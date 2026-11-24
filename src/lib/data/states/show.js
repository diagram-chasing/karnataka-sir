// How a state's counts are printed.

/** @typedef {import('./findings.js').StateFile} StateFile */

/**
 * A count as the story quotes it, or null where the state has none. The match behind cameBack
 * finds about 85% of those who came back, so it is quoted to the hundred.
 * @param {string} key @param {StateFile} state
 */
export function shown(key, state) {
	const v = state.findings[key];
	if (v == null) return null;
	return key === 'cameBack' ? Math.round(v / 100) * 100 : v;
}

/** A label or tally with the state's last intensive revision filled in. @param {string} text @param {StateFile} state */
export const worded = (text, state) =>
	state.lastSirYear
		? text.replace('{year}', String(state.lastSirYear))
		: text.replace('{year} ', '');

/**
 * A count's label as the state page and the share images print it: the ledger's own, with the rule
 * spelled out where the count cannot be read right without it.
 * @param {{ key: string, label: string }} f @param {StateFile} state
 */
export const labelOf = (f, state) =>
	f.key === 'crowdedHouses'
		? 'House numbers with 100+ voters across 50+ distinct families'
		: worded(f.label, state);
