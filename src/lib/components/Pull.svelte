<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		who = '',
		src = '',
		children
	}: { who?: string; src?: string; children: Snippet } = $props();
</script>

<figure class={['pull', { own: !who }]}>
	<blockquote><p>{@render children()}</p></blockquote>
	{#if who}<figcaption>
			{who}{#if src}<span class="pull-src">, {src}</span>{/if}
		</figcaption>{/if}
</figure>
