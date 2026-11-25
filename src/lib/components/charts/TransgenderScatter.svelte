<script>
	import { scaleLinear, scaleSqrt } from 'd3';
	import { ArrowRight, ArrowUp } from '@lucide/svelte';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr, pct } from './theme.js';
	import krDemographics from '$data/states/karnataka/demographics.json';

	/**
	 * @typedef {{ ac: number, name: string, district: string, tg: number, tg_rem: number, tg_pct: number, mf_pct: number }} TgRow
	 * @typedef {{ title: string, dek: string, note: string, source: string, acsWith: number, acsHigher: number, acsTotal: number, stateTgPct: number, stateMfPct: number, tgTotal: number, tgRemoved: number, heroAcs: number[], rows: TgRow[] }} TgData
	 */

	/** @type {{ data?: TgData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data = krDemographics.transgender, title, dek, note, source } = $props();

	const rows = $derived(data.rows ?? []);
	const heroSet = $derived(new Set(data.heroAcs ?? []));
	const maxTg = $derived(Math.max(...rows.map((r) => r.tg), 50));
	const xMax = $derived.by(() => {
		const top = Math.max(...rows.map((r) => r.mf_pct), 45);
		return Math.min(70, Math.ceil((top + 4) / 10) * 10);
	});
	const xTicks = $derived.by(() => {
		const out = [];
		for (let v = 0; v <= xMax; v += 10) out.push(v);
		return out;
	});
	const Y_TICKS = [0, 25, 50, 75, 100];

	// Explicit collision-free hero label sides for Karnataka and Uttar Pradesh heroes.
	/** @type {Record<string, { side: 'left' | 'right' | 'above' | 'below', narrowSide?: 'left' | 'right' | 'above' | 'below', dy?: number }>} */
	const HERO_POS = {
		Vijayanagar: { side: 'left', narrowSide: 'above' },
		'Mangalore City South': { side: 'above' },
		'Gulbarga Uttar': { side: 'left' },
		Gandhinagar: { side: 'below' },
		'Kidwai Nagar': { side: 'above' },
		'Moradabad Nagar': { side: 'left', dy: -10 },
		Sahibabad: { side: 'above' },
		'Allahabad South': { side: 'below' }
	};

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 540);
	const H = $derived(narrow ? 370 : 440);
	const M = $derived({
		top: 32,
		right: narrow ? 16 : 24,
		bottom: 48,
		left: narrow ? 40 : 44
	});

	const x = $derived(
		scaleLinear()
			.domain([0, xMax])
			.range([M.left, w - M.right])
	);
	const y = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([H - M.bottom, M.top])
	);
	const rad = $derived(
		scaleSqrt()
			.domain([1, maxTg])
			.range(narrow ? [2.2, 8.5] : [2.6, 11.5])
	);

	// Draw larger non-hero circles first so small points stay visible, then heroes on top.
	const crowd = $derived(rows.filter((r) => !heroSet.has(r.ac)).sort((a, b) => b.tg - a.tg));
	const heroes = $derived(rows.filter((r) => heroSet.has(r.ac)).sort((a, b) => b.tg - a.tg));

	const diagEnd = $derived(Math.min(xMax, 100));
	const diagAngle = $derived((Math.atan2(y(diagEnd) - y(0), x(diagEnd) - x(0)) * 180) / Math.PI);
	const diagLabelAt = $derived(xMax * 0.96);

	// On a phone four labels crowd each other and the points; the two furthest apart are kept.
	const NARROW_QUIET = new Set(['Moradabad Nagar', 'Sahibabad', 'Gulbarga Uttar', 'Vijayanagar']);
	const heroLabels = $derived(
		heroes
			.filter((d) => !(narrow && NARROW_QUIET.has(d.name)))
			.map((d) => {
				const px = x(d.mf_pct);
				const py = y(d.tg_pct);
				const r = rad(d.tg);
				const pref = HERO_POS[d.name] ?? { side: d.tg_pct > d.mf_pct ? 'above' : 'below' };
				const gap = r + 6;
				const sub = `${Math.round(d.tg_pct)}% vs ${Math.round(d.mf_pct)}%`;
				let tx = px;
				let ty = py;
				/** @type {'start' | 'middle' | 'end'} */
				let anchor = 'middle';
				const side = narrow && pref.narrowSide ? pref.narrowSide : pref.side;
				if (side === 'right') {
					tx = px + gap;
					ty = py - 3 + (pref.dy ?? 0);
					anchor = 'start';
				} else if (side === 'left') {
					tx = px - gap;
					ty = py - 3 + (pref.dy ?? 0);
					anchor = 'end';
				} else if (side === 'above') {
					const estHalf = Math.max(d.name.length, sub.length) * 3.6;
					tx = Math.min(w - M.right - estHalf, Math.max(M.left + estHalf, px));
					ty = py - gap - 15 + (pref.dy ?? 0);
					anchor = 'middle';
				} else {
					const estHalf = Math.max(d.name.length, sub.length) * 3.6;
					tx = Math.min(w - M.right - estHalf, Math.max(M.left + estHalf, px));
					ty = py + gap + 12 + (pref.dy ?? 0);
					anchor = 'middle';
				}
				return { d, tx, ty, anchor, sub };
			})
	);

	const sizeKey = $derived(maxTg >= 150 ? [10, 50, 150] : [10, 50, 100]);

	/** @type {{ d: TgRow, px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} px @param {number} py */
	function nearest(px, py) {
		let best = null;
		let bd = 16 * 16;
		for (const d of rows) {
			const dx = x(d.mf_pct) - px;
			const dy = y(d.tg_pct) - py;
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
			<span><i class="sw higher"></i>Higher for transgender voters</span>
			<span><i class="sw lower"></i>Equal or lower</span>
			<span class="sizes">
				Voters:
				{#each sizeKey as n (n)}
					<span class="sz">
						<svg
							width={rad(n) * 2 + 2}
							height={rad(n) * 2 + 2}
							viewBox="0 0 {rad(n) * 2 + 2} {rad(n) * 2 + 2}"
						>
							<circle cx={rad(n) + 1} cy={rad(n) + 1} r={rad(n)} />
						</svg>{n}
					</span>
				{/each}
			</span>
		</div>
	{/snippet}

	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Scatter of {rows.length} constituencies comparing transgender voter removal rate against men and women removal rate."
			{@attach hoverTap(nearest, (h) => (hover = h))}
		>
			{#each Y_TICKS as t (t)}
				<line class="grid" x1={M.left} x2={w - M.right} y1={crisp(y(t))} y2={crisp(y(t))} />
				<text class="tick" x={M.left - 8} y={y(t)} text-anchor="end">{t}%</text>
			{/each}
			{#each xTicks as t (t)}
				<line class="grid" x1={crisp(x(t))} x2={crisp(x(t))} y1={M.top} y2={y(0)} />
				<text class="tick" x={x(t)} y={y(0) + 18} text-anchor="middle">{t}%</text>
			{/each}

			<ArrowUp class="icon" x={0} y={M.top - 25} size={13} strokeWidth={2} aria-hidden="true" />
			<text class="axis" x={16} y={M.top - 14}>Transgender voters removed</text>
			<text class="axis" x={w - M.right - 16} y={H - 6} text-anchor="end"
				>Men &amp; women removed</text
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
				transform="translate({x(diagLabelAt)}, {y(diagLabelAt) + 14}) rotate({diagAngle})"
				text-anchor="end">Equal rate</text
			>

			{#each crowd as d (d.ac)}
				<circle
					class={['dot', d.tg_pct > d.mf_pct ? 'higher' : 'lower']}
					cx={x(d.mf_pct)}
					cy={y(d.tg_pct)}
					r={rad(d.tg)}
				/>
			{/each}

			{#each heroes as d (d.ac)}
				<circle
					class={['dot hero', d.tg_pct > d.mf_pct ? 'higher' : 'lower']}
					cx={x(d.mf_pct)}
					cy={y(d.tg_pct)}
					r={rad(d.tg)}
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
				<circle class="ring" cx={x(d.mf_pct)} cy={y(d.tg_pct)} r={rad(d.tg) + 3} />
			{/if}
		</svg>

		{#if hover}
			{@const d = hover.d}
			<HoverCard
				x={x(d.mf_pct)}
				y={y(d.tg_pct)}
				{w}
				title={d.name}
				sub={d.district}
				rows={[
					['Transgender removed', `${pct(d.tg_pct, 1)} (${inr(d.tg_rem)} of ${inr(d.tg)})`],
					['Men & women removed', pct(d.mf_pct, 1)]
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
		gap: 0.5rem 1.1rem;
		font-size: 0.8125rem;
		color: var(--c-text);
	}
	.key > span {
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
	.sw.higher {
		background: var(--d-w3);
	}
	.sw.lower {
		background: color-mix(in oklch, var(--foreground) 26%, var(--background));
	}
	.sizes {
		color: var(--c-mute);
	}
	.sz {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
	}
	.sz svg circle {
		fill: none;
		stroke: color-mix(in oklch, var(--foreground) 42%, var(--background));
		stroke-width: 1px;
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
	.dot.higher {
		fill: var(--d-w3);
		fill-opacity: 0.76;
	}
	.dot.lower {
		fill: color-mix(in oklch, var(--foreground) 24%, var(--background));
		fill-opacity: 0.75;
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
