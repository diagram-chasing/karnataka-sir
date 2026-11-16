#!/usr/bin/env node
// Renders the Instagram clip at /dev/clip to social/clip/clip.mp4: the page is a function of time,
// so each frame is set, photographed and piped to ffmpeg, with the audio cut (social/clip/track.wav)
// laid under it. `--stills` writes PNGs every `--every` ms instead (default 594, a beat), and
// `--from`/`--to` (in seconds) render part of it. `--route clip-films` renders the clip at
// /dev/clip-films with social/clip-films/track.wav, into social/clip-films/. `--theme orange` renders that look, as clip-orange.mp4.
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { BASE_PATH } from '../story.config.js';

const flag = (name) => process.argv.includes(`--${name}`);
const arg = (name, fallback) => {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 ? process.argv[i + 1] : fallback;
};

const W = 540;
const H = 960;
const ROUTE = arg('route', 'clip');
const THEME = arg('theme', '');
const OUT = arg('out', `social/${ROUTE}`);
const TRACK = `social/${ROUTE}/track.wav`;

const CHROME =
	process.env.CHROME_PATH ||
	[
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Chromium.app/Contents/MacOS/Chromium',
		'/usr/bin/google-chrome',
		'/usr/bin/chromium'
	].find(existsSync);
if (!CHROME) throw new Error('No Chrome found: set CHROME_PATH');
if (!flag('stills') && spawnSync('ffmpeg', ['-version']).status !== 0)
	throw new Error('ffmpeg is needed to write the video');

mkdirSync(OUT, { recursive: true });
const server = await createServer({ server: { port: 5198, strictPort: false }, logLevel: 'error' });
await server.listen();
const origin = new URL(server.resolvedUrls.local[0]).origin;
const browser = await puppeteer.launch({
	executablePath: CHROME,
	headless: true,
	args: ['--hide-scrollbars', '--font-render-hinting=none']
});

try {
	const page = await browser.newPage();
	// a scene that throws leaves the last frame standing: say so, don't render it
	page.on('pageerror', (err) => {
		console.error(`  page error: ${err.message}`);
		process.exitCode = 1;
	});
	await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
	await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
	const url = `${origin}${BASE_PATH}/dev/${ROUTE}?rec${THEME ? `&theme=${THEME}` : ''}${arg('query', '') && `&${arg('query', '')}`}`;
	const open = async () => {
		await page.goto(url, { waitUntil: 'networkidle0', timeout: 120_000 });
		await page.waitForFunction('window.__clip', { timeout: 30_000 });
	};
	// the first load compiles the route and may reload once dependencies are optimised
	for (let i = 0; i < 4; i++) {
		try {
			await open();
			break;
		} catch (err) {
			if (i === 3) throw err;
		}
	}
	const { duration, fps } = await page.evaluate(() => {
		const { duration, fps } = window.__clip;
		return { duration, fps };
	});
	const clip = { x: 0, y: 0, width: W, height: H };
	// a dev-server reload mid-run throws the page's context away: open it again and retake the frame
	const shoot = async (ms, type) => {
		try {
			return await take(ms, type);
		} catch {
			await open();
			return take(ms, type);
		}
	};
	const take = async (ms, type) => {
		await page.evaluate((t) => window.__clip.seek(t), ms);
		// let the frame be laid out and painted: a screenshot taken straight after the seek can
		// catch new cards before they are drawn
		await page.evaluate(
			() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
		);
		// every scene's images decoded before the frame is taken
		await page.evaluate(() =>
			Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
		);
		return page.screenshot({ type, clip, ...(type === 'jpeg' ? { quality: 96 } : {}) });
	};

	const from = Number(arg('from', 0)) * 1000;
	const to = Math.min(duration, Number(arg('to', duration / 1000)) * 1000);

	if (flag('stills')) {
		const every = Number(arg('every', 594));
		for (let ms = from, n = 0; ms < to; ms += every, n++) {
			const name = `${OUT}/${String(n).padStart(3, '0')}-${String(Math.round(ms)).padStart(5, '0')}.png`;
			writeFileSync(name, await shoot(ms, 'png'));
		}
		console.log(`  stills in ${OUT}/`);
	} else {
		const file = `${OUT}/${arg('name', THEME ? `clip-${THEME}` : 'clip')}.mp4`;
		const audio = existsSync(TRACK)
			? ['-ss', String(from / 1000), '-t', String((to - from) / 1000), '-i', TRACK]
			: [];
		if (!audio.length) console.warn(`  no ${TRACK}: rendering silent`);
		const ff = spawn(
			'ffmpeg',
			[
				'-y',
				'-loglevel',
				'error',
				'-f',
				'image2pipe',
				'-framerate',
				String(fps),
				'-i',
				'-',
				...audio,
				'-c:v',
				'libx264',
				'-preset',
				'slow',
				'-crf',
				// film grain costs bits: `--crf 25` keeps a grained clip to a size worth uploading
				arg('crf', '19'),
				'-pix_fmt',
				'yuv420p',
				'-movflags',
				'+faststart',
				...(audio.length ? ['-c:a', 'aac', '-b:a', '256k'] : []),
				file
			],
			{ stdio: ['pipe', 'inherit', 'inherit'] }
		);
		const done = new Promise((resolve, reject) =>
			ff.on('close', (code) => (code ? reject(new Error(`ffmpeg exited ${code}`)) : resolve()))
		);
		const frames = Math.floor(((to - from) / 1000) * fps);
		for (let f = 0; f < frames; f++) {
			const jpg = await shoot(from + (f * 1000) / fps, 'jpeg');
			if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
			if (f % 150 === 0) console.log(`  frame ${f} of ${frames}`);
		}
		ff.stdin.end();
		await done;
		console.log(`  ${file}`);
	}
} finally {
	await browser.close();
	await server.close();
}
