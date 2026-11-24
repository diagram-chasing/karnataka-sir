<script>
	// A state's constituencies shaded by one measure at a time. AcMap is Karnataka's own map, with
	// its Bengaluru lens and callouts; this is the plain one every other state gets.
	import { geoCentroid, geoMercator } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import HoverCard from './HoverCard.svelte';
	import RampLegend from './RampLegend.svelte';
	import { hoverTap } from './hoverTap.js';
	import { unpack, compactPath } from './geo.js';
	import { RAMP, step } from './theme.js';

	/**
	 * `short` is the measure's name on its key, where the full `label` would not fit in a row.
	 * @typedef {{ key: string, label: string, short?: string, legend: string, value: (c: any) => number | null, fmt: (v: number) => string, thresholds: number[] }} Measure
	 * @type {{ acPacked: any, statePacked: any, ac?: number, key?: string, list: import('$data/constituencies.js').Constituency[], measures: Measure[], name: string, dek?: string, source?: string }}
	 */
	let {
		ac = $bindable(0),
		/** the measure shown; bindable, so a control outside the map can choose it */
		key = $bindable(''),
		acPacked,
		statePacked,
		list,
		measures,
		name,
		dek = '',
		source = ''
	} = $props();

	const acGeo = $derived(unpack(acPacked));
	const stateGeo = $derived(unpack(statePacked));
	const byAc = $derived(new Map(list.map((c) => [c.ac, c])));

	const m = $derived(measures.find((x) => x.key === key) ?? measures[0]);

	// One fixed drawing, scaled by CSS: the map's box is set by its aspect ratio before any script
	// runs, so nothing below it moves when the page hydrates or the measure changes.
	const W = 640;
	const H = 460;
	let width = $state(W); // the box as laid out, for placing the hover card
	const proj = $derived.by(() =>
		geoMercator().fitExtent(
			[
				[1, 1],
				[W - 1, H - 1]
			],
			stateGeo
		)
	);
	const path = $derived(compactPath(proj));
	const NA = 'var(--c-panel)'; // not counted: a flat pale grey, quieter than any shade of the ramp
	const shapes = $derived(
		acGeo.features.map((f) => {
			const c = byAc.get(/** @type {number} */ (f.properties?.ac));
			const v = c ? m.value(c) : null;
			return {
				ac: /** @type {number} */ (f.properties?.ac),
				c,
				v,
				d: path(f),
				fill: v == null || Number.isNaN(v) ? NA : RAMP[step(v, m.thresholds)]
			};
		})
	);
	const hasNA = $derived(shapes.some((s) => s.fill === NA));
	const outline = $derived(path(stateGeo));
	const chosen = $derived(shapes.find((s) => s.ac === ac));
	/** where the chosen constituency's name goes: just above its centre */
	const label = $derived.by(() => {
		const f = acGeo.features.find((x) => x.properties?.ac === ac);
		return f ? proj(geoCentroid(f)) : null;
	});

	/** @type {{ d: (typeof shapes)[number], px: number, py: number } | null} */
	let hover = $state(null);
	const pick = (/** @type {number} */ _x, /** @type {number} */ _y, /** @type {Event} */ e) => {
		const ac = Number(/** @type {Element} */ (e.target)?.getAttribute?.('data-ac'));
		return shapes.find((s) => s.ac === ac) ?? null;
	};
</script>

<ChartFrame {dek} {source}>
	{#snippet controls()}
		{#if measures.length > 1}
			<div class={['seg', { four: measures.length === 4 }]} role="group" aria-label="Measure">
				{#each measures as x (x.key)}
					<button type="button" aria-pressed={m.key === x.key} onclick={() => (key = x.key)}
						>{x.short ?? x.label}</button
					>
				{/each}
			</div>
		{/if}
	{/snippet}
	{#snippet legend()}
		<RampLegend label={m.legend} steps={m.thresholds}>
			<span class="na" class:off={!hasNA}><i></i>Not counted</span>
		</RampLegend>
	{/snippet}
	<div class="plot" bind:clientWidth={width}>
		<!-- Clicking a constituency is a pointer shortcut; the search field is the keyboard way to choose. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<svg
			viewBox="0 0 {W} {H}"
			role="img"
			aria-label="Map of {name}'s {list.length} assembly constituencies shaded by {m.legend.toLowerCase()}"
			{@attach hoverTap(pick, (h) => (hover = h))}
			onclick={() => hover && (ac = hover.d.ac)}
		>
			{#each shapes as s (s.ac)}
				<path class="ac" d={s.d} data-ac={s.ac} style:fill={s.fill} />
			{/each}
			<path class="state" d={outline} />
			{#if chosen}
				<path class="chosen" d={chosen.d} />
				{#if chosen.c && label}
					<text
						class="name"
						x={label[0]}
						y={label[1] - 10}
						text-anchor={label[0] > W * 0.75 ? 'end' : label[0] < W * 0.25 ? 'start' : 'middle'}
						>{chosen.c.name}</text
					>
				{/if}
			{/if}
			{#if hover}
				<path class="on" d={hover.d.d} />
			{/if}
		</svg>
		{#if hover?.d.c}
			<HoverCard
				x={hover.px}
				y={hover.py}
				w={width}
				title={hover.d.c.name}
				sub={hover.d.c.district}
				rows={measures.map((x) => {
					const v = x.value(hover?.d.c);
					return [x.label, v == null ? '–' : x.fmt(v)];
				})}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	/* four measures do not fit one row on a phone: two even rows of two, not three and a stray one */
	@media (max-width: 34rem) {
		:global(.chart div.seg.four) {
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
		}
	}
	.plot {
		position: relative;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 640 / 460;
		max-width: 100%;
		margin-inline: auto;
	}
	/* kept in the legend when unused, so switching measure never changes the legend's height */
	.na.off {
		visibility: hidden;
	}
	.ac {
		stroke: var(--c-bg);
		stroke-width: 0.5px;
		stroke-linejoin: round;
	}
	.state {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.on {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1.5px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.name {
		font-size: var(--text-micro);
		font-weight: 700;
		fill: var(--c-ink);
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 3px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.chosen {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 2px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	svg {
		cursor: pointer;
	}
	.na {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--text-micro);
		color: var(--c-mute);
	}
	.na i {
		width: 0.75rem;
		height: 0.75rem;
		background: var(--c-panel);
		box-shadow: inset 0 0 0 1px var(--c-grid);
	}
</style>
