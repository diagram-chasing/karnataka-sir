import { geoPath } from 'd3';

/** @param {string} s */
function ring(s) {
	const out = [];
	let i = 0;
	let x = 0;
	let y = 0;
	const next = () => {
		let r = 0;
		let shift = 0;
		let b;
		do {
			b = s.charCodeAt(i++) - 63;
			r |= (b & 0x1f) << shift;
			shift += 5;
		} while (b >= 0x20);
		return r & 1 ? ~(r >> 1) : r >> 1;
	};
	while (i < s.length) {
		x += next();
		y += next();
		out.push([x / 1e4, y / 1e4]);
	}
	return out;
}

/**
 * @param {{ p: Record<string, unknown>, m: boolean, g: string[][] }[]} packed
 * @returns {GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>}
 */
export function unpack(packed) {
	return {
		type: 'FeatureCollection',
		features: packed.map(({ p, m, g }) => {
			const polys = g.map((poly) => poly.map(ring));
			return {
				type: 'Feature',
				properties: p,
				geometry: m
					? { type: 'MultiPolygon', coordinates: polys }
					: { type: 'Polygon', coordinates: polys[0] }
			};
		})
	};
}

/**
 * A path generator like d3's geoPath(projection), but each point after a ring's first is written as a
 * step from the one before, in tenths of a pixel ("l3.4-.3" rather than "L221.6,118.3"). The shapes
 * are the same as geoPath(projection).digits(1); the strings are about half as long.
 * @param {(p: [number, number]) => [number, number] | null} projection a d3 geo projection
 */
export function compactPath(projection) {
	let out = '';
	let x = 0;
	let y = 0;
	let open = false;
	const num = (/** @type {number} */ t) => {
		const s = String(t / 10);
		return s.startsWith('0.') ? s.slice(1) : s.startsWith('-0.') ? '-' + s.slice(2) : s;
	};
	const pair = (/** @type {number} */ dx, /** @type {number} */ dy) => {
		const a = num(dx);
		const b = num(dy);
		return a + (b[0] === '-' ? '' : ',') + b;
	};
	const ctx = {
		moveTo(/** @type {number} */ px, /** @type {number} */ py) {
			x = Math.round(px * 10);
			y = Math.round(py * 10);
			out += `M${num(x)},${num(y)}`;
			open = false;
		},
		lineTo(/** @type {number} */ px, /** @type {number} */ py) {
			const nx = Math.round(px * 10);
			const ny = Math.round(py * 10);
			if (nx === x && ny === y) return;
			const step = pair(nx - x, ny - y);
			out += open ? (step[0] === '-' ? step : ' ' + step) : 'l' + step;
			open = true;
			x = nx;
			y = ny;
		},
		closePath() {
			out += 'z';
			open = false;
		},
		arc() {},
		beginPath() {}
	};
	const gen = geoPath(projection, ctx);
	return (/** @type {any} */ object) => {
		out = '';
		open = false;
		gen(object);
		return out;
	};
}

/**
 * The two outer tangents between circles a and b, each as [x1, y1, x2, y2] from a's rim to b's.
 * @param {{ x: number, y: number, r: number }} a
 * @param {{ x: number, y: number, r: number }} b
 */
export function tangents(a, b) {
	const d = Math.hypot(b.x - a.x, b.y - a.y);
	const t = Math.atan2(b.y - a.y, b.x - a.x);
	const al = Math.acos((a.r - b.r) / d);
	return [t + al, t - al].map((g) => [
		a.x + a.r * Math.cos(g),
		a.y + a.r * Math.sin(g),
		b.x + b.r * Math.cos(g),
		b.y + b.r * Math.sin(g)
	]);
}
