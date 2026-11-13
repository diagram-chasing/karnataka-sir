<script>
	import { scaleLog, scaleLinear } from 'd3';
	import { ArrowLeft, ArrowRight, ArrowUp } from '@lucide/svelte';
	import ChartFrame from './ChartFrame.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import RampLegend from './RampLegend.svelte';
	import { CONSTITUENCIES, MIN_NOTICES } from '$data/constituencies.js';
	import { inr, pct, step, crisp, RAMP, STRUCK_STEPS } from './theme.js';

	const rows = CONSTITUENCIES.filter((d) => d.struckPct != null).map((d) => ({
		...d,
		x: d.noticePct,
		y: d.struckPct
	}));
	const median = (a) => {
		const s = [...a].sort((p, q) => p - q);
		return s[Math.floor(s.length / 2)];
	};
	const medX = median(rows.map((d) => d.x));
	const medY = median(rows.map((d) => d.y));
	const xMin = Math.min(...rows.map((d) => d.x)) * 0.8;

	const NAMED = {
		72: { wide: { side: 'right' }, narrow: { side: 'right', short: true } },
		// on a phone, above the dot: to its left the crowd of dots runs under the name
		175: { wide: { side: 'above' }, narrow: { side: 'above', sub: false } }
	};
	const sub = (d, short = false) =>
		d.y === 0
			? `none of ${inr(d.notices)} struck off`
			: short
				? `${pct(d.y)} struck off`
				: `${pct(d.x, d.x < 1 ? 1 : 0)} got a notice, ${pct(d.y)} struck off`;
	const named = rows.filter((d) => NAMED[d.ac]);
	const crowd = rows.filter((d) => !NAMED[d.ac]);
	const fill = (d) => RAMP[step(d.y, STRUCK_STEPS)];

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 560);
	const H = $derived(narrow ? 380 : 440);
	// on a phone the left margin also holds the label for the median struck off
	const M = $derived({ top: 30, right: narrow ? 18 : 20, bottom: 50, left: narrow ? 46 : 38 });
	const x = $derived(
		scaleLog()
			.domain([xMin, 100])
			.range([M.left, w - M.right])
	);
	const y = $derived(
		scaleLinear()
			.domain([0, 14])
			.range([H - M.bottom, M.top])
	);
	const X_TICKS = [0.3, 1, 3, 10, 30, 100];
	const Y_TICKS = [0, 5, 10];
	const R = $derived(narrow ? 3.5 : 4.5);
	const RN = 7;

	const labels = $derived(
		named
			.map((d) => {
				const spec = NAMED[d.ac][narrow ? 'narrow' : 'wide'];
				if (!spec) return null;
				const lines = spec.sub === false ? [d.name] : [d.name, sub(d, spec.short)];
				const px = x(d.x);
				const py = y(d.y);
				const o = RN + 5;
				let tx = px;
				let ty = py;
				let anchor = 'middle';
				if (spec.side === 'right') [tx, anchor] = [px + o, 'start'];
				if (spec.side === 'left') [tx, anchor] = [px - o, 'end'];
				if (spec.side === 'above') {
					ty = py - o - (lines.length - 1) * 16 - 2;
					// keep a centred label inside the plot (about 8px a character, 14px bold)
					const half = (Math.max(...lines.map((l) => l.length)) * 8) / 2;
					tx = Math.max(M.left + half, Math.min(w - half, px));
				} else if (spec.side === 'below') ty = py + o + 11;
				else ty = py - ((lines.length - 1) * 16) / 2 + 5;
				return { ...d, lines, tx, ty, anchor };
			})
			.filter(Boolean)
	);

	let hover = $state(null);
	function nearest(px, py) {
		let best = null;
		let bd = 14 * 14;
		for (const d of rows) {
			const dx = x(d.x) - px;
			const dy = y(d.y) - py;
			const dd = dx * dx + dy * dy;
			if (dd < bd) [best, bd] = [d, dd];
		}
		return best;
	}
</script>

