<script>
	// A state printed as the roll's voter card: who was on the roll, who was removed before the
	// draft and why, and who is on it now. The constituency card's design, one level up.
	import { geoMercator } from 'd3';
	import markSrc from '$lib/assets/dc-mark.png?w=120&format=webp';
	import { unpack, compactPath } from '$charts/geo.js';
	import { lakh, pct } from '$charts/theme.js';

	/**
	 * @type {{
	 *   state: import('$data/states/findings.js').StateFile,
	 *   funnel: { before: number, kept: number, final?: number, beforeWhen?: string, reasons: [string, number][] },
	 *   outline?: any
	 * }}
	 */
	let { state: region, funnel, outline = null } = $props();

	/** How the removals lists word each reason, as ReturnWall has them. */
	const MARKED = /** @type {Record<string, string>} */ ({
		shifted: 'Marked permanently shifted',
		absent: 'Marked absent',
		dead: 'Marked dead',
		duplicate: 'Marked already enrolled elsewhere'
	});

	const finalWhen = $derived(region.documents.final?.when?.replace(/^\d+ /, '') ?? '');
	const rows = $derived.by(() => {
		const of = (/** @type {number} */ n) => (100 * n) / funnel.before;
		const removed = funnel.before - funnel.kept;
		return [
			{
				key: 'before',
				label: 'Voters before the revision',
				when: funnel.beforeWhen ?? '',
				n: funnel.before,
				cut: false,
				sub: false
			},
			{
				key: 'removed',
				label: 'Struck off before the draft roll',
				when: '',
				n: removed,
				cut: true,
				sub: false
			},
			...funnel.reasons.map(([k, n]) => ({
				key: k,
				label: MARKED[k] ?? `Marked ${k.toLowerCase()}`,
				when: '',
				n,
				cut: true,
				sub: true
			})),
			...(funnel.final
				? [
						{
							key: 'kept',
							label: 'Kept in the draft roll',
							when: '',
							n: funnel.kept,
							cut: false,
							sub: false
						},
						{
							key: 'added',
							label: 'Added during claims and objections, minus deletions',
							when: '',
							n: funnel.final - funnel.kept,
							cut: false,
							sub: true
						},
						{
							key: 'after',
							label: 'Voters after the revision',
							when: finalWhen,
							n: funnel.final,
							cut: false,
							sub: false
						}
					]
				: [])
		].map((r) => ({ ...r, share: of(r.n) }));
	});

	/** the final roll's date as the constituency card prints it: dd-mm-yyyy */
	const asOnDmy = $derived(
		region.finalRollDate ? region.finalRollDate.split('-').reverse().join('-') : ''
	);

	const W = 90;
	const H = 120;
	const shape = $derived.by(() => {
		if (!outline) return '';
		const geo = unpack(outline);
		const proj = geoMercator().fitExtent(
			[
				[4, 4],
				[W - 4, H - 4]
			],
			geo
		);
		return compactPath(proj)(geo);
	});
</script>

