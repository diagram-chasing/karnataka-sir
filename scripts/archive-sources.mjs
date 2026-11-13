#!/usr/bin/env node
// Archives every document the story links to (PDF, CSV, spreadsheets) as
// receipts. For each URL it saves the file, the server's response headers, a
// SHA-256 hash and the retrieval time, and, with --wayback, asks the Internet
// Archive to capture the same URL and checks its copy is byte-identical.
//
//   node scripts/archive-sources.mjs             fetch anything not yet captured
//   node scripts/archive-sources.mjs --refresh   capture every URL again
//   node scripts/archive-sources.mjs --wayback   also capture on web.archive.org
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'receipts');
const MANIFEST = join(DIR, 'manifest.json');
const CITING = ['src/lib/content.md', 'src/lib/sources.js'];
const DOC = /https?:\/\/[^\s"'<>)\]`]+\.(?:pdf|csv|xlsx?|zip|docx?)\b/gi;

const args = new Set(process.argv.slice(2));
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const now = () => new Date().toISOString();

/** Where a URL's file lives under receipts/files, e.g. voters.eci.gov.in/X.pdf */
const localPath = (url) => {
	const u = new URL(url);
	return join('files', u.hostname, decodeURIComponent(basename(u.pathname)));
};

function citedUrls() {
	/** @type {Map<string, string[]>} */
	const cited = new Map();
	for (const file of CITING) {
		for (const url of readFileSync(join(ROOT, file), 'utf8').match(DOC) ?? []) {
			cited.set(url, [...new Set([...(cited.get(url) ?? []), file])]);
		}
	}
	return cited;
}

async function capture(url) {
	const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(180_000) });
	const body = Buffer.from(await res.arrayBuffer());
	if (!res.ok) throw new Error(`HTTP ${res.status}`);

	const path = localPath(url);
	mkdirSync(dirname(join(DIR, path)), { recursive: true });
	writeFileSync(join(DIR, path), body);

	const headers = Object.fromEntries(res.headers);
	const headerPath = join('headers', path.replace(/^files\//, '') + '.txt');
	mkdirSync(dirname(join(DIR, headerPath)), { recursive: true });
	writeFileSync(
		join(DIR, headerPath),
		[
			`GET ${url}`,
			`HTTP ${res.status} ${res.url}`,
			...res.headers.entries().map(([k, v]) => `${k}: ${v}`)
		].join('\n') + '\n'
	);

	return {
		retrieved_at: now(),
		final_url: res.url,
		status: res.status,
		bytes: body.length,
		sha256: sha256(body),
		content_type: headers['content-type'] ?? null,
		last_modified: headers['last-modified'] ?? null,
		etag: headers['etag'] ?? null,
		file: path,
		headers: headerPath
	};
}

// Asks the Wayback Machine to capture the URL itself, then downloads its raw
// copy (the id_ form serves the bytes as archived) and compares hashes.
async function wayback(url, expected) {
	const save = await fetch(`https://web.archive.org/save/${url}`, {
		redirect: 'follow',
		signal: AbortSignal.timeout(300_000)
	});
	const snapshot = save.url.match(/web\.archive\.org\/web\/(\d{14})/)
		? save.url
		: save.headers.get('content-location')
			? `https://web.archive.org${save.headers.get('content-location')}`
			: null;
	const ts = snapshot?.match(/\/web\/(\d{14})/)?.[1];
	if (!ts) throw new Error(`no snapshot (HTTP ${save.status})`);

	const raw = await fetch(`https://web.archive.org/web/${ts}id_/${url}`, {
		signal: AbortSignal.timeout(300_000)
	});
	const hash = sha256(Buffer.from(await raw.arrayBuffer()));
	return {
		snapshot: `https://web.archive.org/web/${ts}/${url}`,
		archived_at: ts,
		sha256: hash,
		matches_local: hash === expected
	};
}

const manifest = existsSync(MANIFEST)
	? JSON.parse(readFileSync(MANIFEST, 'utf8'))
	: { documents: [] };
const byUrl = new Map(manifest.documents.map((d) => [d.url, d]));

for (const [url, cited_in] of citedUrls()) {
	const doc = byUrl.get(url) ?? { url, cited_in, captures: [] };
	doc.cited_in = cited_in;
	byUrl.set(url, doc);

	if (doc.captures.length === 0 || args.has('--refresh')) {
		try {
			const c = await capture(url);
			const prev = doc.captures.at(-1);
			if (prev && prev.sha256 !== c.sha256) c.changed_since_previous = true;
			doc.captures.push(c);
			console.log(`saved   ${c.sha256.slice(0, 12)}  ${(c.bytes / 1e6).toFixed(1)} MB  ${url}`);
		} catch (e) {
			console.error(`failed  ${url}: ${e.message}`);
			continue;
		}
	}

	const last = doc.captures.at(-1);
	if (args.has('--wayback') && last && !last.wayback?.matches_local) {
		try {
			last.wayback = await wayback(url, last.sha256);
			console.log(
				`wayback ${last.wayback.matches_local ? 'match   ' : 'MISMATCH'}  ${last.wayback.snapshot}`
			);
		} catch (e) {
			console.error(`wayback failed  ${url}: ${e.message}`);
		}
	}
}

manifest.documents = [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
writeFileSync(MANIFEST, JSON.stringify(manifest, null, '\t') + '\n');

// One line per file, in the format `shasum -a 256 -c` reads from receipts/.
writeFileSync(
	join(DIR, 'SHA256SUMS'),
	manifest.documents
		.filter((d) => d.captures.length)
		.map((d) => `${d.captures.at(-1).sha256}  ${d.captures.at(-1).file}`)
		.join('\n') + '\n'
);
