<script>
	// One constituency against the other 223 on four measures, each a barcode of every constituency.
	import { scaleLinear, Delaunay } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import ConstituencySearch from './ConstituencySearch.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import { STRIPS, headline } from './your-constituency.js';
	import { CONSTITUENCIES, BY_AC, MIN_NOTICES } from '$data/constituencies.js';

	/** @type {{ ac?: number }} */
	let { ac = $bindable(175) } = $props(); // Bommanahalli, which lost the most voters

	const d = $derived(BY_AC.get(ac));
	const title = $derived(d ? headline(d) : '');

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	// below this the label, barcode and values no longer fit side by side, so they stack
	const narrow = $derived(w < 640);

	// The value column is as wide as its longest line, at about 7.4px a character at 13px and
	// 8.4px at 14px bold, so it never runs past the frame.
	const VAL = $derived.by(() => {
		if (narrow || !d) return 0;
		let px = 0;
		for (const s of STRIPS) {
			const v = s.v(d);
			px = Math.max(
				px,
				v != null ? s.fmt(v).length * 8.4 : `Under ${MIN_NOTICES} notices`.length * 7.4
			);
			px = Math.max(px, `Median ${s.fmt(s.median)}`.length * 7.4);
		}
		return Math.ceil(px);
	});
	const LAB = $derived(narrow ? 0 : 190); // ReturnRates' label column
	const BOX = 28; // the barcode's height
	const OVER = 5; // how far the chosen marker overshoots the box
	const TRI = 8; // the median triangle's height; it is 10px wide
	const ABOVE = OVER + 3 + TRI; // room over the box: the triangle clears the orange marker's top
	const BAR = 2.5; // one constituency
	const MARK = 6; // the chosen one
	const HOV = 4; // the one under the pointer
	// phone: the label line and the median line sit just above the triangle, and strips are close set
	const HEAD = $derived(narrow ? 34 : 0);
	const GAP = $derived(narrow ? 18 : 24);
	const x0 = $derived(LAB + 1);
	const x1 = $derived(w - VAL - (narrow ? 1 : 20));

	const strips = $derived.by(() => {
		let top = 0;
		return STRIPS.map((s) => {
			// inside the outline, with room for half a bar at either end
			const x = scaleLinear()
				.domain([0, s.max])
				.range([x0 + 1 + BAR / 2, x1 - 1 - BAR / 2])
				.clamp(true);
			const bars = CONSTITUENCIES.filter((c) => s.v(c) != null).map((c) => ({
				ac: c.ac,
				x: x(/** @type {number} */ (s.v(c)))
			}));
			const boxTop = top + HEAD + ABOVE;
			const strip = { s, top, boxTop, mid: boxTop + BOX / 2, x, bars };
			top = boxTop + BOX + OVER + GAP;
			return strip;
		});
	});
	const H = $derived(strips.length ? strips[strips.length - 1].boxTop + BOX + OVER + 1 : 0);

	// Every bar as a point at its strip's middle, so the pointer snaps to the nearest one in any
	// direction without having to land on a 2.5px bar.
	const points = $derived(
		strips.flatMap((st) => st.bars.map((b) => ({ ac: b.ac, x: b.x, y: st.mid, st })))
	);
	const delaunay = $derived(
		Delaunay.from(
			points,
			(p) => p.x,
			(p) => p.y
		)
	);

	let hover = $state(null);
	function pick(/** @type {number} */ px, /** @type {number} */ py) {
		// over the barcodes and the gaps between them, not the labels and values beside them
		if (px < x0 - 8 || px > x1 + 8) return null;
		const reach = (/** @type {(typeof strips)[number]} */ st) =>
			py >= st.boxTop - ABOVE - (narrow ? 0 : GAP / 2) && py <= st.boxTop + BOX + OVER + GAP / 2;
		if (!strips.some(reach)) return null;
		const p = points[delaunay.find(px, py)];
		return p ? BY_AC.get(p.ac) : null;
	}
	const hoverRows = (/** @type {import('$data/constituencies.js').Constituency} */ c) =>
		STRIPS.map((s) => [s.label, s.v(c) != null ? s.fmt(/** @type {number} */ (s.v(c))) : '–']);
</script>

