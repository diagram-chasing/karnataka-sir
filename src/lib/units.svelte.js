const KEY = 'dc-units';

export const units = $state({ west: false });

export function setWest(/** @type {boolean} */ west) {
	units.west = west;
	try {
		localStorage.setItem(KEY, west ? 'million' : 'lakh');
	} catch {
		// private mode or blocked storage: the switch still works for this visit
	}
}

export const toggleUnits = () => setWest(!units.west);

export function restoreUnits() {
	try {
		if (localStorage.getItem(KEY) === 'million') units.west = true;
	} catch {
		// nothing stored
	}
}

const trim = (/** @type {string} */ s) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);

/**
 * A value in international units, rounded to the precision it was given in: `precision` is the
 * size of its last digit (1.08 crore → 1e5). A million or more is written in millions, with at most
 * two decimals; anything less is written out in full.
 * @param {number} value @param {number} precision
 */
export function inMillions(value, precision) {
	if (value >= 1e6) {
		const dec = Math.min(2, Math.max(0, 6 - Math.round(Math.log10(precision))));
		return `${trim((value / 1e6).toFixed(dec))}\u00a0million`;
	}
	const r = Math.round(value / precision) * precision;
	return r.toLocaleString('en-US');
}
