<script>
	import { scaleLinear } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr } from './theme.js';
	import krDemographics from '$data/states/karnataka/demographics.json';

	/**
	 * @typedef {{ band: string, f_before: number, m_before: number, f_after: number, m_after: number, before: number, after: number, diff: number }} ShiftRow
	 * @typedef {{ title: string, dek: string, note: string, source: string, beforeLabel: string, afterLabel: string, overall: ShiftRow, bands: ShiftRow[] }} SexRatioData
	 */

	/** @type {{ data?: SexRatioData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data = krDemographics.sexRatioShift, title, dek, note, source } = $props();

	const rows = $derived([data.overall, ...(data.bands ?? [])].filter(Boolean));
	const hasRise = $derived(rows.some((r) => r.diff > 0));

	const domain = $derived.by(() => {
		const vals = rows.flatMap((r) => [r.before, r.after]);
		const lo = Math.floor((Math.min(...vals, 900) - 25) / 50) * 50;
		const hi = Math.ceil((Math.max(...vals, 1000) + 25) / 50) * 50;
		return [lo, hi];
	});
	const xTicks = $derived.by(() => {
		const [lo, hi] = domain;
		const step = hi - lo > 350 ? 100 : 50;
		const out = [];
		for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
		return out;
	});

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 500);
	const LAB = $derived(narrow ? 70 : 84);
	const DELTA = $derived(narrow ? 52 : 62);
	const TOP = 34;
	const ROW = 34;
	const DIV_GAP = 10;
	const H = $derived(TOP + rows.length * ROW + DIV_GAP + 14);

	const xEnd = $derived(w - DELTA - 14);
	const x = $derived(
		scaleLinear()
			.domain(domain)
			.range([LAB, xEnd])
	);

	/** @param {number} idx */
	const rowY = (idx) => TOP + idx * ROW + (idx > 0 ? DIV_GAP : 0) + ROW / 2;

	/** @type {{ d: ShiftRow, px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} _px @param {number} py */
	const pick = (_px, py) => {
		for (let i = 0; i < rows.length; i++) {
			const cy = rowY(i);
			if (Math.abs(py - cy) <= ROW / 2) return rows[i];
		}
		return null;
	};

	/** @param {number} d */
	const fmtDelta = (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.round(Math.abs(d))}`;
</script>

<ChartFrame
	title={title ?? data.title}
	dek={dek ?? data.dek}
	note={note ?? data.note}
	source={source ?? data.source}
>
	{#snippet legend()}
		<div class="key" aria-hidden="true">
			<span><i class="sw before"></i>{data.beforeLabel}</span>
			<span><i class="sw fell"></i>{data.afterLabel} (fewer women)</span>
			{#if hasRise}
				<span><i class="sw rose"></i>{data.afterLabel} (more women)</span>
			{/if}
		</div>
	{/snippet}

	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Women per 1,000 men before and after the revision across age groups."
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			{#each xTicks as t (t)}
				<line
					class={['grid', { eq: t === 1000 }]}
					x1={crisp(x(t))}
					x2={crisp(x(t))}
					y1={TOP - 6}
					y2={H - 8}
				/>
				{#if x(t) <= xEnd - 12 && (!narrow || t % 100 === 0 || t === 1000)}
					<text class={['tick', { eq: t === 1000 }]} x={x(t)} y={TOP - 16} text-anchor="middle"
						>{inr(t)}</text
					>
				{/if}
			{/each}

			<text class="col-hdr" x={w - 2} y={TOP - 16} text-anchor="end">Change</text>

			<!-- subtle divider under All ages -->
			<line
				class="sep"
				x1={0}
				x2={w}
				y1={crisp(TOP + ROW + DIV_GAP / 2)}
				y2={crisp(TOP + ROW + DIV_GAP / 2)}
			/>

			{#each rows as r, i (r.band)}
				{@const cy = rowY(i)}
				{@const xb = x(r.before)}
				{@const xa = x(r.after)}
				{@const fell = r.diff < 0}
				{@const dir = xa < xb ? -1 : 1}
				{@const span = Math.abs(xa - xb)}
				<g class={['row', { overall: i === 0, hot: hover?.d.band === r.band }]}>
					<rect class="hit" x={0} y={cy - ROW / 2} width={w} height={ROW} />
					<line class="track" x1={LAB} x2={xEnd} y1={crisp(cy)} y2={crisp(cy)} />
					<text class={['lab', { overall: i === 0 }]} x={LAB - 10} y={cy} text-anchor="end"
						>{r.band}</text
					>

					{#if span > 2}
						<line
							class={['bridge', fell ? 'fell' : 'rose']}
							x1={xb}
							x2={xa - dir * 5}
							y1={cy}
							y2={cy}
						/>
						{#if span > 14}
							<path
								class={['arrow', fell ? 'fell' : 'rose']}
								d="M {xa - dir * 10} {cy - 4} L {xa - dir * 4.5} {cy} L {xa - dir * 10} {cy + 4}"
							/>
						{/if}
					{/if}

					<circle class="dot before" cx={xb} cy={cy} r={4.5} />
					<circle class={['dot', fell ? 'fell' : 'rose']} cx={xa} cy={cy} r={5.5} />

					<text
						class={['delta', fell ? 'fell' : r.diff > 0 ? 'rose' : 'flat']}
						x={w - 2}
						y={cy}
						text-anchor="end">{fmtDelta(r.diff)}</text
					>
				</g>
			{/each}
		</svg>

		{#if hover}
			{@const r = hover.d}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={r.band === 'All ages' ? 'All ages' : `Ages ${r.band}`}
				sub="Women per 1,000 men"
				rows={[
					[data.beforeLabel, `${Math.round(r.before)} (${inr(r.f_before)} W)`],
					[data.afterLabel, `${Math.round(r.after)} (${inr(r.f_after)} W)`],
					['Change', `${fmtDelta(r.diff)} pts`]
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	.key {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem 1.1rem;
		font-size: 0.8125rem;
		color: var(--c-text);
	}
	.key span {
		display: inline-flex;
		align-items: center;
		gap: 0.38rem;
	}
	.sw {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		box-sizing: border-box;
	}
	.sw.before {
		background: var(--c-bg);
		border: 2px solid color-mix(in oklch, var(--foreground) 46%, var(--background));
	}
	.sw.fell {
		background: var(--d-w3);
	}
	.sw.rose {
		background: color-mix(in oklch, var(--foreground) 68%, var(--background));
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
	.grid.eq {
		stroke: color-mix(in oklch, var(--foreground) 38%, var(--background));
		stroke-dasharray: 3 3;
	}
	.sep {
		stroke: color-mix(in oklch, var(--foreground) 14%, var(--background));
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.track {
		stroke: color-mix(in oklch, var(--foreground) 6%, var(--background));
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.bridge {
		stroke-width: 3px;
		stroke-linecap: round;
	}
	.bridge.fell {
		stroke: var(--d-w0);
	}
	.bridge.rose {
		stroke: color-mix(in oklch, var(--foreground) 22%, var(--background));
	}
	.arrow {
		fill: none;
		stroke-width: 1.75px;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.arrow.fell {
		stroke: var(--d-w3);
	}
	.arrow.rose {
		stroke: color-mix(in oklch, var(--foreground) 60%, var(--background));
	}
	.dot.before {
		fill: var(--c-bg);
		stroke: color-mix(in oklch, var(--foreground) 48%, var(--background));
		stroke-width: 2px;
	}
	.dot.fell {
		fill: var(--d-w3);
		stroke: var(--c-bg);
		stroke-width: 1.5px;
	}
	.dot.rose {
		fill: color-mix(in oklch, var(--foreground) 68%, var(--background));
		stroke: var(--c-bg);
		stroke-width: 1.5px;
	}
	.tick {
		font-size: 12px;
		fill: var(--c-mute);
		dominant-baseline: middle;
	}
	.tick.eq {
		fill: var(--c-ink);
		font-weight: 700;
	}
	.col-hdr {
		font-size: 12px;
		fill: var(--c-mute);
		dominant-baseline: middle;
	}
	.lab {
		font-size: 13px;
		fill: var(--c-text);
		dominant-baseline: middle;
	}
	.lab.overall {
		font-weight: 700;
		fill: var(--c-ink);
	}
	.delta {
		font-size: 13px;
		font-weight: 700;
		dominant-baseline: middle;
	}
	.delta.fell {
		fill: var(--d-w3);
	}
	.delta.rose {
		fill: color-mix(in oklch, var(--foreground) 62%, var(--background));
	}
	.delta.flat {
		fill: var(--c-mute);
	}
</style>
