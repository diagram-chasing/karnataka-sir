<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { SOURCES, iconUrl } from '$lib/sources.js';

	let { id }: { id: string } = $props();
	const s = $derived(SOURCES[id]);
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} type="button" class="sn-mark" aria-label="Note from {s.pub}"></button>
		{/snippet}
	</Popover.Trigger>
	<!-- focus stays on the number, so opening a note doesn't draw a focus ring round its link -->
	<Popover.Content
		class="gloss sn"
		sideOffset={8}
		collisionPadding={16}
		onOpenAutoFocus={(e) => e.preventDefault()}
	>
		<p class="sn-src">
			<img src={iconUrl(s.icon)} alt="" width="16" height="16" loading="lazy" />{s.pub}, {s.date}.
		</p>
		<p>{s.text}</p>
		<p>
			<a class="sn-link" href={s.url}
				>{s.title}<ArrowUpRight class="sn-out" aria-hidden="true" strokeWidth={2.25} /></a
			>
		</p>
	</Popover.Content>
</Popover.Root>
