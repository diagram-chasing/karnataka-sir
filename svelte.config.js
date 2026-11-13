import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { BASE_PATH } from './story.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md', '.svx']
		})
	],
	kit: {
		adapter: adapter({ fallback: '404.html' }),
		// The site is served under a path prefix on the studio domain
		// (diagramchasing.fun/YYYY/slug) through a Netlify 200-rewrite proxy.
		// paths.base makes the client router, prerendered links, and the SPA
		// fallback all carry that prefix. The value derives from story.config.js.
		//
		// relative: false produces absolute asset URLs (/YYYY/slug/_app/...).
		// This is required because visitors reach the entry URL without a
		// trailing slash (/YYYY/slug), so a relative "./_app/..." URL would
		// resolve against the parent (/YYYY/) and drop the prefix. Absolute
		// paths don't depend on the trailing slash.
		paths: { base: BASE_PATH, relative: false },
		alias: {
			$config: 'story.config.js',
			$charts: 'src/lib/components/charts',
			$images: 'src/lib/assets/images',
			$data: 'src/lib/data'
		}
	},
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
