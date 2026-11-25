<script>
	import { area, line, scaleLinear } from 'd3';
	import { ArrowUp } from '@lucide/svelte';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr, pct } from './theme.js';
	import krDemographics from '$data/states/karnataka/demographics.json';

	/**
	 * @typedef {{ band: string, mid: number, f_tot: number, f_rem: number, m_tot: number, m_rem: number, f_pct: number, m_pct: number }} Band
	 * @typedef {{ title: string, dek: string, note: string, source: string, peakAge: number, peakLabel: string, secondNote: string, secondAge: number, bands: Band[] }} AgeGenderData
	 */

	/** @type {{ data?: AgeGenderData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data = krDemographics.ageGender, title, dek, note, source } = $props();

	const bands = $derived(data.bands ?? []);
	const xMin = $derived(Math.min(18, ...(bands.map((b) => b.mid - 2.5))));
	const xMax = $derived(Math.max(79, ...(bands.map((b) => b.mid + 1.5))));
	const yMax = $derived.by(() => {
		const top = Math.max(...bands.flatMap((b) => [b.f_pct, b.m_pct]), 30);
		return Math.ceil((top + 3) / 10) * 10;
	});
	const yTicks = $derived.by(() => {
		const out = [];
		for (let v = 0; v <= yMax; v += 10) out.push(v);
		return out;
	});

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 540);
	const H = $derived(narrow ? 320 : 370);
	const M = $derived({
		top: 32,
		right: narrow ? 16 : 22,
		bottom: 44,
		left: narrow ? 38 : 42
	});

	const x = $derived(
		scaleLinear()
			.domain([xMin, xMax])
			.range([M.left, w - M.right])
	);
	const y = $derived(
		scaleLinear()
			.domain([0, yMax])
			.range([H - M.bottom, M.top])
	);

	const X_TICKS = $derived(narrow ? [20, 30, 40, 50, 60, 70] : [20, 30, 40, 50, 60, 70]);

	// Split the ribbon at exact linear crossing points so orange shades Women > Men and neutral grey
	// shades Men > Women cleanly (essential for Karnataka's age-40 crossover).
	const ribbons = $derived.by(() => {
		if (bands.length < 2) return [];
		/** @type {{ sign: 'f' | 'm', pts: { mid: number, f: number, m: number }[] }[]} */
		const segs = [];
		/** @param {'f' | 'm'} sign @param {{ mid: number, f: number, m: number }} pt */
		const push = (sign, pt) => {
			const last = segs[segs.length - 1];
			if (last && last.sign === sign) last.pts.push(pt);
			else segs.push({ sign, pts: [pt] });
		};
		for (let i = 0; i < bands.length - 1; i++) {
			const a = bands[i];
			const b = bands[i + 1];
			const da = a.f_pct - a.m_pct;
			const db = b.f_pct - b.m_pct;
			const pa = { mid: a.mid, f: a.f_pct, m: a.m_pct };
			const pb = { mid: b.mid, f: b.f_pct, m: b.m_pct };
			if (da * db < 0) {
				const t = da / (da - db);
				const cx = a.mid + t * (b.mid - a.mid);
				const cy = a.f_pct + t * (b.f_pct - a.f_pct);
				const pc = { mid: cx, f: cy, m: cy };
				const s1 = da >= 0 ? 'f' : 'm';
				const s2 = db >= 0 ? 'f' : 'm';
				push(s1, pa);
				push(s1, pc);
				push(s2, pc);
				push(s2, pb);
			} else {
				const s = da > 0 || (da === 0 && db >= 0) ? 'f' : 'm';
				push(s, pa);
				if (i === bands.length - 2) push(s, pb);
			}
		}
		const areaGen = area()
			.x((/** @type {any} */ d) => x(d.mid))
			.y0((/** @type {any} */ d) => y(Math.min(d.f, d.m)))
			.y1((/** @type {any} */ d) => y(Math.max(d.f, d.m)));
		return segs.map((s) => ({ sign: s.sign, d: areaGen(/** @type {any} */ (s.pts)) ?? '' }));
	});

	const womenPath = $derived(
		line()
			.x((/** @type {any} */ d) => x(d.mid))
			.y((/** @type {any} */ d) => y(d.f_pct))(/** @type {any} */ (bands)) ?? ''
	);
	const menPath = $derived(
		line()
			.x((/** @type {any} */ d) => x(d.mid))
			.y((/** @type {any} */ d) => y(d.m_pct))(/** @type {any} */ (bands)) ?? ''
	);

	// Anchor points for direct labels & callouts, computed from the data so both states stay clear.
	const firstBand = $derived(bands[0]);
	const peakBand = $derived(
		bands.find((b) => Math.abs(b.mid - data.peakAge) < 2) ?? bands[1] ?? bands[0]
	);
	const secondBand = $derived(
		bands.find((b) => Math.abs(b.mid - data.secondAge) < 3) ?? bands[bands.length - 3]
	);

	const peakCalloutY = $derived.by(() => {
		if (!peakBand) return 32;
		const localMax = Math.max(
			...bands.filter((b) => b.mid >= 20 && b.mid <= 40).map((b) => Math.max(b.f_pct, b.m_pct))
		);
		return Math.min(yMax - 3.2, localMax + 7.5);
	});

	const secondCalloutLines = $derived.by(() => {
		const txt = data.secondNote ?? '';
		if (!txt) return [];
		const comma = txt.indexOf(', ');
		if (comma > 0 && (narrow || txt.length > 34)) {
			return [txt.slice(0, comma + 1), txt.slice(comma + 2)];
		}
		return [txt];
	});

	/** @type {{ d: Band, px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} px @param {number} py */
	function nearest(px, py) {
		if (px < M.left - 12 || px > w - M.right + 12 || py < M.top - 12 || py > H - M.bottom + 12) {
			return null;
		}
		let best = null;
		let bd = Infinity;
		for (const b of bands) {
			const d = Math.abs(x(b.mid) - px);
			if (d < bd) [best, bd] = [b, d];
		}
		return best;
	}

	/** @param {number} diff */
	const fmtDiff = (diff) =>
		`${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs(diff).toFixed(1)} pts`;