<div class="vc">
	<div class="card" aria-label="{region.name}: the revision in numbers">
		<div class="who">
			<div class="fields">
				<dl>
					<div class="name-row">
						<dt>Name</dt>
						<dd class="name">{region.name}</dd>
					</div>
					<div>
						<dt>Seats</dt>
						<dd>{region.constituencies} <span class="mute">assembly constituencies</span></dd>
					</div>
					{#if funnel.final}
						<div>
							<dt>Voters</dt>
							<dd>{lakh(funnel.final)} <span class="mute">(final roll)</span></dd>
						</div>
						<div>
							<dt>Change</dt>
							<dd>
								{lakh(funnel.before - funnel.final)} fewer
								<span class="mute"
									>({pct((100 * (funnel.before - funnel.final)) / funnel.before, 1)})</span
								>{#if funnel.beforeWhen}{' '}<span class="mute nowrap"
										>since {funnel.beforeWhen}</span
									>{/if}
							</dd>
						</div>
					{/if}
				</dl>
			</div>
			{#if shape}
				<div class="photo">
					<svg viewBox="0 0 {W} {H}" role="img" aria-label="Outline of {region.name}">
						<path d={shape} />
					</svg>
				</div>
			{/if}
		</div>

		<div class="funnel">
			{#each rows as r (r.key)}
				<div class="r" class:cut={r.cut} class:sub={r.sub}>
					<span class="l"
						>{r.label}{#if r.when}&nbsp;<span class="when">{r.when}</span>{/if}</span
					>
					<span class="bar" aria-hidden="true">
						<span class="seat" style:--s={Math.max(r.share, 0.6)}></span>
					</span>
					<span class="n">{lakh(r.n)}</span>
					<span class="sh">{r.key === 'before' ? '' : pct(r.share, 1)}</span>
				</div>
			{/each}
		</div>

		<p class="foot">
			<span
				>{region.name} SIR Final Roll{asOnDmy ? `, as on ${asOnDmy}` : ''}. Totals from the Chief
				Electoral Officer. Shares are of the roll before the revision.</span
			>
			<span class="dc"
				><img src={markSrc} alt="" width="120" height="120" decoding="async" /> diagramchasing.fun</span
			>
		</p>
	</div>
</div>

<style>
	.vc {
		container: scard / inline-size;
	}
	.card {
		--ink: #1a1a1a;
		--line: rgb(43 43 43 / 0.7);
		--hair: rgb(43 43 43 / 0.22);
		--mute: rgb(43 43 43 / 0.6);
		--u: 4px;
		box-sizing: border-box;
		width: 100%;
		padding: calc(3 * var(--u)) calc(4 * var(--u)) calc(2.5 * var(--u));
		background: #fff;
		border: 1.4px solid var(--line);
		color: var(--ink);
		font-family: var(--font-sans);
		font-size: var(--text-caption);
		line-height: calc(5 * var(--u));
		font-variant-numeric: tabular-nums;
	}
	.who {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 4.5rem;
		column-gap: calc(4 * var(--u));
		align-items: start;
		padding-bottom: calc(3 * var(--u));
		border-bottom: 1px solid var(--hair);
	}
	.fields {
		display: grid;
		justify-items: start;
		row-gap: calc(2 * var(--u));
	}
	dl {
		margin: 0;
		display: grid;
		justify-self: stretch;
	}
	dl > div {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr);
		column-gap: calc(2 * var(--u));
		align-items: baseline;
	}
	dt {
		color: var(--mute);
		white-space: nowrap;
	}
	dt::after {
		content: ' :';
	}
	dd {
		margin: 0;
		min-width: 0;
	}
	.name {
		font-size: var(--text-body);
		font-weight: 700;
		letter-spacing: -0.012em;
		line-height: calc(6 * var(--u));
		text-transform: uppercase;
	}
	.mute {
		color: var(--mute);
	}
	.nowrap {
		white-space: nowrap;
	}
	.photo {
		aspect-ratio: 3 / 4;
		border: 1px solid var(--line);
		background: #fff;
	}
	.photo svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.photo path {
		fill: var(--d-w0);
		stroke: var(--ink);
		stroke-width: 0.75;
		stroke-linejoin: round;
	}

	.funnel {
		display: grid;
		row-gap: var(--u);
		padding-top: calc(3 * var(--u));
	}
	.r {
		display: grid;
		grid-template-columns: 16.5rem minmax(0, 1fr) 5.25rem 2.75rem;
		column-gap: calc(3 * var(--u));
		align-items: center;
		min-height: calc(5 * var(--u));
	}
	/* a label that wraps does so in balanced lines, never leaving one word alone */
	.l {
		text-wrap: balance;
	}
	.sub .l {
		padding-left: calc(3 * var(--u));
	}
	.when {
		font-size: var(--text-micro);
		color: var(--mute);
	}
	.bar {
		position: relative;
		display: block;
		height: calc(3 * var(--u));
	}
	.sub .bar {
		height: calc(2 * var(--u));
	}
	/* every bar on one scale: its share of the roll before the revision */
	.seat {
		position: absolute;
		inset: 0 auto 0 0;
		width: calc(var(--s) * 1%);
		min-width: 1px;
		background: var(--ink);
	}
	.cut .seat {
		background: var(--story-orange);
	}
	.sub .seat {
		background: var(--d-w1);
	}
	/* an addition, not a removal: grey, never orange */
	.sub:not(.cut) .seat {
		background: rgb(43 43 43 / 0.45);
	}
	.n {
		text-align: right;
		white-space: nowrap;
		font-weight: 700;
	}
	.sub .n {
		font-weight: 400;
	}
	.sh {
		text-align: right;
		white-space: nowrap;
		font-weight: 400;
		color: var(--mute);
	}
	.when {
		white-space: nowrap;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0 calc(3 * var(--u));
		margin: calc(3 * var(--u)) 0 0;
		padding-top: calc(2 * var(--u));
		border-top: 1px solid var(--hair);
		font-size: var(--text-micro);
		line-height: calc(4 * var(--u));
		color: var(--mute);
	}
	.dc {
		display: inline-flex;
		align-items: center;
		gap: var(--u);
	}
	.dc img {
		width: 0.875rem;
		height: 0.875rem;
	}

	/* the narrowest phones: the outline gives its width to the fields, so the name stays on a line */
	@container scard (max-width: 19rem) {
		.card .who {
			grid-template-columns: minmax(0, 1fr);
		}
		.photo {
			display: none;
		}
	}
	/* phone: the label has the card's full width on its own line, so it never breaks mid-phrase;
	   under it the bar, the figure and the share, so every figure and every share sit in a column */
	/* Phone: each row is the label with its value and share on one line, in fixed columns, and
	   the bar under them across the card's width, so every value ends on one edge and every bar
	   starts on one edge and is drawn to one scale. A reason is indented, label and bar both; its
	   bar is still drawn against the card's full width, so it compares with the totals. Rows sit
	   on one rhythm. */
	@container scard (max-width: 30rem) {
		.funnel {
			row-gap: calc(2 * var(--u));
		}
		.r {
			grid-template-columns: minmax(0, 1fr) auto 2.75rem;
			column-gap: calc(2 * var(--u));
			row-gap: var(--u);
			align-items: baseline;
		}
		.l {
			grid-column: 1;
			grid-row: 1;
		}
		.n {
			grid-column: 2;
			grid-row: 1;
		}
		.sh {
			grid-column: 3;
			grid-row: 1;
		}
		.bar {
			grid-column: 1 / -1;
			grid-row: 2;
		}
		.sub {
			padding-left: calc(3 * var(--u));
		}
		.sub .l {
			padding-left: 0;
		}
		.sub .seat {
			width: calc((100% + 3 * var(--u)) * var(--s) / 100);
		}

		.who {
			grid-template-columns: minmax(0, 1fr) 3.75rem;
		}
	}
</style>
