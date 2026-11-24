<script>
	// The states the story covers, as plain links; the one being read is not a link.
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
						<span aria-current="page">{s.name}</span>
					{:else}
						<a href="{base}/{s.slug}">{s.name}</a>
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
		font-size: var(--text-body);
		line-height: 1.4;
		text-align: center;
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.25rem 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	a {
		color: color-mix(in oklch, var(--foreground) 62%, var(--background));
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	a:hover {
		color: var(--foreground);
	}
	[aria-current] {
		font-weight: 700;
		color: var(--foreground);
	}
</style>
