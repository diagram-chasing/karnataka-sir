<script>
	// The voter card's photo box: the state map with the constituency filled and pinned.
	import { miniMap } from './constituency-card.js';
	/** @type {{ c: import('$data/constituencies.js').Constituency }} */
	let { c } = $props();
	const m = $derived(miniMap(c.ac, 90, 108));
</script>

<svg viewBox="0 0 90 120" role="img" aria-label="{c.name} on a map of Karnataka">
	<path class="state" d={m.state} />
	<path class="shape" d={m.shape} />
	<g transform="translate({m.x} {m.y})">
		<g class="pin">
			<path d="M0 0 C -4.2 -5 -7 -8 -7 -12.2 A7 7 0 1 1 7 -12.2 C 7 -8 4.2 -5 0 0 Z" />
			<circle cx="0" cy="-12.2" r="2.6" />
		</g>
	</g>
	<text class="district" x="45" y="116" text-anchor="middle">{c.district}</text>
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.state {
		fill: color-mix(in oklch, var(--foreground) 6%, var(--background));
		stroke: rgb(43 43 43 / 0.45);
		stroke-width: 0.7;
	}
	.shape {
		fill: var(--story-orange);
		stroke: var(--story-orange);
		stroke-width: 0.8;
		stroke-linejoin: round;
	}
	.pin path {
		fill: var(--story-orange);
		stroke: #fff;
		stroke-width: 1.2;
		stroke-linejoin: round;
	}
	.pin circle {
		fill: #fff;
	}
	.pin {
		animation: drop 260ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes drop {
		from {
			transform: translateY(-8px);
			opacity: 0;
		}
	}
	.district {
		font-family: var(--font-sans);
		font-size: 7.5px;
		font-weight: 700;
		fill: #1a1a1a;
	}
	@media (prefers-reduced-motion: reduce) {
		.pin {
			animation: none;
		}
	}
</style>
