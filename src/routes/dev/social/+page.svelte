<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { error } from '@sveltejs/kit';
	import { FORMATS, STILLS } from '$lib/social.js';
	import { story, CANONICAL_ORIGIN } from '$lib/site';
	import CardField, { grid, seeded, type Cell, type Rect } from '$lib/components/CardField.svelte';
	import { CLAIM } from '$lib/components/Hero.svelte';
	import logoSrc from '$lib/assets/dc-logo.png';
	import AcMap from '$charts/AcMap.svelte';
	import ConstituencyTable from '$charts/ConstituencyTable.svelte';
	import DuplicateCards from '$charts/DuplicateCards.svelte';
	import FindingsLedger from '$charts/FindingsLedger.svelte';
	import GarbledBooths from '$charts/GarbledBooths.svelte';
	import NameFaults from '$charts/NameFaults.svelte';
	import NoticeScatter from '$charts/NoticeScatter.svelte';
	import ReasonsTable from '$charts/ReasonsTable.svelte';
	import ReturnRates from '$charts/ReturnRates.svelte';
	import ReusedIds from '$charts/ReusedIds.svelte';
	import RollFunnel from '$charts/RollFunnel.svelte';
	import YourConstituency from '$charts/YourConstituency.svelte';

	let { data } = $props();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each chart has its own props
	type Chart = { C: any; props?: Record<string, unknown>; title?: string; padX?: number };
	const COMPONENTS: Record<string, Chart> = {
		ledger: { C: FindingsLedger, title: story.title },
		constituency: { C: YourConstituency },
		duplicates: { C: DuplicateCards },
		garbled: { C: GarbledBooths },
		names: { C: NameFaults },
		funnel: { C: RollFunnel },
		reasons: { C: ReasonsTable },
		reused: { C: ReusedIds },
		returns: { C: ReturnRates },
		// a callout and the inset label hang outside the map
		map: { C: AcMap, props: { metric: 'notice-rate' }, padX: 64 },
		scatter: { C: NoticeScatter },
		table: { C: ConstituencyTable }
	};

	type Frame = {
		id: string;
		w: number;
		h: number;
		safeY?: number;
		wide?: boolean;
		plain?: boolean;
		cover: { cell: number; orange: number };
	};
	const still = STILLS.find((s) => s.id === data.c);
	const F: Frame | undefined = still ?? FORMATS.find((f) => f.id === data.f);
	if (!F) error(404, `No share format "${data.f}"`);
	const chart = COMPONENTS[data.c];
	const isCover = !!still || data.c === 'cover';
	if (!isCover && !chart) error(404, `No share image for "${data.c}"`);
	const plain = !!F.plain;
	// a moment in the title card's animation; `pnpm social` steps through it for the GIF
	const ms = data.ms;
	const safeY = F.safeY ?? 0;

	// the studio's address, not the story's: short enough to type
	const url = new URL(CANONICAL_ORIGIN).host;
	// the title on two lines, as the hero sets it
	const cut = CLAIM.lastIndexOf(' ', CLAIM.indexOf(' is ') + 1);
	const claimTop = cut > 0 ? CLAIM.slice(0, cut) : CLAIM;
	const claimEnd = cut > 0 ? CLAIM.slice(cut + 1) : '';

	// --- the title card ---------------------------------------------------------------------------
	// The clearing is measured from the set type, then snapped to whole cards and centred.
	const cv = F.cover;
	const { cols, rows, px, py } = grid(F.w, F.h, cv.cell);

	let typeW = $state(0);
	let typeH = $state(0);
	// the leftover count on each axis must be even so the clearing can sit in the middle
	const span = (need: number, size: number, total: number) => {
		let n = Math.min(total, Math.ceil(need / size));
		if ((total - n) % 2) n += 1;
		return Math.min(total, n);
	};
	const clearing = $derived.by((): Rect => {
		if (plain) return [0, 0, 0, 0];
		const cw = span(typeW + 1.6 * px, px, cols);
		const ch = span(typeH + 2.2 * py, py, rows);
		return [(cols - cw) / 2, (rows - ch) / 2, cw, ch];
	});
	// orange cards placed by best-of-many seeded tries, away from each other and the clearing
	const orange = $derived.by((): Cell[] => {
		const rand = seeded(7);
		const [cl, ct, cw, ch] = clearing;
		const free = (x: number, y: number) =>
			x > 0 &&
			y > 0 &&
			x < cols - 1 &&
			y < rows - 1 &&
			(plain || !(x >= cl - 1 && x <= cl + cw && y >= ct - 1 && y <= ct + ch));
		// distances in px, so tall and wide frames spread alike
		const dist = (a: Cell, b: Cell) => Math.hypot((a[0] - b[0]) * px, (a[1] - b[1]) * py);
		const picked: Cell[] = [];
		for (let k = 0; k < cv.orange; k++) {
			let best: Cell | null = null;
			let bestD = -1;
			for (let t = 0; t < 60; t++) {
				const c: Cell = [Math.floor(rand() * cols), Math.floor(rand() * rows)];
				if (!free(...c)) continue;
				const edge =
					Math.min(c[0] * px, c[1] * py, (cols - 1 - c[0]) * px, (rows - 1 - c[1]) * py) * 2;
				const d = Math.min(edge, ...picked.map((p) => dist(p, c)));
				if (d > bestD) [best, bestD] = [c, d];
			}
			if (best) picked.push(best);
		}
		return picked;
	});
	const hole = $derived({
		l: clearing[0] * px,
		t: clearing[1] * py,
		w: clearing[2] * px,
		h: clearing[3] * py
	});

	// --- fitting a chart --------------------------------------------------------------------------
	// Try the chart at every width and keep the layout that covers the most of the stage.
	const WIDTHS = Array.from({ length: 31 }, (_, i) => 300 + i * 20);
	const MIN_S = 0.85; // below this the chart's own type gets too small

	let w = $state(520);
	let h = $state(0);
	let stageW = $state(0);
	let stageH = $state(0);
	let title = $state(chart?.title ?? '');
	let dek = $state('');
	let notes = $state<string[]>([]);
	let ready = $state(false);
	let fitEl = $state<HTMLElement>();
	const fit = (cw: number, ch: number) => Math.min(stageW / cw, ch ? stageH / ch : 1);
	const scale = $derived(fit(w, h));

	// charts redraw before reporting a new height: wait until it holds still for a few frames
	// timers, not animation frames: a background tab in headless Chrome may never paint
	const frame = () => new Promise((r) => setTimeout(r, 20));
	async function settle() {
		await tick();
		let last = -1;
		let still = 0;
		const t0 = performance.now();
		while (still < 4 || performance.now() - t0 < 80) {
			await frame();
			const now = fitEl?.offsetHeight ?? 0;
			still = now === last ? still + 1 : 0;
			last = now;
			if (performance.now() - t0 > 3000) break;
		}
		return last;
	}

	onMount(async () => {
		await document.fonts.ready;
		const imgs = [...document.querySelectorAll('.frame img')] as HTMLImageElement[];
		await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
		if (!chart) {
			// the clearing is sized from the type: let it measure, then redraw
			await settle();
			await frame();
			ready = true;
			return;
		}
		await settle();
		const f = document.querySelector('.frame .fit figure.chart')!;
		title = f.querySelector('.kicker')?.textContent?.trim() || chart.title || '';
		dek = f.querySelector('.dek')?.textContent?.trim() ?? '';
		notes = [...f.querySelectorAll(':scope > footer p')].map((p) => p.textContent!.trim());
		await settle();
		let best = { score: -1, w: 520 };
		for (const cand of WIDTHS) {
			w = cand;
			const ch = await settle();
			const s = fit(cand, ch);
			// a layout that has to shrink its type below MIN_S loses out, but can still win when
			// nothing else fits (a tall map in a wide frame)
			const small = s < MIN_S ? (s / MIN_S) ** 2 : 1;
			const score = ((cand * s) / stageW) * ((ch * s) / stageH) * small;
			if (score > best.score + 0.01) best = { score, w: cand };
		}
		w = best.w;
		await settle();
		ready = true;
	});
