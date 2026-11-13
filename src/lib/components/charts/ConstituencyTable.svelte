<script>
	import { ArrowDown, ArrowUp, X } from '@lucide/svelte';
	import ChartFrame from './ChartFrame.svelte';
	import { CONSTITUENCIES as rows } from '$data/constituencies.js';
	import { pct, signedPct, heat } from './theme.js';

	const COLS = [
		{
			key: 'change',
			label: 'Voters since Jan 2025',
			short: 'Since 2025',
			fmt: (v) => signedPct(v, 0),
			bad: (v) => -v,
			steps: [5, 15, 25, 35],
			dir: 1
		},
		{
			key: 'noticePct',
			label: 'Sent a notice',
			short: 'Notices',
			fmt: (v) => (v < 1 ? pct(v, 2) : pct(v, 0)),
			bad: (v) => v,
			steps: [1, 3, 10, 30],
			dir: -1
		},
		{
			key: 'struckPct',
			label: 'Struck off after a notice',
			short: 'Struck off',
			fmt: (v) => pct(v),
			bad: (v) => v,
			steps: [1, 2, 5, 8],
			dir: -1
		},
		{
			key: 'dupPer10k',
			label: 'Duplicate cards per 10,000',
			fmt: (v) => v.toFixed(0),
			bad: (v) => v,
			steps: [2, 5, 10, 20],
			dir: -1,
			hideNarrow: true
		},
		{
			key: 'house0Pct',
			label: 'No house number',
			fmt: (v) => pct(v, 0),
			bad: (v) => v,
			steps: [5, 10, 20, 30],
			dir: -1,
			hideNarrow: true
		}
	];

	let sortKey = $state('change');
	let sortDir = $state(1);
	let query = $state('');
	/** @type {HTMLInputElement | undefined} */
	let field = $state();
	let showAll = $state(false);
	let width = $state(900);
	const narrow = $derived(width < 720);

	function setSort(key) {
		if (sortKey === key) sortDir = -sortDir;
		else {
			sortKey = key;
			sortDir = COLS.find((c) => c.key === key)?.dir ?? -1;
		}
	}
	const visible = $derived.by(() => {
		const q = query.trim().toLowerCase();
		let r = rows.filter(
			(d) => !q || d.name.toLowerCase().includes(q) || d.district.toLowerCase().includes(q)
		);
		r = [...r].sort((a, b) => {
			const av = a[sortKey],
				bv = b[sortKey];
			if (av == null) return 1;
			if (bv == null) return -1;
			return sortDir * (av - bv);
		});
		return showAll || q ? r : r.slice(0, 10);
	});
	const sortLabel = $derived(COLS.find((c) => c.key === sortKey)?.label ?? '');
</script>

<ChartFrame
	title="The ten constituencies that lost the most voters are all in Bengaluru"
	dek="Breakdown of voter notices and disqualifications by assembly constituencies in Karnataka, January 2025 to October 2026"
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	{#snippet controls()}
		<div class="field">
			<input
				type="search"
				placeholder="Search for a constituency or district"
				bind:value={query}
				bind:this={field}
				aria-label="Search constituencies"
			/>
			{#if query}
				<button
					type="button"
					class="clear"
					aria-label="Clear search"
					onclick={() => {
						query = '';
						field?.focus();
					}}><X size={16} strokeWidth={2.25} aria-hidden="true" /></button
				>
			{/if}
		</div>
	{/snippet}
	{#snippet legend()}
		<span class="lbl">Sorted by {sortLabel}</span>
	{/snippet}
	<div class="scroller" bind:clientWidth={width}>
		<table class="grid">
			<thead>
				<tr>
					<th>Constituency</th>
					{#each COLS as c (c.key)}
						<th
							class={{ 'narrow-hide': c.hideNarrow }}
							aria-sort={sortKey === c.key ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'}
						>
							<button
								type="button"
								onclick={() => setSort(c.key)}
								class={{ active: sortKey === c.key }}
							>
								{narrow ? (c.short ?? c.label) : c.label}{#if sortKey === c.key}<span
										class="arrow"
										aria-hidden="true"
										>{#if sortDir === 1}<ArrowUp size={12} strokeWidth={2.25} />{:else}<ArrowDown
												size={12}
												strokeWidth={2.25}
											/>{/if}</span
									>{/if}
							</button>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each visible as r (r.ac)}
					<tr>
						<td>
							<span class="nm">{r.name}</span>
							<span class="sub">{r.district}{r.zeroIneligible ? ' · 0 found ineligible' : ''}</span>
						</td>
						{#each COLS as c (c.key)}
							{@const v = r[c.key]}
							{#if v == null}
								<td class={['na', { 'narrow-hide': c.hideNarrow }]}>–</td>
							{:else}
								<td class={[heat(c.bad(v), c.steps), { 'narrow-hide': c.hideNarrow }]}
									>{c.fmt(v)}</td
								>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if !query}
		<button type="button" class="more" onclick={() => (showAll = !showAll)}>
			{showAll ? 'Show the top 10' : `Show all ${rows.length} constituencies`}
		</button>
	{/if}
</ChartFrame>

<style>
	.scroller {
		overflow-x: auto;
	}
	th button {
		all: unset;
		cursor: pointer;
		display: inline-block;
		max-width: 7.5rem;
		line-height: 1.2;
		white-space: normal;
		text-align: inherit;
	}
	th button:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.arrow {
		display: inline-flex;
		margin-left: 0.15em;
		vertical-align: -0.1em;
	}
	td:first-child {
		width: 13rem;
	}
	@media (max-width: 720px) {
		.narrow-hide {
			display: none;
		}
		td:first-child {
			width: 8rem;
		}
		/* doubled classes: ChartFrame styles the grid at .chart .body table.grid, and Svelte scoping adds no weight */
		.scroller.scroller td:first-child .sub.sub {
			display: block;
		}
	}
	@media (max-width: 359px) {
		.scroller.scroller table.grid tr > td,
		.scroller.scroller table.grid tr > th {
			padding-left: 4px;
			padding-right: 4px;
			font-size: 13px;
		}
		.scroller.scroller table.grid tr > td:first-child {
			width: auto;
			padding-left: 0;
			font-size: 13px;
		}
	}
</style>
