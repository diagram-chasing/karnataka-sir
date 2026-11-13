<script lang="ts">
	import type { Snippet } from 'svelte';

	let { n, id, children }: { n: 1 | 2; id: string; children: Snippet } = $props();

	const SLOGAN = {
		1: [
			'No eligible citizen is left out while ',
			'no ineligible person is included',
			' in the electoral roll.'
		],
		2: [
			'',
			'No eligible citizen is left out',
			' while no ineligible person is included in the electoral roll.'
		]
	};
	const [before, marked, after] = $derived(SLOGAN[n]);
</script>

<div class="breakout-md part" {id}>
	<h2>
		<span class="sr-only">{@render children()}</span>
		<span aria-hidden="true"
			><span class="rest">{before}</span>{marked}<span class="rest">{after}</span></span
		>
	</h2>
</div>

<style>
	.part {
		margin-top: var(--space-part);
		margin-bottom: calc(1.5 * var(--leading));
	}
	h2 {
		max-width: 25ch;
		margin: 0 auto;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: var(--text-5);
		line-height: 1.02;
		letter-spacing: -0.025em;
		text-align: center;
		text-wrap: balance;
	}
	/* 40% ink keeps the pale half above 3:1 against the page */
	.rest {
		color: color-mix(in oklch, var(--foreground) 40%, var(--background));
	}
</style>
