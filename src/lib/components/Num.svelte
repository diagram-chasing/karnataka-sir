<script lang="ts">
	import { ArrowLeftRight } from '@lucide/svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { units, setWest, toggleUnits, inMillions } from '$lib/units.svelte.js';

	let { v, west, explain = false }: { v: string; west?: string; explain?: boolean } = $props();

	function convert(text: string) {
		const m = text.match(/^([\d.,]+)\s*(lakh|crore)?$/);
		if (!m) return text;
		const digits = m[1].replace(/,/g, '');
		const n = parseFloat(digits);
		if (!m[2]) return n.toLocaleString('en-US');
		const dec = digits.includes('.') ? digits.split('.')[1].length : 0;
		const mult = m[2] === 'crore' ? 1e7 : 1e5;
		return inMillions(n * mult, mult / 10 ** dec);
	}

	const shown = $derived(units.west ? (west ?? convert(v)) : v.replace(/ (lakh|crore)$/, ' $1'));
	const other = $derived(units.west ? 'lakh and crore' : 'millions');
</script>

{#if explain}
	<Popover.Root>
		<Popover.Trigger class="num" aria-label="{shown}. About lakh and crore">
			{shown}<ArrowLeftRight class="num-i" aria-hidden="true" strokeWidth={2.25} />
		</Popover.Trigger>
		<Popover.Content class="gloss" sideOffset={8} collisionPadding={16}>
			<p>1 lakh = 100,000 · 1 crore = 10 million</p>
			<div class="units-switch" role="group" aria-label="Show numbers in">
				<button type="button" aria-pressed={!units.west} onclick={() => setWest(false)}
					>Lakh and crore</button
				>
				<button type="button" aria-pressed={units.west} onclick={() => setWest(true)}
					>Millions</button
				>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<button
		type="button"
		class="num"
		onclick={toggleUnits}
		title="Show in {other}"
		aria-label="{shown}. Show every number in {other}"
		>{shown}<ArrowLeftRight class="num-i" aria-hidden="true" strokeWidth={2.25} /></button
	>
{/if}
