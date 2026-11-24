<script>
	// The states the story covers, as the story's own toggle: a grey track with a raised white key
	// on the state being read. The others are links, keys of the same size that darken under the
	// pointer, so the row reads as somewhere to go and not as a label.
	import { base } from '$app/paths';
	import { STATES } from '$data/states/index.js';

	/** @type {{ current: string }} */
	let { current } = $props();
</script>

{#if STATES.length > 1}
	<nav class="states" aria-label="States">
		<ul>
			{#each STATES as s (s.slug)}
				<li>
					{#if s.slug === current}
						<span class="key on" aria-current="page">{s.name}</span>
					{:else}
						<a class="key" href="{base}/{s.slug}">{s.name}</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.states {
		margin: 0 auto;
		padding: 0 var(--gutter, 1.25rem);
		font-family: var(--font-sans);
		text-align: center;
	}
	ul {
		display: inline-flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 3px;
		margin: 0;
		padding: 4px;
		list-style: none;
		border-radius: calc(var(--ui-r, 5px) + 2px);
		background: var(--ui-track, color-mix(in oklch, var(--foreground) 7%, var(--background)));
		box-shadow: var(--ui-track-inset, none);
	}
	li {
		display: flex;
	}
	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.75rem;
		box-sizing: border-box;
		padding: 0.5rem 1.1rem;
		border-radius: var(--ui-r, 5px);
		color: var(--foreground);
		font-size: var(--text-body);
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.005em;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color 120ms ease-out,
			box-shadow 120ms ease-out;
	}
	/* the state being read: the raised key */
	.key.on {
		background: var(--background);
		box-shadow: var(--shadow-sheet, 0 1px 2px rgb(0 0 0 / 0.18));
	}
	/* the other states: links, as keys not yet pressed */
	a.key:hover {
		background: var(
			--ui-track-hover,
			color-mix(in oklch, var(--foreground) 12%, var(--background))
		);
	}
	a.key:active {
		transform: translateY(0.5px);
	}
	a.key:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 2px;
	}
</style>
