<script>
	// The share image's card on a white margin, mounted off screen at a fixed rem width by constituency-card-png.js.
	import ConstituencyVoterCard from './ConstituencyVoterCard.svelte';

	/** @type {{ c: import('$data/constituencies.js').Constituency }} */
	let { c } = $props();
</script>

<div class="share">
	<ConstituencyVoterCard {c} />
</div>

<style>
	/* 576px of card and 24px of white each side */
	.share {
		box-sizing: border-box;
		width: 39rem;
		padding: 1.5rem;
		background: #fff;
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
	}
	/* a still: the map pin's drop would otherwise be caught halfway */
	.share :global(*) {
		animation: none !important;
		transition: none !important;
	}
</style>