<ChartFrame
	{title}
	dek="Four measures of the revision across 224 assembly constituencies, January 2025 to October 2026"
	note="Each bar represents a constituency excluding those with fewer {MIN_NOTICES} notices."
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	{#snippet controls()}
		<ConstituencySearch bind:ac />
	{/snippet}
	<div bind:clientWidth={width} class="plot">
		<!-- Clicking a bar is a pointer shortcut; the search field is the keyboard way to choose. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="{d?.name ?? ''} against the other constituencies on four measures"
			{@attach hoverTap(pick, (h) => (hover = h))}
			onclick={() => hover && (ac = hover.d.ac)}
		>
			{#each strips as st (st.s.key)}
				{@const v = d ? st.s.v(d) : null}
				{@const mid = st.mid}
				{@const mx = Math.round(st.x(st.s.median))}
				{#if narrow}
					<text class="hdr" x={0} y={st.top + 9}>{st.s.label}</text>
					{#if v != null}
						<text class="val" x={w - 1} y={st.top + 9} text-anchor="end">{st.s.fmt(v)}</text>
					{:else}
						<text class="sub" x={w - 1} y={st.top + 9} text-anchor="end"
							>Under {MIN_NOTICES} notices</text
						>
					{/if}
					<text class="sub" x={w - 1} y={st.top + 26} text-anchor="end"
						>Median {st.s.fmt(st.s.median)}</text
					>
				{:else}
					<text class="lab" x={LAB - 10} y={mid} text-anchor="end">{st.s.label}</text>
					{#if v != null}
						<text class="val" x={w - 1} y={mid - 8} text-anchor="end">{st.s.fmt(v)}</text>
					{:else}
						<text class="sub" x={w - 1} y={mid - 8} text-anchor="end"
							>Under {MIN_NOTICES} notices</text
						>
					{/if}
					<text class="sub" x={w - 1} y={mid + 10} text-anchor="end"
						>Median {st.s.fmt(st.s.median)}</text
					>
				{/if}

				<rect class="box" x={x0} y={st.boxTop} width={x1 - x0} height={BOX} />
				{#each st.bars as b (b.ac)}
					<rect class="bar" x={b.x - BAR / 2} y={st.boxTop + 1} width={BAR} height={BOX - 2} />
				{/each}
				<!-- one x for the tick and the triangle, so they can never drift apart -->
				<g transform="translate({mx} 0)">
					<line class="median-halo" x1="0" x2="0" y1={st.boxTop + 1} y2={st.boxTop + BOX - 1} />
					<line class="median" x1="0" x2="0" y1={st.boxTop} y2={st.boxTop + BOX} />
					<polygon
						class="median-tri"
						points="-5,{st.boxTop - ABOVE} 5,{st.boxTop - ABOVE} 0,{st.boxTop - ABOVE + TRI}"
					/>
				</g>
				{#if hover && hover.d.ac !== ac}
					{@const hv = st.s.v(hover.d)}
					{#if hv != null}
						<rect
							class="hov"
							x={st.x(hv) - HOV / 2}
							y={st.boxTop + 1}
							width={HOV}
							height={BOX - 2}
						/>
					{/if}
				{/if}
				{#if v != null}
					<rect
						class="mark"
						x={st.x(v) - MARK / 2}
						y={st.boxTop - OVER}
						width={MARK}
						height={BOX + 2 * OVER}
					/>
				{/if}
			{/each}
		</svg>
		{#if hover}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={hover.d.name}
				sub={hover.d.district}
				rows={hoverRows(hover.d)}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	svg {
		cursor: pointer;
	}
	.box {
		fill: var(--d-wx);
		stroke: var(--c-outline);
		stroke-width: 2px;
		shape-rendering: crispEdges;
	}
	/* part see-through so crowded stretches read darker */
	.bar {
		fill: var(--d-w4);
		opacity: 0.28;
	}
	/* pale orange, not ink, so the hovered bar never reads as the median */
	.hov {
		fill: var(--d-w1);
	}
	.mark {
		fill: var(--d-w3);
		stroke: var(--c-outline);
		stroke-width: 2px;
	}
	/* the halo keeps the bars from hiding the median tick */
	.median-halo {
		stroke: var(--d-wx);
		stroke-width: 6px;
	}
	.median {
		stroke: var(--c-ink);
		stroke-width: 2px;
	}
	.median-tri {
		fill: var(--c-ink);
	}
	text {
		fill: var(--c-ink);
		dominant-baseline: middle;
	}
	.lab,
	.val {
		font-size: 14px;
	}
	.val {
		font-weight: 700;
	}
	.hdr {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 13px;
		font-weight: 700;
	}
	.sub {
		font-size: 13px;
		fill: var(--c-text);
	}
</style>
