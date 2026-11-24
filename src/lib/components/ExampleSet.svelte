<script>
	// The example pages behind one count. One example shows at a time: a single drawn page, or a
	// pair that is read together (the same voter ID in two constituencies). Where a count has
	// several, the arrows above the page step through them, and on a touch screen a swipe does too.
	//
	// The frame is as tall as the example on show. Its arrows sit above it (here, or on the
	// finding's own row when the caller sets them), so stepping never moves them; what is below the
	// frame moves with it.
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import Exhibit from '$charts/Exhibit.svelte';

	/**
	 * @typedef {{ document: string, constituency: string, part: number, page: number | null, where?: string, url: string }} Cite
	 * @type {{ examples: { id: string, doc?: Cite }[][], label: string, compact?: boolean, at?: number, steps?: boolean }}
	 */
	// `compact` always draws the phone version of a page, for a viewer narrower than the screen.
	// `steps={false}` leaves the arrows to the caller, which binds `at` and sets them elsewhere.
	let { examples, label, compact = false, at = $bindable(0), steps = true } = $props();

	const n = $derived(examples.length);
	const shown = $derived(Math.min(at, n - 1));
	const step = (/** @type {number} */ d) => (at = (shown + d + n) % n);

	/** A citation's detail in plain words: the removals list by name, and the Hindi reason glossed. */
	const where = (/** @type {string} */ w) =>
		w
			.replace('reason मृत्यु', 'reason मृत्यु (death)')
			.replace(/ checked$/, '')
			.replace(' (and 588)', '');

	// a horizontal swipe on the page steps, a vertical one scrolls as usual
	let x0 = 0;
	let y0 = 0;
	const down = (/** @type {PointerEvent} */ e) => {
		x0 = e.clientX;
		y0 = e.clientY;
	};
	const up = (/** @type {PointerEvent} */ e) => {
		if (e.pointerType === 'mouse' || n < 2) return;
		const dx = e.clientX - x0;
		if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(e.clientY - y0)) step(dx < 0 ? 1 : -1);
	};
</script>

<div class="set">
	{#if n > 1 && steps}
		<div class="steps">
			<span class="count" aria-live="polite"
				><span class="sr">Example </span>{shown + 1} of {n}</span
			>
			<span class="keys">
				<button type="button" onclick={() => step(-1)} aria-label="Previous example">
					<ChevronLeft size={18} strokeWidth={2.25} aria-hidden="true" />
				</button>
				<button type="button" onclick={() => step(1)} aria-label="Next example">
					<ChevronRight size={18} strokeWidth={2.25} aria-hidden="true" />
				</button>
			</span>
		</div>
	{/if}
	<!-- a carousel's slide area: focusable so the arrow keys step it, as the arrows above do -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="stage"
		role="group"
		aria-roledescription="carousel"
		aria-label="Examples: {label}"
		tabindex={n > 1 ? 0 : undefined}
		onpointerdown={down}
		onpointerup={up}
		onkeydown={(e) => {
			const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
			if (d && n > 1) {
				e.preventDefault();
				step(d);
			}
		}}
	>
		{#each examples as ex, k (k)}
			<div class="ex" class:on={k === shown} inert={k !== shown} aria-hidden={k !== shown}>
				{#each ex as x (x.id)}
					<div class="shot">
						<Exhibit
							id={x.id}
							{compact}
							alt="{label}: voter cards as printed on the {x.doc
								? `${x.doc.document.replace(/^[A-Z][a-z]/, (/** @type {string} */ s) => s.toLowerCase())}, ${x.doc.constituency} part ${x.doc.part}${x.doc.page ? `, page ${x.doc.page}` : ''}`
								: 'final roll'}, with the fields that matter highlighted."
						>
							{#if x.doc}
								{x.doc.document}, {x.doc.constituency}
								<a href={x.doc.url} target="_blank" rel="noopener noreferrer">part {x.doc.part}</a
								>{#if x.doc.page}, page {x.doc.page}{/if}{#if x.doc.where}, {where(
										x.doc.where
									)}{/if}.
							{/if}
						</Exhibit>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.stage {
		touch-action: pan-y;
	}
	/* the frame takes the height of the example on show; the others stay in the page, loaded but
	   unseen. The arrows sit above the frame, so a change of height never moves them. */
	.ex {
		display: none;
	}
	.ex.on {
		display: block;
		animation: show 180ms ease-out;
	}
	@keyframes show {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ex.on {
			animation: none;
		}
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	/* the two pages of a pair are two parts of one example; a caption sits tight under its page */
	.shot + .shot {
		margin-top: var(--leading);
	}
	.shot :global(figcaption) {
		margin-top: calc(var(--leading) / 4);
		text-align: left;
		font-size: var(--text-caption);
		line-height: 1.4;
		color: color-mix(in oklch, var(--foreground) 60%, var(--background));
		text-wrap: pretty;
	}
	.shot :global(figcaption a) {
		color: inherit;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	/* the counter and its arrows together, on a line of their own at the frame's top right */
	.steps {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		height: 2.5rem;
		margin-bottom: calc(var(--leading) / 4);
	}
	.stage:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 4px;
	}
	.count {
		font-size: var(--text-caption);
		font-variant-numeric: tabular-nums;
		color: var(--foreground);
	}
	.keys {
		display: flex;
		gap: 0.5rem;
	}
	.keys button {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		border: 0;
		border-radius: var(--ui-r, 5px);
		background: color-mix(in oklch, var(--foreground) 6%, var(--background));
		color: var(--foreground);
		cursor: pointer;
	}
	.keys button:hover {
		background: color-mix(in oklch, var(--foreground) 12%, var(--background));
	}
	.keys button:active {
		transform: translateY(0.5px);
	}
	.keys button:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 2px;
	}
</style>
