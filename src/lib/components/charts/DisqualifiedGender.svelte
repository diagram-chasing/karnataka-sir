<script>
	import { scaleLinear } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr, pct } from './theme.js';

	/**
	 * @typedef {{ ac: number, name: string, district: string, tot: number, f: number, m: number, mf: number, f_pct: number }} DisqRow
	 * @typedef {{ title: string, dek: string, note: string, source: string, total: number, female: number, male: number, marriedFemale: number, femalePct: number, acsMin10: number, acsMajFemale: number, topRows: DisqRow[] }} DisqData
	 */

	/** @type {{ data: DisqData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data, title, dek, note, source } = $props();

	const rows = $derived(data.topRows ?? []);

	/** @type {Record<string, string>} */
	const CLEAN_DISTRICT = {
		Bulandsahar: 'Bulandshahr',
		Baharaich: 'Bahraich'
	};
	const dist = (/** @type {string} */ s) => CLEAN_DISTRICT[s] ?? s;

	const dynamicNote = $derived(note ?? data.note ?? '');

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 500);
	const LAB = $derived(narrow ? 132 : 204);
	const VAL = $derived(narrow ? 46 : 50);
	const TOP = 46;
	const BAR = 20;
	const ROW = 30;
	const H = $derived(TOP + rows.length * ROW + 12);

	const x = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([LAB, w - VAL])
	);
	const TICKS = [0, 25, 50, 75, 100];

	/** @type {{ d: DisqRow, px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} _px @param {number} py */
	const pick = (_px, py) => {
		const idx = Math.floor((py - TOP) / ROW);
		return idx >= 0 && idx < rows.length ? rows[idx] : null;
	};
</script>

<ChartFrame
	title={title ?? data.title}
	dek={dek ?? data.dek}
	note={dynamicNote}
	source={source ?? data.source}
>
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Top constituencies by female share among voters stamped disqualified."
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			{#each TICKS as t (t)}
				<line
					class={['grid', { parity: t === 50 }]}
					x1={crisp(x(t))}
					x2={crisp(x(t))}
					y1={TOP - 6}
					y2={H - 8}
				/>
				<text class="tick" x={x(t)} y={TOP - 14} text-anchor={t === 0 ? 'start' : 'middle'}
					>{t}%</text
				>
			{/each}

			<line
				class="state-avg"
				x1={crisp(x(data.femalePct))}
				x2={crisp(x(data.femalePct))}
				y1={TOP - 22}
				y2={H - 8}
			/>
			<text
				class="ref-lbl avg"
				x={x(data.femalePct)}
				y={TOP - 32}
				text-anchor="middle">{Math.round(data.femalePct)}% state average</text
			>

			{#each rows as r, i (r.ac)}
				{@const y0 = TOP + i * ROW + (ROW - BAR) / 2}
				{@const cy = TOP + i * ROW + ROW / 2}
				{@const bw = Math.max(2, x(r.f_pct) - LAB)}
				<g class={['row', { hot: hover?.d.ac === r.ac }]}>
					<rect class="hit" x={0} y={TOP + i * ROW} width={w} height={ROW} />
					<rect class="track" x={LAB} y={y0} width={x(100) - LAB} height={BAR} />
					<rect class="bar" x={LAB} y={y0} width={bw} height={BAR} />
					<text class="lab" x={LAB - 10} y={cy} text-anchor="end">
						<tspan class="nm">{r.name}</tspan>{#if !narrow}<tspan class="dist"
								>, {dist(r.district)}</tspan
							>{/if}
					</text>
					<text class="val" x={LAB + bw + 7} y={cy} text-anchor="start">{pct(r.f_pct, 1)}</text>
				</g>
			{/each}
		</svg>

		{#if hover}
			{@const r = hover.d}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={r.name}
				sub={dist(r.district)}
				rows={[
					['Disqualified (Q)', inr(r.tot)],
					['Women', `${inr(r.f)} (${pct(r.f_pct, 1)})`],
					['Men', inr(r.m)],
					['With husband’s name', `${inr(r.mf)} (${pct((100 * r.mf) / r.tot, 1)})`]
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	.hit {
		fill: transparent;
	}
	.row.hot .bar {
		fill: var(--d-w2);
	}
	.grid {
		stroke: var(--c-grid);
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.grid.parity {
		stroke: color-mix(in oklch, var(--foreground) 38%, var(--background));
		stroke-dasharray: 3 3;
	}
	.state-avg {
		stroke: var(--d-w3);
		stroke-width: 1.5px;
		stroke-dasharray: 2 2;
		shape-rendering: crispEdges;
	}
	.track {
		fill: var(--c-panel);
		shape-rendering: crispEdges;
	}
	.bar {
		fill: var(--d-w0);
		stroke: var(--d-w3);
		stroke-width: 1px;
		shape-rendering: crispEdges;
		transition: fill 120ms ease-out;
	}
	.tick {
		font-size: 12px;
		fill: var(--c-mute);
		dominant-baseline: middle;
	}
	.ref-lbl {
		font-size: 12px;
		dominant-baseline: middle;
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	.ref-lbl.avg {
		font-weight: 700;
		fill: var(--d-w3);
	}
	.lab {
		font-size: 13px;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.lab .nm {
		font-weight: 700;
	}
	.lab .dist {
		font-size: 12px;
		fill: var(--c-mute);
	}
	.val {
		font-size: 13px;
		font-weight: 700;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
</style>
