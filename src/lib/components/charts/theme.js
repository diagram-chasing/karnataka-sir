import { units, inMillions } from '$lib/units.svelte.js';

/** The six-step orange ramp for maps and dots, palest first (tokens in story.css). */
export const RAMP = [
	'var(--d-wx)',
	'var(--d-w0)',
	'var(--d-w1)',
	'var(--d-w2)',
	'var(--d-w3)',
	'var(--d-w4)'
];

/** Where the ramp steps for the share of notice recipients struck off, in %. */
export const STRUCK_STEPS = [1, 2, 3, 5, 8];

/** Index of the first threshold a value fails to reach: 0 below the first, thresholds.length above the last. @param {number} v @param {number[]} thresholds */
export function step(v, thresholds) {
	let i = 0;
	while (i < thresholds.length && v >= thresholds[i]) i++;
	return i;
}

/** A table cell's heat class: none below the first threshold, then f0 to f3. @param {number} v @param {number[]} thresholds */
export function heat(v, thresholds) {
	const s = step(v, thresholds);
	return s === 0 ? '' : `f${s - 1}`;
}

/** A coordinate on the pixel grid, so a 1px line is sharp. @param {number} v */
export const crisp = (v) => Math.round(v) + 0.5;

/** A count with the reader's digit grouping: 1,05,48,148 in Indian units, 10,548,148 in millions. @param {number | null | undefined} n */
export function inr(n) {
	if (n == null || Number.isNaN(n)) return '';
	const neg = n < 0;
	if (units.west) return (neg ? '−' : '') + Math.round(Math.abs(n)).toLocaleString('en-US');
	let s = String(Math.round(Math.abs(n)));
	if (s.length > 3) {
		let head = s.slice(0, -3);
		const tail = s.slice(-3);
		const parts = [];
		while (head.length > 2) {
			parts.unshift(head.slice(-2));
			head = head.slice(0, -2);
		}
		if (head) parts.unshift(head);
		s = parts.join(',') + ',' + tail;
	}
	return (neg ? '−' : '') + s;
}

/** A count in lakh or crore (or millions), written out in full under a lakh. @param {number | null | undefined} n @param {number} [d] */
export function lakh(n, d = 1) {
	if (n == null) return '';
	if (n < 1e5) return inr(n);
	if (units.west) return inMillions(n, n >= 1e7 ? 1e5 : 10 ** (5 - d));
	if (n >= 1e7) return (n / 1e7).toFixed(2) + ' crore';
	return (n / 1e5).toFixed(d) + ' lakh';
}

/** @param {number} x @param {number} [d] */
export function pct(x, d = 1) {
	return x.toFixed(d) + '%';
}

/** @param {number} x @param {number} [d] */
export function signedPct(x, d = 0) {
	return (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d) + '%';
}