<ChartFrame
	title="Getting a notice was far riskier in some constituencies than in others"
	dek="Share of voters sent a notice, and share of those struck off as disqualified, {rows.length} assembly constituencies, Karnataka, October 2026"
	note="Constituencies with under {MIN_NOTICES} notices are left out."
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	{#snippet legend()}
		<RampLegend label="Struck off after a notice" steps={STRUCK_STEPS} />
	{/snippet}
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Scatter of {rows.length} constituencies: share of electors sent a notice against share of notice recipients struck off."
			{@attach hoverTap(nearest, (h) => (hover = h))}
		>
			{#each Y_TICKS as t (t)}
				<line class="grid" x1={M.left} x2={w - M.right} y1={crisp(y(t))} y2={crisp(y(t))} />
				<text class="tick" x={M.left - 8} y={y(t)} text-anchor="end">{t}%</text>
			{/each}
			{#each X_TICKS as t (t)}
				<line class="tick-mark" x1={crisp(x(t))} x2={crisp(x(t))} y1={y(0) + 2} y2={y(0) + 7} />
				<text class="tick" x={x(t)} y={y(0) + 23} text-anchor="middle">{t}%</text>
			{/each}
			<ArrowUp class="icon" x={0} y={M.top - 25} size={13} strokeWidth={2} aria-hidden="true" />
			<text class="axis" x={16} y={M.top - 14}
				>Share of voters sent a notice who were struck off</text
			>
			<text class="axis" x={w - M.right - 16} y={H - 6} text-anchor="end"
				>Share of voters sent a notice</text
			>
			<ArrowRight
				class="icon"
				x={w - M.right - 13}
				y={H - 17}
				size={13}
				strokeWidth={2}
				aria-hidden="true"
			/>

			<line class="median" x1={crisp(x(medX))} x2={crisp(x(medX))} y1={y(14)} y2={y(0)} />
			<line class="median" x1={M.left} x2={w - M.right} y1={crisp(y(medY))} y2={crisp(y(medY))} />

			{#each crowd as d (d.ac)}
				<circle class="dot" cx={x(d.x)} cy={y(d.y)} r={R} style:fill={fill(d)} />
			{/each}
			<ArrowLeft
				class="icon"
				x={x(medX) + 5}
				y={y(11.6) - 11}
				size={13}
				strokeWidth={2}
				aria-hidden="true"
			/>
			<text class="note" x={x(medX) + 7} y={y(11.6)}>
				<tspan x={x(medX) + 21}>{pct(medX)}</tspan>
				{#if narrow}
					<tspan x={x(medX) + 7} dy="15">median share</tspan>
					<tspan x={x(medX) + 7} dy="15">sent a notice</tspan>
				{:else}
					<tspan x={x(medX) + 7} dy="15">median share sent a notice</tspan>
				{/if}
			</text>
			{#if narrow}
				<!-- in the tick column: inside the plot it would sit on the crowd of dots -->
				<text class="note med" x={M.left - 6} y={y(medY) - 4} text-anchor="end">median</text>
				<text class="note med v" x={M.left - 6} y={y(medY) + 9} text-anchor="end">{pct(medY)}</text>
			{:else}
				<text class="note" x={M.left + 2} y={y(medY) - 6}>median struck off, {pct(medY)}</text>
			{/if}
			{#each named as d (d.ac)}
				<circle class="dot named" cx={x(d.x)} cy={y(d.y)} r={RN} style:fill={fill(d)} />
			{/each}
			{#each labels as d (d.ac)}
				<text class="name" x={d.tx} y={d.ty} text-anchor={d.anchor}>
					{#each d.lines as line, i (i)}
						<tspan class:sub={i > 0} x={d.tx} dy={i ? 16 : 0}>{line}</tspan>
					{/each}
				</text>
			{/each}
			{#if hover}
				<circle class="ring" cx={x(hover.d.x)} cy={y(hover.d.y)} r={RN + 3} />
			{/if}
		</svg>

		{#if hover}
			{@const d = hover.d}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={d.name}
				sub={d.district}
				rows={[
					['Notices', `${inr(d.notices)} (${pct(d.x, d.x < 1 ? 2 : 1)})`],
					['Struck off', `${inr(d.struck)} (${pct(d.y)})`]
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	.dot {
		stroke: var(--c-outline);
		stroke-width: 1px;
	}
	.dot.named {
		stroke-width: 2px;
	}
	.ring {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1.5px;
		pointer-events: none;
	}
	.grid {
		stroke: var(--c-grid);
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.tick-mark {
		stroke: var(--c-ink);
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.median {
		stroke: var(--c-ink);
		stroke-width: 1px;
		stroke-dasharray: 1 3;
		shape-rendering: crispEdges;
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
		dominant-baseline: middle;
	}
	.axis {
		font-size: 12px;
	}
	.note {
		font-size: 13px;
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	.note.med {
		font-size: 11px;
	}
	.note.med.v {
		font-size: 12px;
		font-weight: 700;
	}
	.name {
		font-size: 14px;
		font-weight: 700;
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3.5px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.name .sub {
		font-size: 13px;
		font-weight: 400;
	}
</style>
