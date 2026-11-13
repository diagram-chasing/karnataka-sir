<script>
	import ChartFrame from './ChartFrame.svelte';
	import rows from '$data/reused_ids.json';

	const REASONS = [
		{ key: 'dead', label: 'Dead' },
		{ key: 'absent', label: 'Absent' },
		{ key: 'shifted', label: 'Shifted' },
		{ key: 'duplicate', label: 'Duplicate' }
	]
		.map((r) => ({ ...r, n: rows.filter((d) => d.why === r.key).length }))
		.filter((r) => r.n);
	const FIRST = 10;

	let active = $state('dead');
	let showAll = $state(false);
	const group = $derived(rows.filter((d) => d.why === active));
	const visible = $derived(showAll ? group : group.slice(0, FIRST));
	const reason = $derived(REASONS.find((r) => r.key === active));

	function pick(key) {
		active = key;
		showAll = false;
	}
</script>

<ChartFrame
	title="{rows.length} new voters in Dasarahalli were given a voter ID that belonged to someone else"
	dek="Voter IDs held by two different people, by how the earlier holder was struck off, Dasarahalli constituency, January 2025 roll and final roll of October 2026"
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	{#snippet controls()}
		<div class="seg" role="group" aria-label="How the earlier holder was struck off">
			{#each REASONS as r (r.key)}
				<button type="button" aria-pressed={active === r.key} onclick={() => pick(r.key)}
					>{r.label} {r.n}</button
				>
			{/each}
		</div>
	{/snippet}
	<table class="pairs grid">
		<thead>
			<tr>
				<th>Voter ID</th>
				<th>Marked {reason.label.toLowerCase()}, on the roll in January 2025</th>
				<th>New voter, added by October 2026</th>
			</tr>
		</thead>
		<tbody>
			{#each visible as r, i (i)}
				<tr>
					<td class="f0" aria-label="{r.pre}, three digits hidden, {r.id}"
						>{r.pre}<span class="hid"></span>{r.id}</td
					>
					<td class="dim">{r.was}</td>
					<td class="dim">{r.now}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if group.length > FIRST}
		<button type="button" class="more" onclick={() => (showAll = !showAll)}>
			{showAll ? `Show the first ${FIRST}` : `Show all ${group.length}`}
		</button>
	{/if}
</ChartFrame>

<style>
	:global(.chart .body table.grid.pairs) th,
	:global(.chart .body table.grid.pairs) td {
		text-align: left;
		padding-left: 8px;
		width: 36%;
	}
	:global(.chart .body table.grid.pairs) th:first-child,
	:global(.chart .body table.grid.pairs) td:first-child {
		width: 28%;
		padding-left: 8px;
		white-space: nowrap;
	}
	/* the IDs are codes, so they keep the monospace; their heading doesn't */
	:global(.chart .body table.grid.pairs) td:first-child {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-weight: 700;
	}
	:global(.chart .body table.grid.pairs) td {
		font-family: var(--font-sans, system-ui, sans-serif);
		padding-top: 5px;
		padding-bottom: 5px;
	}
	.hid {
		display: inline-block;
		width: 1.7em;
		height: 0.72em;
		margin: 0 0.15em;
		background: color-mix(in oklab, #111 38%, var(--d-w0));
	}
</style>
