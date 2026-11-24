<script>
	// A finding: the count, what it counts, and its visuals (the drawn pages with their stepper,
	// then any chart or table for that count, passed in), together, so each can be read or
	// screenshotted alone. The same unit in every section of a state's page.
	//
	// The figure and its label are one block, the claim. On a wide screen it keeps to a 16rem
	// column, flush right against the visuals and centred on their height, with the arrows above
	// the frame at its top right. On a phone the arrows sit at the right end of the figure's row,
	// a row of fixed height, the label runs full width under it, and the visuals follow. Either
	// way stepping never moves the arrows; the frame takes the height of the example on show.
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import ExampleSet from '$lib/components/ExampleSet.svelte';
	import { lakh } from '$charts/theme.js';

	/**
	 * @typedef {{ document: string, constituency: string, part: number, page: number | null, where?: string, url: string }} Cite
	 * @type {{ n: number, what: string, examples?: { id: string, doc?: Cite }[][], cites?: import('svelte').Snippet, extra?: import('svelte').Snippet, key?: string, focus?: boolean }}
	 */
	// `key` names the finding for the page's reading line; `focus` is set on the one being read
	let { n, what, examples = [], cites, extra, key = '', focus = false } = $props();

	let at = $state(0);
	const count = $derived(examples.length);
	const step = (/** @type {number} */ d) => (at = (at + d + count) % count);
	const figure = $derived.by(() => {
		const [fig, unit] = lakh(n).split(/[  ]/);
		return { fig, unit: unit ?? '' };
	});
	const side = $derived(count > 0 || !!extra);

	// A finding whose visuals run well past a screen's height is long: on a wide screen its claim
	// then stays in view, at the middle of the screen, while the visuals scroll past. Shorter ones
	// keep the claim centred on the visuals and nothing sticks.
	let visualsH = $state(0);
	let claimH = $state(0);
	let screenH = $state(0);
	const long = $derived(screenH > 0 && visualsH > 1.1 * screenH);
</script>

<svelte:window bind:innerHeight={screenH} />

<article
	class="finding"
	class:side
	class:focus
	class:long
	class:stepped={count > 1}
	data-key={key}
	style:--claim-h="{claimH}px"
>
	<div class="claim" bind:clientHeight={claimH}>
		<p class="n">
			{figure.fig}{#if figure.unit}<span class="u">{figure.unit}</span>{/if}
		</p>
		<div class="what">
			<p>{what}</p>
			{@render cites?.()}
		</div>
	</div>
	{#if count > 1}
		<div class="steps">
			<span class="count" aria-live="polite"
				><span class="sr">Example </span>{at + 1} of {count}</span
			>
			<button type="button" onclick={() => step(-1)} aria-label="Previous example">
				<ChevronLeft size={18} strokeWidth={2.25} aria-hidden="true" />
			</button>
			<button type="button" onclick={() => step(1)} aria-label="Next example">
				<ChevronRight size={18} strokeWidth={2.25} aria-hidden="true" />
			</button>
		</div>
	{/if}
	{#if side}
		<div class="visuals" bind:clientHeight={visualsH}>
			{#if count}
				<ExampleSet {examples} label={what} steps={false} bind:at />
			{/if}
			{@render extra?.()}
		</div>
	{/if}
</article>

<style>
	/* Phone: the claim spans the width; the arrows sit over its first row at the right, beside the
	   figure (the label starts below that row, so they never meet); the visuals follow. */
	.finding {
		/* the figure's row: as tall as the arrows, or the figure where it is larger */
		--row: max(2.75rem, var(--text-3));
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: var(--row) auto;
		margin: 0;
	}
	.claim {
		grid-column: 1 / -1;
		grid-row: 1 / span 2;
		min-width: 0;
	}
	/* plain inline text on a line the height of the arrows' row, so the figure is centred on that
	   row and its unit sits on the figure's baseline */
	.n {
		margin: 0;
		max-width: none;
		font-family: var(--font-heading);
		font-size: var(--text-3);
		font-weight: 700;
		line-height: var(--row);
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums lining-nums;
		white-space: nowrap;
		color: var(--foreground);
	}
	/* the unit rides with its figure, small and in the regular weight */
	.u {
		/* its own line height, or the sans face's taller line would grow the figure's row */
		line-height: 1;
		padding-left: 0.25em;
		font-family: var(--font-sans);
		font-size: var(--text-body);
		font-weight: 400;
		letter-spacing: 0;
	}
	.what {
		margin-top: var(--space-p);
	}
	.what p {
		margin: 0;
		max-width: none;
		font-size: var(--text-body);
		line-height: 1.35;
		color: var(--foreground);
		text-wrap: pretty;
	}
	/* the visuals: the pages first, then the chart or table, a line's height apart */
	.visuals {
		grid-column: 1 / -1;
		grid-row: 3;
		display: flex;
		flex-direction: column;
		gap: var(--leading);
		min-width: 0;
		margin-top: var(--space-p);
	}

	/* the counter and its arrows, at the right end of the figure's row */
	.steps {
		grid-column: 2;
		grid-row: 1;
		align-self: center;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.count {
		margin-right: 0.5rem;
		font-size: var(--text-caption);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--foreground);
	}
	.steps button {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border: 0;
		border-radius: var(--ui-r, 5px);
		background: color-mix(in oklch, var(--foreground) 6%, var(--background));
		color: var(--foreground);
		cursor: pointer;
	}
	.steps button:hover {
		background: color-mix(in oklch, var(--foreground) 12%, var(--background));
	}
	.steps button:active {
		transform: translateY(0.5px);
	}
	.steps button:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 2px;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* Wide: the claim in a 16rem column, set flush right against the gutter and centred down the
	   height of its visuals; the arrows above the frame at its top right, in the right column, so
	   the claim centres on the visuals alone. Nothing sticks. */
	@media (min-width: 48rem) {
		.finding {
			grid-template-columns: 16rem minmax(0, 1fr);
			grid-template-rows: auto auto;
			column-gap: 2.5rem;
		}
		.claim {
			grid-column: 1;
			grid-row: 2;
			align-self: center;
			text-align: right;
		}
		/* a label of a few words breaks into two lines of like length, a long one into three, flush
		   right under its figure */
		.what p {
			max-width: 11.5em;
			margin-left: auto;
			text-wrap: balance;
		}
		.steps {
			grid-column: 2;
			grid-row: 1;
			justify-self: end;
			margin-bottom: calc(var(--leading) / 4);
		}
		.visuals {
			grid-column: 2;
			grid-row: 2;
			align-self: start;
			margin-top: 0;
		}
		/* a finding with nothing beside it keeps the same column and edge as every other */
		.finding:not(.side) .claim {
			align-self: start;
		}
	}
</style>
