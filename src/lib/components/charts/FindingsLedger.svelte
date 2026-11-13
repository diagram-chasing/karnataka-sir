<script>
	import ChartFrame from './ChartFrame.svelte';
	import { lakh } from './theme.js';
	import {
		STRUCK_OFF,
		CAME_BACK_ROUNDED,
		DEAD_CAME_BACK,
		DUPLICATE_PEOPLE,
		GARBLED_NAMES,
		REUSED_IDS,
		NO_HOUSE_NUMBER
	} from '$data/totals.js';

	const HALVES = [
		{
			head: 'No ineligible person is included',
			rows: [
				['People on the roll more than once in their own booth', DUPLICATE_PEOPLE],
				['Voter IDs on the roll in two constituencies', 461],
				['House numbers with 100 or more voters', 381],
				['Voters with no real house number', NO_HOUSE_NUMBER],
				['Names printed as symbols', GARBLED_NAMES],
				["Pairs of voters who are each other's father", 296]
			]
		},
		{
			head: 'No eligible citizen is left out',
			rows: [
				['Voters struck off before the draft roll', STRUCK_OFF],
				['Of those, back on the final roll', CAME_BACK_ROUNDED],
				['Told they are not on the 2002 roll, though they are', 3115],
				['Struck off after a notice under the nine-month rule', 4954],
				['Marked dead, and back on the final roll', DEAD_CAME_BACK],
				["New voters holding a removed voter's ID", REUSED_IDS]
			]
		}
	];
</script>

<ChartFrame source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing">
	<div class="halves">
		{#each HALVES as h (h.head)}
			<table class="grid">
				<thead>
					<tr>
						<th>{h.head}</th>
						<th>Count</th>
					</tr>
				</thead>
				<tbody>
					{#each h.rows as [what, n] (what)}
						<tr>
							<td>{what}</td>
							<td class="dim">{lakh(n)}</td>
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
