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

/** The 224 assembly constituencies, with every rate the charts show. Percentages are 0 to 100. */
export const CONSTITUENCIES = byAc.map((d) => {
	const electors2025 = e2025.get(d.ac);
	return {
		ac: d.ac,
		// a typo in the CEO's own constituency list
		name: d.constituency.replace('RamannNagar', 'Raman Nagar'),
		district: district(d.district),
		blr: /BANGALORE URBAN|B\.B\.M\.P/.test(d.district),
		electors: d.electors,
		electors2025,
		change: electors2025 ? (100 * (d.electors - electors2025)) / electors2025 : null,
		notices: d.notices_generated,
		noticePct: (100 * d.notices_generated) / d.electors,
		/** notices in the partners' digitized lists, the base for the struck-off rate */
		listedNotices: d.notices_partner,
		struck: d.struck_q,
		struckPct: d.notices_partner > MIN_NOTICES ? (100 * d.struck_q) / d.notices_partner : null,
		zeroIneligible: d.bk_ineligible === 0,
		dupPer10k: (1e4 * (d.dup_entries || 0)) / d.electors,
		house0: d.house0 || 0,
		house0Pct: (100 * (d.house0 || 0)) / d.electors
	};
});

/** @typedef {(typeof CONSTITUENCIES)[number]} Constituency */

export const BY_AC = new Map(CONSTITUENCIES.map((d) => [d.ac, d]));
