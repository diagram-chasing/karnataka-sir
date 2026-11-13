<script>
	import ChartFrame from './ChartFrame.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import VoterCard, { CARD_W, CARD_H } from '$lib/components/VoterCard.svelte';
	import dup from '$data/duplicates.json';
	import { inr, pct } from './theme.js';

	const UNIT = 200;
	// Duplicates counted as the prose counts them: every entry for a person after their first, so the
	// person's own entry is never counted. dup.extraAdded of them were added in the revision.
	const blocks = [
		{ key: 'deleted', card: 'card-gone', label: 'Removed as duplicates', n: dup.deleted },
		{ key: 'added', card: 'card-orange', label: 'Added during the revision', n: dup.extraAdded },
		{ key: 'older', card: 'card-grey', label: 'Already on the roll', n: dup.extra - dup.extraAdded }
	];
	const ratio = Math.round(dup.extraAdded / dup.deleted);

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 560);
	const CW = $derived(narrow ? 34 : CARD_W);
	const CH = $derived(narrow ? 18 : CARD_H);
	const GX = $derived(narrow ? 4 : 7);
	const GY = $derived(narrow ? 4 : 7);
	const LABEL = 24;
	const GAP = 22;

	const layout = $derived.by(() => {
		const cols = Math.floor((w + GX) / (CW + GX));
		let y = 0;
		const out = blocks.map((b) => {
			const top = y;
			y += LABEL;
			const units = Math.max(1, Math.round(b.n / UNIT));
			const cards = [];
			for (let i = 0; i < units; i++) {
				cards.push({ x: (i % cols) * (CW + GX), y: y + Math.floor(i / cols) * (CH + GY) });
			}
			const rows = Math.ceil(units / cols);
			y += rows * (CH + GY) - GY;
			const o = { ...b, top, bottom: y, cards };
			y += GAP;
			return o;
		});
		return { blocks: out, h: y - GAP + 2 };
	});

	let hover = $state(null);
	const pick = (_, py) => layout.blocks.find((b) => py >= b.top && py <= b.bottom);
	const card = $derived.by(() => {
		if (!hover) return null;
		const b = hover.d;
		if (b.key === 'deleted')
			return { sub: 'During claims and objections', rows: [['Duplicates', inr(b.n)]] };
		return {
			sub: 'Duplicates on the final roll',
			rows: [
				['Duplicates', inr(b.n)],
				[`Share of the ${inr(dup.extra)}`, pct((100 * b.n) / dup.extra, 0)]
			]
		};
	});
</script>

<ChartFrame
	title="The revision added {ratio} duplicates for every one it removed"
	dek="Duplicate entries removed and added during the revision, Karnataka, final roll, October 2026"
	note="Each card is {UNIT} duplicates. A duplicate is a second or later entry for the same person in one booth: same name, relative's name, age and sex, and either the same house number or an entry added in the revision."
	source="Sources: CEO Karnataka; Diagram Chasing"
>
	<div bind:clientWidth={width} class="plot">
		<svg
			width={w}
			height={layout.h}
			role="img"
			aria-label="{inr(dup.deleted)} duplicates removed against {inr(
				dup.extraAdded
			)} added during the revision and {inr(
				dup.extra - dup.extraAdded
			)} already on the roll, one drawing per {UNIT} duplicates"
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			<defs>
				{#each blocks as b (b.key)}<symbol id="dc-{b.key}" viewBox="0 0 {CARD_W} {CARD_H}"
						><VoterCard blank={b.key === 'deleted'} /></symbol
					>{/each}
			</defs>
			{#each layout.blocks as b (b.key)}
				<g class={['block', b.card, { dim: hover && hover.d.key !== b.key }]}>
					<text class="name" x="0" y={b.top + 14}
						>{b.label} <tspan class="n">{inr(b.n)}</tspan></text
					>
					{#each b.cards as c, i (i)}
						<use href="#dc-{b.key}" x={c.x} y={c.y} width={CW} height={CH} />
					{/each}
				</g>
			{/each}
		</svg>
		{#if card}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={hover.d.label}
				sub={card.sub}
				rows={card.rows}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	.block {
		transition: opacity 120ms;
	}
	.block.dim {
		opacity: 0.35;
	}
	.name {
		fill: var(--c-ink);
		font-size: 14px;
	}
	.name .n {
		font-weight: 700;
	}
</style>
