const urls = import.meta.glob('/src/lib/assets/images/posters/*.jpg', {
	eager: true,
	query: '?format=webp',
	import: 'default'
});

/** @typedef {{ name: string, year: string, ratio: number, english?: string }} Film */

/** @type {Record<string, Film>} */
export const FILMS = {
	'hum-paanch': { name: 'Hum Paanch', year: '1980', ratio: 271 / 368, english: 'We Five' },
	duplicate: { name: 'Duplicate', year: '1998', ratio: 266 / 374 },
	housefull: { name: 'Housefull', year: '2010', ratio: 255 / 390 },
	gumnaam: { name: 'Gumnaam', year: '1965', ratio: 236 / 316, english: 'Nameless' },
	'hum-aapke-hain-koun': {
		name: 'Hum Aapke Hain Koun..!',
		year: '1994',
		ratio: 220 / 300,
		english: 'Who Am I to You?'
	},
	'main-hoon-na': {
		name: 'Main Hoon Na',
		year: '2004',
		ratio: 266 / 375,
		english: "I'm Here, Aren't I?"
	},
	judwaa: { name: 'Judwaa', year: '1997', ratio: 220 / 294, english: 'Twins' },
	pehchaan: { name: 'Pehchan', year: '1970', ratio: 250 / 335, english: 'Identity' },
	zinda: { name: 'Zinda', year: '2006', ratio: 263 / 380, english: 'Alive' },
	'jaane-bhi-do-yaaro': {
		name: 'Jaane Bhi Do Yaaro',
		year: '1983',
		ratio: 274 / 362,
		english: 'Let It Go, Friends'
	}
};

/** @param {string} id */
export const posterUrl = (id) =>
	/** @type {string | undefined} */ (urls[`/src/lib/assets/images/posters/${id}.jpg`]);

/** @type {HTMLImageElement[]} */
const warmed = [];

/**
 * Prefetches a poster at idle, low priority, so its popover opens from cache. Skipped under save-data.
 * @param {string} id
 */
export function warmPoster(id) {
	const src = posterUrl(id);
	// @ts-expect-error: navigator.connection is not in every browser or in TypeScript's DOM types
	if (!src || navigator.connection?.saveData) return;
	const fetchIt = () => {
		const img = new Image();
		img.fetchPriority = 'low';
		img.src = src;
		warmed.push(img); // held so the request isn't dropped with the element
	};
	const whenIdle = () =>
		'requestIdleCallback' in window
			? requestIdleCallback(fetchIt, { timeout: 3000 })
			: setTimeout(fetchIt, 1000);
	if (document.readyState === 'complete') whenIdle();
	else addEventListener('load', whenIdle, { once: true });
}
