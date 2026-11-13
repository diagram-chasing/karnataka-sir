<script lang="ts">
	import { Info } from '@lucide/svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { onMount } from 'svelte';
	import { FILMS, posterUrl, warmPoster } from '$lib/films.js';

	let { film, title }: { film: string; title: string } = $props();
	onMount(() => warmPoster(film));
	const f = $derived(FILMS[film]);
	const words = $derived(title.split(' '));
</script>

<!-- the last word and the mark never part across a line break -->
<span class="film-title" data-film={film}
	>{#if words.length > 1}{words.slice(0, -1).join(' ')}{' '}{/if}<span class="film-last"
		>{words.at(-1)}<Popover.Root>
			<Popover.Trigger class="film-i" aria-label="Poster of {f.name}"
				><Info aria-hidden="true" strokeWidth={2} /></Popover.Trigger
			>
			<Popover.Content class="gloss gloss-film" align="start" sideOffset={10} collisionPadding={16}>
				<img src={posterUrl(film)} alt="Poster of {f.name}" style:aspect-ratio={f.ratio} />
				<p class="gloss-title">{f.name} <span class="gloss-year">({f.year})</span></p>
				{#if f.english}<p class="gloss-en"><i>{f.english}</i></p>{/if}
			</Popover.Content>
		</Popover.Root></span
	></span
>{#if f.english}<span class="film-en">{f.english}</span>{/if}
