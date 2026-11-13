<script>
	import manifest from '$images/exhibits/manifest.json';

	const urls = import.meta.glob('/src/lib/assets/images/exhibits/*.svg', {
		eager: true,
		query: '?url',
		import: 'default'
	});

	// eager + low priority: ready before scroll, never blocks first paint

	// `compact` always uses the narrow drawing, for exhibits set side by side in columns
	/** @type {{ id: string, alt: string, compact?: boolean, children?: import('svelte').Snippet }} */
	let { id, alt, compact = false, children } = $props();

	const url = (s) => urls[`/src/lib/assets/images/exhibits/${s}.svg`];
	const size = $derived.by(() => {
		if (!manifest[id]) throw new Error(`No exhibit "${id}" in exhibits/manifest.json`);
		return manifest[id];
	});
	const d = $derived(size.d);
	const m = $derived(size.m);
	const full = $derived(url(id));
	const small = $derived(url(id + '-m'));
</script>

<figure class="exhibit">
	{#if compact}
		<img src={small} {alt} width={m.w} height={m.h} fetchpriority="low" decoding="async" />
	{:else}
		<picture>
			<source media="(max-width: 40em)" srcset={small} width={m.w} height={m.h} />
			<img src={full} {alt} width={d.w} height={d.h} fetchpriority="low" decoding="async" />
		</picture>
	{/if}
	{#if children}
		<figcaption>{@render children()}</figcaption>
	{/if}
</figure>

<style>
	.exhibit {
		margin: 0;
	}
	.exhibit img {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
