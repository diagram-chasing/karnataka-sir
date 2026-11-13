<script module lang="ts">
	import { story, CANONICAL_ORIGIN } from '$lib/site';

	/** The title without its question mark, which the hero and the title card set apart in orange. */
	export const CLAIM = story.title.replace(/\s*\(\?\)\s*$/, '');

	type Cell = [col: number, row: number];
	type Rect = [col: number, row: number, cols: number, rows: number];

	/** A band of exactly `n` cards around a bottom-centre clearing; odd column count for a true centre. */
	function band(n: number, vw: number, cw: number, ch: number, aspect: number) {
		const side0 = (vw - cw) / 2;
		const px0 = Math.sqrt((vw * (ch + side0) - cw * ch) / (n * aspect));
		const c0 = Math.floor(vw / px0);
		let best: { score: number; cols: number; rows: number; ccols: number; crows: number } | null =
			null;
		for (let cols = c0 - 3; cols <= c0 + 3; cols++) {
			if (cols % 2 === 0) continue;
			const px = vw / cols;
			const py = px * aspect;
			for (let ccols = 3; ccols < cols - 1; ccols += 2) {
				for (let crows = Math.ceil(ch / py) - 2; crows <= Math.ceil(ch / py) + 4; crows++) {
					const rows = (n + ccols * crows) / cols;
					if (!Number.isInteger(rows) || rows <= crows) continue;
					const side = ((cols - ccols) / 2) * px;
					const top = (rows - crows) * py;
					const score =
						Math.abs(side - top) + Math.abs(ccols * px - cw) + Math.abs(crows * py - ch) * 2;
					if (!best || score < best.score) best = { score, cols, rows, ccols, crows };
				}
			}
		}
		if (!best) throw new Error(`no exact band for ${n} cards`);
		const { cols, rows, ccols, crows } = best;
		const px = vw / cols;
		const left = (cols - ccols) / 2;
		const r0 = rows - crows;
		const mid = Math.floor(left / 2);
		const back: Cell[] = [
			[mid, r0 + Math.floor(crows / 2)],
			[(cols - 1) / 2, Math.floor(r0 / 2)],
			[cols - 1 - mid, r0 + Math.floor(crows / 2)]
		];
		const rects: Rect[] = [
			[0, 0, cols, r0],
			[0, r0, left, crows],
			[left + ccols, r0, left, crows]
		];
		return {
			cols,
			rows,
			px,
			py: px * aspect,
			rects,
			back,
			clear: [left, r0, ccols, crows] as Rect
		};
	}

	/** Phone: `n` cards as one block, last row centred. `cols` must leave a same-parity remainder. */
	function block(n: number, cols: number, vw: number, aspect: number) {
		const px = vw / cols;
		const full = Math.floor(n / cols);
		const tail = n - full * cols;
		const rows = full + (tail ? 1 : 0);
		const rects: Rect[] = [[0, 0, cols, full]];
		if (tail) rects.push([(cols - tail) / 2, full, tail, 1]);
		const mid = Math.floor(cols / 4);
		const back: Cell[] = [
			[mid, Math.round(full * 0.62)],
			[(cols - 1) / 2, Math.round(full * 0.22)],
			[cols - 1 - mid, Math.round(full * 0.62)]
		];
		return { cols, rows, px, py: px * aspect, rects, back, clear: null };
	}
</script>

<script lang="ts">
	// The opening screen: one voter card per 5,000 people struck off before the draft roll.
	import Byline from '$lib/components/Byline.svelte';
	import VoterCard, { CARD_W, CARD_H, CELL_ASPECT } from '$lib/components/VoterCard.svelte';
	import { STRUCK_OFF, CAME_BACK } from '$data/totals.js';
	import { inr } from '$charts/theme.js';
	// 480px WebP
	import logoSrc from '$lib/assets/dc-logo.png?w=480&format=webp';

	const PER = 5000;
	const n = Math.round(STRUCK_OFF / PER);

	const LAYOUTS = [
		{ cls: 'wide', f: band(n, 1440, 780, 400, CELL_ASPECT) },
		{ cls: 'narrow', f: block(n, 23, 400, CELL_ASPECT) }
	];

	const inset = (px: number, py: number) => ({
		x: px * 0.06,
		y: py * 0.1,
		w: px * 0.88,
		h: py * 0.8
	});

	const wide = LAYOUTS[0].f;
	const [cl, ct, cw, ch] = wide.clear!;
	const vars = [
		`--wide-ar: ${wide.cols * wide.px} / ${wide.rows * wide.py}`,
		`--narrow-ar: ${LAYOUTS[1].f.cols * LAYOUTS[1].f.px} / ${LAYOUTS[1].f.rows * LAYOUTS[1].f.py}`,
		`--l: ${(cl / wide.cols) * 100}%`,
		`--t: ${(ct / wide.rows) * 100}%`,
		`--w: ${(cw / wide.cols) * 100}%`,
		`--h: ${(ch / wide.rows) * 100}%`
	].join('; ');
</script>

