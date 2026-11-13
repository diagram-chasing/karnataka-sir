<script>
	import ChartFrame from './ChartFrame.svelte';
	import reasons from '$data/reasons.json';
	import { inr, lakh, pct, heat } from './theme.js';

	const rows = reasons
		.filter((d) => d.notices > 1000)
		.map((d) => ({ ...d, rate: (100 * d.struck_q) / d.notices }));
	const PLAIN = {
		'Unmapped with Last SIR': 'Not found on the 2002 roll',
		'Self Name Mismatch': 'Name differs from the 2002 entry',
		'Parent Age Difference <15': 'Parent under 15 years older',
		'Parent Name Mismatch': "Parent's name differs from 2002",
		'Grandparent Age difference <40': 'Grandparent under 40 years older',
		'Progeny Age Gap <9 Month': 'Sibling born within 9 months',
		'Parent Age difference >50': 'Parent over 50 years older',
		'Progeny >= 6': '6 or more children of one parent'
	};
	const STEPS = [0.8, 1.1, 1.5, 2];
</script>

<ChartFrame
	title="The nine-month rule was the most likely to get a voter struck off"
	dek="Notices of voter disqualification in Karnataka between August and October 2026, categorized by reason"
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing"
>
	<table class="grid">
		<thead>
			<tr>
				<th>Reason on the notice</th>
				<th>Notices</th>
				<th>Struck off</th>
				<th class="count">Voters</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as r (r.reason)}
				<tr>
					<td
						><span class="nm">{PLAIN[r.reason] ?? r.reason}</span><span class="sub mono"
							>{r.reason}</span
						></td
					>
					<td>{lakh(r.notices)}</td>
					<td class={heat(r.rate, STEPS)}>{pct(r.rate)}</td>
					<td class="dim count">{inr(r.struck_q)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</ChartFrame>

<style>
	:global(.chart .body table.grid) td .sub.mono {
		display: block;
		margin: 1px 0 0;
	}
	:global(.chart .body table.grid) td .sub.mono::before {
		content: none;
	}
	th,
	td {
		width: 16%;
	}
	th:first-child,
	td:first-child {
		width: auto;
	}
	@media (max-width: 560px) {
		.count {
			display: none;
		}
		th,
		td {
			width: 22%;
		}
	}
</style>
