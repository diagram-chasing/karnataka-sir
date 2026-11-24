<script>
	// One image of a state's social kit: its card, its return rates, or one example page with the
	// count it stands for. Each is a chart frame, so the share page can lift the title, the line
	// under it and the source the way it does for the essay's charts.
	//
	//   item: 'card' | 'returns' | 'x:<finding or name-fault example id>:<example number>'
	import ChartFrame from '$charts/ChartFrame.svelte';
	import Exhibit from '$charts/Exhibit.svelte';
	import ReturnRates from '$charts/ReturnRates.svelte';
	import StateCard from '$lib/components/StateCard.svelte';
	import { lakh, inr } from '$charts/theme.js';
	import { FINDINGS } from '$data/states/findings.js';
	import { BY_SLUG, boundariesOf, chartsOf } from '$data/states/index.js';
	import { shown, worded } from '$data/states/show.js';

	/** @type {{ slug: string, item: string }} */
	let { slug, item } = $props();

	const region = /** @type {import('$data/states/findings.js').StateFile} */ (BY_SLUG.get(slug));
	const charts = chartsOf(slug);
	const bounds = boundariesOf(slug);
	const finalWhen = region.documents.final?.when ?? '';
	const [kind, key, nth] = item.split(':');

	// the removal counts come from the complete constituencies until the state's own are in
	const REMOVALS = ['struckOff', 'cameBack', 'deadCameBack'];
	const subset = region.findings.struckOff == null ? charts.findingsSubset : null;

	/** The count and wording behind an example: one of the twelve ledger counts, or a kind of name fault. */
	const about = (() => {
		if (kind !== 'x') return null;
		const f = FINDINGS.find((x) => x.key === key);
		if (f) {
			const sub = subset && REMOVALS.includes(key);
			const n = sub ? subset[key] : shown(key, region);
			const where = sub
				? `in ${subset.constituencies} of ${region.constituencies} constituencies in ${region.name}`
				: `on ${region.name}'s final roll of ${finalWhen}`;
			return { label: worded(f.label, region), n, where };
		}
		const k = charts.nameFaults?.kinds.find((/** @type {any} */ x) => x.example === key);
		return k
			? {
					label: k.kind,
					n: k.n,
					where: `on ${region.name}'s final roll of ${finalWhen}, counted by OCR`
				}
			: null;
	})();
	const example = kind === 'x' ? (charts.exhibits[key]?.[Number(nth ?? 0)] ?? []) : [];
	// the citations for this count's examples run in the same order as its pages
	const docs = (charts.examples ?? [])
		.filter((/** @type {any} */ e) => e.finding === key && e.checked)
		.flatMap((/** @type {any} */ e) => e.docs);
	const before = (charts.exhibits[key] ?? []).slice(0, Number(nth ?? 0)).flat().length;
	const cites = example
		.map((_, i) => docs[before + i])
		.filter(Boolean)
		.map(
			(/** @type {any} */ d) =>
				`${d.document}, ${d.constituency} part ${d.part}${d.page ? `, page ${d.page}` : ''}`
		);

	const per = charts.returns
		? Math.round(
				charts.returns.reduce((/** @type {number} */ s, /** @type {any} */ g) => s + g.dropped, 0) /
					Math.max(
						1,
						charts.returns.reduce((/** @type {number} */ s, /** @type {any} */ g) => s + g.back, 0)
					)
			)
		: 0;
</script>

{#if kind === 'card' && charts.funnel}
	<ChartFrame
		title="{region.name}: {lakh(
			charts.funnel.before - charts.funnel.final
		)} fewer voters after the revision"
		dek="{charts.funnel.beforeWhen} to {finalWhen}"
		source="Official totals: Chief Electoral Officer"
	>
		<StateCard state={region} funnel={charts.funnel} outline={bounds?.state} />
	</ChartFrame>
{:else if kind === 'returns' && charts.returns}
	<ReturnRates
		byReason={charts.returns}
		byAge={charts.returnAge}
		flat
		title="For every {inr(per)} people struck off, only one came back"
		dek="Share of voters struck off before the draft roll who are back on the final roll, {charts.subset
			? `${charts.subset} of ${region.constituencies} constituencies in ${region.name}`
			: region.name}"
		note=""
		source={region.credit ?? ''}
	/>
{:else if about && example.length}
	<ChartFrame
		title={about.label}
		dek="At least {lakh(about.n)} {about.where}"
		source={cites.join('. ') + (cites.length ? '.' : '')}
	>
		<div class="pages">
			{#each example as id (id)}
				<Exhibit {id} alt="" />
			{/each}
		</div>
	</ChartFrame>
{/if}

<style>
	.pages {
		display: grid;
		gap: 12px;
	}
</style>
