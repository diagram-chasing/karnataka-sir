<script>
	// Everyone struck off before the draft roll, a card per 5,000 by reason; orange is who came back.
	import ChartFrame from './ChartFrame.svelte';
	import VoterCard, { CARD_W, CARD_H, CELL_ASPECT } from '$lib/components/VoterCard.svelte';
	import { seeded } from '$lib/components/CardField.svelte';
	import returns from '$data/asddo_return.json';
	import { lakh, inr } from './theme.js';

	// the hero's unit, so the orange here adds up to the hero's three cards
	const UNIT = 5000;

	/** @type {Record<string, string>} */
	const MARKED = {
		shifted: 'marked permanently shifted',
		absent: 'marked absent',
		dead: 'marked dead',
		duplicate: 'marked already enrolled elsewhere'
	};

	const blocks = [...returns]
		.sort((a, b) => b.dropped - a.dropped)
		.map((g, gi) => {
			const units = Math.round(g.dropped / UNIT);
			const cards = g.back / UNIT;
			const full = Math.floor(cards);
			const part = cards - full;
			// small seeds give a first draw near 0, which would pin every group's first card top-left
			const rand = seeded(48271 + gi * 7919);
			for (let k = 0; k < 5; k++) rand();
			/** @type {number[]} */
			const spots = [];
			while (spots.length < full + (part > 0 ? 1 : 0)) {
				const i = Math.floor(rand() * units);
				if (!spots.includes(i)) spots.push(i);
			}
			// the whole cards, then the one card the remainder fills part way
			const whole = spots.slice(0, full).sort((a, b) => a - b);
			const partial = part > 0 ? { i: spots[full], f: part } : null;
			return {
				key: g.category,
				dropped: g.dropped,
				back: g.back,
				units,
				whole,
				partial,
				cards,
				marked: MARKED[g.category]
			};
		});

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 560);
	// the hero's cell: about 24px wide on a wide screen, 23 to a row on a phone
	const cols = $derived(narrow ? 23 : Math.round(w / 24));
	const PX = $derived(w / cols);
	const PY = $derived(PX * CELL_ASPECT);
	const inset = $derived({ x: PX * 0.06, y: PY * 0.1, w: PX * 0.88, h: PY * 0.8 });
	const cell = (/** @type {number} */ i) => ({
		x: (i % cols) * PX + inset.x,
		y: Math.floor(i / cols) * PY + inset.y
	});
</script>

<ChartFrame
	title="For every 708 people struck off, only one came back"
	dek="People struck off before the draft roll by the reason given, and those added back on the final roll, Karnataka"
	note="Each card represents {inr(
		UNIT
	)} people removed, while filled or outlined orange cards indicate 5,000 or a fraction."
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	<div bind:clientWidth={width} class="plot">
		{#each blocks as b, k (b.key)}
			<div class="block">
				<p class="name">
					<span><b>{lakh(b.dropped)}</b> {b.marked}</span>
					<span>{inr(b.back)} added back</span>
				</p>
				<svg
					width={w}
					height={Math.ceil(b.units / cols) * PY}
					role="img"
					aria-label="{inr(b.units)} cards, one for every {inr(
						UNIT
					)} people {b.marked}, of whom {inr(b.back)} came back"
				>
					{#if k === 0}
						<defs><symbol id="rw-card" viewBox="0 0 {CARD_W} {CARD_H}"><VoterCard /></symbol></defs>
					{/if}
					<g class="card-grey">
						{#each { length: b.units } as _, i (i)}
							{#if !b.whole.includes(i) && b.partial?.i !== i}
								{@const c = cell(i)}
								<use href="#rw-card" x={c.x} y={c.y} width={inset.w} height={inset.h} />
							{/if}
						{/each}
					</g>
					<g class="card-orange">
						{#each b.whole as i (i)}
							{@const c = cell(i)}
							<use href="#rw-card" x={c.x} y={c.y} width={inset.w} height={inset.h} />
						{/each}
					</g>
					{#if b.partial}
						{@const c = cell(b.partial.i)}
						<g class="card-part">
							<use href="#rw-card" x={c.x} y={c.y} width={inset.w} height={inset.h} />
						</g>
						<clipPath id="rw-part-{b.key}">
							<rect x={c.x} y={c.y - 1} width={inset.w * b.partial.f} height={inset.h + 2} />
						</clipPath>
						<g class="card-orange" clip-path="url(#rw-part-{b.key})">
							<use href="#rw-card" x={c.x} y={c.y} width={inset.w} height={inset.h} />
						</g>
					{/if}
				</svg>
			</div>
		{/each}
	</div>
</ChartFrame>

<style>
	/* about a third of DuplicateCards' size, so heavier strokes land near its ~1.2px phone strokes */
	svg {
		display: block;
		--card-line: 3.4px;
		--card-box-line: 2.6px;
	}
	.card-part {
		color: var(--story-orange);
		--card-fill: #fff;
		--card-bar: var(--d-w0);
	}
	.block + .block {
		margin-top: 22px;
	}
	.name {
		margin: 0 0 6px;
		max-width: none;
		color: var(--c-ink);
		font-size: 14px;
		line-height: 1.35;
	}
	.name span {
		display: block;
	}
	.name b {
		font-weight: 700;
	}
</style>
