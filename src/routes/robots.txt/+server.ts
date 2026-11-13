import { SITE_BASE } from '$lib/site';

export const prerender = true;

export function GET() {
	const body = `User-agent: *
Allow: /

Sitemap: ${SITE_BASE}/sitemap.xml
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain' }
	});
}
