<script>
	// A section's closing total.
	//
	//   <Tally id="tally-dead-back" n={332} what="marked dead, and back on the final roll" of="16.3 lakh marked dead" />
	import { inr } from '$charts/theme.js';

	/** @type {{ n: number | string, what: string, of?: string, floor?: boolean, id?: string }} */
	let { n, what, of = '', floor = true, id } = $props();

	const figure = $derived(typeof n === 'number' ? inr(n) : n);
	let on = $state(false);

	/** @type {import('svelte/action').Action<HTMLElement>} */
	function enter(node) {
		if (typeof IntersectionObserver === 'undefined') {
			on = true;
			return;
		}
		const io = new IntersectionObserver(
			(es) => {
				if (es.some((e) => e.isIntersecting)) {
					on = true;
					io.disconnect();
				}
			},
			{ rootMargin: '0px 0px -15% 0px', threshold: 0.3 }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}
</script>

<p class="tally" {id} class:on use:enter>
	{#if floor}<small class="floor">at least</small>{/if}
	<span class="n">{figure}</span>
	<span class="what"
		>{#if of}<span class="of">of {of}</span>{/if}{what}</span
	>
</p>

<style>
	.tally {
		display: grid;
		justify-content: end;
		justify-items: end;
		row-gap: 0.25rem;
		margin-block: calc(2 * var(--leading)) calc(3 * var(--leading));
		text-align: right;
		opacity: 0;
		transform: translateY(8px);
	}
	.tally.on {
		opacity: 1;
		transform: none;
		transition:
			opacity 240ms ease-out,
			transform 240ms ease-out;
	}
	@media (prefers-reduced-motion: reduce) {
		.tally {
			opacity: 1;
			transform: none;
		}
		.tally.on {
			transition: none;
		}
	}
	.floor {
		font-size: var(--text-caption);
		font-weight: 500;
		line-height: 1.4;
		color: var(--muted-foreground);
	}
	.n {
		font-family: var(--font-heading);
		font-size: var(--text-4);
		font-weight: 700;
		line-height: 0.95;
		letter-spacing: -0.035em;
		font-variant-numeric: tabular-nums lining-nums;
	}
	.of {
		display: block;
	}
	.what {
		justify-self: stretch;
		contain: inline-size; /* takes the width of the lines above rather than setting it */
		min-width: min(26ch, 100vw - 2 * var(--gutter, 1.25rem));
		font-size: var(--text-1);
		line-height: 1.25;
		color: var(--muted-foreground);
		text-wrap: balance;
	}
	/* the tally's own margin is the section break; don't add the heading's on top */
	:global(.article > .tally + :is(h2, h3)) {
		margin-top: 0;
	}
</style>
