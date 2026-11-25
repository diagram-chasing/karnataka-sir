<script>
	import { scaleLinear } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr, lakh } from './theme.js';
	import krDemographics from '$data/states/karnataka/demographics.json';

	/**
	 * @typedef {{ band: string, f_rem: number, m_rem: number, f_add: number, m_add: number }} RvaBand
	 * @typedef {{ title: string, dek: string, note: string, source: string, bands: RvaBand[] }} RvaData
	 */

	/** @type {{ data?: RvaData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data = krDemographics.removalsVsAdditions, title, dek, note, source } = $props();

	const bands = $derived(data.bands ?? []);
	const totRem = $derived(bands.reduce((s, b) => s + b.f_rem + b.m_rem, 0));
	const totAdd = $derived(bands.reduce((s, b) => s + b.f_add + b.m_add, 0));

	const maxRem = $derived(Math.max(...bands.flatMap((b) => [b.f_rem, b.m_rem]), 1));
	const maxAdd = $derived(Math.max(...bands.flatMap((b) => [b.f_add, b.m_add]), 1));

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const stacked = $derived(w < 540);
	const LAB = $derived(stacked ? 66 : 72);
	const VAL = $derived(stacked ? 48 : 54);
	const GAP = 34;
	const panelW = $derived(stacked ? w - LAB - VAL : (w - LAB - GAP - 2 * VAL) / 2);

	const BAR = 13;
	const PAIR_GAP = 3;
	const ROW = 42;
	const TOP = 42;
	const PANEL_GAP = 38;
	const panelH = $derived(bands.length * ROW);
	const H = $derived(stacked ? TOP + panelH + PANEL_GAP + TOP + panelH + 6 : TOP + panelH + 10);

	const xRem = $derived(scaleLinear().domain([0, maxRem]).range([0, Math.max(panelW, 60)]));
	const xAdd = $derived(scaleLinear().domain([0, maxAdd]).range([0, Math.max(panelW, 60)]));

	const remX0 = $derived(LAB);
	const addX0 = $derived(stacked ? LAB : LAB + panelW + VAL + GAP);
	const addY0 = $derived(stacked ? TOP + panelH + PANEL_GAP : 0);

	/** Compact bar label in the reader's chosen unit (lakh / M). @param {number} n */
	const compact = (n) => {
		if (n < 100000) return `${Math.round(n / 1000)}k`;
		return lakh(n, 1).replace(' lakh', 'L').replace(' crore', 'Cr').replace(' million', 'M');
	};

	/** @type {{ d: { band: RvaBand, side: 'rem' | 'add' }, px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} px @param {number} py */
	function pick(px, py) {
		if (stacked) {
			if (py >= TOP && py <= TOP + panelH) {
				const idx = Math.floor((py - TOP) / ROW);
				return bands[idx] ? { band: bands[idx], side: 'rem' } : null;
			}
			const y2 = py - (addY0 + TOP);
			if (y2 >= 0 && y2 <= panelH) {
				const idx = Math.floor(y2 / ROW);
				return bands[idx] ? { band: bands[idx], side: 'add' } : null;
			}
			return null;
		}
		if (py < TOP || py > TOP + panelH) return null;
		const idx = Math.floor((py - TOP) / ROW);
		if (!bands[idx]) return null;
		return { band: bands[idx], side: px >= addX0 - GAP / 2 ? 'add' : 'rem' };
	}
</script>

<ChartFrame
	title={title ?? data.title}
	dek={dek ?? data.dek}
	note={note ?? data.note}
	source={source ?? data.source}