</script>

<svelte:head><title>Share image · {data.c}</title></svelte:head>

<div
	class={['frame', `f-${F.id}`, { ready, wide: F.wide, cover: isCover }]}
	style:width="{F.w}px"
	style:height="{F.h}px"
	style:--safe-y="{safeY}px"
	data-format={F.id}
	data-chart={data.c}
>
	{#if isCover}
		<CardField w={F.w} h={F.h} cell={cv.cell} clear={plain ? null : clearing} back={orange} {ms} />
		{#if !plain}
			<div
				class="clearing"
				style:left="{hole.l}px"
				style:top="{hole.t}px"
				style:width="{hole.w}px"
				style:height="{hole.h}px"
			>
				<div class="type" bind:clientWidth={typeW} bind:clientHeight={typeH}>
					<img class="logo" src={logoSrc} alt="Diagram Chasing" />
					<h1>{claimTop}<br />{claimEnd} <span class="q">(?)</span></h1>
				</div>
			</div>
		{/if}
	{:else}
		<div class="sheet">
			<header class="head">
				<h2>{title}</h2>
				{#if dek}<p>{dek}</p>{/if}
			</header>
			<div class="stage" bind:clientWidth={stageW} bind:clientHeight={stageH}>
				<div class="box" style:width="{w * scale}px" style:height="{h * scale}px">
					<div
						class="fit"
						bind:this={fitEl}
						bind:clientHeight={h}
						style:width="{w}px"
						style:padding-inline="{chart.padX ?? 0}px"
						style:transform="scale({scale})"
					>
						<chart.C {...chart.props ?? {}} />
					</div>
				</div>
			</div>
			<footer class="foot">
				{#each notes as n, k (k)}<p>{n}</p>{/each}
			</footer>
			<div class="brand">
				<img class="logo" src={logoSrc} alt="Diagram Chasing" />
				<p class="url">{url}</p>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(html:has(.frame)) {
		overflow: hidden;
	}
	/* the frame covers the page around it; light theme whatever the system says */
	.frame {
		position: fixed;
		left: 0;
		top: 0;
		z-index: 99999;
		box-sizing: border-box;
		overflow: hidden;
		background: #fff;
		color: #1a1a1a;
		--background: oklch(1 0 0);
		--foreground: oklch(0.145 0 0);
		--muted-foreground: oklch(0.45 0 0);
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
	}
	.frame :global(*) {
		box-sizing: border-box;
	}
	.logo {
		display: block;
		width: auto;
	}

	/* --- the title card ---------------------------------------------------------------------- */
	.clearing {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.type {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: max-content;
		white-space: nowrap;
	}
	.cover .logo {
		height: 30px;
		margin-bottom: 20px;
	}
	.cover h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 52px;
		line-height: 0.95;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}
	.cover .q {
		color: var(--story-orange);
	}
	.f-og h1,
	.f-thumb h1 {
		font-size: 70px;
	}
	.f-og .logo,
	.f-thumb .logo {
		height: 40px;
		margin-bottom: 26px;
	}
	.f-story h1 {
		font-size: 52px;
	}
	.f-wide h1 {
		font-size: 46px;
	}
	.f-wide .logo {
		height: 26px;
		margin-bottom: 16px;
	}

	/* --- a chart ----------------------------------------------------------------------------- */
	.sheet {
		width: 100%;
		height: 100%;
		padding: calc(var(--safe-y) + 24px) 22px calc(var(--safe-y) + 16px);
		display: grid;
		grid-template: 'head' auto 'stage' minmax(0, 1fr) 'foot' auto 'brand' auto / minmax(0, 1fr);
		row-gap: 12px;
	}
	.wide .sheet {
		padding: 22px 22px 16px;
		grid-template:
			'head stage' minmax(0, 1fr)
			'foot stage' auto
			'brand brand' auto / 230px minmax(0, 1fr);
		column-gap: 22px;
	}
	.head {
		grid-area: head;
	}
	.head h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 23px;
		line-height: 1.2;
		letter-spacing: -0.015em;
		text-wrap: balance;
	}
	.head p {
		margin: 7px 0 0;
		max-width: none;
		font-size: 14px;
		line-height: 1.4;
		color: #4a4a4a;
		text-wrap: pretty;
	}
	.f-story .head h2 {
		font-size: 27px;
	}
	.f-story .head p {
		font-size: 15.5px;
	}
	.wide .head h2 {
		font-size: 22px;
	}
	.wide .head p {
		font-size: 13.5px;
		margin-top: 9px;
	}
	.stage {
		grid-area: stage;
		position: relative;
		min-width: 0;
		min-height: 0;
	}
	.foot {
		grid-area: foot;
	}
	.foot p {
		margin: 0;
		max-width: none;
		font-size: 10.5px;
		line-height: 1.45;
		color: #777;
		text-wrap: pretty;
	}
	.brand {
		grid-area: brand;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 2px;
	}
	.brand .logo {
		height: 20px;
	}
	.url {
		margin: 0;
		max-width: none;
		font-size: 13px;
		font-weight: 700;
		line-height: 1.3;
		color: #4a4a4a;
	}

	/* out of flow, so its size never changes the space it is fitted to */
	.box {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	.fit {
		transform-origin: 0 0;
	}
	.fit :global(figure.chart) {
		margin: 0;
	}
	/* the frame sets the title, subtitle, note and source itself, at one size on every image */
	.fit :global(.kicker),
	.fit :global(.dek),
	.fit :global(figure.chart > footer) {
		display: none;
	}
	.fit :global(figure.chart > header) {
		margin-bottom: 0;
	}
	.fit :global(.toolbar) {
		margin: 0 0 0.7rem;
	}
	/* a still image has nothing to press */
	.fit :global(.toolbar .controls),
	.fit :global(button.more) {
		display: none;
	}
</style>
