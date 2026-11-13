<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		source,
		where,
		href,
		children
	}: { source: string; where: string; href: string; children: Snippet } = $props();
</script>

<figure class="excerpt">
	<blockquote cite={href}><p>{@render children()}</p></blockquote>
	<figcaption><a {href}>{source}</a>, {where}</figcaption>
</figure>
