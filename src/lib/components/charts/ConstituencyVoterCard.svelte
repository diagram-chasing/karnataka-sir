<script>
	// One constituency printed as the roll's voter card. ConstituencyShare passes mark={false}.
	import markSrc from '$lib/assets/dc-mark.png?w=120&format=webp';
	import ConstituencyLocator from './ConstituencyLocator.svelte';
	import { stages, rollRows, sharePct } from './constituency-card.js';
	import { inr } from './theme.js';

	/** @type {{ c: import('$data/constituencies.js').Constituency, mark?: boolean }} */
	let { c, mark = true } = $props();
	const st = $derived(stages(c));
	const roll = $derived(rollRows(c));
</script>

<div class="vc">
	<div class="card" aria-label="{c.name}: how the revision treated it">
		<div class="who">
			<div class="fields">
				<span class="epic">AC {String(c.ac).padStart(3, '0')}</span>
				<dl>
					<div class="name-row">
						<dt>Name</dt>
						<dd class="name">{c.name}</dd>
					</div>
					<div>
						<dt>District</dt>
						<dd>{c.district}</dd>
					</div>
					<div>
						<dt>Voters</dt>
						<dd>{inr(c.electors)} <span class="mute">(final roll)</span></dd>
					</div>
				</dl>
			</div>
			<div class="photo"><ConstituencyLocator {c} /></div>
		</div>

		<div class="funnel">
			{#each st as s (s.key)}
				<div class="r" class:cut={s.cut}>
					<span class="l"
						>{s.label}{#if s.when}&nbsp;<span class="when">{s.when}</span>{/if}</span
					>
					<span class="bar" aria-hidden="true">
						<span class="typ" style:width="{s.typical}%"></span>
						<span class="seat" style:width="{Math.max(s.share, s.n ? 0.6 : 0)}%"></span>
					</span>
					<span class="n">
						{#if s.thin}<span class="dim">too few asked</span>{:else}{inr(s.n)}<span class="sh"
								>{s.key === 'before' ? '' : sharePct(s.share)}</span
							>{/if}
					</span>
				</div>
			{/each}
		</div>

		<dl class="roll">
			<div>
				<dt>Duplicate voters</dt>
				<dd>
					{roll.dup.text}&nbsp;per&nbsp;10,000
					<span class="dim">(typical&nbsp;{roll.dup.typical})</span>
				</dd>
			</div>
			<div>
				<dt>No valid address</dt>
				<dd>{roll.house0.text} <span class="dim">(typical&nbsp;{roll.house0.typical})</span></dd>
			</div>
		</dl>

		<p class="legend" aria-hidden="true">
			<span class="li"><span class="sw solid"></span>this constituency</span>
			<span class="li"><span class="sw outline"></span>a typical constituency</span>
		</p>

		<p class="foot">
			<span>Karnataka SIR Final Roll, as on 27-10-2026</span>
			{#if mark}<span class="dc"
					><img src={markSrc} alt="" width="120" height="120" decoding="async" /> diagramchasing.fun</span
				>{/if}
		</p>
	</div>
</div>

<style>
	.vc {
		container: vcard / inline-size;
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
		font-size: 0.8125rem;
		line-height: calc(5 * var(--u));
		font-variant-numeric: tabular-nums;
	}
	.who {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 5.5rem;
		column-gap: calc(4 * var(--u));
		align-items: start;
		padding-bottom: calc(3 * var(--u));
		border-bottom: 1px solid var(--hair);
	}
	dl {
		margin: 0;
		display: grid;
		row-gap: 0;
		max-width: none;
		width: auto;
	}
	dl > div {
		display: grid;
		grid-template-columns: 4.25rem minmax(0, 1fr);
		column-gap: calc(2 * var(--u));
		align-items: baseline;
	}
	.fields {
		display: grid;
		justify-items: start;
		row-gap: calc(2 * var(--u));
	}
	.fields dl {
		justify-self: stretch;
	}
	.name-row {
		margin-bottom: var(--u);
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
		font-size: 1.0625rem;
		font-weight: 700;
		letter-spacing: -0.012em;
		line-height: calc(6 * var(--u));
		text-transform: uppercase;
	}
	.epic {
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		letter-spacing: 0.04em;
		padding: 0 calc(1.5 * var(--u));
		line-height: calc(6 * var(--u));
		background: var(--d-w0);
	}
	.mute,
	.dim {
		color: var(--mute);
		font-weight: 400;
	}
	.photo {
		aspect-ratio: 3 / 4;
		border: 1px solid var(--line);
		overflow: hidden;
		background: #fff;
	}

	.funnel {
		display: grid;
		row-gap: var(--u);
		padding-top: calc(3 * var(--u));
	}
	.r {
		display: grid;
		grid-template-columns: 13.25rem minmax(0, 1fr) 6.75rem;
		column-gap: calc(3 * var(--u));
		align-items: center;
		min-height: calc(5 * var(--u));
		line-height: calc(5 * var(--u));
	}
	.l {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.when {
		font-size: 0.6875rem;
		color: var(--mute);
	}
	.bar {
		position: relative;
		display: block;
		height: calc(3 * var(--u));
	}
	.typ,
	.seat {
		position: absolute;
		left: 0;
		box-sizing: border-box;
		min-width: 1px;
	}
	.typ {
		top: 0;
		height: 100%;
		border: 1px solid rgb(43 43 43 / 0.55);
	}
	.seat {
		top: 2px;
		height: calc(100% - 4px);
		background: var(--ink);
	}
	.cut .seat {
		background: var(--story-orange);
	}
	.n {
		display: flex;
		justify-content: flex-end;
		gap: calc(1.5 * var(--u));
		text-align: right;
		white-space: nowrap;
		font-weight: 700;
	}
	.sh {
		display: inline-block;
		min-width: 2.75rem;
		font-weight: 400;
		color: var(--mute);
	}

	.roll {
		margin: calc(3 * var(--u)) 0 0;
		padding-top: calc(2 * var(--u));
		border-top: 1px solid var(--hair);
	}
	.roll > div {
		grid-template-columns: 13.25rem minmax(0, 1fr);
		column-gap: calc(3 * var(--u));
		line-height: calc(5 * var(--u));
	}
	.roll dd {
		font-weight: 700;
		white-space: nowrap;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0 calc(4.5 * var(--u));
		margin: calc(3 * var(--u)) 0 0;
		font-size: 0.6875rem;
		line-height: calc(4 * var(--u));
		color: var(--mute);
	}
	/* nowrap here, in the footer and on the AC number: the share image draws text a hair wider on some phones */
	.li {
		display: inline-flex;
		align-items: center;
		gap: calc(1.5 * var(--u));
		white-space: nowrap;
	}
	.sw {
		display: inline-block;
		width: calc(4 * var(--u));
		height: calc(2.5 * var(--u));
		box-sizing: border-box;
	}
	.sw.solid {
		background: var(--story-orange);
	}
	.sw.outline {
		border: 1px solid rgb(43 43 43 / 0.6);
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--u) calc(3 * var(--u));
		margin: calc(3 * var(--u)) 0 0;
		padding-top: calc(2 * var(--u));
		border-top: 1px solid var(--line);
		font-size: 0.6875rem;
		line-height: calc(4 * var(--u));
		color: var(--mute);
	}
	.foot > span {
		white-space: nowrap;
	}
	.dc {
		display: inline-flex;
		align-items: center;
		gap: calc(1.5 * var(--u));
		color: var(--ink);
		font-weight: 700;
	}
	.dc img {
		width: 0.95rem;
		height: 0.95rem;
		filter: grayscale(1);
	}

	/* a container query, not a media query, so the wide share-image copy keeps the full layout on a phone */
	@container vcard (max-width: 24rem) {
		.card {
			font-size: 0.75rem;
			padding: calc(2.5 * var(--u)) calc(3 * var(--u)) calc(2 * var(--u));
		}
		.who {
			grid-template-columns: minmax(0, 1fr) 4.5rem;
			column-gap: calc(3 * var(--u));
		}
		dl > div {
			grid-template-columns: 3.75rem minmax(0, 1fr);
		}
		.epic {
			font-size: 0.75rem;
			line-height: calc(5 * var(--u));
		}
		.name {
			font-size: 0.9375rem;
		}
		.r {
			grid-template-columns: 8.75rem minmax(0, 1fr) 5rem;
			column-gap: calc(2 * var(--u));
			font-size: 0.6875rem;
		}
		.roll > div {
			grid-template-columns: 8.75rem minmax(0, 1fr);
			column-gap: calc(2 * var(--u));
			font-size: 0.6875rem;
		}
		/* the value may take a second line here; "(typical …)" moves down whole */
		.roll dd {
			white-space: normal;
		}
		.sh {
			min-width: 2.25rem;
		}
		.when {
			display: none;
		}
	}
</style>
