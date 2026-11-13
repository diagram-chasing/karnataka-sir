// Finds the highlighted field on a compact exhibit SVG (its first orange path), so the phone Trail
// can keep that field on one line across documents.

const HL = 'rgb(100%, 74.9%, 63.92%)';

/** @param {string} d */
function pathBox(d) {
	const n = (d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
	const xs = n.filter((_, i) => i % 2 === 0);
	const ys = n.filter((_, i) => i % 2 === 1);
	if (!xs.length || !ys.length) return null;
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** @type {Map<string, Promise<number | null>>} */
const cache = new Map();

/**
 * The vertical centre of the highlighted field, as a share of the drawing's height.
 * @param {string} src the SVG's URL
 */
export function highlightY(src) {
	let p = cache.get(src);
	if (!p) {
		p = measure(src).catch(() => null);
		cache.set(src, p);
	}
	return p;
}

/** @param {string} src */
async function measure(src) {
	const text = await (await fetch(src)).text();
	const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
	const vb = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
	if (vb.length !== 4) return null;
	const vh = vb[3];
	for (const el of svg.querySelectorAll('path, rect')) {
		const fill = el.getAttribute('fill') ?? el.parentElement?.getAttribute('fill') ?? '';
		if (fill !== HL) continue;
		let b;
		if (el.tagName === 'rect') {
			const y = +(el.getAttribute('y') ?? 0);
			b = [0, y, 0, y + +(el.getAttribute('height') ?? 0)];
		} else b = pathBox(el.getAttribute('d') ?? '');
		if (!b) continue;
		const m = /matrix\(([^)]+)\)/.exec(el.getAttribute('transform') ?? '');
		if (m) {
			const [, , , d, , f] = m[1].split(/[\s,]+/).map(Number);
			b = [b[0], b[1] * d + f, b[2], b[3] * d + f];
		}
		return (b[1] + b[3]) / 2 / vh;
	}
	return null;
}

/**
 * How far down to move each sheet, in px, so consecutive highlighted fields line up without
 * cropping. Pairs that cannot meet are capped in cost so they don't spend slack others need.
 * @param {{ H: number, hy: number | null }[]} docs each sheet's height in px and its field's centre
 * @param {number} frameH
 */
export function alignShifts(docs, frameH) {
	const CAP = 40;
	const slack = docs.map((d) => Math.max(0, Math.round(frameH - d.H)));
	const dy = docs.map(() => 0);
	const line = (/** @type {number} */ i) => (docs[i].hy ?? 0) * docs[i].H + dy[i];
	const cost = () => {
		let c = 0;
		for (let i = 1; i < docs.length; i++) {
			if (docs[i].hy == null || docs[i - 1].hy == null) continue;
			c += Math.min(Math.abs(line(i) - line(i - 1)), CAP);
		}
		return c;
	};
	for (let round = 0; round < 3; round++) {
		for (let i = 0; i < docs.length; i++) {
			let best = dy[i];
			let bestCost = Infinity;
			for (let v = 0; v <= slack[i]; v++) {
				dy[i] = v;
				const c = cost() + v * 1e-3; // all else equal, move as little as possible
				if (c < bestCost) {
					bestCost = c;
					best = v;
				}
			}
			dy[i] = best;
		}
	}
	return dy;
}
