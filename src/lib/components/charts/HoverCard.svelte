<script>
	/** @type {{ x: number, y: number, w: number, title: string, sub?: string, rows?: (string | number)[][] }} */
	let { x, y, w, title, sub = '', rows = [] } = $props();
	const GAP = 12;
	let cw = $state(0);
	const left = $derived.by(() => {
		const right = x + GAP;
		const leftSide = x - GAP - cw;
		const [first, second] = x > w * 0.6 ? [leftSide, right] : [right, leftSide];
		if (first >= 0 && first + cw <= w) return first;
		if (second >= 0 && second + cw <= w) return second;
		return Math.max(0, Math.min(w - cw, x - cw / 2));
	});
</script>

<div
	class="card"
	bind:offsetWidth={cw}
	style:left="{left}px"
	style:top="{y}px"
	style:visibility={cw ? null : 'hidden'}
	role="status"
>
	<div class="title">{title}</div>
	{#if sub}<div class="sub">{sub}</div>{/if}
	{#if rows.length}
		<table>
			<tbody>
				{#each rows as r, i (i)}
					<tr
						>{#each r as c, j (j)}<td>{c}</td>{/each}</tr
					>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.card {
		position: absolute;
		z-index: 2;
		pointer-events: none;
		transform: translateY(12px);
		width: max-content;
		min-width: 9rem;
		max-width: 14rem;
		padding: 7px 10px 8px;
		background: var(--c-bg, #fff);
		color: var(--c-ink, #111);
		border-radius: var(--ui-r-sheet, 6px);
		border: 0;
		box-shadow: var(--shadow-print);
		font-family: var(--font-sans, system-ui, sans-serif);
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		line-height: 1.25;
	}
	.title {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.sub {
		font-size: 12px;
		color: var(--c-text, #444);
		margin-top: 1px;
	}
	.card table {
		width: 100%;
		margin: 6px 0 0;
		border: 0;
		border-collapse: collapse;
		border-spacing: 0;
		font-size: 13px;
		line-height: 1.2;
		background: transparent;
	}
	.card tr,
	.card tbody tr:nth-child(2n),
	.card tbody tr:nth-child(2n) td,
	.card tbody tr:hover,
	.card tbody tr:hover td {
		background: transparent !important;
	}
	.card td {
		padding: 3px 0 3px 10px;
		border: 0;
		text-align: right;
		white-space: nowrap;
		vertical-align: baseline;
		background: transparent;
		color: var(--c-ink, #111);
	}
	.card tr > :first-child {
		text-align: left;
		padding-left: 0;
		white-space: nowrap;
		padding-right: 4px;
	}
	.card td {
		border-bottom: 1px solid var(--c-grid, #e6e6e6);
	}
	.card tbody tr:last-child td {
		border-bottom: 0;
		padding-bottom: 0;
	}
</style>
