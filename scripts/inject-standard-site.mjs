#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { story, ATPROTO_PUBLICATION } from '../story.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, '../build/index.html');

if (!existsSync(htmlPath)) {
	console.error('inject-standard-site: build/index.html not found. Run vite build first.');
	process.exit(1);
}

let html = readFileSync(htmlPath, 'utf8');

// Idempotent: strip any previously injected tags before re-injecting.
html = html.replace(/[ \t]*<link rel="site\.standard\.(?:document|publication)"[^>]*>\n?/g, '');

const tags = [`<link rel="site.standard.publication" href="${ATPROTO_PUBLICATION}">`];
if (story.atprotoDocument) {
	tags.push(`<link rel="site.standard.document" href="${story.atprotoDocument}">`);
} else {
	console.warn(
		'inject-standard-site: story.atprotoDocument is empty; injecting the publication tag only.'
	);
}

html = html.replace('</head>', `\t\t${tags.join('\n\t\t')}\n\t</head>`);
writeFileSync(htmlPath, html);
console.log(`inject-standard-site: added ${tags.length} tag(s) to build/index.html`);
