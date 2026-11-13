<script lang="ts">
	import { Info } from '@lucide/svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { GLOSSARY } from '$lib/glossary.js';

	let { id, text }: { id: string; text: string } = $props();
	const g = $derived(GLOSSARY[id]);
	// the last word and the mark never part across a line break
	const cut = $derived(text.lastIndexOf(' ') + 1);
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<!-- a span, not a button, so a long term can wrap like the words around it -->
			<span {...props} role="button" tabindex="0" class="term"
				>{text.slice(0, cut)}<span class="term-last"
					>{text.slice(cut)}<Info class="term-i" aria-hidden="true" strokeWidth={2.25} /></span
				></span
			>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="gloss" sideOffset={8} collisionPadding={16}>
		<p class="gloss-title">{g.title}</p>
		<p>{g.body}</p>
	</Popover.Content>
</Popover.Root>
