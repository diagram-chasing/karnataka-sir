<script>
	import { scaleLinear } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import byReason from '$data/asddo_return.json';
	import byAge from '$data/asddo_return_age.json';
	import { inr, pct, step } from './theme.js';
	import { STRIKE_REASONS } from '$data/strike-reasons.js';

	const SHORT = {
		'Permanently shifted': 'Shifted',
		'Already enrolled elsewhere': 'Enrolled elsewhere'
	};
	const row = (label, d) => ({
		label,
		dropped: d.dropped,
		back: d.back,
		rate: (100 * d.back) / d.dropped
	});
	const panels = [
		{
			title: 'By reason',
			rows: byReason.map((d) => row(STRIKE_REASONS[d.category], d)).sort((a, b) => b.rate - a.rate)
		},
		{
			title: 'By age',
			rows: byAge.map((d) => row(d.band.replace('-', ' to ').replace('+', ' and over'), d))
		}
	];
	const max = Math.max(...panels.flatMap((p) => p.rows.map((r) => r.rate)));
	const STEPS = [0.05, 0.1, 0.2, 0.3];
	const RAMP = ['var(--d-w4)', 'var(--d-w3)', 'var(--d-w2)', 'var(--d-w1)', 'var(--d-w0)'];
	const fill = (r) => RAMP[step(r.rate, STEPS)];

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 560);
	const LAB = $derived(narrow ? 136 : 190);
	const VAL = 62;
	const BAR = 22;
	const ROW = 30;
	const HDR = 26;
	const GAP = 22;
	const x = $derived(
		scaleLinear()
			.domain([0, max])
			.range([0, w - LAB - VAL])
	);
	const layout = $derived.by(() => {
		let y = 0;
		const out = panels.map((p) => {
			const top = y;
			y += HDR;
			const rows = p.rows.map((r) => {
				const o = { ...r, y, cy: y + BAR / 2 };
				y += ROW;
				return o;
			});
			y += GAP;
			return { ...p, top, rows };
		});
		return { panels: out, height: y - GAP + 4 };
	});

	let hover = $state(null);
	const pick = (_, py) =>
		layout.panels.flatMap((p) => p.rows).find((r) => py >= r.y && py <= r.y + BAR);
</script>

<ChartFrame
	title="Older voters and those marked dead were the least likely to come back"
	dek="Share of voters struck off before the draft roll who are back on the final roll, by reason and age, Karnataka, October 2026"
	note="A voter counts as back if someone with the same name, relative's name and age was added in the same constituency. This finds about 85% of them. Age is from the January 2025 roll."
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={layout.height}
			role="img"
			aria-label="Share of people struck off who are back on the final roll, by reason and by age band"
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			{#each layout.panels as p (p.title)}
				<text class="hdr" x={0} y={p.top + 10}>{p.title}</text>
				{#each p.rows as r (r.label)}
					<text class="lab" x={LAB - 10} y={r.cy} text-anchor="end"
						>{narrow ? (SHORT[r.label] ?? r.label) : r.label}</text
					>
					<rect
						class="bar"
						x={LAB + 1}
						y={r.y + 1}
						width={Math.max(x(r.rate) - 2, 2)}
						height={BAR - 2}
						style:fill={fill(r)}
					/>
					<text class="val" x={LAB + x(r.rate) + 7} y={r.cy}>{pct(r.rate, 2)}</text>
				{/each}
			{/each}
		</svg>
		{#if hover}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={hover.d.label}
				rows={[
					['Struck off', inr(hover.d.dropped)],
					['Back on the roll', inr(hover.d.back)],
					['Share back', pct(hover.d.rate, 2)]
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
	.hdr {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 13px;
		font-weight: 700;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.lab,
	.val {
		font-size: 14px;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.val {
		font-weight: 700;
	}
</style>
