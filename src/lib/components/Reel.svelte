<script>
	// Reading progress bar, one segment per section; scrub to preview, release to jump.
	import { REEL, reelTracker } from '$lib/reel.svelte.js';

	const t = reelTracker();
	const s = t.s;

	/** @type {HTMLElement | undefined} */
	let strip = $state();
	/** @type {HTMLElement[]} */
	const segs = $state([]);
	let hover = $state(-1);
	let hoverX = $state(0);
	let scrubbing = $state(false);
	let width = $state(0);

	const show = $derived(s.pastHero && s.ready);
	const tip = $derived(hover >= 0 ? REEL[hover] : null);
	// pointer position 0–1; the readout anchors at the same share of its own width so it stays on screen
	const along = $derived(width ? Math.min(1, Math.max(0, hoverX / width)) : 0);

	/** @param {number} clientX */
	function pick(clientX) {
		const i = segs.findIndex((el) => {
			const r = el.getBoundingClientRect();
			return clientX >= r.left - 1 && clientX <= r.right + 1;
		});
		if (i >= 0) hover = i;
		hoverX = clientX;
	}

	/** @param {PointerEvent} e */
	function down(e) {
		scrubbing = true;
		pick(e.clientX);
		try {
			strip?.setPointerCapture(e.pointerId);
		} catch {
			// the pointer is already gone; the drag simply ends at the bar's edge
		}
	}
	/** @param {PointerEvent} e */
	function move(e) {
		pick(e.clientX);
	}
	function up() {
		if (scrubbing && hover >= 0) t.jump(hover);
		scrubbing = false;
		if (matchMedia('(hover: none)').matches) hover = -1;
	}
	function leave() {
		if (!scrubbing) hover = -1;
	}

	/** @param {KeyboardEvent} e */
	function key(e) {
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			const step = e.key === 'ArrowRight' ? 1 : -1;
			const i = Math.min(REEL.length - 1, Math.max(0, (hover < 0 ? s.current : hover) + step));
			hover = i;
			const r = segs[i]?.getBoundingClientRect();
			if (r) hoverX = r.left + r.width / 2;
		} else if (e.key === 'Enter' && hover >= 0) {
			t.jump(hover);
		} else if (e.key === 'Escape') {
			hover = -1;
		}
	}
</script>

<svelte:window bind:innerWidth={width} />

<div class="reel" data-show={show ? '' : undefined} data-active={hover >= 0 ? '' : undefined}>
	<div
		class="hit"
		bind:this={strip}
		role="slider"
		tabindex={show ? 0 : -1}
		aria-label="Sections of the story"
		aria-valuemin={1}
		aria-valuemax={REEL.length}
		aria-valuenow={s.current + 1}
		aria-valuetext={REEL[s.current].word}
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={() => (scrubbing = false)}
		onpointerleave={leave}
		onkeydown={key}
		onblur={() => (hover = -1)}
	>
		<div class="strip">
			{#each REEL as x, i (x.key)}
				<div
					class="seg"
					bind:this={segs[i]}
					style:flex-grow={s.share[i] ?? 0}
					data-hover={hover === i ? '' : undefined}
				>
					<div class="fill" style:transform="scaleX({s.fill[i] ?? 0})"></div>
					{#if i === s.current}<div class="head" style:left="{(s.fill[i] ?? 0) * 100}%"></div>{/if}
				</div>
			{/each}
		</div>
	</div>

	{#if tip}
		<div
			class="tip"
			style:left="calc(8px + (100% - 16px) * {along})"
			style:translate="{-along * 100}% 0"
		>
			<p class="word">{tip.word}</p>
			<p class="where">{hover + 1} of {REEL.length}</p>
		</div>
	{/if}
</div>

<style>
	.reel {
		position: fixed;
		top: 0;
		right: 0;
		left: 0;
		z-index: 40;
		opacity: 0;
		pointer-events: none;
		transition: opacity 200ms ease-out;
	}
	.reel[data-show] {
		opacity: 1;
	}
	.reel[data-show] .hit {
		pointer-events: auto;
	}
	/* a taller target than the bar it holds */
	.hit {
		height: 22px;
		padding: 0 2px;
		cursor: pointer;
		touch-action: none;
		outline: none;
	}
	@media (pointer: coarse) {
		.hit {
			height: 32px;
		}
	}
	.strip {
		display: flex;
		gap: 2px;
		height: 12px;
		margin: 0 -2px;
		padding: 2px 0;
		background: var(--background);
		transform: scaleY(0.5);
		transform-origin: top;
		transition: transform 180ms ease-out;
	}
	.reel[data-active] .strip,
	.hit:focus-visible .strip {
		transform: scaleY(1);
	}
	.seg {
		position: relative;
		flex-basis: 0;
		min-width: 3px;
		overflow: hidden;
		border-radius: 1px;
		background: var(--ui-track-hover);
	}
	.fill {
		position: absolute;
		inset: 0;
		background: color-mix(in oklch, var(--foreground) 72%, var(--background));
		transform-origin: left;
	}
	.seg[data-hover] {
		background: color-mix(in oklch, var(--foreground) 22%, var(--background));
	}
	.seg[data-hover] .fill {
		background: var(--foreground);
	}
	.head {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 3px;
		margin-left: -1px;
		background: var(--story-orange);
	}

	.tip {
		position: absolute;
		top: 26px;
		padding: 0.45rem 0.7rem 0.5rem;
		border-radius: var(--ui-r-sheet);
		background: var(--background);
		box-shadow: var(--shadow-print);
		font-size: 0.875rem;
		line-height: 1.3;
		white-space: nowrap;
		pointer-events: none;
		animation: in 160ms ease-out;
	}
	@media (pointer: coarse) {
		.tip {
			top: 38px;
		}
	}
	.tip p {
		margin: 0;
	}
	.word {
		font-weight: 700;
	}
	.where {
		margin-top: 0.1rem !important;
		color: color-mix(in oklch, var(--foreground) 55%, var(--background));
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}
	@keyframes in {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reel,
		.strip {
			transition: none;
		}
		.tip {
			animation: none;
		}
	}
</style>
