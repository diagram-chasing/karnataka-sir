<script>
	import { RAMP } from './theme.js';

	/** @type {{ label: string, steps: number[], children?: import('svelte').Snippet }} */
	let { label, steps, children } = $props();
	const tick = (/** @type {number} */ v) => (v < 1 ? v.toFixed(1) : v.toFixed(0));
</script>

<div class="ramp" role="img" aria-label={label}>
	<span class="lbl">{label}</span>
	<div class="swatches">
		{#each RAMP as c, i (i)}<i style:background={c}></i>{/each}
	</div>
	<div class="ticks">
		{#each steps as t, i (t)}
			<span style:left="{(100 * (i + 1)) / RAMP.length}%"
				>{tick(t)}{i === steps.length - 1 ? '%' : ''}</span
			>
		{/each}
	</div>
	{@render children?.()}
</div>

<style>
	.ramp {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 18rem;
		max-width: 100%;
	}
	.swatches {
		display: flex;
		gap: 0;
		height: 0.75rem;
		box-shadow: 0 0 0 1px var(--ui-line);
	}
	.swatches i {
		flex: 1;
		display: block;
		border: 0;
		border-radius: 0;
	}
	.ticks {
		position: relative;
		height: 1.1rem;
		margin-top: -0.375rem;
		color: var(--c-text);
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}
	.ticks span {
		position: absolute;
		top: 0;
		padding-top: 0.45rem;
		transform: translateX(-50%);
		white-space: nowrap;
		line-height: 1;
	}
	.ticks span::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		width: 1px;
		height: 0.3rem;
		background: var(--c-ink);
	}
</style>
