import { story } from '../../story.config.js';

/** The social images and the project thumbnail stay in the repo; they are not published. */
const SOCIAL_DIR = 'social';

export const FORMATS = [
	{
		id: 'portrait',
		label: '4:5',
		platforms: 'Instagram, Threads, LinkedIn',
		w: 540,
		h: 675,
		scale: 2,
		cover: { cell: 30, orange: 5 }
	},
	{
		id: 'story',
		label: '9:16',
		platforms: 'Instagram and WhatsApp stories',
		w: 540,
		h: 960,
		scale: 2,
		// the apps draw their own header and reply bar over the top and bottom
		safeY: 110,
		cover: { cell: 30, orange: 6 }
	},
	{
		id: 'square',
		label: '1:1',
		platforms: 'LinkedIn, Facebook, Mastodon',
		w: 600,
		h: 600,
		scale: 2,
		cover: { cell: 30, orange: 5 }
	},
	{
		id: 'wide',
		label: '16:9',
		platforms: 'X, Bluesky',
		w: 800,
		h: 450,
		scale: 2,
		wide: true,
		cover: { cell: 30, orange: 5 }
	}
];

/**
 * Stills shot once, not per format: the link preview and the project-card thumbnails. The
 * thumbnail's title sits inside the middle 4:3, which is all the project grid shows.
 */
export const STILLS = [
	{
		id: 'og',
		w: 1200,
		h: 630,
		scale: 1,
		out: `static${story.shareImage}`,
		cover: { cell: 46, orange: 4 }
	},
	{
		id: 'thumb',
		w: 1200,
		h: 630,
		scale: 2,
		out: `${SOCIAL_DIR}/thumbnail.jpg`,
		cover: { cell: 46, orange: 4 }
	},
	{
		id: 'thumb-plain',
		w: 1200,
		h: 630,
		scale: 2,
		out: `${SOCIAL_DIR}/thumbnail-plain.jpg`,
		cover: { cell: 46, orange: 5 },
		plain: true
	}
];

/** One image per entry and format, in story order. `cover` is the title card; the rest are charts. */
export const CHARTS = [
	{ id: 'cover', label: 'Title card' },
	{ id: 'ledger', label: 'What the rolls show' },
	{ id: 'constituency', label: 'Your constituency' },
	{ id: 'duplicates', label: 'Duplicate voters' },
	{ id: 'garbled', label: 'Garbled names by booth' },
	{ id: 'names', label: 'Things that are not names' },
	{ id: 'funnel', label: 'Who was struck off' },
	{ id: 'reasons', label: 'Notices by reason' },
	{ id: 'reused', label: 'Reused voter IDs' },
	{ id: 'returns', label: 'Who came back' },
	{ id: 'map', label: 'Notices by constituency' },
	{ id: 'scatter', label: 'Notices and strike-offs' },
	{ id: 'table', label: 'Constituency table' }
];

/** social/{format}/{nn}-{chart}.jpg, numbered in story order so a folder is a ready carousel. */
export const imagePath = (chart, format) => {
	const n = String(CHARTS.findIndex((c) => c.id === chart) + 1).padStart(2, '0');
	return `${SOCIAL_DIR}/${format}/${n}-${chart}.jpg`;
};
