<script>
	import { line } from 'd3';

	const DOCS = {
		d2002: {
			name: '2002 roll',
			what: 'Voters at the last intensive revision',
			by: 'Published by CEO Karnataka',
			when: '2002',
			lane: 1
		},
		jan25: {
			name: 'January 2025 roll',
			what: 'Voters before this revision began',
			by: 'Digitized by Mathakaavalu',
			when: 'January 2025',
			lane: 0
		},
		struck: {
			name: 'Struck-off list',
			what: '1.08 crore people removed before the draft',
			by: 'Digitized by Mathakaavalu and Edellu Karnataka',
			when: 'June to August 2026',
			lane: 0
		},
		notices: {
			name: 'Notice lists',
			what: 'People told to prove they are eligible',
			by: 'Digitized by Mathakaavalu and Edellu Karnataka',
			when: 'August to October 2026',
			lane: 1
		},
		final: {
			name: 'Final roll',
			what: 'Voters at the end of the revision',
			by: 'Digitized by Diagram Chasing',
			when: '27 October 2026',
			lane: 0.5
		}
	};
	const ORDER = /** @type {const} */ (['d2002', 'jan25', 'struck', 'notices', 'final']);
	// each match runs from the earlier document to the later one; `at` is where it enters the final roll
	/** @type {{ a: string, b: string, on: string, at?: number }[]} */
	const LINKS = [
		{ a: 'jan25', b: 'struck', on: 'the same voter ID' },
		{ a: 'd2002', b: 'notices', on: 'the same voter ID, name and age' },
		{
			a: 'struck',
			b: 'final',
			on: 'the same name, relative and age, in the same constituency',
			at: 0.25
		},
		{ a: 'notices', b: 'final', on: 'the same voter ID', at: 0.75 }
	];

	let width = $state(640);
	const narrow = $derived(width < 560);
	const GUTTER = 100;
	const GAP_X = 32;
	const CARD_H = 64;
	const ROW = CARD_H + 32;

	const pos = $derived.by(() => {
		const cw = (width - GUTTER - GAP_X) / 2;
		return Object.fromEntries(
			ORDER.map((k, i) => [k, { x: GUTTER + DOCS[k].lane * (cw + GAP_X), y: i * ROW, w: cw }])
		);
	});
	const H = (ORDER.length - 1) * ROW + CARD_H;

	const step = line();
	const links = $derived(
		LINKS.map((l) => {
			const a = pos[l.a];
			const b = pos[l.b];
			const sx = a.x + a.w / 2;
			const tx = l.at === undefined ? sx : b.x + b.w * l.at;
			const sy = a.y + CARD_H;
			const ty = b.y;
			const turn = ty - (ROW - CARD_H) / 2;
			/** @type {[number, number][]} */
			const pts =
				sx === tx
					? [
							[sx, sy],
							[tx, ty]
						]
					: [
							[sx, sy],
							[sx, turn],
							[tx, turn],
							[tx, ty]
						];
			// label width: the free space beside the line, up to the next lane or the edge
			const mw = DOCS[l.a].lane === 0 ? a.w / 2 + GAP_X - 16 : a.w / 2 - 12;
			return {
				...l,
				d: step(pts),
				lx: sx + 8,
				ly: sy + (turn > sy + 30 ? (turn - sy) / 2 : (ty - sy) / 2),
				mw
			};
		})
	);

	// phone layout: two columns, one per chain, then the final roll across both
	const CHAINS = [
		['jan25', 'struck'],
		['d2002', 'notices']
	];
	const COL_GAP = 12;
	// a row gap is as tall as the longer of its two match labels, plus air above and below
	const AIR = 14;
	const LINE_IN = 14;
	/** @type {Record<string, number>} */
	let heights = $state(Object.fromEntries(ORDER.map((k) => [k, 72])));
	/** label heights, keyed by the document each match starts from @type {Record<string, number>} */
	let labelH = $state(Object.fromEntries(LINKS.map((l) => [l.a, 30])));
	const npos = $derived.by(() => {
		const cw = (width - COL_GAP) / 2;
		/** @type {Record<string, { x: number, y: number, w: number }>} */
		const out = {};
		let y = 0;
		for (let r = 0; r < 2; r++) {
			CHAINS.forEach((chain, c) => (out[chain[r]] = { x: c * (cw + COL_GAP), y, w: cw }));
			y += Math.max(heights[CHAINS[0][r]], heights[CHAINS[1][r]]);
			y += Math.max(labelH[CHAINS[0][r]], labelH[CHAINS[1][r]]) + AIR * 2;
		}
		out.final = { x: 0, y, w: width };
		return out;
	});
	const NH = $derived(npos.final.y + heights.final);
	const nlinks = $derived(
		LINKS.map((l) => {
			const a = npos[l.a];
			const b = npos[l.b];
			const x = a.x + LINE_IN;
			const sy = a.y + heights[l.a];
			return {
				...l,
				d: step([
					[x, sy],
					[x, b.y]
				]),
				lx: x + 8,
				ly: sy + (b.y - sy) / 2,
				mw: a.w - LINE_IN - 8
			};
		})
	);
</script>

<figure
	class="trail"
	aria-label="The documents, in order. The struck-off list was matched with the January 2025 roll on voter ID, and with the final roll on name, relative and age. The notice lists were matched with the 2002 roll on voter ID, name and age, and with the final roll on voter ID."
>
	<div bind:clientWidth={width}>
		{#if narrow}
			<div class="trail-map narrow" style:height="{NH}px" aria-hidden="true">
				<svg {width} height={NH}>
					{#each nlinks as l (l.a + l.b)}
						<path d={l.d} />
					{/each}
				</svg>
				{#each ORDER as k (k)}
					{@const d = DOCS[k]}
					{@const p = npos[k]}
					<div
						class="trail-doc"
						style:left="{p.x}px"
						style:top="{p.y}px"
						style:width="{p.w}px"
						bind:clientHeight={heights[k]}
					>
						<span class="trail-name">{d.name}<span class="trail-when">, {d.when}</span></span>
						<span class="trail-what">{d.what}. <span class="trail-by">{d.by}.</span></span>
					</div>
				{/each}
				{#each nlinks as l (l.a + l.b)}
					<span
						class="trail-on"
						style:left="{l.lx}px"
						style:top="{l.ly}px"
						style:max-width="{l.mw}px"
						bind:clientHeight={labelH[l.a]}>matched on {l.on}</span
					>
				{/each}
			</div>
		{:else}
			<div class="trail-map" style:height="{H}px" aria-hidden="true">
				<svg {width} height={H}>
					{#each links as l (l.a + l.b)}
						<path d={l.d} />
					{/each}
				</svg>
				{#each ORDER as k (k)}
					{@const d = DOCS[k]}
					{@const p = pos[k]}
					<span class="trail-date" style:top="{p.y + 6}px" style:width="{GUTTER - 14}px"
						>{d.when}</span
					>
					<div
						class="trail-doc"
						style:left="{p.x}px"
						style:top="{p.y}px"
						style:width="{p.w}px"
						style:height="{CARD_H}px"
					>
						<span class="trail-name">{d.name}</span>
						<span class="trail-what">{d.what}. <span class="trail-by">{d.by}.</span></span>
					</div>
				{/each}
				{#each links as l (l.a + l.b)}
					<span
						class="trail-on"
						style:left="{l.lx}px"
						style:top="{l.ly}px"
						style:max-width="{l.mw}px">matched on {l.on}</span
					>
				{/each}
			</div>
		{/if}
	</div>
</figure>
