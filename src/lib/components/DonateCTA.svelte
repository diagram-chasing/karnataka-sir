<script lang="ts">
	import markSrc from '$lib/assets/dc-mark.png?w=240&format=webp';
	import { CANONICAL_ORIGIN, PAGE_LINKS } from '$lib/site';

	const support = PAGE_LINKS.find((l) => l.name === 'Support')!.href;
</script>

<aside class="donate" aria-label="Support Diagram Chasing">
	<div class="text">
		<p class="name"><a href={CANONICAL_ORIGIN}>Diagram Chasing</a></p>
		<p class="why">
			This project is independently produced and reader-supported. If you found it useful, please
			consider sending a tip to help us make more work like it.
		</p>
		<a class="give" href={support}>₹ Support us</a>
	</div>
	<div class="photo">
		<img src={markSrc} alt="" width="290" height="290" loading="lazy" decoding="async" />
	</div>
</aside>

<style>
	/* the card's ink, as in CardField and the hero */
	.donate {
		--card-ink: rgb(43 43 43 / 0.55);
		display: grid;
		grid-template-columns: 1fr 6.5rem;
		gap: 1.25rem;
		max-width: 30rem;
		margin: calc(1.5 * var(--leading, 1.5rem)) auto 0;
		padding: 1.125rem 1.125rem 1.125rem 1.25rem;
		background: #fff;
		border: 1.2px solid var(--card-ink);
		box-shadow: var(--shadow-sheet);
	}
	.text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}
	p {
		margin: 0;
	}
	.name {
		font-size: 1.0625rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}
	.name a {
		color: inherit;
		text-decoration: none;
	}
	.name a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.why {
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--muted-foreground);
		text-wrap: pretty;
	}
	.photo {
		align-self: start;
		display: grid;
		place-items: center;
		aspect-ratio: 12 / 16;
		border: 1px solid var(--card-ink);
		padding: 0.5rem;
	}
	.photo img {
		display: block;
		width: 100%;
		height: auto;
		filter: grayscale(1);
	}
	.give {
		margin-top: 0.25rem;
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		padding: 0 1rem;
		box-sizing: border-box;
		border-radius: var(--ui-r, 5px);
		background: var(--foreground);
		color: var(--background);
		font-size: 0.875rem;
		font-weight: 700;
		white-space: nowrap;
		text-decoration: none;
		box-shadow: var(--shadow-sheet);
		transition: background-color 120ms ease-out;
	}
	.give:hover {
		background: color-mix(in oklch, var(--foreground) 85%, var(--background));
	}
	.give:focus-visible,
	.name a:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 3px;
	}
	@media (max-width: 400px) {
		.donate {
			grid-template-columns: 1fr 4rem;
			gap: 0.875rem;
			padding: 1rem;
		}
		.photo {
			padding: 0.3rem;
		}
	}
</style>