</script>

<ChartFrame
	title={title ?? data.title}
	dek={dek ?? data.dek}
	note={note ?? data.note}
	source={source ?? data.source}
>
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="{title ?? data.title}. Line chart comparing women and men removal rates across age groups."
			{@attach hoverTap(nearest, (h) => (hover = h))}
		>
			{#each yTicks as t (t)}
				<line
					class={['grid', { zero: t === 0 }]}
					x1={M.left}
					x2={w - M.right}
					y1={crisp(y(t))}
					y2={crisp(y(t))}
				/>
				<text class="tick" x={M.left - 8} y={y(t)} text-anchor="end">{t}%</text>
			{/each}

			{#each X_TICKS as t (t)}
				<line class="tick-mark" x1={crisp(x(t))} x2={crisp(x(t))} y1={y(0) + 1} y2={y(0) + 6} />
				<text class="tick" x={x(t)} y={y(0) + 20} text-anchor="middle">{t}</text>
			{/each}
			{#if bands.length}
				{@const last = bands[bands.length - 1]}
				<line
					class="tick-mark"
					x1={crisp(x(last.mid))}
					x2={crisp(x(last.mid))}
					y1={y(0) + 1}
					y2={y(0) + 6}
				/>
				<text class="tick" x={x(last.mid)} y={y(0) + 20} text-anchor="middle">75+</text>
			{/if}

			<ArrowUp class="icon" x={0} y={M.top - 25} size={13} strokeWidth={2} aria-hidden="true" />
			<text class="axis" x={16} y={M.top - 14}>Share removed</text>
			<text class="axis" x={w - M.right} y={H - 4} text-anchor="end">Age group</text>

			{#each ribbons as r, i (i)}
				<path class={['ribbon', r.sign]} d={r.d} />
			{/each}

			<path class="line men" d={menPath} />
			<path class="line women" d={womenPath} />

			{#each bands as b (b.band)}
				<circle class="pt men" cx={x(b.mid)} cy={y(b.m_pct)} r={narrow ? 2.5 : 3} />
				<circle class="pt women" cx={x(b.mid)} cy={y(b.f_pct)} r={narrow ? 2.5 : 3} />
			{/each}

			{#if firstBand && bands.length > 1}
				<text
					class="series women"
					x={x(bands[1].mid) - 6}
					y={y(bands[1].f_pct) - 8}
					text-anchor="end">Women</text
				>
				<text class="series men" x={x(firstBand.mid)} y={y(firstBand.m_pct) + 18} text-anchor="start"
					>Men</text
				>
			{/if}

			{#if peakBand && data.peakLabel}
				{@const px = crisp(x(peakBand.mid))}
				<line
					class="leader"
					x1={px}
					x2={px}
					y1={y(peakCalloutY) + 10}
					y2={y(peakBand.f_pct) - 6}
				/>
				<text
					class="callout strong"
					x={narrow ? M.left + 4 : Math.max(M.left + 4, x(peakBand.mid) - 18)}
					y={y(peakCalloutY)}
					text-anchor="start">{data.peakLabel.replace('x ', '× ')}</text
				>
			{/if}

			{#if secondBand && secondCalloutLines.length}
				{@const sx = crisp(x(secondBand.mid))}
				{@const lowVal = Math.min(secondBand.f_pct, secondBand.m_pct)}
				{@const noteY = y(Math.max(4.5, lowVal - 9.5))}
				<line class="leader" x1={sx} x2={sx} y1={y(lowVal) + 6} y2={noteY - 12} />
				<text
					class="callout muted"
					x={Math.min(w - M.right - 2, x(secondBand.mid) + (narrow ? 12 : 0))}
					y={noteY}
					text-anchor={narrow ? 'end' : 'middle'}
				>
					{#each secondCalloutLines as ln, i (i)}
						<tspan x={Math.min(w - M.right - 2, x(secondBand.mid) + (narrow ? 12 : 0))} dy={i ? 15 : 0}
							>{ln}</tspan
						>
					{/each}
				</text>
			{/if}

			{#if hover}
				{@const b = hover.d}
				<line class="guide" x1={crisp(x(b.mid))} x2={crisp(x(b.mid))} y1={M.top} y2={y(0)} />
				<circle class="ring men" cx={x(b.mid)} cy={y(b.m_pct)} r={5.5} />
				<circle class="ring women" cx={x(b.mid)} cy={y(b.f_pct)} r={5.5} />
			{/if}
		</svg>

		{#if hover}
			{@const b = hover.d}
			<HoverCard
				x={x(b.mid)}
				y={Math.min(y(b.f_pct), y(b.m_pct))}
				{w}
				title="Ages {b.band}"
				rows={[
					['Women', `${pct(b.f_pct, 1)} (${inr(b.f_rem)})`],
					['Men', `${pct(b.m_pct, 1)} (${inr(b.m_rem)})`],
					['Gap (W − M)', fmtDiff(b.f_pct - b.m_pct)]
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	.grid {
		stroke: var(--c-grid);
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.grid.zero {
		stroke: color-mix(in oklch, var(--foreground) 32%, var(--background));
	}
	.tick-mark {
		stroke: color-mix(in oklch, var(--foreground) 38%, var(--background));
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.ribbon.f {
		fill: var(--d-w0);
		fill-opacity: 0.62;
	}
	.ribbon.m {
		fill: color-mix(in oklch, var(--foreground) 11%, var(--background));
	}
	.line {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.line.women {
		stroke: var(--d-w3);
		stroke-width: 2.75px;
	}
	.line.men {
		stroke: color-mix(in oklch, var(--foreground) 48%, var(--background));
		stroke-width: 2px;
	}
	.pt.women {
		fill: var(--d-w3);
		stroke: var(--c-bg);
		stroke-width: 1.25px;
	}
	.pt.men {
		fill: color-mix(in oklch, var(--foreground) 48%, var(--background));
		stroke: var(--c-bg);
		stroke-width: 1.25px;
	}
	.guide {
		stroke: color-mix(in oklch, var(--foreground) 25%, var(--background));
		stroke-width: 1px;
		stroke-dasharray: 2 2;
		pointer-events: none;
	}
	.ring {
		fill: var(--c-bg);
		stroke-width: 2.25px;
		pointer-events: none;
	}
	.ring.women {
		stroke: var(--d-w3);
	}
	.ring.men {
		stroke: var(--c-ink);
	}
	.leader {
		stroke: color-mix(in oklch, var(--foreground) 35%, var(--background));
		stroke-width: 1px;
		stroke-dasharray: 2 2;
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
	.series {
		font-size: 13px;
		font-weight: 700;
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 4px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.series.women {
		fill: var(--d-w3);
	}
	.series.men {
		fill: color-mix(in oklch, var(--foreground) 56%, var(--background));
	}
	.callout {
		font-size: 13px;
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 4px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.callout.strong {
		font-weight: 700;
		fill: var(--d-w3);
	}
	.callout.muted {
		fill: var(--c-text);
	}
</style>
