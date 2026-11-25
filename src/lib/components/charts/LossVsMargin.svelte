<script>
	import { scaleLinear } from 'd3';
	import { ArrowRight, ArrowUp } from '@lucide/svelte';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr, lakh } from './theme.js';
	import krDemographics from '$data/states/karnataka/demographics.json';

	/**
	 * @typedef {{ ac: number, name: string, district: string, margin: number, winner_party: string, before: number, after: number, net_loss: number, dropped: number, q_disq: number, excess_f_loss: number }} MarginRow
	 * @typedef {{ title: string, dek: string, note: string, source: string, electionYear: number, exceedsCount: number, totalAcs: number, qExceedsCount?: number, excessFemaleExceedsCount?: number, medianRatio: number, heroAcs: number[], rows: MarginRow[] }} MarginData
	 */

	/** @type {{ data?: MarginData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data = krDemographics.lossVsMargin, title, dek, note, source } = $props();

	const rows = $derived(data.rows ?? []);
	const heroSet = $derived(new Set(data.heroAcs ?? []));

	const xMax = $derived.by(() => {
		const top = Math.max(...rows.map((r) => r.margin), 100000);
		return Math.ceil((top + 10000) / 50000) * 50000;
	});
	const yMax = $derived.by(() => {
		const top = Math.max(...rows.map((r) => r.net_loss), 100000);
		return Math.ceil((top + 15000) / 50000) * 50000;
	});

	/** @param {number} max */
	const makeTicks = (max) => {
		const step = max <= 150000 ? 50000 : max <= 250000 ? 50000 : 100000;
		const out = [];
		for (let v = 0; v <= max; v += step) out.push(v);
		return out;
	};
	const xTicks = $derived(makeTicks(xMax));
	const yTicks = $derived(makeTicks(yMax));

	/** @param {number} v */
	const tickLbl = (v) => {
		if (v === 0) return '0';
		if (v < 100000) return `${Math.round(v / 1000)}k`;
		return lakh(v, v % 100000 === 0 ? 0 : 1)
			.replace(' lakh', 'L')
			.replace(' million', 'M');
	};

	/** @type {Record<string, { side: 'left' | 'right' | 'above' | 'below', narrowSide?: 'left' | 'right' | 'above' | 'below' }>} */
	const HERO_POS = {
		'Bangalore South': { side: 'right', narrowSide: 'below' },
		Dasarahalli: { side: 'right' },
		Jayanagar: { side: 'right' },
		Kanakapura: { side: 'above' },
		'Lucknow North': { side: 'right', narrowSide: 'above' },
		'Meerut South': { side: 'above' },
		Noida: { side: 'below' },
		Mehroni: { side: 'above' }
	};

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 540);
	const H = $derived(narrow ? 360 : 420);
	const M = $derived({
		top: 32,
		right: narrow ? 16 : 24,
		bottom: 48,
		left: narrow ? 44 : 50
	});

	const x = $derived(
		scaleLinear()
			.domain([0, xMax])
			.range([M.left, w - M.right])
	);
	const y = $derived(
		scaleLinear()
			.domain([0, yMax])
			.range([H - M.bottom, M.top])
	);
	const clampY = (/** @type {number} */ v) => y(Math.max(0, v));

	const crowd = $derived(rows.filter((r) => !heroSet.has(r.ac)));
	const heroes = $derived(rows.filter((r) => heroSet.has(r.ac)));

	const diagEnd = $derived(Math.min(xMax, yMax));
	const diagAngle = $derived(
		(Math.atan2(y(diagEnd) - y(0), x(diagEnd) - x(0)) * 180) / Math.PI
	);
	const diagAt = $derived(diagEnd * 0.94);

	/** Compact hero subtitle. @param {MarginRow} d */
	const heroSub = (d) => {
		const loss = tickLbl(d.net_loss);
		const mar = d.margin < 1000 ? `${d.margin}` : tickLbl(d.margin);
		return `${loss} lost vs ${mar} margin`;
	};

	const heroLabels = $derived(
		heroes.map((d) => {
			const px = x(d.margin);
			const py = clampY(d.net_loss);
			const pref = HERO_POS[d.name] ?? { side: d.net_loss > d.margin ? 'right' : 'below' };
			const side = narrow && pref.narrowSide ? pref.narrowSide : pref.side;
			const sub = heroSub(d);
			const gap = 9;
			let tx = px;
			let ty = py;
			/** @type {'start' | 'middle' | 'end'} */
			let anchor = 'middle';
			if (side === 'right') {
				tx = px + gap;
				ty = py - 3;
				anchor = 'start';
			} else if (side === 'left') {
				tx = px - gap;
				ty = py - 3;
				anchor = 'end';
			} else if (side === 'above') {
				const estHalf = Math.max(d.name.length, sub.length) * 3.4;
				tx = Math.min(w - M.right - estHalf, Math.max(M.left + estHalf, px));
				ty = py - gap - 15;
				anchor = 'middle';
			} else {
				const estHalf = Math.max(d.name.length, sub.length) * 3.4;
				tx = Math.min(w - M.right - estHalf, Math.max(M.left + estHalf, px));
				ty = py + gap + 12;
				anchor = 'middle';
			}
			return { d, tx, ty, anchor, sub };
		})
	);

	/** @type {{ d: MarginRow, px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} px @param {number} py */
	function nearest(px, py) {
		let best = null;
		let bd = 16 * 16;
		for (const d of rows) {
			const dx = x(d.margin) - px;
			const dy = clampY(d.net_loss) - py;
			const dd = dx * dx + dy * dy;
			if (dd < bd) [best, bd] = [d, dd];
		}
		return best;
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
			<span><i class="sw above"></i>Loss exceeded {data.electionYear} margin</span>
			<span><i class="sw below"></i>Within {data.electionYear} margin</span>
		</div>
	{/snippet}

	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Scatter of {rows.length} constituencies comparing {data.electionYear} winning margin against net voter loss."
			{@attach hoverTap(nearest, (h) => (hover = h))}
		>
			{#each yTicks as t (t)}
				<line class="grid" x1={M.left} x2={w - M.right} y1={crisp(y(t))} y2={crisp(y(t))} />
				<text class="tick" x={M.left - 8} y={y(t)} text-anchor="end">{tickLbl(t)}</text>
			{/each}
			{#each xTicks as t (t)}
				<line class="grid" x1={crisp(x(t))} x2={crisp(x(t))} y1={M.top} y2={y(0)} />
				<text class="tick" x={x(t)} y={y(0) + 18} text-anchor="middle">{tickLbl(t)}</text>
			{/each}

			<ArrowUp class="icon" x={0} y={M.top - 25} size={13} strokeWidth={2} aria-hidden="true" />
			<text class="axis" x={16} y={M.top - 14}>Net voter loss</text>
			<text class="axis" x={w - M.right - 16} y={H - 6} text-anchor="end"
				>{data.electionYear} winning margin</text
			>
			<ArrowRight
				class="icon"
				x={w - M.right - 13}
				y={H - 17}
				size={13}
				strokeWidth={2}
				aria-hidden="true"
			/>

			<line class="diag" x1={x(0)} y1={y(0)} x2={x(diagEnd)} y2={y(diagEnd)} />
			<text
				class="diag-lbl"
				transform="translate({x(diagAt)}, {y(diagAt) + 14}) rotate({diagAngle})"
				text-anchor="end">Net loss = margin</text
			>

			{#each crowd as d (d.ac)}
				<circle
					class={['dot', d.net_loss > d.margin ? 'above' : 'below']}
					cx={x(d.margin)}
					cy={clampY(d.net_loss)}
					r={narrow ? 3 : 3.6}
				/>
			{/each}

			{#each heroes as d (d.ac)}
				<circle
					class={['dot hero', d.net_loss > d.margin ? 'above' : 'below']}
					cx={x(d.margin)}
					cy={clampY(d.net_loss)}
					r={narrow ? 5.2 : 6}
				/>
			{/each}

			{#each heroLabels as h (h.d.ac)}
				<text class="hero-name" x={h.tx} y={h.ty} text-anchor={h.anchor}>
					<tspan x={h.tx}>{h.d.name}</tspan>
					<tspan class="sub" x={h.tx} dy="14">{h.sub}</tspan>
				</text>
			{/each}

			{#if hover}
				{@const d = hover.d}
				<circle class="ring" cx={x(d.margin)} cy={clampY(d.net_loss)} r={8.5} />
			{/if}
		</svg>

		{#if hover}
			{@const d = hover.d}
			{@const ratio = d.margin > 0 ? (d.net_loss / d.margin).toFixed(1) : '—'}
			<HoverCard
				x={x(d.margin)}
				y={clampY(d.net_loss)}
				{w}
				title={d.name}
				sub="{d.district} · {d.winner_party} ({data.electionYear})"
				rows={[
					[`${data.electionYear} margin`, inr(d.margin)],
					['Net voter loss', d.net_loss < 0 ? `grew ${inr(-d.net_loss)}` : inr(d.net_loss)],
					['Loss / margin', d.net_loss < 0 ? '—' : `${ratio}×`],
					['Disqualified (Q)', inr(d.q_disq)]
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
		gap: 0.35rem;
	}
	.sw {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.sw.above {
		background: var(--d-w3);
	}
	.sw.below {
		background: color-mix(in oklch, var(--foreground) 26%, var(--background));
	}

	.grid {
		stroke: var(--c-grid);
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.diag {
		stroke: color-mix(in oklch, var(--foreground) 55%, var(--background));
		stroke-width: 1.25px;
		stroke-dasharray: 2 3;
	}
	.diag-lbl {
		font-size: 12px;
		font-style: italic;
		fill: var(--c-mute);
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	.dot {
		stroke: var(--c-bg);
		stroke-width: 0.75px;
	}
	.dot.above {
		fill: var(--d-w3);
		fill-opacity: 0.72;
	}
	.dot.below {
		fill: color-mix(in oklch, var(--foreground) 26%, var(--background));
		fill-opacity: 0.72;
	}
	.dot.hero {
		fill-opacity: 0.96;
		stroke: var(--c-ink);
		stroke-width: 1.75px;
	}
	.ring {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1.75px;
		pointer-events: none;
	}
	text {
		fill: var(--c-ink);
	}
	:global(svg.icon) {
		color: var(--c-ink);
		overflow: visible;
	}
	.tick {
		font-size: 12px;
		fill: var(--c-mute);
		dominant-baseline: middle;
	}
	.axis {
		font-size: 12px;
		fill: var(--c-text);
	}
	.hero-name {
		font-size: 13px;
		font-weight: 700;
		fill: var(--c-ink);
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 4px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.hero-name .sub {
		font-size: 12px;
		font-weight: 400;
		fill: var(--c-text);
	}
</style>
