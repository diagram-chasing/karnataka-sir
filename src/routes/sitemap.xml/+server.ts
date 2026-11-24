import { SITE_BASE } from '$lib/site';
import { STATES } from '$data/states/index.js';

export const prerender = true;

// One page per state; the story's own address redirects to the essay.
const routes = STATES.map((s) => `/${s.slug}`);

export function GET() {
	const urls = routes
		.map((route) => `\t<url>\n\t\t<loc>${SITE_BASE}${route === '/' ? '' : route}</loc>\n\t</url>`)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
}
