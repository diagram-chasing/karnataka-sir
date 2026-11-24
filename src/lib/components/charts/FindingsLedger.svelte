<script>
	import ChartFrame from './ChartFrame.svelte';
	import { lakh } from './theme.js';
	import { FINDINGS } from '$data/states/findings.js';
	import { BY_SLUG, ESSAY } from '$data/states/index.js';
	import { shown, worded } from '$data/states/show.js';

	/** @type {{ state?: import('$data/states/findings.js').StateFile }} */
	let { state = /** @type {any} */ (BY_SLUG.get(ESSAY)) } = $props();

	const HEADS = { 1: 'No ineligible person is included', 2: 'No eligible citizen is left out' };
	const halves = $derived(
		/** @type {const} */ ([1, 2]).map((half) => ({
			head: HEADS[half],
			rows: FINDINGS.filter((f) => f.half === half).map((f) => ({
				what: worded(f.label, state),
				n: shown(f.key, state)
			}))
		}))
	);
</script>

<ChartFrame source={state.credit ?? ''}>
	<div class="halves">
		{#each halves as h (h.head)}
			<table class="grid">
				<thead>
					<tr>
						<th>{h.head}</th>
						<th>Count</th>
					</tr>
				</thead>
				<tbody>
					{#each h.rows as r (r.what)}
						<tr>
							<td>{r.what}</td>
							<td class="dim">{r.n == null ? '–' : lakh(r.n)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/each}
	</div>
</ChartFrame>

<style>
	.halves {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem 1.5rem;
		align-items: start;
	}
	th:last-child,
	td:last-child {
		width: 6.25rem;
	}
	td:first-child {
		padding-top: 5px;
		padding-bottom: 5px;
	}
	@media (max-width: 640px) {
		.halves {
			grid-template-columns: 1fr;
		}
	}
</style>
