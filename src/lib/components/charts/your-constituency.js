// YourConstituency's four measures and its title.
import { CONSTITUENCIES } from '$data/constituencies.js';
import { medians } from '$data/standing.js';
import { pct } from './theme.js';

/** @typedef {import('$data/constituencies.js').Constituency} Constituency */

/**
 * Each measure turned so higher is worse: `v` reads it off a constituency (null when it has
 * none), `max` ends the scale. Duplicates per 10,000 are left out: small whole numbers bunched
 * between 0 and 15 make a barcode of noise.
 *
 * The scales' ends are set for Karnataka. Another state keeps only the measures it has, and each
 * scale ends at the next ten above its largest value.
 * @param {Constituency[]} list @param {string} [since] the roll before the revision, as the label names it
 */
export function stripsFor(list, since = 'Jan 2025') {
	const own = list === CONSTITUENCIES;
	const median = medians(list);
	return [
		{
			key: 'change',
			label: `Voters lost since ${since}`,
			v: (/** @type {Constituency} */ c) => (c.change == null ? null : -c.change),
			max: 55,
			fmt: (/** @type {number} */ v) => (v < 0 ? `grew ${pct(-v, 0)}` : pct(v, 0))
		},
		{
			key: 'removedPct',
			label: 'Struck off before the draft roll',
			v: (/** @type {Constituency} */ c) => c.removedPct,
			max: 40,
			fmt: (/** @type {number} */ v) => pct(v, 0)
		},
		{
			key: 'noticePct',
			label: 'Sent a notice',
			v: (/** @type {Constituency} */ c) => c.noticePct,
			max: 60,
			fmt: (/** @type {number} */ v) => (v < 1 ? pct(v, 2) : pct(v, 0))
		},
		{
			key: 'struckPct',
			label: 'Struck off after a notice',
			v: (/** @type {Constituency} */ c) => c.struckPct,
			max: 14,
			fmt: (/** @type {number} */ v) => pct(v, 1)
		},
		{
			key: 'house0Pct',
			label: 'No house number',
			v: (/** @type {Constituency} */ c) => c.house0Pct,
			max: 40,
			fmt: (/** @type {number} */ v) => (v < 1 ? pct(v, 1) : pct(v, 0))
		},
		{
			key: 'disqualifiedPct',
			label: 'Struck off as disqualified',
			v: (/** @type {Constituency} */ c) => c.disqualifiedPct,
			max: 3,
			fmt: (/** @type {number} */ v) => pct(v, 2)
		}
	]
		.filter((s) => list.some((c) => s.v(c) != null))
		.map((s) => {
			const m = median[/** @type {keyof typeof median} */ (s.key)];
			const top = Math.max(...list.map((c) => s.v(c) ?? 0));
			return {
				...s,
				max: own
					? s.max
					: s.key === 'disqualifiedPct'
						? Math.ceil(top)
						: Math.max(10, Math.ceil(top / 10) * 10),
				median: s.key === 'change' ? -m : m
			};
		});
}

/** Karnataka's strips. */
export const STRIPS = stripsFor(CONSTITUENCIES);

/**
 * One headline for every constituency: "{name} lost 53% of its voters", or for a roll that grew,
 * "{name}'s roll grew 2%".
 * @param {Constituency} c a constituency from CONSTITUENCIES
 */
export function headline(c) {
	const name = c.name.replace(/\s+/g, ' ');
	if (c.change == null) return name;
	return c.change > 0
		? `${name}'s roll grew ${pct(c.change, 0)}`
		: `${name} lost ${pct(-c.change, 0)} of its voters`;
}
