#!/usr/bin/env node
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { BASE_PATH } from '../story.config.js';
import { FORMATS, STILLS, CHARTS, imagePath } from '../src/lib/social.js';
import { gifFrames } from '../src/lib/og-motion.js';

const arg = (name) => {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 ? process.argv[i + 1]?.split(',') : null;
};
const only = arg('only');
const formats = arg('formats');
const want = (id) => !only || only.includes(id);

const CHROME =
	process.env.CHROME_PATH ||
	[
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Chromium.app/Contents/MacOS/Chromium',
		'/usr/bin/google-chrome',
		'/usr/bin/chromium'
	].find(existsSync);
if (!CHROME) throw new Error('No Chrome found: set CHROME_PATH');
const MAGICK = spawnSync('magick', ['-version']).status === 0;
const GIFSICLE = spawnSync('gifsicle', ['--version']).status === 0;

// --- what to shoot --------------------------------------------------------------------------
const jobs = [];
for (const s of STILLS.filter((s) => want(s.id))) jobs.push({ q: `c=${s.id}`, ...s });
for (const c of CHARTS.filter((c) => want(c.id))) {
	for (const f of FORMATS.filter((f) => !formats || formats.includes(f.id))) {
		jobs.push({ q: `f=${f.id}&c=${c.id}`, ...f, out: imagePath(c.id, f.id) });
	}
}

// --- shoot ----------------------------------------------------------------------------------
const server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: 'error' });
await server.listen();
const origin = new URL(server.resolvedUrls.local[0]).origin;
// one browser per worker: a tab behind another gets no resize observations, so the charts never
// see the widths the fitter tries and it scores stale layouts
const launch = () =>
	puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
const browser = await launch();

async function shoot(page, job) {
	await page.setViewport({ width: job.w, height: job.h, deviceScaleFactor: job.scale });
	await page.bringToFront();
	await page.goto(`${origin}${BASE_PATH}/dev/social?${job.q}`, { waitUntil: 'networkidle0' });
	await page.waitForSelector('.frame.ready', { timeout: 60_000 });
	const file = job.out;
	mkdirSync(dirname(file), { recursive: true });
	const clip = { x: 0, y: 0, width: job.w, height: job.h };
	if (MAGICK) {
		const png = await page.screenshot({ type: 'png', clip });
		execFileSync(
			'magick',
			['png:-', '-strip', '-sampling-factor', '4:4:4', '-quality', '90', file],
			{ input: png }
		);
	} else {
		writeFileSync(file, await page.screenshot({ type: 'jpeg', quality: 90, clip }));
	}
	console.log(`  ${file}`);
	if (job.gif) await animate(page, job, clip);
}

// the GIF: one load and screenshot per frame of the timeline
async function animate(page, job, clip) {
	if (!MAGICK || !GIFSICLE) {
		console.warn(`  skipped ${job.gif}: needs magick and gifsicle`);
		return;
	}
	const dir = mkdtempSync(join(tmpdir(), 'og-gif-'));
	try {
		const frames = gifFrames();
		const png = (i) => join(dir, `${String(i).padStart(3, '0')}.png`);
		for (const [i, [ms]] of frames.entries()) {
			await page.goto(`${origin}${BASE_PATH}/dev/social?${job.q}&ms=${ms}`, {
				waitUntil: 'networkidle0'
			});
			await page.waitForSelector('.frame.ready', { timeout: 60_000 });
			writeFileSync(png(i), await page.screenshot({ type: 'png', clip }));
		}
		// one palette for every frame, from the still and the frames mid-fade, and no dither: a
		// pixel that has not moved keeps its colour index, so the GIF stores only what changes
		const palette = join(dir, 'palette.png');
		const mid = [0, ...[0.25, 0.5, 0.75, 0.9].map((p) => Math.round(p * (frames.length - 1)))];
		execFileSync('magick', [
			...mid.map(png),
			'-append',
			'+dither',
			'-colors',
			'32',
			'-unique-colors',
			palette
		]);
		const args = ['-O3', '--loopcount=forever'];
		for (const [i, [, delay]] of frames.entries()) {
			const f = join(dir, `${String(i).padStart(3, '0')}.gif`);
			execFileSync('magick', [png(i), '-strip', '+dither', '-remap', palette, f]);
			args.push('-d', String(delay), f);
		}
		execFileSync('gifsicle', [...args, '-o', job.gif]);
		console.log(`  ${job.gif}`);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

try {
	// warm the dev server up first: its first load compiles every chart and may optimise new
	// dependencies, which reloads any page already open
	const warm = await browser.newPage();
	for (let i = 0; i < 4; i++) {
		try {
			await warm.goto(`${origin}${BASE_PATH}/dev/social?f=wide&c=map`, {
				waitUntil: 'networkidle0',
				timeout: 120_000
			});
			await warm.waitForSelector('.frame.ready', { timeout: 60_000 });
			break;
		} catch (err) {
			// try again once the server has settled
			if (i === 3) console.warn(`Warm-up failed, rendering anyway: ${err.message}`);
		}
	}
	await warm.close();

	const queue = [...jobs];
	const failed = [];
	const fresh = async (own) => {
		const page = await own.newPage();
		await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
		return page;
	};
	// a page that times out is thrown away and the image tried once more on a new one
	const worker = async () => {
		const own = await launch();
		let page = await fresh(own);
		for (let job; (job = queue.shift()); ) {
			for (let attempt = 1; ; attempt++) {
				try {
					await shoot(page, job);
					break;
				} catch (err) {
					await page.close().catch(() => {});
					page = await fresh(own);
					if (attempt === 2) {
						failed.push(job.out);
						console.error(`  failed: ${job.out} (${err.message})`);
						break;
					}
				}
			}
		}
		await own.close();
	};
	console.log(`Rendering ${jobs.length} images`);
	await Promise.all(Array.from({ length: 3 }, worker));
	if (failed.length) process.exitCode = 1;
} finally {
	await browser.close();
	await server.close();
}
