// The median constituency on each measure, for the "your constituency" chart.
import { CONSTITUENCIES } from './constituencies.js';

/** NoticeScatter's median: the middle value of the sorted list. @param {number[]} a */
const median = (a) => {
	const s = [...a].sort((p, q) => p - q);
	return s[Math.floor(s.length / 2)];
};

/**
 * A state's median constituency, in the units its constituencies use.
 *
 * The two notice measures use NoticeScatter's constituencies (those with a struck-off rate, so at
 * least MIN_NOTICES notices), so Karnataka's medians match its 5.0% and 1.1%; the others use all.
 * @param {import('./constituencies.js').Constituency[]} list
 */
export function medians(list) {
	const rated = list.filter((d) => d.struckPct != null);
	return {
		change: median(
			list.filter((d) => d.change != null).map((d) => /** @type {number} */ (d.change))
		),
		noticePct: median(rated.map((d) => /** @type {number} */ (d.noticePct))),
		struckPct: median(rated.map((d) => /** @type {number} */ (d.struckPct))),
		house0Pct: median(list.map((d) => d.house0Pct)),
		removedPct: median(list.filter((d) => d.removedPct != null).map((d) => d.removedPct ?? 0)),
		backPct: median(list.filter((d) => d.backPct != null).map((d) => d.backPct ?? 0)),
		disqualifiedPct: median(
			list.filter((d) => d.disqualifiedPct != null).map((d) => d.disqualifiedPct ?? 0)
		)
	};
}

/** Karnataka's median constituency. */
export const MEDIAN = medians(CONSTITUENCIES);
