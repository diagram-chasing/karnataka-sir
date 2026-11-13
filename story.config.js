export const story = {
	title: 'No eligible citizen is left out (?)',
	slug: 'karnataka-sir',
	year: 2026,
	description:
		"The Election Commission says Karnataka's final voter roll leaves out no eligible citizen and includes no ineligible person. The rolls say otherwise.",
	authors: [{ name: 'Aman Bhargava', link: 'https://diagramchasing.fun/authors/aman' }],
	/** ISO datetime. Leave empty for a draft: SEO renders a WebPage instead of an Article. */
	publishTime: '2026-11-12T18:00:00+05:30',
	updateTime: '',
	keywords: [
		'India',
		'Karnataka',
		'elections',
		'voter rolls',
		'Special Intensive Revision',
		'data visualization'
	],
	/** Plausible data-domain. */
	analyticsId: 'karnataka-sir',
	/** Path under static/, resolved against SITE_BASE for og:image. */
	shareImage: '/og/card.jpg',
	shareImageAlt:
		'The Diagram Chasing logo and the title, No eligible citizen is left out (?), in a clearing among rows of grey voter cards, three of them orange.',
	siteName: 'Diagram Chasing',
	/** Netlify site name ({name}.netlify.app). */
	netlifySiteName: 'dc-karnataka-sir',
	/** AT-URI of this story's site.standard.document record. Empty injects only the publication tag. */
	atprotoDocument: 'at://did:plc:pbzkofwfyokqzouibm2bcfo4/site.standard.document/3n26lt44wx2mf'
};

/** The story lives at diagramchasing.fun{BASE_PATH} through a Netlify 200-rewrite proxy. */
export const BASE_PATH = `/${story.year}/${story.slug}`;

export const CANONICAL_ORIGIN = 'https://diagramchasing.fun';

/** AT-URI of the Diagram Chasing site.standard.publication record (same for every story). */
export const ATPROTO_PUBLICATION =
	'at://did:plc:pbzkofwfyokqzouibm2bcfo4/site.standard.publication/3mv3cvvqd72hd';
