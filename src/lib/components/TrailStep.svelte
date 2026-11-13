<script>
	// One document in a Trail; children are a sentence and a compact Exhibit. Give `when` only where
	// the name doesn't already carry the date. On mount it measures its sheet for the Trail.
	import { getContext, onMount } from 'svelte';
	import TrailId from './TrailId.svelte';
	import { highlightY } from './trail-measure.js';

	/** @type {{ doc: string, when?: string, children: import('svelte').Snippet }} */
	let { doc, when = '', children } = $props();

	// whether this is the last step under the old ID or the first under the new one
	const trail = getContext('idtrail');
	const n = trail?.register(doc, when) ?? 0;
	const next = trail?.next;
	const ends = !!next && n === next.from - 1;
	const starts = !!next && n === next.from;

	const on = $derived(trail ? trail.active === n - 1 : true);
	const dy = $derived(trail ? trail.shift(n) : 0);
	const sheetH = $derived(trail ? trail.sheetH(n) : 0);

	/** @type {HTMLLIElement | undefined} */
	let li = $state();
	onMount(() => {
		const img = li?.querySelector('figure img');
		if (!img || !trail) return;
		const ratio =
			(+(img.getAttribute('height') ?? 0) || 1) / (+(img.getAttribute('width') ?? 0) || 1);
		/** @type {number | null} */
		let hy = null;
		const report = () => trail.measured(n, { w: img.clientWidth, ratio, hy });
		report();
		highlightY(img.currentSrc || img.src).then((y) => {
			hy = y;
			report();
		});
		const ro = new ResizeObserver(report);
		ro.observe(img);
		return () => ro.disconnect();
	});
</script>

<li
	class="idtrail-step"
	class:ends
	class:starts
	class:on
	bind:this={li}
	style:--dy="{dy}px"
	style:--sheet-h="{sheetH}px"
