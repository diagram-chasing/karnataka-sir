// The median constituency on each measure, for the "your constituency" chart.
import { CONSTITUENCIES } from './constituencies.js';

/** NoticeScatter's median: the middle value of the sorted list. @param {number[]} a */
const median = (a) => {
	const s = [...a].sort((p, q) => p - q);
	return s[Math.floor(s.length / 2)];
};

// The two notice measures use NoticeScatter's constituencies (those with a struck-off rate, so
// at least MIN_NOTICES notices), so their medians match its 5.0% and 1.1%; the others use all 224.
const rated = CONSTITUENCIES.filter((d) => d.struckPct != null);

/** The median constituency, in the units CONSTITUENCIES uses. */
export const MEDIAN = {
	change: median(CONSTITUENCIES.map((d) => /** @type {number} */ (d.change))),
	noticePct: median(rated.map((d) => d.noticePct)),
	struckPct: median(rated.map((d) => /** @type {number} */ (d.struckPct))),
	house0Pct: median(CONSTITUENCIES.map((d) => d.house0Pct))
};
