<script>
	import { scaleSqrt } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import { hoverTap } from './hoverTap.js';
	import { crisp, inr, pct } from './theme.js';

	/**
	 * @typedef {{ ac: number, name: string, district: string, q: number, q_pct: number, q_f_pct: number, reserved: string }} QRow
	 * @typedef {{ title: string, dek: string, note: string, source: string, median: number, total: number, zeroCount: number, heroAcs: number[], rows: QRow[] }} QSpreadData
	 */

	/** @type {{ data: QSpreadData, title?: string, dek?: string, note?: string, source?: string }} */
	let { data, title, dek, note, source } = $props();

	const rows = $derived(data.rows ?? []);
	const xMax = $derived(Math.ceil((Math.max(...rows.map((r) => r.q), 8000) + 500) / 1000) * 1000);

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 540);
	const xTicks = $derived(
		narrow ? [0, 500, 2000, 5000, 8000] : [0, 250, 500, 1000, 2000, 4000, 6000, 8000]
	);
	const M = $derived({ top: 38, right: narrow ? 14 : 20, bottom: 38, left: narrow ? 14 : 18 });
	const R = $derived(narrow ? 2.5 : 3.2);

	const x = $derived(
		scaleSqrt()
			.domain([0, xMax])
			.range([M.left, w - M.right])
	);

	/**
	 * Mike Bostock's exact one-sided beeswarm `dodge` (https://observablehq.com/@d3/beeswarm):
	 * every dot stays at its exact true x-coordinate and rests cleanly on or above the baseline,
	 * forming a grounded unit-dot density distribution without symmetric drift or herringbone voids.
	 */
	const swarm = $derived.by(() => {
		const radius = R * 2 + 1.1; // center-to-center minimum spacing
		const radius2 = radius * radius;
		const items = rows
			.map((d) => ({ d, x: x(d.q) }))
			.sort((a, b) => a.x - b.x || a.d.ac - b.d.ac);

		/** @type {{ x: number, y: number, d: QRow, next: any } | null} */
		let head = null;
		/** @type {{ x: number, y: number, d: QRow, next: any } | null} */
		let tail = null;

		/** @type {{ d: QRow, cx: number, yOff: number }[]} */
		const out = [];
		let maxY = 0;

		const intersects = (/** @type {number} */ cx, /** @type {number} */ cy) => {
			let a = head;
			while (a) {
				const dx = a.x - cx;
				const dy = a.y - cy;
				if (dx * dx + dy * dy < radius2 - 1e-6) return true;
				a = a.next;
			}
			return false;
		};

		for (const item of items) {
			// Prune placed dots that are strictly further than `radius` behind current x
			while (head && head.x < item.x - radius) head = head.next;
			let y = 0;
			if (intersects(item.x, y)) {
				let a = head;
				y = Infinity;
				while (a) {
					const dx = a.x - item.x;
					const cand = a.y + Math.sqrt(Math.max(0, radius2 - dx * dx));
					if (cand < y && !intersects(item.x, cand)) y = cand;
					a = a.next;
				}
			}
			const node = { x: item.x, y, d: item.d, next: null };
			if (!head) {
				head = tail = node;
			} else {
				tail.next = node;
				tail = node;
			}
			if (y > maxY) maxY = y;
			out.push({ d: item.d, cx: item.x, yOff: y });
		}

		const domeH = Math.max(96, Math.ceil(maxY + R + 22));
		const baseY = M.top + domeH;
		return {
			pts: out,
			domeH,
			baseY,
			height: baseY + M.bottom
		};
	});

	const isVaranasi = (/** @type {QRow} */ d) => d.district === 'Varanasi';
	const isST = (/** @type {QRow} */ d) => d.reserved === 'ST';
	const isHero = (/** @type {QRow} */ d) => isVaranasi(d) || isST(d) || d.ac === 135;

	// Draw normal dots first, highlighted dots cleanly on top
	const orderedPts = $derived([
		...swarm.pts.filter((p) => !isHero(p.d)),
		...swarm.pts.filter((p) => isHero(p.d))
	]);

	const byAc = $derived(new Map(swarm.pts.map((p) => [p.d.ac, p])));

	/** @type {{ d: QRow, px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} px @param {number} py */
	function nearest(px, py) {
		let best = null;
		let bd = 16 * 16;
		for (const p of swarm.pts) {
			const dx = p.cx - px;
			const dy = swarm.baseY - R - p.yOff - py;
			const dd = dx * dx + dy * dy;
			if (dd < bd) [best, bd] = [p.d, dd];
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
			<span><i class="sw varanasi"></i>Varanasi (5 seats)</span>
			<span><i class="sw st"></i>ST seats (2)</span>
			<span><i class="sw high"></i>2,000+</span>
			<span><i class="sw mid"></i>Above median</span>
			<span><i class="sw low"></i>Below median</span>
		</div>
	{/snippet}

	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={swarm.height}
			role="img"
			aria-label="Grounded beeswarm of Q disqualifications across all {rows.length} Uttar Pradesh constituencies, ranging from 0 to 8,419 with a median of {data.median}."
			{@attach hoverTap(nearest, (h) => (hover = h))}
		>
			{#each xTicks as t (t)}
				<line
					class="grid"
					x1={crisp(x(t))}
					x2={crisp(x(t))}
					y1={M.top - 6}
					y2={swarm.baseY}
				/>
				<line
					class="tick-mark"
					x1={crisp(x(t))}
					x2={crisp(x(t))}
					y1={swarm.baseY}
					y2={swarm.baseY + 5}
				/>
				<text class="tick" x={x(t)} y={swarm.baseY + 17} text-anchor={t === 0 ? 'start' : 'middle'}
					>{inr(t)}</text
				>
			{/each}

			<!-- Crisp resting baseline -->
			<line
				class="baseline"
				x1={M.left}
				x2={w - M.right}
				y1={crisp(swarm.baseY)}
				y2={crisp(swarm.baseY)}
			/>
			<text class="axis" x={w - M.right} y={swarm.height - 4} text-anchor="end"
				>Disqualified voters (square-root scale)</text
			>

			<!-- Median guide rising cleanly above the dome -->
			<line
				class="median"
				x1={crisp(x(data.median))}
				x2={crisp(x(data.median))}
				y1={M.top - 16}
				y2={swarm.baseY}
			/>
			<text class="med-lbl" x={x(data.median) + 6} y={M.top - 10} text-anchor="start"
				>Median: {inr(data.median)}</text
			>

			<!-- Unit-dot swarm -->
			{#each orderedPts as p (p.d.ac)}
				{@const v = isVaranasi(p.d)}
				{@const st = isST(p.d)}
				{@const high = !v && !st && p.d.q >= 2000}
				{@const mid = !v && !st && p.d.q >= data.median && p.d.q < 2000}
				<circle
					class={['dot', { varanasi: v, st, high, mid, shah: p.d.ac === 135 }]}
					cx={p.cx}
					cy={swarm.baseY - R - p.yOff}
					r={v || st || p.d.ac === 135 ? R + 1 : R}
				/>
			{/each}

			<!-- Connected callouts in wide-open air above the right tail -->
			{#if byAc.get(135)}
				{@const p = byAc.get(135)}
				{@const cy = swarm.baseY - R - p.yOff}
				{@const ty = cy - (narrow ? 82 : 44)}
				<line class="leader" x1={crisp(p.cx)} x2={crisp(p.cx)} y1={ty + 15} y2={cy - R - 3} />
				<text class="callout" x={p.cx} y={ty} text-anchor="end">
					<tspan x={p.cx}>Shahjahanpur</tspan>
					<tspan class="sub" x={p.cx} dy="13">8,419</tspan>
				</text>
			{/if}

			{#if byAc.get(403)}
				{@const p = byAc.get(403)}
				{@const cy = swarm.baseY - R - p.yOff}
				{#if narrow}
					{@const elbowY = cy - 36}
					{@const elbowX = p.cx - 14}
					<path class="leader" d="M {p.cx} {cy - R - 3} L {p.cx} {elbowY} L {elbowX} {elbowY}" />
					<text class="callout" x={elbowX - 4} y={elbowY - 3} text-anchor="end">
						<tspan x={elbowX - 4}>Duddhi (ST)</tspan>
						<tspan class="sub" x={elbowX - 4} dy="13">6,687</tspan>
					</text>
				{:else}
					{@const ty = cy - 84}
					<line class="leader" x1={crisp(p.cx)} x2={crisp(p.cx)} y1={ty + 15} y2={cy - R - 3} />
					<text class="callout" x={p.cx} y={ty} text-anchor="end">
						<tspan x={p.cx}>Duddhi (ST)</tspan>
						<tspan class="sub" x={p.cx} dy="13">6,687</tspan>
					</text>
				{/if}
			{/if}

			{#if byAc.get(390) && !narrow}
				{@const p = byAc.get(390)}
				{@const cy = swarm.baseY - R - p.yOff}
				{@const elbowY = cy - 36}
				{@const elbowX = p.cx - 28}
				<path class="leader" d="M {p.cx} {cy - R - 3} L {p.cx} {elbowY} L {elbowX} {elbowY}" />
				<text class="callout" x={elbowX - 5} y={elbowY - 3} text-anchor="end">
					<tspan x={elbowX - 5}>Varanasi Cantt.</tspan>
					<tspan class="sub" x={elbowX - 5} dy="13">6,616</tspan>
				</text>
			{/if}

			{#if hover}
				{@const hit = byAc.get(hover.d.ac)}
				{#if hit}
					<circle class="ring" cx={hit.cx} cy={swarm.baseY - R - hit.yOff} r={R + 3.5} />
				{/if}
			{/if}
		</svg>

		{#if hover}
			{@const d = hover.d}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title="{d.name}{d.reserved && d.reserved !== 'GEN' ? ` (${d.reserved})` : ''}"
				sub={d.district}
				rows={[
					['Disqualified (Q)', inr(d.q)],
					['Share of final roll', pct(d.q_pct, 2)],
					['Women share', pct(d.q_f_pct, 1)]
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
		box-sizing: border-box;
	}
	.sw.varanasi {
		background: var(--d-w3);
		border: 1.5px solid var(--c-ink);
	}
	.sw.st {
		background: var(--c-ink);
	}
	.sw.high {
		background: var(--d-w2);
	}
	.sw.mid {
		background: var(--d-w0);
	}
	.sw.low {
		background: color-mix(in oklch, var(--foreground) 18%, var(--background));
	}

	.grid {
		stroke: var(--c-grid);
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.baseline {
		stroke: color-mix(in oklch, var(--foreground) 45%, var(--background));
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.tick-mark {
		stroke: color-mix(in oklch, var(--foreground) 45%, var(--background));
		stroke-width: 1px;
		shape-rendering: crispEdges;
	}
	.median {
		stroke: var(--c-ink);
		stroke-width: 1px;
		stroke-dasharray: 2 3;
		shape-rendering: crispEdges;
	}
	.med-lbl {
		font-size: 12px;
		font-weight: 700;
		fill: var(--c-ink);
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	.dot {
		fill: color-mix(in oklch, var(--foreground) 18%, var(--background));
		stroke: var(--c-bg);
		stroke-width: 0.9px;
	}
	.dot.mid {
		fill: var(--d-w0);
	}
	.dot.high {
		fill: var(--d-w2);
	}
	.dot.shah {
		fill: var(--d-w3);
		stroke: var(--c-ink);
		stroke-width: 1.5px;
	}
	.dot.varanasi {
		fill: var(--d-w3);
		stroke: var(--c-ink);
		stroke-width: 1.5px;
	}
	.dot.st {
		fill: var(--c-ink);
		stroke: var(--c-bg);
		stroke-width: 1.25px;
	}
	.leader {
		fill: none;
		stroke: color-mix(in oklch, var(--foreground) 45%, var(--background));
		stroke-width: 1px;
		pointer-events: none;
	}
	.callout {
		font-size: 12.5px;
		font-weight: 700;
		fill: var(--c-ink);
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3.5px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.callout .sub {
		font-size: 11.5px;
		font-weight: 400;
		fill: var(--c-text);
	}
	.tick {
		font-size: 12px;
		fill: var(--c-mute);
		dominant-baseline: middle;
	}
	.axis {
		font-size: 11.5px;
		fill: var(--c-mute);
	}
	.ring {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1.75px;
		pointer-events: none;
	}
</style>
