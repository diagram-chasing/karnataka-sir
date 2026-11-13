// The animated link preview's timeline. It opens and closes on the still, so it loops without a
// seam and apps that show only the first frame get the still: the gaps in the wall fill back in
// from the middle out, the cards are struck off at random, then the orange ones come back.

/** One GIF frame every 60ms: about 16fps, smooth enough for fades and light on bytes. */
export const FRAME_MS = 60;
/** How long the still holds at each end of the loop; the two run together into one. */
const HOLD = 600;

const RESTORE = { at: HOLD, spread: 400, dur: 400 };
const STRIKE = { at: 1700, spread: 1200, dur: 260 };
const RETURN = { at: 3300, gap: 140, dur: 450, fade: 180 };
/** The last moment anything moves; the rest of the loop holds on the still. */
export const MOVING = [RESTORE.at, RETURN.at + 3 * RETURN.gap + RETURN.dur];
export const LOOP_MS = MOVING[1] + HOLD;

/** cubic-bezier(x1, y1, x2, y2) as a function of time in [0, 1]. */
function bezier(x1, y1, x2, y2) {
	const at = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
	const slope = (a, b, t) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;
	return (x) => {
		let t = x;
		for (let i = 0; i < 8; i++) {
			const d = slope(x1, x2, t);
			if (Math.abs(d) < 1e-6) break;
			t -= (at(x1, x2, t) - x) / d;
		}
		return at(y1, y2, Math.min(1, Math.max(0, t)));
	};
}
const easeOut = bezier(0.23, 1, 0.32, 1);
const easeInOut = bezier(0.77, 0, 0.175, 1);
/** An underdamped spring, bounce 0.25, settled by the end of its span. */
const spring = (t) => {
	const zeta = 0.75;
	const w = 2 * Math.PI * 1.25;
	const wd = w * Math.sqrt(1 - zeta * zeta);
	return t >= 1
		? 1
		: 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};

const progress = (ms, at, dur, ease) => ease(Math.min(1, Math.max(0, (ms - at) / dur)));

/**
 * Each card's layers at `ms`: the grey card, the dashed blank and the orange card, as opacity
 * and scale. `end` is how the still draws the cell, `centre` its distance from the middle of the
 * frame in [0, 1], `u` a random number in [0, 1) and `orange` its place among the orange cards.
 */
export function cardAt(ms, { end, centre, u, orange }) {
	if (end === 'card') return { grey: 1, greyScale: 1, gone: 0, back: 0, backScale: 1 };
	const r = progress(ms, RESTORE.at + RESTORE.spread * centre, RESTORE.dur, easeInOut);
	// orange cards are struck off early, so they are all gone before the first comes back
	const s = progress(
		ms,
		STRIKE.at + STRIKE.spread * (end === 'back' ? u * 0.6 : u),
		STRIKE.dur,
		easeOut
	);
	const restoring = ms < STRIKE.at;
	const grey = restoring ? r : 1 - s;
	const greyScale = restoring ? 0.94 + 0.06 * r : 1 - 0.08 * s;
	if (end === 'gone')
		return { grey, greyScale, gone: restoring ? 1 - r : s, back: 0, backScale: 1 };
	const at = RETURN.at + RETURN.gap * orange;
	const q = progress(ms, at, RETURN.dur, spring);
	const f = progress(ms, at, RETURN.fade, easeOut);
	return {
		grey,
		greyScale,
		gone: restoring ? 0 : s * (1 - f),
		back: restoring ? 1 - r : f,
		backScale: restoring ? 1 : 0.85 + 0.15 * q
	};
}

/** [ms, centiseconds] for each GIF frame: the still held, then every frame while anything moves. */
export function gifFrames() {
	const frames = [[0, MOVING[0] / 10]];
	for (let ms = MOVING[0]; ms < MOVING[1]; ms += FRAME_MS) frames.push([ms, FRAME_MS / 10]);
	frames.push([MOVING[1], (LOOP_MS - MOVING[1]) / 10]);
	return frames;
}
