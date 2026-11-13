import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
export default defineConfig({
	plugins: [enhancedImages(), tailwindcss(), sveltekit()],
	// Bundle the popover's dependencies up front. Found lazily, they arrive in two re-optimizing
	// passes, and a page loaded between them mixes two copies of Svelte's runtime ("Cannot read
	// properties of undefined (reading 'call')" in popover.svelte).
	optimizeDeps: {
		include: [
			'bits-ui',
			'@lucide/svelte',
			'tailwind-merge',
			'clsx',
			'@internationalized/date',
			'd3'
		]
	},
	server: {
		fs: {
			// story.config.js sits at the project root and is imported client-side through the
			// $config alias. SvelteKit limits Vite's dev server to src/, .svelte-kit/ and
			// node_modules/, so without this the dev client gets a 404 for it and never hydrates.
			allow: ['.']
		}
	}
});
