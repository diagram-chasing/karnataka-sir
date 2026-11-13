<script>
	import { scaleLinear } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import { STRIKE_REASONS } from '$data/strike-reasons.js';
	import { lakh, inr, pct, crisp } from './theme.js';

	const JUNE = 55432314;
	const KEPT = 44635975;
	const REASONS = [
		['shifted', 6545679],
		['absent', 1900926],
		['dead', 1639864],
		['duplicate', 709870]
	];
	const DROPPED = JUNE - KEPT;

	const seg = ({ row, label, name = label, n, total, x0, kind, value = () => lakh(n) }) => ({
		row,
		label,
		name,
		n,
		share: n / total,
		x1: x0,
		x2: x0 + n / total,
		kind,
		get value() {
			return value();
		}
	});
	const segs = [
		seg({ row: 0, label: 'Kept in the draft roll', n: KEPT, total: JUNE, x0: 0, kind: 'on' }),
		seg({
			row: 0,
			label: 'Struck off before the draft',
			name: 'Struck off',
			n: DROPPED,
			total: JUNE,
			x0: KEPT / JUNE,
			kind: 'off'
		})
	];
	let acc = 0;
	for (const [key, n] of REASONS) {
		segs.push(seg({ row: 1, label: STRIKE_REASONS[key], n, total: DROPPED, x0: acc, kind: 'off' }));
		acc += n / DROPPED;
	}
	// who came back is ReturnWall's job, straight after this chart

	const HEADERS = ['On the roll, 16 June 2026', 'Struck off, by reason'];

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 560);
	const fs = 14;
	const x = $derived(scaleLinear().domain([0, 1]).range([0, w]));

	const HDR = 24;
	const BAR = 56;
	const PAD = 10;
	const PITCH = $derived(Math.round(fs * 2.5));
	const GAP = 16;
	const LIFT = $derived(narrow ? 0 : 10);
	const GAPX = 2;
	const SLIVER = 6;
	const INSET = 8;
	const GUTTER = 5;

	const layout = $derived.by(() => {
		const perChar = fs * 0.54;
		const fits = (d) => {
			const chars = Math.max(d.name.length, d.value.length);
			return d.share * w >= chars * perChar + 2 * INSET + 4;
		};
		const rects = [];
		const inside = [];
		const outside = [];
		const headers = [];
		let y = 0;
		for (let r = 0; r < HEADERS.length; r++) {
			if (r === 1) y += LIFT;
			const barTop = y + HDR;
			const barBot = barTop + BAR;
			headers.push({ x: r === 1 ? 9 : 0, y: y + 9, text: HEADERS[r] });
			const rowSegs = segs.filter((d) => d.row === r);
			rowSegs.forEach((d, i) => {
				const px1 = i > 0 ? x(d.x1) + GAPX : x(d.x1);
				let wd = Math.max(x(d.x2) - px1, SLIVER);
				let px = px1;
				if (px + wd > w) px = w - wd;
				const p = { ...d, px, wd, barTop, barBot, mid: px + wd / 2, in: fits(d) };
				rects.push(p);
				if (p.in) inside.push(p);
			});
			const outs = rects.filter((d) => d.row === r && !d.in).sort((a, b) => a.mid - b.mid);
			outs.forEach((d, k) => {
				const yText = barBot + PAD + k * PITCH;
				const yLine = crisp(yText + fs * 0.45);
				const onBracket = r === 0;
				const flip = onBracket || d.mid > w * 0.5;
				const lx = onBracket ? crisp(d.px) : crisp(d.mid);
				outside.push({
					...d,
					lx,
					yText,
					yLine,
					xFoot: lx + (flip ? -5 : 5),
					xText: (onBracket ? d.px : d.mid) + (flip ? -INSET : INSET),
					flip,
					onBracket
				});
			});
			y = barBot + (outs.length ? PAD + outs.length * PITCH : 0) + GAP;
		}
		const struck = rects.find((d) => d.row === 0 && d.kind === 'off');
		const second = rects.find((d) => d.row === 1);
		const hung = outside.filter((d) => d.onBracket);
		const xL = crisp(struck.px);
		const xR = crisp(struck.px + struck.wd) - 1;
		const yStep = crisp(hung.length ? hung[hung.length - 1].yText + PITCH : struck.barBot + 12);
		const top = struck.barBot + GUTTER;
		const bot = second.barTop - GUTTER;
		const bracket = {
			left: `${xL},${top} ${xL},${yStep} ${crisp(0)},${yStep} ${crisp(0)},${bot}`,
			right: `${xR},${top} ${xR},${bot}`
		};
		return { rects, inside, outside, headers, bracket, height: Math.ceil(y - GAP + 2) };
	});

	let hover = $state(null);
	const pick = (px, py) =>
		layout.rects.find((s) => px >= s.px && px <= s.px + s.wd && py >= s.barTop && py <= s.barBot);
