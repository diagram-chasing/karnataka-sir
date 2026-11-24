<script lang="ts">
	import Content from '$lib/content.md';
	import SEO from '$lib/components/SEO.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Reel from '$lib/components/Reel.svelte';
	import StateNav from '$lib/components/StateNav.svelte';
	import { absUrl } from '$lib/site';
	import { restoreUnits } from '$lib/units.svelte.js';

	$effect(restoreUnits);
</script>

<SEO canonicalUrl={absUrl('/karnataka')} />

<Hero />
<StateNav current="karnataka" />
<Reel />

<article class="article">
	<Content />
</article>
