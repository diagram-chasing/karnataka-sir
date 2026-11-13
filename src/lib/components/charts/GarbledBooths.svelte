<script>
	import { scaleLinear } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import booths from '$data/garbled_booths.json';
	import { inr, pct } from './theme.js';

	const rows = [...booths]
		.sort((a, b) => b.pct - a.pct)
		.map((d) => ({
			...d,
			label: `${d.constituency} ${d.part}`,
			rr: d.constituency === 'Raichur Rural'
		}));

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 560);
	const LAB = $derived(narrow ? 142 : 150);
	const VAL = 48;
	const BAR = 20;
	const ROW = 27;
	const x = $derived(
		scaleLinear()
			.domain([0, rows[0].pct])
			.range([0, w - LAB - VAL])
	);
	const height = rows.length * ROW;

	let hover = $state(null);
	const pick = (_, py) => (py % ROW <= BAR ? rows[Math.floor(py / ROW)] : null);
</script>

<ChartFrame
	title="Half of all garbled names come from just four booths in Raichur Rural"
	dek="Share of voters whose name or relative's name is printed as symbols, 12 booths with the most, Karnataka, final roll, October 2026"
	note="A name counts as garbled if it is mostly symbols."
	source="Source: Diagram Chasing"
>
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			{height}
			role="img"
			aria-label="Twelve booths by share of garbled names, Raichur Rural's four highlighted"
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			{#each rows as r, i (r.label)}
				{@const y = i * ROW}
				<text class={['lab', { rr: r.rr }]} x={LAB - 10} y={y + BAR / 2} text-anchor="end"
					>{r.label}</text
				>
				<rect
					class={['bar', r.rr ? 'hot' : 'pale']}
					x={LAB + 1}
					y={y + 1}
					width={Math.max(x(r.pct) - 2, 2)}
					height={BAR - 2}
				/>
				<text class="val" x={LAB + x(r.pct) + 7} y={y + BAR / 2}>{pct(r.pct, 0)}</text>
			{/each}
		</svg>
		{#if hover}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={hover.d.label}
				sub={hover.d.booth}
				rows={[
					['Garbled names', inr(hover.d.garbled)],
					['Voters in the booth', inr(hover.d.voters)],
					['Share', pct(hover.d.pct, 1)]
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	rect {
		shape-rendering: crispEdges;
	}
	.bar {
		stroke: var(--c-outline);
		stroke-width: 2px;
	}
	.bar.hot {
		fill: var(--d-w3);
	}
	.bar.pale {
		fill: var(--d-wx);
	}
	.lab,
	.val {
		font-size: 14px;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.lab.rr,
	.val {
		font-weight: 700;
	}
</style>
