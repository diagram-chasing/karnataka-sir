<script lang="ts">
	// The way from a state's page to the essay: the story's own title card, title, description and
	// byline, on the donate card's paper. The whole card is the link.
	import { ArrowRight } from '@lucide/svelte';
	import { base } from '$app/paths';
	import { story } from '$lib/site';
	import { ESSAY } from '$data/states/index.js';
</script>

<a class="story" href="{base}/{ESSAY}" aria-label="Read the story: {story.title}">
	<img src="{base}{story.shareImage}" alt="" width="1200" height="630" decoding="async" />
	<span class="text">
		<span class="dek">{story.description}</span>
		<span class="foot">
			<span class="go"
				>Read the story <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" /></span
			>
		</span>
	</span>
</a>

<style>
	.story {
		--card-ink: rgb(43 43 43 / 0.55);
		display: grid;
		max-width: 34rem;
		/* the page sets the gap above it */
		margin: 0 auto;
		background: #fff;
		border: 1.2px solid var(--card-ink);
		box-shadow: var(--shadow-sheet);
		color: var(--foreground);
		text-decoration: none;
		transition: box-shadow 160ms ease-out;
	}
	.story:hover {
		box-shadow: var(--shadow-print);
	}
	.story:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 3px;
	}
	img {
		display: block;
		width: 100%;
		height: auto;
		border-bottom: 1px solid var(--card-ink);
	}
	.text {
		display: grid;
		gap: var(--space-p);
		padding: 1.25rem;
	}
	.dek {
		font-size: var(--text-body);
		line-height: 1.4;
		color: var(--foreground);
		text-wrap: pretty;
	}
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-start;
		gap: 0.75rem 1rem;
	}
	.go {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 40px;
		padding: 0 1rem;
		border-radius: var(--ui-r, 5px);
		background: var(--foreground);
		color: var(--background);
		font-size: var(--text-caption);
		font-weight: 700;
		white-space: nowrap;
		box-shadow: var(--shadow-sheet);
	}
	.story:hover .go {
		background: color-mix(in oklch, var(--foreground) 85%, var(--background));
	}
</style>
