<script>
	import { scaleLinear } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr, pct } from './theme.js';
	import krDemographics from '$data/states/karnataka/demographics.json';

	/**
	 * @typedef {{ category: string, f_tot: number, f_rem: number, f_pct: number, m_tot: number, m_rem: number, m_pct: number }} ReasonRow
	 * @typedef {{ title: string, dek: string, note: string, source: string, under35Label: string, all: ReasonRow[], under35: ReasonRow[] }} GenderReasonsData
	 */

	/** @type {{ data?: GenderReasonsData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data = krDemographics.genderReasons, title, dek, note, source } = $props();

	/** @type {'under35' | 'all'} */
	let mode = $state('under35');

	/** @type {Record<string, string>} */
	const LABELS = {
		shifted: 'Shifted',
		absent: 'Absent',
		dead: 'Dead',
		duplicate: 'Duplicate'
	};

	const rows = $derived(
		(mode === 'under35' ? data.under35 : data.all).map((r) => ({
			...r,
			f_exact: r.f_tot ? (100 * r.f_rem) / r.f_tot : r.f_pct,
			m_exact: r.m_tot ? (100 * r.m_rem) / r.m_tot : r.m_pct,
			label: LABELS[r.category] ?? r.category
		}))
	);

	// Shared scale across both toggle states so dots visibly move on the same ruler.
	const xMax = $derived.by(() => {
		const both = [...(data.under35 ?? []), ...(data.all ?? [])];
		const top = Math.max(...both.flatMap((r) => [r.f_pct, r.m_pct]), 12);
		return Math.ceil((top + 1.5) / 5) * 5;
	});
	const xTicks = $derived.by(() => {
		const out = [];
		const step = xMax <= 20 ? 5 : 10;
		for (let v = 0; v <= xMax; v += step) out.push(v);
		return out;
	});

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 520);
	const LAB = $derived(narrow ? 76 : 96);
	const RIGHT = $derived(narrow ? 56 : 64);
	const TOP = 26;
	const ROW = 46;
	const H = $derived(TOP + rows.length * ROW + 8);

	const x = $derived(
		scaleLinear()
			.domain([0, xMax])
			.range([LAB, w - RIGHT])
	);

	/** @type {{ d: (typeof rows)[number], px: number, py: number } | null} */
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
	note={note ?? data.note}
	source={source ?? data.source}