>
	{#if starts}
		<div class="idtrail-next"><TrailId prefix={next.prefix} suffix={next.suffix} /></div>
	{/if}
	<div class="idtrail-node">
		<span class="idtrail-disc" aria-hidden="true"></span>
		<span class="idtrail-lbl"
			><span class="idtrail-doc">{doc}</span>{#if when}<span class="idtrail-when">{when}</span
				>{/if}</span
		>
	</div>
	<!-- narrow only -->
	<p class="idtrail-name">
		<strong>{doc}</strong>{#if when}<span class="idtrail-date">{when}</span>{/if}
	</p>
	{@render children()}
</li>

<style>
	.idtrail-step {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		row-gap: calc(0.5 * var(--leading));
		margin: 0;
		counter-increment: idtrail;
	}
	/* top-aligned so the leader always meets the disc, dated or not */
	.idtrail-node {
		display: flex;
		align-items: flex-start;
		column-gap: calc(var(--hang) - var(--disc));
		min-height: var(--disc);
	}
	.idtrail-disc {
		position: relative;
		z-index: 1;
		display: grid;
		flex: none;
		place-items: center;
		width: var(--disc);
		height: var(--disc);
		border-radius: 50%;
		background: var(--story-orange);
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.idtrail-disc::before {
		content: counter(idtrail);
	}
	.idtrail-lbl {
		display: grid;
		row-gap: 0.15rem;
		align-self: start;
		padding-top: calc((var(--disc) - 1.2rem) / 2);
	}
	.idtrail-doc {
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.2;
	}
	.idtrail-when {
		color: var(--muted-foreground);
		font-size: var(--text-caption);
		line-height: 1.2;
	}
	.idtrail-step > :global(p) {
		margin: 0;
		text-wrap: pretty;
	}
	.idtrail-name {
		display: none;
	}

	/* ---- narrow: one of the mat's documents ---- */
	@media (max-width: 63.999em) {
		.idtrail-step {
			grid-area: 1 / 1;
			display: flex;
			flex-direction: column;
			gap: 0;
			visibility: hidden;
			pointer-events: none;
		}
		.idtrail-step.on {
			visibility: visible;
			pointer-events: auto;
		}
		.idtrail-node,
		.idtrail-next {
			display: none;
		}
		/* unwrap the figure so its sheet and caption can be ordered separately */
		.idtrail-step > :global(figure) {
			display: contents;
		}
		/* bottom margin fills the mat to the tallest sheet; shifted, not moved, to align highlights */
		.idtrail-step > :global(figure img) {
			order: -1;
			position: relative;
			z-index: 1;
			display: block;
			box-sizing: border-box;
			width: calc(100% - 2 * var(--pad));
			height: auto;
			margin: var(--pad) var(--pad) calc(var(--pad) + max(0px, var(--frame-h) - var(--sheet-h)));
			background: #fff;
			box-shadow: var(--shadow-sheet);
			opacity: 0;
			transform: translateY(var(--dy));
			transition: opacity 200ms ease-out;
		}
		.idtrail-step.on > :global(figure img) {
			opacity: 1;
		}
		.idtrail-step > .idtrail-name {
			display: block;
			order: 1;
			margin: calc(var(--leading) + var(--nav)) var(--out) 0;
			font-size: 0.9375em;
			line-height: 1.5;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.idtrail-date {
			color: var(--muted-foreground);
			font-variant-numeric: tabular-nums;
		}
		.idtrail-date::before {
			content: '·';
			margin: 0 0.45em;
		}
		.idtrail-step > :global(p:not(.idtrail-name)) {
			order: 2;
			margin: 0 var(--out);
			font-size: 0.9375em;
			line-height: 1.5;
		}
		.idtrail-step > :global(figure figcaption) {
			order: 3;
			margin: calc(0.25 * var(--leading)) var(--out) 0;
			color: var(--muted-foreground);
			font-size: var(--text-caption);
			line-height: 1.45;
			text-wrap: pretty;
		}
		.idtrail-step > :global(p),
		.idtrail-step > :global(figure figcaption) {
			opacity: 0;
			transition: opacity 200ms ease-out;
		}
		.idtrail-step.on > :global(p),
		.idtrail-step.on > :global(figure figcaption) {
			opacity: 1;
		}
		@media (prefers-reduced-motion: reduce) {
			.idtrail-step > :global(figure img),
			.idtrail-step > :global(p),
			.idtrail-step > :global(figure figcaption) {
				transition: none;
			}
		}
	}

	/* ---- wide: one centred column per document ---- */
	@media (min-width: 64em) {
		.idtrail-step {
			grid-row: span 3;
			grid-template-rows: subgrid;
		}
		.idtrail-node {
			flex-direction: column;
			align-items: center;
			row-gap: calc(0.5 * var(--leading));
		}
		.idtrail-lbl {
			align-self: center;
			padding-top: 0;
			text-align: center;
		}
		.idtrail-step > :global(p) {
			justify-self: center;
			max-width: 23rem;
			font-size: 0.9375em;
			line-height: 1.5;
			text-align: center;
			text-wrap: balance;
		}
		.idtrail-step > :global(figure) {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-self: start;
			align-items: center;
			margin: 0;
			padding: 0;
			background: none;
		}
		.idtrail-step > :global(figure img) {
			max-width: 24rem;
			margin: 0 auto;
			background: #fff;
			box-shadow: var(--shadow-sheet);
		}
		.idtrail-step > :global(figure figcaption) {
			max-width: 24rem;
			margin-top: calc(0.5 * var(--leading));
			text-align: center;
		}
		/* each step draws its own stretch of the bar and the drop into its disc */
		.idtrail-step::before {
			content: '';
			position: absolute;
			top: calc(-1 * var(--drop));
			left: calc(-0.5 * var(--leading));
			right: calc(-0.5 * var(--leading));
			height: 1px;
			background: var(--lead);
		}
		.idtrail-step:first-of-type::before {
			left: calc(50% - 0.5px);
		}
		.idtrail-step:last-of-type::before,
		.idtrail-step.ends::before {
			right: calc(50% - 0.5px);
		}
		.idtrail-step.starts::before {
			left: calc(50% - 0.5px);
		}
		.idtrail-next {
			display: none;
		}
		.idtrail-step::after {
			content: '';
			position: absolute;
			top: calc(-1 * var(--drop));
			left: calc(50% - 0.5px);
			width: 1px;
			height: var(--drop);
			background: var(--lead);
		}
	}
</style>