<header class="hero">
	<svg class="defs" aria-hidden="true">
		<symbol id="hero-card" viewBox="0 0 {CARD_W} {CARD_H}"><VoterCard /></symbol>
	</svg>

	<div class="stage" style={vars}>
		{#each LAYOUTS as { cls, f } (cls)}
			{@const c = inset(f.px, f.py)}
			<svg
				class="field {cls}"
				viewBox="0 0 {f.cols * f.px} {f.rows * f.py}"
				role="img"
				aria-label="{inr(n)} voter cards, one for every {inr(PER)} of the {inr(
					STRUCK_OFF
				)} people struck off before the draft roll. Three, in orange, are the {inr(
					CAME_BACK
				)} who came back."
			>
				<defs>
					<pattern
						id="cards-{cls}"
						class="card-grey"
						width={f.px}
						height={f.py}
						patternUnits="userSpaceOnUse"
					>
						<use href="#hero-card" x={c.x} y={c.y} width={c.w} height={c.h} />
					</pattern>
				</defs>
				{#each f.rects as [x, y, w, h], i (i)}
					<rect
						x={x * f.px}
						y={y * f.py}
						width={w * f.px}
						height={h * f.py}
						fill="url(#cards-{cls})"
					/>
				{/each}
				{#each f.back as [x, y], i (i)}
					<use
						href="#hero-card"
						class="card-orange"
						x={x * f.px + c.x}
						y={y * f.py + c.y}
						width={c.w}
						height={c.h}
					/>
				{/each}
			</svg>
		{/each}
		<div class="clearing">
			<div class="panel">
				<a class="logo" href={CANONICAL_ORIGIN} aria-label="Diagram Chasing — home">
					<img src={logoSrc} alt="Diagram Chasing" width="1000" height="328" fetchpriority="high" />
				</a>
				<h1>{CLAIM} <span class="q">(?)</span></h1>
				<p class="dek">{story.description}</p>
				<Byline />
			</div>
		</div>
	</div>

	<p class="key">
		<span class="item"
			><svg class="swatch card-grey" aria-hidden="true"><use href="#hero-card" /></svg>
			{inr(PER)} people removed from the voter list</span
		>
		<span class="item"
			><svg class="swatch card-orange" aria-hidden="true"><use href="#hero-card" /></svg>
			{inr(PER)} added back</span
		>
	</p>
</header>

<style>
	.hero {
		padding: 1rem 0 clamp(1.5rem, 5vh, 3rem);
		background: var(--background);
		color: var(--foreground);
	}
	.defs {
		position: absolute;
		width: 0;
		height: 0;
	}
	.stage {
		position: relative;
		width: min(100vw - 2rem, 96rem);
		margin: 0 auto;
		aspect-ratio: var(--wide-ar);
		container-type: inline-size;
	}
	.field {
		display: block;
		width: 100%;
		height: 100%;
	}
	.narrow {
		display: none;
	}

	.clearing {
		position: absolute;
		left: var(--l);
		top: var(--t);
		width: var(--w);
		height: var(--h);
		display: grid;
		place-items: center;
		padding: 0 1.5cqw;
		box-sizing: border-box;
	}
	.panel {
		text-align: center;
	}
	.logo {
		display: inline-block;
		margin-bottom: calc(0.75 * var(--leading));
	}
	.logo img {
		display: block;
		height: clamp(1.75rem, 2.6cqw, 2.5rem);
		width: auto;
	}
	h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(2.75rem, 5.2cqw, 6rem);
		line-height: 0.94;
		letter-spacing: -0.012em;
		text-wrap: balance;
	}
	.q {
		color: var(--story-orange);
	}
	.dek {
		max-width: 34rem;
		margin: calc(0.75 * var(--leading)) auto 0;
		font-size: min(
			var(--text-1),
			1.3125rem
		); /* the clearing is a fixed box: hold the dek to three lines */
		line-height: 1.35;
		color: color-mix(in oklch, var(--foreground) 78%, var(--background));
		text-wrap: balance;
	}
	.panel :global(.byline) {
		margin: calc(0.75 * var(--leading)) 0 0;
		font-size: var(--text-caption);
		color: var(--muted-foreground);
	}
	.panel :global(.byline a) {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: color-mix(in oklab, currentColor 45%, transparent);
		text-underline-offset: 3px;
	}

	.key {
		margin: 1rem 0 0;
		padding: 0 var(--gutter);
		text-align: center;
		text-wrap: balance;
		font-size: var(--text-micro);
		line-height: 1.5;
		color: var(--muted-foreground);
	}
	.item {
		white-space: nowrap;
	}
	.item + .item {
		margin-left: 1.25em;
	}
	.swatch {
		display: inline-block;
		width: 1.5rem;
		height: 0.8rem;
		margin: 0 0.1em;
		vertical-align: -0.12em;
		overflow: visible;
	}

	@media (max-width: 56em) {
		.wide {
			display: none;
		}
		.narrow {
			display: block;
		}
		.stage {
			display: flex;
			flex-direction: column;
			width: calc(100vw - 1.5rem);
			aspect-ratio: auto;
		}
		.narrow {
			height: auto;
			aspect-ratio: var(--narrow-ar);
		}
		.clearing {
			position: static;
			order: -1;
			width: auto;
			height: auto;
			padding: clamp(2rem, 7vh, 3.5rem) 0.5rem 2rem;
		}
		h1 {
			font-size: clamp(3.25rem, 1.8rem + 5.6vw, 6.5rem);
		}
	}
</style>
