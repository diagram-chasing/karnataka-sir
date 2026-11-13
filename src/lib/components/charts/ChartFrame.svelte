<script>
	/** @type {{ title?: string, dek?: string, source?: string, note?: string, titleLines?: number, children: import('svelte').Snippet, controls?: import('svelte').Snippet, legend?: import('svelte').Snippet }} */
	let {
		title = '',
		dek = '',
		source = '',
		note = '',
		titleLines = 0,
		children,
		controls,
		legend
	} = $props();
</script>

<figure class="chart">
	<header>
		{#if title}<p class="kicker" style:min-height={titleLines ? `${titleLines * 1.3}em` : null}>
				{title}
			</p>{/if}
		{#if dek}<p class="dek" style:min-height={titleLines ? '3em' : null}>{dek}</p>{/if}
		{#if controls || legend}
			<div class="toolbar">
				{#if controls}<div class="controls">{@render controls()}</div>{/if}
				{#if legend}<div class="legend">{@render legend()}</div>{/if}
			</div>
		{/if}
	</header>
	<div class="body">{@render children()}</div>
	{#if note || source}
		<footer>
			{#if note}<p>{note}</p>{/if}
			{#if source}<p>{source}</p>{/if}
		</footer>
	{/if}
</figure>

<style>
	.chart {
		--c-ink: var(--foreground);
		--c-text: color-mix(in oklch, var(--foreground) 78%, var(--background));
		--c-mute: color-mix(in oklch, var(--foreground) 52%, var(--background));
		--c-grid: color-mix(in oklch, var(--foreground) 10%, var(--background));
		--c-panel: color-mix(in oklch, var(--foreground) 5%, var(--background));
		--c-bg: var(--background);
		--c-outline: var(--primary);
		margin: calc(var(--baseline-1, 1.5rem) * 2) 0;
		color: var(--c-ink);
		font-family: var(--font-sans, system-ui, sans-serif);
		font-variant-numeric: tabular-nums;
	}
	header {
		margin-bottom: calc(0.75 * var(--leading, 1.5rem));
	}
	.kicker {
		font-weight: 700;
		font-size: 1.25rem;
		line-height: 1.25;
		margin: 0;
		max-width: 34rem;
		letter-spacing: -0.012em;
		text-wrap: balance;
	}
	.dek {
		font-size: 1rem;
		line-height: 1.5;
		margin: 0.375rem 0 0;
		color: var(--c-text);
		max-width: 36rem;
		text-wrap: pretty;
	}
	.toolbar {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: calc(0.6 * var(--leading, 1.5rem));
		margin-top: calc(0.6 * var(--leading, 1.5rem));
	}
	/* full width, so a search field's max-width: 100% holds on a 320px phone */
	.controls {
		align-self: stretch;
	}
	footer {
		margin-top: calc(0.5 * var(--leading, 1.5rem));
		font-size: var(--text-micro, 0.75rem);
		line-height: 1.45;
		color: var(--c-mute);
	}
	footer p {
		margin: 0;
		text-wrap: pretty;
		font-size: var(--text-micro, 0.75rem);
		line-height: 1.45;
		color: var(--c-mute);
		max-width: none;
	}
	footer p + p {
		margin-top: 0.1rem;
	}

	.chart :global(.lbl) {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0;
		color: var(--c-ink);
	}
	.body :global(.plot) {
		position: relative;
	}
	.body :global(.plot > svg) {
		display: block;
		overflow: visible;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-variant-numeric: tabular-nums;
	}

	.chart :global(div.seg) {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: 3px;
		border-radius: var(--ui-r);
		background: var(--ui-track);
		box-shadow: var(--ui-track-inset);
	}
	.chart :global(div.seg button),
	.chart :global(.more) {
		padding: 0.45rem 0.85rem;
		border: 0;
		border-radius: var(--ui-r-key);
		background: none;
		color: var(--c-text);
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0;
		line-height: 1.2;
		cursor: pointer;
		transition:
			background-color 120ms ease-out,
			color 120ms ease-out,
			box-shadow 120ms ease-out;
	}
	.chart :global(div.seg button:hover) {
		color: var(--c-ink);
	}
	.chart :global(div.seg button[aria-pressed='true']) {
		background: var(--c-bg);
		color: var(--c-ink);
		box-shadow: var(--shadow-sheet);
	}
	.chart :global(.more) {
		display: block;
		width: max-content;
		margin: calc(0.6 * var(--leading, 1.5rem)) auto 0;
		border-radius: var(--ui-r);
		background: var(--ui-track);
		color: var(--c-ink);
	}
	.chart :global(.more:hover) {
		background: var(--ui-track-hover);
	}
	.chart :global(:is(div.seg button, .more):active) {
		transform: translateY(0.5px);
	}
	.chart :global(input) {
		box-sizing: border-box;
		width: 21rem;
		max-width: 100%;
		padding: 0.55rem 0.85rem;
		border: 0;
		border-radius: var(--ui-r);
		background: var(--ui-track);
		box-shadow: var(--ui-track-inset);
		color: var(--c-ink);
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.9375rem;
		transition:
			background-color 120ms ease-out,
			box-shadow 120ms ease-out;
	}
	.chart :global(input::placeholder) {
		color: var(--c-mute);
	}
	/* the browser's own clear button is replaced by a Lucide one (.clear) */
	.chart :global(input[type='search']::-webkit-search-cancel-button) {
		-webkit-appearance: none;
		appearance: none;
		display: none;
	}
	.chart :global(.field) {
		position: relative;
		width: 21rem;
		max-width: 100%;
	}
	.chart :global(.field input) {
		width: 100%;
		padding-right: 2.25rem;
	}
	.chart :global(.clear) {
		position: absolute;
		top: 50%;
		right: 0.4rem;
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: var(--ui-r-key);
		background: none;
		color: var(--c-mute);
		cursor: pointer;
		transform: translateY(-50%);
		transition: color 120ms ease-out;
	}
	.chart :global(.clear:hover) {
		color: var(--c-ink);
	}
	.chart :global(.clear:focus-visible) {
		outline: 2px solid var(--story-orange);
		outline-offset: 1px;
	}
	.chart :global(input:focus) {
		outline: none;
		background: var(--c-bg);
		box-shadow: var(--ui-focus);
	}
	.chart :global(:is(div.seg button, .more):focus-visible) {
		outline: 2px solid var(--story-orange);
		outline-offset: 2px;
	}

	.chart .body :global(table.grid) {
		display: table;
		width: 100%;
		max-width: none;
		margin: 0;
		border: 0;
		overflow: visible;
		border-collapse: separate;
		border-spacing: 2px 2px;
		font-size: 14px;
		line-height: 1.15;
		background: transparent;
	}
	.chart .body :global(table.grid th) {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0;
		line-height: 1.2;
		color: var(--c-ink);
		text-align: right;
		vertical-align: bottom;
		padding: 0 6px 4px;
		border: 0;
		border-bottom: 2px solid var(--c-ink);
		background: transparent;
		white-space: normal;
	}
	.chart .body :global(table.grid th:first-child) {
		text-align: left;
		padding-left: 0;
	}
	.chart .body :global(table.grid td) {
		padding: 3px 6px;
		border: 0;
		vertical-align: middle;
		text-align: right;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 14px;
		font-variant-numeric: tabular-nums;
		color: var(--c-ink);
		white-space: nowrap;
		background: transparent;
	}
	.chart .body :global(table.grid td:first-child) {
		text-align: left;
		padding-left: 0;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 14px;
		white-space: normal;
	}
	.chart .body :global(table.grid tr),
	.chart .body :global(table.grid :where(tr:nth-child(2n)) td) {
		background: transparent;
	}
	.chart .body :global(table.grid tbody tr:hover td:is(.f0, .f1, .f2, .f3, .dim)) {
		box-shadow: inset 0 0 0 2px var(--c-ink);
	}
	.chart .body :global(table.grid .nm) {
		display: inline;
		font-weight: 700;
	}
	.chart .body :global(table.grid .sub) {
		display: inline;
		font-size: 12px;
		color: var(--c-text);
	}
	.chart .body :global(table.grid .sub::before) {
		content: ' ';
	}
	.chart .body :global(table.grid .sub.mono) {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 12px;
	}
	.chart .body :global(table.grid td.dim) {
		background: var(--c-panel);
	}
	.chart .body :global(table.grid td.na) {
		color: var(--c-text);
	}
	.chart .body :global(table.grid td.f0) {
		background: var(--d-w0);
		color: #111;
	}
	.chart .body :global(table.grid td.f1) {
		background: var(--d-w1);
		color: #111;
	}
	.chart .body :global(table.grid td.f2) {
		background: var(--d-w3);
		color: #fff;
	}
	.chart .body :global(table.grid td.f3) {
		background: var(--d-w4);
		color: #fff;
		font-weight: 700;
	}

	@media (max-width: 640px) {
		.chart :global(div.seg button) {
			flex: 1 1 auto;
		}
		.kicker {
			font-size: 1.1rem;
		}
		.dek {
			font-size: 0.95rem;
		}
	}
</style>
