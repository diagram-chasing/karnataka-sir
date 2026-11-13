import { story, BASE_PATH, CANONICAL_ORIGIN } from '$config';

export { story, BASE_PATH, CANONICAL_ORIGIN };

/**
 * Absolute public URL of the story (no trailing slash). Canonical URLs and
 * share images resolve against this. Override with VITE_SITE_BASE for
 * previews that live on another origin.
 */
export const SITE_BASE = (import.meta.env.VITE_SITE_BASE || CANONICAL_ORIGIN + BASE_PATH).replace(
	/\/$/,
	''
);

/** Joins a path onto SITE_BASE. For example, absUrl('/og/card.jpg') returns https://.../og/card.jpg. */
export function absUrl(path: string): string {
	return SITE_BASE + (path.startsWith('/') ? path : `/${path}`);
}

export const PAGE_LINKS = [
	{ name: 'Home', href: 'https://diagramchasing.fun' },
	{ name: 'About', href: 'https://diagramchasing.fun/about' },
	{ name: 'Authors', href: 'https://diagramchasing.fun/authors' },
	{ name: 'Support', href: 'https://diagramchasing.fun/support' }
];

export const SOCIAL_LINKS = {
	rss: 'https://diagramchasing.fun/rss.xml',
	github: 'https://github.com/diagram-chasing',
	instagram: 'https://www.instagram.com/diagramchasing',
	linkedin: 'https://www.linkedin.com/company/diagram-chasing/'
};
