<svelte:options namespace="svg" />

<script module>
	/** The card's drawing box, for a symbol's viewBox or a scale. */
	export const CARD_W = 60;
	export const CARD_H = 32;
	/** A card's cell in a wall of cards, height over width. */
	export const CELL_ASPECT = 0.62;
</script>

<script>
	// One voter card in a CARD_W × CARD_H box. Colours come from the .card-* class on its parent (story.css).
	/** @type {{ blank?: boolean, fixedStroke?: boolean }} */
	let { blank = false, fixedStroke = false } = $props();
	const ve = $derived(fixedStroke ? 'non-scaling-stroke' : undefined);
</script>

<rect class={['paper', { blank }]} x="1" y="1" width="58" height="30" vector-effect={ve} />
{#if !blank}
	<rect class="box" x="44" y="5" width="12" height="22" vector-effect={ve} />
	<rect class="bar" x="4" y="7" width="26" height="3" />
	<rect class="bar" x="4" y="14.5" width="34" height="3" />
	<rect class="bar" x="4" y="22" width="18" height="3" />
{/if}

<style>
	.paper {
		fill: var(--card-fill);
		stroke: currentColor;
		stroke-width: var(--card-line, 2.2px);
	}
	.paper.blank {
		fill: none;
		stroke-dasharray: var(--card-dash, 3 3);
		stroke-width: var(--card-gone-line, 1.6px);
	}
	.box {
		fill: none;
		stroke: currentColor;
		stroke-width: var(--card-box-line, 1.6px);
	}
	.bar {
		fill: var(--card-bar);
	}
</style>