>
	{#snippet controls()}
		<div class="seg" role="group" aria-label="Age group">
			<button aria-pressed={mode === 'under35'} onclick={() => (mode = 'under35')}
				>{data.under35Label ?? 'Under 35'}</button
			>
			<button aria-pressed={mode === 'all'} onclick={() => (mode = 'all')}>All ages</button>
		</div>
	{/snippet}
	{#snippet legend()}
		<div class="key" aria-hidden="true">
			<span><i class="sw women"></i>Women</span>
			<span><i class="sw men"></i>Men</span>
		</div>
	{/snippet}
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Removal rates by official reason for women and men, {mode === 'under35'
				? data.under35Label
				: 'all ages'}."
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			{#each xTicks as t (t)}
				<line
					class={['grid', { zero: t === 0 }]}
					x1={crisp(x(t))}
					x2={crisp(x(t))}
					y1={TOP - 6}
					y2={H - 4}
				/>
				<text class="tick" x={x(t)} y={10} text-anchor={t === 0 ? 'start' : 'middle'}>{t}%</text>
			{/each}

			{#each rows as r, i (r.category)}
				{@const cy = TOP + i * ROW + ROW / 2}
				{@const xf = x(r.f_exact)}
				{@const xm = x(r.m_exact)}
				{@const xLo = Math.min(xf, xm)}
				{@const xHi = Math.max(xf, xm)}
				{@const span = xHi - xLo}
				{@const fHigher = r.f_exact >= r.m_exact}
				{@const close = span < 42}
				{@const fStr = pct(r.f_exact, 1)}
				{@const mStr = pct(r.m_exact, 1)}
				{@const sameStr = fStr === mStr}
				<g class={['row', { hot: hover?.d.category === r.category }]}>
					<rect class="hit" x={0} y={TOP + i * ROW} width={w} height={ROW} />
					<line class="track" x1={LAB} x2={w - RIGHT} y1={crisp(cy)} y2={crisp(cy)} />
					<text class="lab" x={LAB - 12} y={cy} text-anchor="end">{r.label}</text>

					<line
						class={['bridge', fHigher ? 'f' : 'm']}
						x1={xLo}
						x2={xHi}
						y1={cy}
						y2={cy}
					/>
					<circle class="dot men" cx={xm} cy={cy} r={6} />
					<circle class="dot women" cx={xf} cy={cy} r={6} />

					{#if close}
						{#if sameStr}
							<text class="val muted" x={xHi + 10} y={cy} text-anchor="start">{fStr}</text>
						{:else}
							<text class="val" x={xHi + 10} y={cy} text-anchor="start">
								<tspan class="v-women">{fStr}</tspan>
								<tspan class="v-sep"> / </tspan>
								<tspan class="v-men">{mStr}</tspan>
							</text>
						{/if}
					{:else if xLo - LAB >= 42}
						<text
							class={['val', fHigher ? 'v-men' : 'v-women']}
							x={xLo - 10}
							y={cy}
							text-anchor="end">{fHigher ? mStr : fStr}</text
						>
						<text
							class={['val', fHigher ? 'v-women' : 'v-men']}
							x={xHi + 10}
							y={cy}
							text-anchor="start">{fHigher ? fStr : mStr}</text
						>
					{:else}
						<text
							class={['val', fHigher ? 'v-men' : 'v-women']}
							x={xLo}
							y={cy - 14}
							text-anchor="start">{fHigher ? mStr : fStr}</text
						>
						<text
							class={['val', fHigher ? 'v-women' : 'v-men']}
							x={xHi + 10}
							y={cy}
							text-anchor="start">{fHigher ? fStr : mStr}</text
						>
					{/if}
				</g>
			{/each}
		</svg>

		{#if hover}
			{@const r = hover.d}
			{@const ratio = r.m_exact > 0 ? (r.f_exact / r.m_exact).toFixed(1) : '—'}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={r.label}
				sub={mode === 'under35' ? data.under35Label : 'All ages'}
				rows={[
					['Women', `${pct(r.f_exact, 1)} (${inr(r.f_rem)})`],
					['Men', `${pct(r.m_exact, 1)} (${inr(r.m_rem)})`],
					['Women / men ratio', `${ratio}×`]
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	.key {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--c-ink);
	}
	.key span {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.sw {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.sw.women {
		background: var(--d-w3);
	}
	.sw.men {
		background: color-mix(in oklch, var(--foreground) 48%, var(--background));
	}

	.hit {
		fill: transparent;
	}
	.row.hot .hit {
		fill: color-mix(in oklch, var(--foreground) 3.5%, transparent);
	}
	.grid {
		stroke: var(--c-grid);
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.grid.zero {
		stroke: color-mix(in oklch, var(--foreground) 28%, var(--background));
	}
	.track {
		stroke: color-mix(in oklch, var(--foreground) 7%, var(--background));
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.bridge {
		stroke-width: 5px;
		stroke-linecap: round;
		transition:
			x1 260ms cubic-bezier(0.23, 1, 0.32, 1),
			x2 260ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.bridge.f {
		stroke: var(--d-w0);
	}
	.bridge.m {
		stroke: color-mix(in oklch, var(--foreground) 20%, var(--background));
	}
	.dot {
		stroke: var(--c-bg);
		stroke-width: 1.75px;
		transition: cx 260ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.dot.women {
		fill: var(--d-w3);
	}
	.dot.men {
		fill: color-mix(in oklch, var(--foreground) 48%, var(--background));
	}
	.tick {
		font-size: 12px;
		fill: var(--c-mute);
		dominant-baseline: middle;
	}
	.lab {
		font-size: 14px;
		font-weight: 700;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.val {
		font-size: 13px;
		font-weight: 700;
		dominant-baseline: middle;
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3.5px;
		stroke-linejoin: round;
	}
	.val.muted,
	.v-men {
		fill: color-mix(in oklch, var(--foreground) 58%, var(--background));
		font-weight: 600;
	}
	.v-women {
		fill: var(--d-w3);
		font-weight: 700;
	}
	.v-sep {
		fill: var(--c-mute);
		font-weight: 400;
	}
	@media (prefers-reduced-motion: reduce) {
		.bridge,
		.dot {
			transition: none;
		}
	}
</style>
