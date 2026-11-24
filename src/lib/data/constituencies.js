import byAc from './by_ac.json';
import electors from './electors_2025.json';

/** Below this many notices a constituency gets no struck-off rate: too few to compare. */
export const MIN_NOTICES = 500;

const e2025 = new Map(electors.map((d) => [d.ac, d.electors_2025]));

/** @param {string} s */
const district = (s) =>
	s
		.replace(/B\.B\.M\.P\((\w+)\)/, 'Bengaluru $1')
		.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase());

/**
 * A state's constituencies with every rate the charts show, from its by_ac rows. Percentages are
 * 0 to 100. A rate is null where the state has no such count.
 * @param {any[]} rows
 */
export function build(rows) {
	return rows.map((d) => {
		const electors2025 = d.electors_before;
		// Every voter on the final roll: those in the booth files held, plus the printed totals of
		// any booths whose files are missing. Null where a missing booth's total is not known, so
		// the gap is never read as voters lost.
		const whole = !d.parts_missing
			? d.electors
			: d.electors_missing_parts != null
				? d.electors + d.electors_missing_parts
				: null;
		return {
			ac: /** @type {number} */ (d.ac),
			// a typo in the CEO's own constituency list
			name: /** @type {string} */ (d.constituency).replace('RamannNagar', 'Raman Nagar'),
			district: district(d.district ?? ''),
			blr: /BANGALORE URBAN|B\.B\.M\.P/.test(d.district ?? ''),
			electors: /** @type {number} */ (d.electors),
			electors2025: /** @type {number | undefined} */ (electors2025),
			// no change where some of the constituency's booth files are missing: the gap would
			// read as voters lost
			change: electors2025 && whole != null ? (100 * (whole - electors2025)) / electors2025 : null,
			/** removed before the draft roll, as a share of the roll before the revision */
			droppedPct: electors2025 && d.dropped != null ? (100 * d.dropped) / electors2025 : null,
			notices: /** @type {number} */ (d.notices_generated),
			noticePct: d.notices_generated == null ? null : (100 * d.notices_generated) / d.electors,
			/** notices in the partners' digitized lists, the base for the struck-off rate */
			listedNotices: d.notices_partner,
			struck: d.struck_q,
			struckPct: d.notices_partner > MIN_NOTICES ? (100 * d.struck_q) / d.notices_partner : null,
			zeroIneligible: d.bk_ineligible === 0,
			dupPer10k: (1e4 * (d.dup_entries || 0)) / d.electors,
			house0: d.house0 || 0,
			house0Pct: (100 * (d.house0 || 0)) / d.electors,
			// Measures for a state whose removals lists are matched to its final roll but which has no
			// notice lists: the share removed before the draft, the share of those who are back, and
			// cards struck off the final roll as disqualified. Null for a state that does not give them.
			removedPct:
				d.back != null && electors2025 && d.dropped != null
					? (100 * d.dropped) / electors2025
					: null,
			backPct: d.back != null && d.dropped ? (100 * d.back) / d.dropped : null,
			disqualifiedPct: d.disqualified != null ? (100 * d.disqualified) / d.electors : null
		};
	});
}

/** Karnataka's 224 assembly constituencies. */
export const CONSTITUENCIES = build(byAc.map((d) => ({ ...d, electors_before: e2025.get(d.ac) })));

/** @typedef {(typeof CONSTITUENCIES)[number]} Constituency */

export const BY_AC = new Map(CONSTITUENCIES.map((d) => [d.ac, d]));