</script>

<ChartFrame
	title="One in five voters was struck off before the draft roll"
	dek="Voters on the roll in June 2026, and those struck off before the draft roll by reason, Karnataka"
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={layout.height}
			role="img"
			aria-label="Two bars: the June roll split into kept and struck off, and the struck off by reason."
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			<polyline class="bracket" points={layout.bracket.left} />
			<polyline class="bracket" points={layout.bracket.right} />

			{#each layout.rects as d (d.label)}
				<rect
					x={d.px + 1}
					y={d.barTop + 1}
					width={d.wd - 2}
					height={BAR - 2}
					class="bar {d.kind}"
					class:hot={hover?.d.label === d.label}
				/>
			{/each}

			{#each layout.headers as h (h.text)}
				<text class="hdr" x={h.x} y={h.y}>{h.text}</text>
			{/each}

			{#each layout.inside as d (d.label)}
				<text class="seg {d.kind}" x={d.px + INSET} y={d.barTop + INSET} font-size={fs}>
					<tspan x={d.px + INSET} dy={fs * 0.85}>{d.name}</tspan>
					<tspan x={d.px + INSET} dy={fs * 1.25}>{d.value}</tspan>
				</text>
			{/each}

			{#each layout.outside as d (d.label)}
				{#if d.onBracket}
					<polyline class="leader {d.kind}" points="{d.lx},{d.yLine} {d.xFoot},{d.yLine}" />
				{:else}
					<polyline
						class="leader {d.kind}"
						points="{d.lx},{d.barBot + GUTTER} {d.lx},{d.yLine} {d.xFoot},{d.yLine}"
					/>
				{/if}
				<text
					class="seg out {d.kind}"
					x={d.xText}
					y={d.yText}
					font-size={fs}
					text-anchor={d.flip ? 'end' : 'start'}
				>
					<tspan x={d.xText} dy={fs * 0.85}>{d.name}</tspan>
					<tspan x={d.xText} dy={fs * 1.25}>{d.value}</tspan>
				</text>
			{/each}
		</svg>

		{#if hover}
			{@const d = hover.d}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={d.label}
				rows={[
					['People', inr(d.n)],
					['Of this bar', pct(100 * d.share, d.share < 0.01 ? 2 : 1)],
					...(d.row > 0
						? [['Of June roll', pct((100 * d.n) / JUNE, d.n / JUNE < 0.01 ? 2 : 1)]]
						: [])
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	rect,
	.bracket,
	.leader {
		shape-rendering: crispEdges;
	}
	.bar {
		stroke: var(--c-outline);
		stroke-width: 2px;
		transition: filter 0.1s ease;
	}
	.bar.off {
		fill: var(--ui-line);
	}
	.bar.on {
		fill: var(--c-bg);
	}
	.bar.hot {
		filter: brightness(1.12);
	}
	.bracket,
	.leader {
		fill: none;
		stroke: var(--c-mute);
		stroke-width: 1px;
	}
	.hdr {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0;
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.seg {
		pointer-events: none;
		fill: var(--c-ink);
	}
</style>
