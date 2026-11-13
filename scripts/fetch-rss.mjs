#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BASE_PATH } from '../story.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/lib/data/latest-posts.json');
const FEED_URL = 'https://diagramchasing.fun/rss.xml';

function parseRSS(xmlText) {
	const items = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	let match;

	while ((match = itemRegex.exec(xmlText)) !== null) {
		const itemContent = match[1];

		const title =
			(itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
				itemContent.match(/<title>(.*?)<\/title>/))?.[1] || '';

		const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || '';

		const description =
			(itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
				itemContent.match(/<description>(.*?)<\/description>/))?.[1] || '';

		const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

		// Read the image from the enclosure tag. Handle both attribute orders.
		const enclosureMatch =
			itemContent.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]*)"/) ||
			itemContent.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"/);
		const image = enclosureMatch?.[1] || null;

		const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
		const finalDescription =
			cleanDescription.length > 150 ? cleanDescription.substring(0, 150) + '...' : cleanDescription;

		items.push({
			title,
			link,
			description: finalDescription,
			pubDate: new Date(pubDate).toISOString(),
			image
		});
	}

	// Sort newest first and drop this story itself; its link carries our basepath.
	return items
		.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
		.filter((item) => !item.link.includes(BASE_PATH))
		.slice(0, 2);
}

async function fetchRSSFeed() {
	try {
		const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(15000) });
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const xmlText = await response.text();
		const feedItems = parseRSS(xmlText);

		if (feedItems.length === 0) {
			throw new Error('feed parsed to zero items');
		}

		const json = JSON.stringify({ items: feedItems }, null, 2) + '\n';
		if (!existsSync(OUTPUT_PATH) || readFileSync(OUTPUT_PATH, 'utf8') !== json) {
			writeFileSync(OUTPUT_PATH, json);
			console.log(`Updated latest-posts.json with ${feedItems.length} posts`);
		}
	} catch (error) {
		console.warn(`Warning: could not refresh the RSS feed: ${error.message}`);
		if (existsSync(OUTPUT_PATH)) {
			console.warn('Keeping the committed latest-posts.json.');
		} else {
			// On a first run without network, seed an empty file so that imports resolve.
			writeFileSync(OUTPUT_PATH, JSON.stringify({ items: [] }, null, 2) + '\n');
			console.warn('Wrote an empty latest-posts.json so that the build can proceed.');
		}
	}
}

fetchRSSFeed();
