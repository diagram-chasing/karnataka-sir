<script>
	// One voter ID followed through several documents, one TrailStep per document.
	//
	//   <Trail prefix="MZS" suffix="2292">
	//   <TrailStep doc="Notice list">
	//
	//   Sentence about this document.
	//
	//   <Exhibit compact id="…" alt="…">Caption.</Exhibit>
	//
	//   </TrailStep>
	//   </Trail>
	//
	// If the ID changed partway, pass `next` with the step it first appears on:
	// next={{ prefix: 'YVA', suffix: '0865', from: 3 }}
	import { setContext } from 'svelte';
	import { ArrowRight, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import TrailId from './TrailId.svelte';
	import { alignShifts } from './trail-measure.js';

	/** @type {{ prefix: string, suffix: string, next?: { prefix: string, suffix: string, from: number }, children: import('svelte').Snippet }} */
	let { prefix, suffix, next, children } = $props();

	// steps take their place in order as they start, so each knows its number on the server too
	/** @type {{ doc: string, when: string }[]} */
	const steps = $state([]);
	/** each step's sheet as drawn: its width, height over width, and the highlighted field's centre */
	/** @type {{ w: number, ratio: number, hy: number | null }[]} */
	const sheets = $state([]);
	let active = $state(0);

	const n = $derived(steps.length);
	const after = $derived(!!next && active + 1 >= next.from);

	const frameH = $derived(
		sheets.length ? Math.max(0, ...sheets.map((s) => (s?.w ?? 0) * (s?.ratio ?? 0))) : 0
	);
	// a sheet under half the mat's height (a single CSV line) is centred and skips the alignment
	const docs = $derived(
		steps.map((_, i) => {
			const H = (sheets[i]?.w ?? 0) * (sheets[i]?.ratio ?? 0);
			const short = frameH > 0 && H < frameH / 2;
			return { H, short, hy: short ? null : (sheets[i]?.hy ?? null) };
		})
	);
	const dy = $derived(
		frameH
			? alignShifts(docs, frameH).map((v, i) => (docs[i].short ? (frameH - docs[i].H) / 2 : v))
			: docs.map(() => 0)
	);
	/** month names shortened so every control key fits on one line */
	const short = (/** @type {string} */ s) =>
		s
			.replace(
				/\b(January|February|March|April|June|July|August|September|October|November|December)\b/g,
				(m) => m.slice(0, 3)
			)
			.replace(/\bSept\b/, 'Sep');

	/** @param {number} i */
	function go(i) {
		active = ((i % n) + n) % n;
	}

	setContext('idtrail', {
		get next() {
			return next;
		},
		get active() {
			return active;
		},
		/** @param {string} doc @param {string} when */
		register: (doc, when) => steps.push({ doc, when }),
		/** @param {number} i 1-based @param {{ w: number, ratio: number, hy: number | null }} s */
		measured: (i, s) => {
			sheets[i - 1] = s;
		},
		/** @param {number} i 1-based */
		shift: (i) => dy[i - 1] ?? 0,
		/** @param {number} i 1-based */
		sheetH: (i) => docs[i - 1]?.H ?? 0
	});
</script>

<div class="idtrail" class:split={!!next} class:after style:--from={next?.from}>
	<p class="idtrail-id">
		<span class="idtrail-old"><TrailId {prefix} {suffix} gone={!!next} /></span>
		{#if next}
			<span class="idtrail-arrow" aria-hidden="true"
				><ArrowRight aria-hidden="true" strokeWidth={2} /></span
			>
			<span class="idtrail-new"><TrailId prefix={next.prefix} suffix={next.suffix} /></span>
		{/if}
	</p>
	{#if n > 1}
		<div class="idtrail-seg" role="group" aria-label="Documents">
			{#each steps as s, i (i)}
				<button type="button" aria-pressed={i === active} onclick={() => go(i)}
					>{short(s.doc)}</button
				>
			{/each}
		</div>
	{/if}
	<ol style:--frame-h="{frameH}px">
		{@render children()}
		<!-- narrow only: the way back and forward -->
		{#if n > 1}
			<div class="idtrail-nav">
				<button type="button" aria-label="Previous document" onclick={() => go(active - 1)}>
					<ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
				</button>
				<button type="button" aria-label="Next document" onclick={() => go(active + 1)}>
					<ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
				</button>
			</div>
		{/if}
	</ol>
</div>

<style>
	.idtrail {
		--disc: 1.75rem;
		--hang: 2.4rem;
		--stub: calc(0.5 * var(--leading)); /* from the ID down to where the leader branches */
		--drop: calc(0.75 * var(--leading)); /* from the branch down to each disc */
		--lead: color-mix(in oklch, var(--foreground) 52%, var(--background));
		position: relative;
		margin-top: var(--space-figure);
		margin-bottom: var(--space-figure);
	}

	/* the voter ID, top centre; the leader starts under it */
	.idtrail-id {
		position: relative;
		margin: 0;
		padding-bottom: var(--stub);
		text-align: center;
		line-height: 1;
	}
	.idtrail-id::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: calc(50% - 0.5px);
		width: 1px;
		height: var(--stub);
		background: var(--lead);
	}
	ol {
		position: relative;
		display: grid;
		margin: 0;
		padding: var(--drop) 0 0;
		list-style: none;
		counter-reset: idtrail;
	}
	.idtrail-arrow,
	.idtrail-new {
		display: none;
	}

	/* ---- narrow: one mat, one document at a time ---- */
	@media (max-width: 63.999em) {
		.idtrail {
			/* half a gutter wider than the prose each side, so the content inside keeps the prose's edges */
			--out: calc(0.5 * var(--gutter, 1.25rem));
			--pad: var(--out); /* the mat around the sheet */
			--nav: 2.5rem; /* the arrows' row, the segmented control's key height */
			max-width: calc(24rem + 2 * var(--out));
			margin-inline: max(calc(-1 * var(--out)), calc((100% - 24rem) / 2 - var(--out)));
		}
		.idtrail-id {
			display: flex;
			align-items: center;
			gap: 0.4rem;
			margin-inline: var(--out);
			padding-bottom: calc(0.5 * var(--leading));
			text-align: left;
		}
		.idtrail-id::after {
			display: none;
		}
		/* the new ID is hidden until the reader reaches its step */
		.split .idtrail-arrow,
		.split .idtrail-new {
			display: inline-flex;
			transition: opacity 220ms ease-out;
		}
		.split .idtrail-arrow {
			color: var(--muted-foreground);
		}
		.split .idtrail-arrow :global(svg) {
			width: 1rem;
			height: 1rem;
		}
		.split:not(.after) .idtrail-arrow,
		.split:not(.after) .idtrail-new {
			opacity: 0.28;
		}
		.split .idtrail-old {
			transition: opacity 220ms ease-out;
		}

		/* segmented control */
		.idtrail-seg {
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: minmax(0, 1fr);
			gap: 2px;
			margin: 0 var(--out) calc(0.5 * var(--leading));
			padding: 3px;
			border-radius: var(--ui-r);
			background: var(--ui-track);
			box-shadow: var(--ui-track-inset);
		}
		.idtrail-seg button {
			height: 2.5rem;
			padding: 0 0.4rem;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			border: 0;
			border-radius: var(--ui-r-key);
			background: none;
			color: var(--muted-foreground);
			font: inherit;
			font-size: 0.8125rem;
			font-weight: 700;
			line-height: 1.2;
			cursor: pointer;
			transition:
				background-color 120ms ease-out,
				color 120ms ease-out,
				box-shadow 120ms ease-out;
		}
		.idtrail-seg button:hover {
			color: var(--foreground);
		}
		.idtrail-seg button[aria-pressed='true'] {
			background: var(--background);
			color: var(--foreground);
			box-shadow: var(--shadow-sheet);
		}
		.idtrail-seg button:focus-visible {
			outline: none;
			box-shadow: var(--ui-focus);
		}

		/* every step shares one cell, sized to the tallest sheet, so nothing below moves between documents */
		ol {
			grid-template-columns: minmax(0, 1fr);
			padding: 0;
		}
		ol::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: calc(var(--frame-h) + 2 * var(--pad));
			background: var(--muted);
		}
		/* prev/next arrows under the mat */
		.idtrail-nav {
			position: absolute;
			top: calc(var(--frame-h) + 2 * var(--pad) + 0.5 * var(--leading));
			left: 0;
			right: 0;
			z-index: 2;
			display: flex;
			justify-content: center;
			gap: 0.5rem;
			height: var(--nav);
		}
		.idtrail-nav button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 3.5rem;
			height: var(--nav);
			padding: 0;
			border: 0;
			border-radius: var(--ui-r);
			background: var(--background);
			color: var(--foreground);
			box-shadow: var(--shadow-sheet);
			cursor: pointer;
			transition:
				background-color 120ms ease-out,
				transform 120ms ease-out;
		}
		.idtrail-nav button:hover {
			background: var(--ui-track);
		}
		.idtrail-nav button:active {
			transform: translateY(0.5px);
			background: var(--ui-track-hover);
		}
		.idtrail-nav button:focus-visible {
			outline: 2px solid var(--story-orange);
			outline-offset: 2px;
		}

		@media (prefers-reduced-motion: reduce) {
			.idtrail-nav button,
			.split .idtrail-arrow,
			.split .idtrail-new,
			.split .idtrail-old {
				transition: none;
			}
		}
	}

	/* ---- wide: the documents side by side ---- */
	@media (min-width: 64em) {
		.idtrail-seg,
		.idtrail-nav {
			display: none;
		}
		.idtrail {
			width: min(50rem, 100vw - 3rem);
			max-width: none;
			margin-left: calc(50% - min(25rem, 50vw - 1.5rem));
		}
		.idtrail:has(:global(li:nth-child(3))) {
			width: min(76rem, 100vw - 3rem);
			margin-left: calc(50% - min(38rem, 50vw - 1.5rem));
		}
		ol {
			grid-template-rows: repeat(3, auto);
			grid-auto-flow: column;
			grid-auto-columns: minmax(0, 1fr);
			column-gap: var(--leading);
			row-gap: 0;
		}

		/* split: each ID centred over the steps it leads into */
		.idtrail.split {
			--n: 2;
			--col: calc((100% - (var(--n) - 1) * var(--leading)) / var(--n));
			--pitch: calc(var(--col) + var(--leading));
			--old-x: calc(var(--col) / 2 + (var(--from) - 2) / 2 * var(--pitch));
			--new-x: calc(var(--col) / 2 + (var(--from) + var(--n) - 2) / 2 * var(--pitch));
		}
		.idtrail.split:has(:global(li:nth-child(3))) {
			--n: 3;
		}
		.idtrail.split:has(:global(li:nth-child(4))) {
			--n: 4;
		}
		.split .idtrail-id {
			text-align: left;
		}
		.split .idtrail-old {
			display: inline-block;
			transform: translateX(-50%);
			margin-left: var(--old-x);
		}
		.split .idtrail-new,
		.split .idtrail-arrow {
			display: block;
			position: absolute;
			top: 0;
			transform: translateX(-50%);
		}
		.split .idtrail-new {
			left: var(--new-x);
		}
		/* the arrow from old ID to new, centred on the pills' height */
		.split .idtrail-arrow {
			top: calc((var(--text-1) + 0.6rem - 1rem) / 2);
			left: calc((var(--old-x) + var(--new-x)) / 2);
			display: flex;
			color: var(--muted-foreground);
		}
		.split .idtrail-arrow :global(svg) {
			width: 1rem;
			height: 1rem;
		}
		/* one stub under each ID; the new ID's runs on into its step's drop */
		.split .idtrail-id::after {
			left: calc(var(--old-x) - 0.5px);
		}
		.split .idtrail-id::before {
			content: '';
			position: absolute;
			top: calc(var(--text-1) + 0.6rem); /* the pill's height */
			bottom: 0;
			left: calc(var(--new-x) - 0.5px);
			width: 1px;
			background: var(--lead);
		}
	}
</style>
