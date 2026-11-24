<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import StatePage from '$lib/components/StatePage.svelte';
	import { story, absUrl } from '$lib/site';
	import { restoreUnits } from '$lib/units.svelte.js';

	let { data } = $props();

	$effect(restoreUnits);
</script>

<SEO
	canonicalUrl={absUrl(`/${data.state.slug}`)}
	seoTitle="{story.title}: {data.state.name} — {story.siteName}"
	shareTitle="{story.title}: {data.state.name}"
	shareImgPath={absUrl(`/og/${data.state.slug}.jpg`)}
	shareImgAnimatedPath=""
	shareImgAlt="The Diagram Chasing logo, the title No eligible citizen is left out (?) and {data
		.state.name}, in a clearing among rows of grey voter cards."
	seoDescription="{data.state
		.name}'s Special Intensive Revision of the voter roll in numbers: official totals, what the rolls show, and every constituency."
/>

<StatePage state={data.state} />
