<script module lang="ts">
	import { CARD_W, CARD_H, CELL_ASPECT } from '$lib/components/VoterCard.svelte';

	export type Cell = [col: number, row: number];
	export type Rect = [col: number, row: number, cols: number, rows: number];

	/** The wall's grid: whole cells that divide the frame exactly, each about `cell` px wide. */
	export function grid(w: number, h: number, cell: number) {
		const cols = Math.max(1, Math.round(w / cell));
		const px = w / cols;
		const rows = Math.max(1, Math.round(h / (px * CELL_ASPECT)));
		return { cols, rows, px, py: h / rows };
	}

	/** A seeded random in [0, 1), so every render draws the same wall. */
	export function seeded(seed: number) {
		let s = seed;
		return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
	}
</script>

<script lang="ts">
	// The hero's voter cards as a wall for the share images. `clear` is left blank for type.
	// `ms` plays the animated card's timeline (og-motion.js); left out, it is the still.
	import VoterCard from '$lib/components/VoterCard.svelte';
	import { cardAt } from '$lib/og-motion.js';

	const GONE = 0.2;

	let {
		w,
		h,
		cell,
		clear = null,
		back = [],
		ms = 0
	}: {
		w: number;
		h: number;
		cell: number;
		clear?: Rect | null;
		back?: Cell[];
		ms?: number;
	} = $props();

	const g = $derived(grid(w, h, cell));
	const c = $derived({ x: g.px * 0.07, y: g.py * 0.12, w: g.px * 0.86, h: g.py * 0.76 });

	// where each card ends up, and what it needs to find its place in the timeline
	const wall = $derived.by(() => {
		const rand = seeded(5);
		const order = seeded(11);
		const lit = back.map(([x, y]) => `${x},${y}`);
		const [hc, hr, hw, hh] = clear ?? [-1, -1, 0, 0];
		const reach = Math.hypot(g.cols / 2, g.rows / 2);
		const out = [];
		for (let r = 0; r < g.rows; r++)
			for (let col = 0; col < g.cols; col++) {
				// drawn for every cell, so the wall stays the same whatever the clearing takes
				const empty = rand() < GONE;
				const u = order();
				if (col >= hc && col < hc + hw && r >= hr && r < hr + hh) continue;
				const k = `${col},${r}`;
				const orange = lit.indexOf(k);
				out.push({
					k,
					x: col * g.px + c.x,
					y: r * g.py + c.y,
					end: (orange > -1 ? 'back' : empty ? 'gone' : 'card') as 'card' | 'gone' | 'back',
					centre: Math.hypot(col + 0.5 - g.cols / 2, r + 0.5 - g.rows / 2) / reach,
					u,
					orange
				});
			}
		return out;
	});
	const cells = $derived(wall.map((p) => ({ ...p, ...cardAt(ms, p) })));

	// a layer scaled about the card's middle
	const about = (s: number) =>
		s === 1
			? undefined
			: `translate(${CARD_W / 2} ${CARD_H / 2}) scale(${s}) translate(${-CARD_W / 2} ${-CARD_H / 2})`;
</script>

<svg class="field" width={w} height={h} viewBox="0 0 {w} {h}" aria-hidden="true">
	{#each cells as p (p.k)}
		<g transform="translate({p.x} {p.y}) scale({c.w / CARD_W} {c.h / CARD_H})">
			{#if p.gone > 0.005}
				<g class="gone" opacity={p.gone}><VoterCard blank fixedStroke /></g>
			{/if}
			{#if p.grey > 0.005}
				<g class="card" opacity={p.grey} transform={about(p.greyScale)}>
					<VoterCard fixedStroke />
				</g>
			{/if}
			{#if p.back > 0.005}
				<g class="back card-orange" opacity={p.back} transform={about(p.backScale)}>
					<VoterCard fixedStroke />
				</g>
			{/if}
		</g>
	{/each}
</svg>

<style>
	/* heavier than the hero's cards: these are seen small, in a feed */
	.field {
		display: block;
		--card-line: 1.2px;
		--card-box-line: 1px;
		--card-gone-line: 1.2px;
		--card-dash: 2 4;
	}
	.card {
		color: rgb(43 43 43 / 0.55);
		--card-fill: #fff;
		--card-bar: rgb(43 43 43 / 0.3);
	}
	.gone {
		color: rgb(43 43 43 / 0.22);
	}
	.back {
		--card-line: 1.6px;
		--card-box-line: 1.4px;
	}
</style>