>
	{#snippet legend()}
		<div class="key" aria-hidden="true">
			<span><i class="sw women"></i>Women</span>
			<span><i class="sw men"></i>Men</span>
			<span class="scale-note">Independent scales</span>
		</div>
	{/snippet}

	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Paired horizontal bars comparing voters struck off before the draft against additions on the final roll, by age group and gender."
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			<!-- Panel 1: Removed before draft -->
			<g>
				<text class="panel-hdr" x={remX0} y={14}>Removed before draft</text>
				<text class="panel-sub" x={remX0} y={30}>{lakh(totRem)} total</text>
				<line class="axis-line" x1={crisp(remX0)} x2={crisp(remX0)} y1={TOP - 4} y2={TOP + panelH} />

				{#each bands as b, i (b.band)}
					{@const yTop = TOP + i * ROW + (ROW - (2 * BAR + PAIR_GAP)) / 2}
					{@const cy = TOP + i * ROW + ROW / 2}
					{@const wf = Math.max(2, xRem(b.f_rem))}
					{@const wm = Math.max(2, xRem(b.m_rem))}
					<g class={['row', { hot: hover?.d.band.band === b.band && hover?.d.side === 'rem' }]}>
						<rect class="hit" x={0} y={TOP + i * ROW} width={stacked ? w : addX0 - GAP / 2} height={ROW} />
						<text class="lab" x={remX0 - 10} y={cy} text-anchor="end">{b.band}</text>
						<rect class="bar women" x={remX0} y={yTop} width={wf} height={BAR} />
						<text class="val women" x={remX0 + wf + 5} y={yTop + BAR / 2}>{compact(b.f_rem)}</text>
						<rect class="bar men" x={remX0} y={yTop + BAR + PAIR_GAP} width={wm} height={BAR} />
						<text class="val men" x={remX0 + wm + 5} y={yTop + BAR + PAIR_GAP + BAR / 2}
							>{compact(b.m_rem)}</text
						>
					</g>
				{/each}
			</g>

			<!-- Panel 2: Added on final roll -->
			<g transform="translate(0, {addY0})">
				<text class="panel-hdr" x={addX0} y={14}>Added on final roll</text>
				<text class="panel-sub" x={addX0} y={30}>{lakh(totAdd)} total</text>
				<line class="axis-line" x1={crisp(addX0)} x2={crisp(addX0)} y1={TOP - 4} y2={TOP + panelH} />

				{#each bands as b, i (b.band)}
					{@const yTop = TOP + i * ROW + (ROW - (2 * BAR + PAIR_GAP)) / 2}
					{@const cy = TOP + i * ROW + ROW / 2}
					{@const wf = Math.max(2, xAdd(b.f_add))}
					{@const wm = Math.max(2, xAdd(b.m_add))}
					<g class={['row', { hot: hover?.d.band.band === b.band && hover?.d.side === 'add' }]}>
						<rect
							class="hit"
							x={stacked ? 0 : addX0 - GAP / 2}
							y={TOP + i * ROW}
							width={stacked ? w : w - (addX0 - GAP / 2)}
							height={ROW}
						/>
						{#if stacked}
							<text class="lab" x={addX0 - 10} y={cy} text-anchor="end">{b.band}</text>
						{/if}
						<rect class="bar women" x={addX0} y={yTop} width={wf} height={BAR} />
						<text class="val women" x={addX0 + wf + 5} y={yTop + BAR / 2}>{compact(b.f_add)}</text>
						<rect class="bar men" x={addX0} y={yTop + BAR + PAIR_GAP} width={wm} height={BAR} />
						<text class="val men" x={addX0 + wm + 5} y={yTop + BAR + PAIR_GAP + BAR / 2}
							>{compact(b.m_add)}</text
						>
					</g>
				{/each}
			</g>
		</svg>

		{#if hover}
			{@const b = hover.d.band}
			{@const isRem = hover.d.side === 'rem'}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title="Ages {b.band}"
				sub={isRem ? 'Removed before draft' : 'Added on final roll'}
				rows={isRem
					? [
							['Women removed', inr(b.f_rem)],
							['Men removed', inr(b.m_rem)],
							['Women added', inr(b.f_add)],
							['Men added', inr(b.m_add)]
						]
					: [
							['Women added', inr(b.f_add)],
							['Men added', inr(b.m_add)],
							['Women removed', inr(b.f_rem)],
							['Men removed', inr(b.m_rem)]
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
		gap: 0.45rem 1rem;
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--c-ink);
	}
	.key > span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.scale-note {
		font-weight: 400;
		color: var(--c-mute);
	}
	.sw {
		display: inline-block;
		width: 11px;
		height: 9px;
	}
	.sw.women {
		background: var(--d-w3);
	}
	.sw.men {
		background: color-mix(in oklch, var(--foreground) 34%, var(--background));
	}

	.hit {
		fill: transparent;
	}
	.row.hot .hit {
		fill: color-mix(in oklch, var(--foreground) 3.5%, transparent);
	}
	.panel-hdr {
		font-size: 13px;
		font-weight: 700;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.panel-sub {
		font-size: 12px;
		fill: var(--c-mute);
		dominant-baseline: middle;
	}
	.axis-line {
		stroke: color-mix(in oklch, var(--foreground) 26%, var(--background));
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.lab {
		font-size: 13px;
		fill: var(--c-text);
		dominant-baseline: middle;
	}
	.bar {
		shape-rendering: crispEdges;
	}
	.bar.women {
		fill: var(--d-w3);
	}
	.bar.men {
		fill: color-mix(in oklch, var(--foreground) 30%, var(--background));
	}
	.val {
		font-size: 11.5px;
		dominant-baseline: middle;
	}
	.val.women {
		font-weight: 700;
		fill: var(--d-w3);
	}
	.val.men {
		fill: color-mix(in oklch, var(--foreground) 56%, var(--background));
	}
</style>
