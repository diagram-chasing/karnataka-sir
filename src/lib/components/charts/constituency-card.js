// The constituency card's numbers, typical (median) values and locator map.
import { geoMercator, geoCentroid } from 'd3';
import { CONSTITUENCIES, BY_AC } from '$data/constituencies.js';
import { MEDIAN } from '$data/standing.js';
import { unpack, compactPath } from './geo.js';
import { inr } from './theme.js';
import acPacked from '$data/karnataka-ac.poly.json';
import statePacked from '$data/karnataka-state.poly.json';
import byAc from '$data/by_ac.json';

export { BY_AC };

/** C.V. Raman Nagar: 59% of its voters got a notice, the most in the state. */
export const DEFAULT_AC = 161;

const median = (/** @type {number[]} */ a) => {
	const s = [...a].sort((p, q) => p - q);
	return s[Math.floor(s.length / 2)];
};

/** Removed before the draft roll, by constituency; CONSTITUENCIES leaves this field out. */
const DROPPED = new Map(byAc.map((d) => [d.ac, d.dropped || 0]));

/** The typical constituency's share removed before the draft, of its January 2025 roll. */
const DROPPED_TYPICAL = median(
	CONSTITUENCIES.filter((c) => c.electors2025).map(
		(c) => (100 * (DROPPED.get(c.ac) ?? 0)) / /** @type {number} */ (c.electors2025)
	)
);
const DUP_TYPICAL = median(CONSTITUENCIES.map((c) => c.dupPer10k));

/**
 * The revision as a sequence of counts, each a share of the January 2025 roll: who was on it,
 * who was removed before the draft list, who was asked to prove eligibility, who was removed
 * after that check, and who is on the roll now. The typical shares chain the story's medians.
 * @param {import('$data/constituencies.js').Constituency} c
 */
export function stages(c) {
	const e25 = c.electors2025 || c.electors;
	const of = (/** @type {number} */ n) => (100 * n) / e25;
	const dropped = DROPPED.get(c.ac) ?? 0;
	const typicalFinal = 100 + MEDIAN.change; // MEDIAN.change is negative: the typical roll shrank
	return [
		{
			key: 'before',
			label: 'Voters before the revision',
			when: 'Jan 2025',
			n: e25,
			share: 100,
			typical: 100,
			cut: false,
			thin: false
		},
		{
			key: 'dropped',
			label: 'Removed before draft list',
			when: '',
			n: dropped,
			share: of(dropped),
			typical: DROPPED_TYPICAL,
			cut: true,
			thin: false
		},
		{
			key: 'notice',
			label: 'Asked to prove eligibility',
			when: '',
			n: c.notices,
			share: of(c.notices),
			typical: (MEDIAN.noticePct * typicalFinal) / 100,
			cut: true,
			thin: false
		},
		{
			key: 'struck',
			label: 'Removed after check',
			when: '',
			n: c.struck,
			share: of(c.struck),
			typical: (MEDIAN.struckPct * MEDIAN.noticePct * typicalFinal) / 1e4,
			cut: true,
			thin: c.struckPct == null
		},
		{
			key: 'after',
			label: 'Voters after the revision',
			when: 'Oct 2026',
			n: c.electors,
			share: of(c.electors),
			typical: typicalFinal,
			cut: false,
			thin: false
		}
	];
}

/** What the final roll still holds, with the typical constituency beside it. @param {import('$data/constituencies.js').Constituency} c */
export function rollRows(c) {
	return {
		dup: { text: c.dupPer10k.toFixed(1), typical: DUP_TYPICAL.toFixed(1) },
		house0: { text: oneIn(c.house0Pct), typical: oneIn(MEDIAN.house0Pct) }
	};
}

/** "1 in 450" for a percentage, rounded to a clean denominator. @param {number} p */
function oneIn(p) {
	if (p <= 0) return 'none';
	const d = 100 / p;
	const nice = d >= 100 ? Math.round(d / 50) * 50 : d >= 20 ? Math.round(d / 5) * 5 : Math.round(d);
	return nice <= 1 ? 'every voter' : `1\u00a0in\u00a0${inr(nice)}`;
}

/** A share of the January roll, printed: whole percent from 10, one decimal to 1, two below. @param {number} x */
export function sharePct(x) {
	return (x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x.toFixed(2)) + '%';
}

const acGeo = unpack(acPacked);
const stateGeo = unpack(statePacked);
const CENTROID = new Map(acGeo.features.map((f) => [f.properties.ac, geoCentroid(f)]));

/**
 * The state outline and one constituency's shape and centre in it, drawn into a w × h box.
 * @param {number} ac @param {number} w @param {number} h
 */
export function miniMap(ac, w, h) {
	const proj = geoMercator().fitExtent(
		[
			[2, 2],
			[w - 2, h - 2]
		],
		stateGeo
	);
	const path = compactPath(proj);
	const f = acGeo.features.find((d) => d.properties.ac === ac);
	const c = /** @type {[number, number]} */ (proj(CENTROID.get(ac) ?? [76, 15]));
	return { state: path(stateGeo), shape: f ? path(f) : '', x: c[0], y: c[1] };
}
