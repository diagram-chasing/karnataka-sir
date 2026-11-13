import { SITE_BASE } from '$lib/site';

export const prerender = true;

// Add every prerendered route the story ships (e.g. '/explore').
const routes = ['/'];

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
