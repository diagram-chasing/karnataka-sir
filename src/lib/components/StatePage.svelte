<script>
	import logoSrc from '$lib/assets/dc-logo.png?w=480&format=webp';
	import StateCard from '$lib/components/StateCard.svelte';
	import StateNav from '$lib/components/StateNav.svelte';
	import StoryCard from '$lib/components/StoryCard.svelte';
	import ConstituencyTable from '$charts/ConstituencyTable.svelte';
	import Finding from '$lib/components/Finding.svelte';
	import ReturnRates from '$charts/ReturnRates.svelte';
	import ReturnWall from '$charts/ReturnWall.svelte';
	import RollFunnel from '$charts/RollFunnel.svelte';
	import AgeGenderGap from '$charts/AgeGenderGap.svelte';
	import GenderReasons from '$charts/GenderReasons.svelte';
	import SexRatioShift from '$charts/SexRatioShift.svelte';
	import RemovalsVsAdditions from '$charts/RemovalsVsAdditions.svelte';
	import LossVsMargin from '$charts/LossVsMargin.svelte';
	import TransgenderScatter from '$charts/TransgenderScatter.svelte';
	import DisqualificationSpread from '$charts/DisqualificationSpread.svelte';
	import DisqualifiedGender from '$charts/DisqualifiedGender.svelte';
	import NameFaults from '$charts/NameFaults.svelte';
	import DuplicateCards from '$charts/DuplicateCards.svelte';
	import ReusedIds from '$charts/ReusedIds.svelte';
	import StateMap from '$charts/StateMap.svelte';
	import YourConstituency from '$charts/YourConstituency.svelte';
	import { stripsFor } from '$charts/your-constituency.js';
	import { inr, lakh, pct } from '$charts/theme.js';
	import { CANONICAL_ORIGIN } from '$lib/site';
	import { DOCUMENTS, FINDINGS } from '$data/states/findings.js';
	import { boundariesOf, chartsOf, constituenciesOf } from '$data/states/index.js';
	import { shown, worded, labelOf } from '$data/states/show.js';

	/** @type {{ state: import('$data/states/findings.js').StateFile }} */
	let { state: region } = $props(); // not `state`: that name would shadow the $state rune
	const charts = $derived(chartsOf(region.slug));
	const bounds = $derived(boundariesOf(region.slug));
	const list = $derived(constituenciesOf(region.slug));

	/** @typedef {{ document: string, constituency: string, part: number, page: number | null, where?: string, url: string }} Cite */
	/**
	 * The pages a count's example sits on, for examples checked against the printed page.
	 * @param {string} key @returns {Cite[]}
	 */
	const citesFor = (key) =>
		(charts.examples ?? [])
			.filter((/** @type {any} */ e) => e.finding === key && e.checked)
			.flatMap((/** @type {any} */ e) => e.docs);

	/**
	 * A count's examples, each a list of drawn pages with the citation for each. The citations come
	 * in the same order as the pages, example after example.
	 * @param {string[][]} shots @param {Cite[]} docs
	 */
	const examplesFor = (shots, docs) => {
		let k = 0;
		return shots.map((ids) => ids.map((id) => ({ id, doc: docs[k++] })));
	};

	/**
	 * The removals by reason, from the lists the struck-off count is made from, so the chart beside
	 * that count adds up to it (the card's funnel uses the official totals, which differ).
	 */
	const struckFunnel = $derived.by(() => {
		if (!charts.funnel) return null;
		const { before, kept, reasons } = charts.funnel;
		return { before, kept, reasons, struck: before - kept };
	});
	/**
	 * The chart or table set beside a count, after its example pages, as the essay pairs them: the
	 * removals by reason beside those struck off (drawn from the same lists as the count, so its
	 * total is the count's own), the returns by reason and age beside those who came back, the duplicate cards beside the
	 * duplicates (once the count added back is known), the table of the most crowded houses beside
	 * the crowded houses, the table of reused IDs beside the reused IDs. (The essay's wall of the
	 * returns, beside those who came back, draws one card for 5,000 people and runs to thousands of
	 * cards for a state this size; it waits for a unit of its own.)
	 */
	// people per card on the wall of returns: the smallest round unit that keeps it near Karnataka's
	// two thousand cards
	const wallUnit = (() => {
		const all = (charts.returns ?? []).reduce(
			(/** @type {number} */ t, /** @type {any} */ g) => t + g.dropped,
			0
		);
		return [5000, 10000, 15000, 20000, 25000, 50000].find((u) => all / u <= 2200) ?? 50000;
	})();
	const detailOf = (/** @type {string} */ key) =>
		key === 'crowdedHouses' && charts.crowded
			? 'crowded'
			: key === 'struckOff' && struckFunnel
				? 'funnel'
				: key === 'cameBack' && charts.returns
					? 'wall'
					: key === 'deadCameBack' && charts.returns && charts.returnAge
						? 'returns'
						: key === 'duplicatesInBooth' && charts.duplicates?.extraAdded != null
							? 'duplicates'
							: key === 'reusedIds' && charts.reusedIds
								? 'reused'
								: null;
	// Removals are counted from the lists. Until every list for the state is in, the three counts
	// that rest on them come from the constituencies that are complete, and the section says so:
	// a count on one base is never set beside a count on another.
	const REMOVAL_KEYS = ['struckOff', 'cameBack', 'deadCameBack'];
	const onSubset = $derived(region.findings.struckOff == null && !!charts.findingsSubset);
	const count = (/** @type {string} */ key) =>
		onSubset && REMOVAL_KEYS.includes(key)
			? key === 'cameBack' && charts.findingsSubset[key] != null
				? Math.round(charts.findingsSubset[key] / 100) * 100 // a name match, quoted to the hundred as in show.js
				: (charts.findingsSubset[key] ?? null)
			: REMOVAL_KEYS.includes(key) && region.findings.struckOff == null
				? null
				: shown(key, region);

	/** A count's label: the ledger's own, with the rule or the base added where a count needs it to be read right. */
	const rowLabel = (/** @type {(typeof FINDINGS)[number]} */ f) => {
		const label = labelOf(f, region);
		if (!onSubset || !REMOVAL_KEYS.includes(f.key)) return label;
		const n = charts.findingsSubset.constituencies;
		return f.key === 'struckOff'
			? `${label}, in ${n} of ${region.constituencies} constituencies`
			: `${label}, in the same ${n}`;
	};

	/**
	 * @typedef {{ key: string, what: string, n: number | null, docs: Cite[], shots: string[][], detail: string | null }} Item
	 */
	/** @param {1 | 2} half @returns {Item[]} */
	const itemsOf = (half) =>
		FINDINGS.filter((f) => f.half === half).map((f) => {
			const n = count(f.key);
			return {
				key: f.key,
				what: rowLabel(f),
				n,
				docs: citesFor(f.key),
				detail: n == null ? null : detailOf(f.key),
				shots: n == null ? [] : (charts.exhibits[f.key] ?? [])
			};
		});

	// Who was removed, by age and gender: each chart's finding as a figure and a sentence, read off
	// the same data the chart draws, so the two cannot disagree. A chart's own headline is the
	// sentence beside it, and its note keeps only what neither says.
	const demo = $derived(charts.demographics ?? {});
	const demoItems = $derived.by(() => {
		const pc = (/** @type {number} */ v, d = 0) => pct(v, d);
		const out = [];
		const ag = demo.ageGender;
		if (ag) {
			const peak = ag.bands.reduce((/** @type {any} */ a, /** @type {any} */ b) =>
				b.f_pct / b.m_pct > a.f_pct / a.m_pct ? b : a
			);
			out.push({
				key: 'ageGender',
				fig: `${(peak.f_pct / peak.m_pct).toFixed(1)}×`,
				what: `Women aged ${peak.band} were removed at ${(peak.f_pct / peak.m_pct).toFixed(1)} times the rate of men`,
				note: (ag.note.match(/Removals list ages[^.]*\./) ??
					ag.note.match(/Age is from[^.]*\./) ?? [''])[0]
			});
		}
		const gr = demo.genderReasons;
		const shifted = gr?.under35?.find((/** @type {any} */ r) => r.category === 'shifted');
		if (shifted) {
			out.push({
				key: 'genderReasons',
				fig: pc(shifted.f_pct),
				what: `of women under 35 were marked shifted, against ${pc(shifted.m_pct, 1)} of men`,
				note: (gr.note.match(/Removals list ages[^.]*\./) ??
					gr.note.match(/Age is from[^.]*\./) ?? [''])[0]
			});
		}
		const ra = demo.removalsVsAdditions;
		const young = ra?.bands?.[0];
		if (young && young.m_add > young.f_add) {
			out.push({
				key: 'removalsVsAdditions',
				n: young.m_add - young.f_add,
				what: `more men than women aged ${young.band} were added to the final roll`
			});
		}
		const sr = demo.sexRatioShift;
		if (sr?.overall) {
			out.push({
				key: 'sexRatioShift',
				fig: String(Math.round(sr.overall.after)),
				what: `women for every 1,000 men on the final roll, ${sr.overall.diff < 0 ? 'down' : 'up'} from ${Math.round(sr.overall.before)}`
			});
		}
		const tg = demo.transgender;
		if (tg) {
			out.push({
				key: 'transgender',
				fig: pc(tg.stateTgPct),
				what: `of registered transgender voters were removed, against ${pc(tg.stateMfPct)} of men and women`,
				dek: `Share of transgender voters removed against the share of men and women removed, by constituency, ${region.name}`,
				note: tg.note
			});
		}
		const dq = demo.disqualifiedGender;
		if (dq) {
			out.push({
				key: 'disqualifiedGender',
				fig: pc(dq.femalePct),
				what: 'of voters struck off as disqualified were women',
				note: `Women were a majority in ${dq.acsMajFemale} of the ${dq.acsMin10} constituencies with at least 10 disqualifications.`
			});
		}
		const ds = demo.disqualificationSpread;
		if (ds?.rows?.length) {
			const most = ds.rows.reduce((/** @type {any} */ a, /** @type {any} */ b) =>
				b.q > a.q ? b : a
			);
			out.push({
				key: 'disqualificationSpread',
				n: most.q,
				what: `voters struck off as disqualified in ${most.name}, the most in any constituency`
			});
		}
		const lm = demo.lossVsMargin;
		if (lm) {
			out.push({
				key: 'lossVsMargin',
				n: lm.exceedsCount,
				what: `of ${lm.totalAcs} constituencies lost more voters than the ${lm.electionYear} winning margin`
			});
		}
		return out;
	});
	const finalItems = $derived(itemsOf(1));
	const struckItems = $derived(itemsOf(2));
	const nameItems = $derived(
		/** @type {Item[]} */ (
			(charts.nameFaults?.kinds ?? []).map((/** @type {any} */ k) => ({
				key: k.example ?? k.kind,
				what: k.kind,
				n: k.n,
				docs: citesFor(k.example ?? ''),
				detail: null,
				shots: charts.exhibits[k.example ?? ''] ?? []
			}))
		)
	);

	/** Each section states its base once, under its heading, in the owner's words. */
	const finalBase = $derived(
		region.coverage
			? `Based on ${inr(region.coverage.held)} of the state's ${inr(region.coverage.parts)} booths; actual totals may be higher.`
			: ''
	);
	const BACK =
		"A voter counts as 'added back' if they were added to the final roll in the same booth as the list that removed them, under a new voter ID, with the same name and relative and an age within a year.";
	const struckBase = $derived(
		[
			onSubset
				? `Counted in the ${charts.findingsSubset.constituencies} of ${region.constituencies} constituencies where we have every list.`
				: '',
			struckItems.some((i) => i.key === 'cameBack' && i.n != null) ? BACK : ''
		]
			.filter(Boolean)
			.join(' ')
	);
	const namesBase = $derived(
		charts.nameFaults
			? 'While it is possible that some mistakes have crept in due to OCR, every example below and a random sample of each kind were verified manually in the original documents'
			: ''
	);

	const WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
	/** "One in five", or "Nearly one in five" where the share falls short of it. */
	const oneIn = (/** @type {number} */ ratio) => {
		const n = Math.round(ratio);
		const word = WORDS[n] ?? String(n);
		return ratio > n + 0.05 ? `Nearly one in ${word}` : `One in ${word}`;
	};
	const funnelTitle = $derived(
		struckFunnel
			? `${oneIn(struckFunnel.before / struckFunnel.struck)} voters was struck off before the draft roll`
			: ''
	);
	/** The names chart's headline: how many entries in all, in the reader's units. */
	const namesTitle = $derived(
		charts.nameFaults
			? `${lakh(charts.nameFaults.kinds.reduce((/** @type {number} */ s, /** @type {any} */ k) => s + k.n, 0))} invalid names or house numbers`
			: ''
	);

	/** Counts the analysis looked for and found none of, from the state's own file. */
	const noneFound = $derived(/** @type {string[]} */ (region.noneFound ?? []));

	/** The three sections of findings: each a heading, its base, its findings, and what has no count yet. */
	const sections = $derived(
		[
			{
				id: 'ledger-1',
				head: 'Errors on the final roll',
				base: finalBase,
				items: finalItems.filter((i) => i.n != null && !noneFound.includes(i.key)),
				empty: finalItems.filter((i) => i.n == null && !noneFound.includes(i.key)),
				none: finalItems.filter((i) => noneFound.includes(i.key))
			},
			{
				id: 'ledger-2',
				head: 'Voters who were struck off and how many came back',
				base: struckBase,
				items: struckItems.filter((i) => i.n != null && !noneFound.includes(i.key)),
				empty: struckItems.filter((i) => i.n == null && !noneFound.includes(i.key)),
				none: struckItems.filter((i) => noneFound.includes(i.key))
			},
			charts.nameFaults && {
				id: 'names',
				head: 'Incorrect names and house numbers',
				base: namesBase,
				items: nameItems,
				empty: /** @type {Item[]} */ ([]),
				none: /** @type {Item[]} */ ([])
			}
		].filter((s) => !!s)
	);

	// The strip across the top: one plain word a section, the one being read in ink.
	const contents = $derived(
		[
			charts.funnel && { id: 'summary', word: region.name },
			list.length && { id: 'constituency', word: 'Your constituency' },
			{ id: 'ledger-1', word: 'Errors on the roll' },
			{ id: 'ledger-2', word: 'Struck off' },
			charts.demographics && { id: 'demographics', word: 'Who was removed' },
			charts.nameFaults && { id: 'names', word: 'Names' },
			{ id: 'sources', word: 'Methodology' }
		].filter((c) => !!c)
	);
	let current = $state('summary');
	let pastTop = $state(false);
	$effect(() => {
		const ids = contents.map((c) => c.id);
		const onScroll = () => {
			const line = innerHeight * 0.3;
			let at = ids[0];
			for (const id of ids) {
				const el = document.getElementById(`s-${id}`);
				if (el && el.getBoundingClientRect().top <= line) at = id;
			}
			current = at;
			pastTop = scrollY > 240;
		};
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		return () => removeEventListener('scroll', onScroll);
	});
	// On a phone the strip's words do not fit and it scrolls sideways: each edge fades out where
	// there is more to scroll to, and the current section's word is brought to the middle.
	/** @type {HTMLOListElement | undefined} */
	let stripList = $state();
	let fadeL = $state(false);
	let fadeR = $state(false);
	const edges = () => {
		const el = stripList;
		if (!el) return;
		fadeL = el.scrollLeft > 2;
		fadeR = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
	};
	$effect(() => {
		edges();
		addEventListener('resize', edges, { passive: true });
		return () => removeEventListener('resize', edges);
	});
	$effect(() => {
		const el = stripList;
		const a = el?.querySelector(`a[href="#s-${current}"]`);
		if (!el || !(a instanceof HTMLElement)) return;
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollTo({
			left: a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2,
			behavior: still ? 'auto' : 'smooth'
		});
	});

	/*
	 * The finding being read. A thin band 40% down the screen is watched: the finding crossing it
	 * is in focus, at full strength, and the others are dimmed, as a scrolly's steps are. Between
	 * findings the last one stays in focus. Nothing dims until the state card has scrolled out above,
	 * nor before this runs, so the page never loads half grey.
	 */
	let focusKey = $state('');
	let dimming = $state(false);
	$effect(() => {
		if (typeof IntersectionObserver === 'undefined') return;
		const band = new IntersectionObserver(
			(es) => {
				for (const e of es) {
					if (e.isIntersecting) focusKey = /** @type {HTMLElement} */ (e.target).dataset.key ?? '';
				}
			},
			{ rootMargin: '-40% 0px -59% 0px' }
		);
		for (const el of document.querySelectorAll('.reckoner .finding')) band.observe(el);
		const card = document.getElementById('s-summary');
		const past = new IntersectionObserver(([e]) => {
			dimming = !e.isIntersecting && e.boundingClientRect.top < 0;
		});
		if (card) past.observe(card);
		return () => {
			band.disconnect();
			past.disconnect();
		};
	});

	/** whoever turned the rolls into data, credited once under the table */
	const maker = $derived(Object.values(region.documents).find((d) => d?.maker));
	/** the crowded-houses table opens on its top five on a phone */
	let crowdAll = $state(false);

	const finalWhen = $derived(region.documents.final?.when?.replace(/^\d+ /, '') ?? '');

	// constituencies
	const since = $derived(region.documents.before?.when ?? '');
	const strips = $derived(stripsFor(list, since));
	const span = $derived([since, finalWhen].filter(Boolean).join(' to '));
	/** the map's measure; a click on a strip's name sets it to that strip's measure */
	let mapKey = $state('');
	const pickStrip = (/** @type {MouseEvent} */ e) => {
		const t = /** @type {Element} */ (e.target).closest?.('text');
		const m = mapMeasures.find((x) => x.label === t?.textContent?.trim());
		if (m) mapKey = m.key;
	};
	/** The lookup opens on the median constituency, not the extreme: its headline is the typical one. */
	const counted = $derived(list.filter((c) => c.change != null));
	const middle = $derived(
		[...counted].sort(
			(a, b) => /** @type {number} */ (a.change) - /** @type {number} */ (b.change)
		)[Math.floor(counted.length / 2)]?.ac ?? list[0]?.ac
	);
	let ac = $state(0);
	$effect(() => {
		if (!ac && middle) ac = middle;
	});
	/**
	 * The map's measures, the strips' own where the rows carry them, and only those the state has for
	 * most of its constituencies. Each has a short key for the toggle, so four fit in one row on a
	 * phone; the full name is the legend's and the hover card's.
	 */
	const mapMeasures = $derived(
		[
			{
				key: 'droppedPct',
				label: 'Struck off before the draft roll',
				short: 'Struck off',
				legend: 'Share struck off before the draft roll',
				value: (/** @type {any} */ c) => c.droppedPct,
				fmt: (/** @type {number} */ v) => pct(v, 0),
				thresholds: [5, 10, 15, 20, 30]
			},
			{
				key: 'change',
				label: `Voters lost since ${since}`,
				short: 'Voters lost',
				legend: `Share of voters lost since ${since}`,
				value: (/** @type {any} */ c) => (c.change == null ? null : -c.change),
				fmt: (/** @type {number} */ v) => (v < 0 ? `grew ${pct(-v, 0)}` : pct(v, 0)),
				thresholds: [5, 10, 15, 20, 30]
			},
			{
				key: 'house0Pct',
				label: 'No house number',
				short: 'No house number',
				legend: 'Share of voters with no house number',
				value: (/** @type {any} */ c) => c.house0Pct,
				fmt: (/** @type {number} */ v) => (v < 1 ? pct(v, 1) : pct(v, 0)),
				thresholds: [0.5, 1, 2, 5, 10]
			},
			{
				key: 'disqualifiedPct',
				label: 'Struck off as disqualified',
				short: 'Disqualified',
				legend: 'Share of voters struck off as disqualified',
				value: (/** @type {any} */ c) => c.disqualifiedPct,
				fmt: (/** @type {number} */ v) => pct(v, 2),
				thresholds: [0.1, 0.25, 0.5, 1, 2]
			}
		].filter((x) => list.filter((c) => x.value(c) != null).length > list.length / 2)
	);

	const docs = $derived(
		DOCUMENTS.flatMap((id) => {
			const d = region.documents[id];
			return d?.name ? [d] : [];
		})
	);

	/** a figure split into its number and its unit, so the unit can sit small beside it */
	const parts = (/** @type {number} */ n) => {
		const [fig, unit] = lakh(n).split(/[  ]/);
		return { fig, unit: unit ?? '' };
	};
</script>

{#snippet cite(/** @type {Cite} */ d)}
	<span class="cite"
		>{d.document}, {d.constituency}
		<a href={d.url} target="_blank" rel="noopener noreferrer">part {d.part}</a>{#if d.page}, page {d.page}{/if}{#if d.where},
			{d.where
				.replace('reason मृत्यु', 'reason मृत्यु (death)')
				.replace(/ checked$/, '')
				.replace(' (and 588)', '')}{/if}.</span
	>
{/snippet}

{#snippet figure(/** @type {number} */ n)}
	{@const p = parts(n)}<span class="fig"
		>{p.fig}{#if p.unit}<span class="u">{p.unit}</span>{/if}</span
	>
{/snippet}

<!-- A finding: the count, what it counts, and its evidence (see Finding.svelte). Here, the parts
     only this page knows: the citation for a count with no drawn page, and the table or chart
     behind a count. -->
{#snippet finding(/** @type {Item} */ i)}
	{#snippet cites()}
		{#if !i.shots.length}
			{#each i.docs as d (d.url)}{@render cite(d)}{/each}
		{/if}
	{/snippet}
	{#snippet crowd()}
		<!-- the table and its button are one part, so the visuals' gap falls above them only -->
		<div class="crowd-part">
			<table class="crowd" class:all={crowdAll}>
				<caption>The 10 house numbers with the most voters</caption>
				<thead>
					<tr>
						<th>Constituency, part</th>
						<th>House</th>
						<th>Voters</th>
						<th>Distinct families</th>
					</tr>
				</thead>
				<tbody>
					{#each charts.crowded.slice(0, 10) as h, k (`${h.ac}-${h.part}-${h.house}`)}
						<tr class:later={k >= 5}>
							<td>{h.constituency}, part&nbsp;{h.part}</td>
							<td>{h.house}</td>
							<td>{inr(h.voters)}</td>
							<td>{inr(h.relatives)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<!-- on a phone the table opens on its top five, as the constituency table opens on its top ten -->
			{#if charts.crowded.length > 5}
				<button
					type="button"
					class="more"
					aria-expanded={crowdAll}
					onclick={() => (crowdAll = !crowdAll)}
					>{crowdAll ? 'Show the top 5' : `Show all ${Math.min(10, charts.crowded.length)}`}</button
				>
			{/if}
		</div>
	{/snippet}
	{#snippet reused()}
		<div class="chart-slot">
			<ReusedIds
				data={charts.reusedIds}
				title="7 new voters in Powayan were given a voter ID that belonged to someone else"
				dek="Voter IDs held by two different people, by how the earlier holder was struck off, Powayan constituency, 2024 roll and final roll of April 2026"
				source={region.credit ?? ''}
				before="2024"
				after={finalWhen}
			/>
		</div>
	{/snippet}
	{#snippet funnel()}
		<div class="chart-slot">
			<RollFunnel
				data={struckFunnel ?? undefined}
				title={funnelTitle}
				dek="Voters on the roll in {charts.funnel?.beforeWhen ??
					since}, and those struck off before the draft roll by reason, {region.name}"
				source={region.credit ?? ''}
				rollLabel="On the roll, {charts.funnel?.beforeWhen ?? since}"
				ofRoll="Of that roll"
			/>
		</div>
	{/snippet}
	{#snippet duplicates()}
		<div class="chart-slot">
			<DuplicateCards
				data={charts.duplicates}
				unit={500}
				dek="Duplicate entries removed and added during the revision, {region.name}, final roll, {finalWhen}"
				source={region.credit ?? ''}
			/>
		</div>
	{/snippet}
	{#snippet wall()}
		<div class="chart-slot">
			<ReturnWall
				returns={charts.returns}
				unit={wallUnit}
				dek="People struck off before the draft roll by the reason given, and those added back on the final roll, {region.name}"
				source={region.credit ?? ''}
			/>
		</div>
	{/snippet}
	{#snippet returns()}
		<div class="returns">
			<ReturnRates
				byReason={charts.returns}
				byAge={charts.returnAge}
				title="Older voters and those marked dead were the least likely to come back"
				dek="Share of voters struck off before the draft roll who are back on the final roll, by reason and age, {region.name}"
				note=""
				flat
				source={region.credit ?? ''}
			/>
		</div>
	{/snippet}
	<Finding
		key={i.key}
		focus={focusKey === i.key}
		n={i.n ?? 0}
		what={i.what}
		examples={i.shots.length ? examplesFor(i.shots, i.docs) : []}
		{cites}
		extra={i.detail === 'crowded'
			? crowd
			: i.detail === 'returns'
				? returns
				: i.detail === 'wall'
					? wall
					: i.detail === 'funnel'
						? funnel
						: i.detail === 'duplicates'
							? duplicates
							: i.detail === 'reused'
								? reused
								: undefined}
	/>
{/snippet}

<header class="top">
	<a class="logo" href={CANONICAL_ORIGIN} aria-label="Diagram Chasing — home">
		<img src={logoSrc} alt="Diagram Chasing" width="1000" height="328" fetchpriority="high" />
	</a>
	<h1>{region.name}</h1>
	<p class="what-is">
		Numbers and errors in the{region.documents.final?.when
			? ` ${new Date(region.documents.final.when).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
			: ''} voter list from the Special Intensive Revision (SIR).
	</p>
	{#if region.updated}<p class="updated mb-4!">Updated {region.updated}</p>{/if}

	<StateNav current={region.slug} />
</header>

<nav class="strip" class:on={pastTop} aria-label="On this page">
	<ol bind:this={stripList} onscroll={edges} class:fade-l={fadeL} class:fade-r={fadeR}>
		{#each contents as c (c.id)}
			<li>
				<a href="#s-{c.id}" aria-current={current === c.id ? 'true' : undefined}>{c.word}</a>
			</li>
		{/each}
	</ol>
</nav>

<article class="article reckoner" class:dimming>
	{#if charts.funnel}
		<div class="card-block block" id="s-summary">
			<StateCard state={region} funnel={charts.funnel} outline={bounds?.state} />
		</div>
	{/if}

	{#if list.length}
		<section class="block" id="s-constituency" aria-labelledby="h-constituency">
			<h2 id="h-constituency">Know your constituency</h2>
			<!-- wide: the search and strips beside the map, the table under both; phone: in that order -->
			<div class="lookup-grid">
				{#if strips.length && ac}
					<!-- clicking a strip's name shows its measure on the map: a pointer shortcut; the map's own
				     toggle is the keyboard way -->
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div class="lookup" onclick={pickStrip}>
						<YourConstituency
							bind:ac
							{list}
							{strips}
							dek="Change from the {since} roll to {finalWhen}.{counted.length < list.length
								? ` In the ${counted.length} of ${list.length} constituencies where the total of each booth is known.`
								: ''}"
							note=""
							source=""
						/>
					</div>
				{/if}
				{#if bounds && mapMeasures.length}
					<div class="map">
						<StateMap
							bind:ac
							bind:key={mapKey}
							acPacked={bounds.ac}
							statePacked={bounds.state}
							{list}
							measures={mapMeasures}
							name={region.name}
							source=""
						/>
					</div>
				{/if}
			</div>
			<div class="ctable">
				<ConstituencyTable
					rows={list}
					title=""
					dek=""
					search={false}
					source={[region.credit, region.mapCredit].filter(Boolean).join('. ') + '.'}
					{since}
					sinceShort={since}
				/>
			</div>
		</section>
	{/if}

	{#each sections as s (s.id)}
		<section class="counts block" id="s-{s.id}" aria-labelledby="h-{s.id}">
			<h2 id="h-{s.id}">{s.head}</h2>
			{#if s.base}<p class="base">{s.base}</p>{/if}
			{#if s.id === 'names' && charts.nameFaults}
				<div class="overview">
					<NameFaults
						data={charts.nameFaults.kinds}
						axis="Printed on the roll"
						title={namesTitle}
						dek="Entries printed wrongly in place of a name or a house number, by kind, {region.name}, final roll, {finalWhen}"
						source={region.credit ?? ''}
					/>
				</div>
			{/if}
			<div class="findings">
				{#each s.items as i (i.key)}{@render finding(i)}{/each}
			</div>
			<!-- {#if s.none.length}
				<p class="pending">
					<b>None found:</b>
					{s.none.map((i) => i.what).join('; ')}
				</p>
			{/if} -->
			<!-- {#if s.empty.length}
				<p class="pending">
					<b>Not counted yet:</b>
					{s.empty.map((i) => i.what).join('; ')}
				</p>
			{/if} -->
		</section>
		{#if s.id === 'ledger-2' && charts.demographics}
			<section class="demographics block" id="s-demographics" aria-labelledby="h-demographics">
				<h2 id="h-demographics">Who was removed</h2>
				<div class="findings">
					{#each demoItems as d (d.key)}
						{#snippet chart()}
							<div class="chart-slot">
								{#if d.key === 'ageGender'}
									<AgeGenderGap data={demo.ageGender} note={d.note} />
								{:else if d.key === 'genderReasons'}
									<GenderReasons data={demo.genderReasons} note={d.note} />
								{:else if d.key === 'transgender'}
									<TransgenderScatter data={demo.transgender} dek={d.dek} note={d.note} />
								{:else if d.key === 'disqualifiedGender'}
									<DisqualifiedGender data={demo.disqualifiedGender} note={d.note} />
								{:else if d.key === 'removalsVsAdditions'}
									<RemovalsVsAdditions data={demo.removalsVsAdditions} />
								{:else if d.key === 'sexRatioShift'}
									<SexRatioShift data={demo.sexRatioShift} />
								{:else if d.key === 'disqualificationSpread'}
									<DisqualificationSpread data={demo.disqualificationSpread} />
								{:else if d.key === 'lossVsMargin'}
									<LossVsMargin data={demo.lossVsMargin} />
								{/if}
							</div>
						{/snippet}
						<Finding
							key={d.key}
							focus={focusKey === d.key}
							fig={d.fig ?? ''}
							n={d.n ?? 0}
							what={d.what}
							extra={chart}
						/>
					{/each}
				</div>
			</section>
		{/if}
	{/each}

	{#if docs.length}
		<section class="sources block" id="s-sources" aria-labelledby="h-sources">
			<h2 id="h-sources">Methodology</h2>
			<!-- a small table: the document, its date, who published it; then one line of credits -->
			<table class="src">
				<tbody>
					{#each [...docs, ...(region.moreSources ?? [])] as d (d.name)}
						<tr>
							<th scope="row">
								{#if d.url}<a href={d.url} target="_blank" rel="noopener noreferrer">{d.name}</a
									>{:else}{d.name}{/if}
							</th>
							<td class="when">{d.when && !d.name?.includes(d.when) ? d.when : ''}</td>
							<td class="by">{d.by ?? ''}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="credits">
				{#if maker}Rolls digitized by <a
						href={maker.makerUrl}
						target="_blank"
						rel="noopener noreferrer">{maker.maker}</a
					>,{/if}
				analysis by Diagram Chasing. {#if region.mapCredit}{region.mapCredit}.{/if} <br /> <br /> Each
				example was double-checked against the original PDFs. Parts of voter IDs and serial numbers are
				redacted in the the sample images but we link to the original ECI documents so that they can
				be verified if needed.
			</p>
		</section>
	{/if}

	<StoryCard />
</article>

<style>
	/* The story's own scales (src/typography.css), and nothing else.
	   Type: --text-4 the state's name; --text-3 the figures; --text-2 the section headings;
	   --text-1 the line under the name; --text-body labels, notes and lines of text;
	   --text-caption captions, chart descriptions, table heads, buttons; --text-micro sources,
	   map keys, "Updated".
	   Space: --space-section above each section and the story card; --space-figure from the
	   header to the card, from a heading block to its first finding or chart, between findings,
	   above "None found" and "Not counted yet"; --leading between parts inside one thing (pages
	   and the chart under them, a chart and the next); --space-p a heading to its note, a figure
	   to its label, the name to its line to the switcher; a quarter --leading a page to its
	   caption, a table's caption to the table, "Updated" under the switcher. Gaps are set by the
	   parent or by a margin on the later sibling only, never by two margins meeting. */
	.reckoner {
		--ink: var(--foreground);
		--mute: color-mix(in oklch, var(--foreground) 60%, var(--background));
		--column: 60rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-section);
		padding-top: var(--space-figure);
	}

	.top {
		padding: clamp(1.25rem, 4vh, 2.5rem) var(--gutter, 1.25rem) 0;
		text-align: center;
	}
	.logo {
		/* a block, so no line box adds space under it */
		display: block;
		width: max-content;
		margin-inline: auto;
		margin-bottom: var(--space-p);
	}
	.logo img {
		display: block;
		height: 1.75rem;
		width: auto;
	}
	.updated {
		margin: calc(var(--leading) / 4) 0 0;
		font-size: var(--text-micro);
		line-height: 1.35;
		color: color-mix(in oklch, var(--foreground) 60%, var(--background));
	}
	.what-is {
		margin: 0 auto var(--space-p);
		max-width: 36rem;
		font-size: var(--text-1);
		line-height: 1.35;
		color: color-mix(in oklch, var(--foreground) 70%, var(--background));
		text-wrap: balance;
	}
	h1 {
		margin: 0 auto var(--space-p);
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: var(--text-4);
		line-height: 1;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	/* the strip sits out of the way until the reader is past the top, then stays; fixed, so it
	   takes no height in the page's flow while hidden */
	.strip {
		position: fixed;
		inset: 0 0 auto;
		/* above every finding, dimmed or not (their opacity makes stacking contexts of their own) */
		z-index: 50;
		background: var(--background);
		border-bottom: 1px solid color-mix(in oklch, var(--foreground) 10%, var(--background));
		font-family: var(--font-sans);
		font-size: var(--text-caption);
		line-height: 1;
		opacity: 0;
		pointer-events: none;
		transition: opacity 160ms ease-out;
	}
	.strip.on {
		opacity: 1;
		pointer-events: auto;
	}
	.strip ol {
		display: flex;
		gap: 1.5rem;
		/* the page's column, so the strip's first word sits on the headings' edge */
		max-width: calc(60rem + 2 * var(--gutter, 1.25rem));
		margin: 0 auto;
		padding: 0 var(--gutter, 1.25rem);
		list-style: none;
		overflow-x: auto;
		scrollbar-width: none;
		--fl: 0rem;
		--fr: 0rem;
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 var(--fl),
			#000 calc(100% - var(--fr)),
			transparent
		);
	}
	.strip ol::-webkit-scrollbar {
		display: none;
	}
	/* a fade on each side that has more to scroll to */
	.strip ol.fade-l {
		--fl: 1.5rem;
	}
	.strip ol.fade-r {
		--fr: 1.5rem;
	}
	.strip a {
		display: block;
		padding: 0.75rem 0;
		border-bottom: 2px solid transparent;
		white-space: nowrap;
		text-decoration: none;
		color: color-mix(in oklch, var(--foreground) 60%, var(--background));
	}
	.strip a:hover {
		color: var(--foreground);
	}
	.strip a[aria-current] {
		color: var(--foreground);
		font-weight: 700;
		border-bottom-color: var(--story-orange);
	}
	@media (prefers-reduced-motion: reduce) {
		.strip {
			transition: none;
		}
	}

	/* One column for the whole page, centred on the same line as the header: every block, the card
	   and every heading share its two edges. On a phone it is the text's own width. */
	.block {
		width: 100%;
		max-width: var(--column);
		margin: 0 auto;
		scroll-margin-top: 3.5rem;
	}
	/* every shared chart brings a figure margin of its own; here the parent's gap does the spacing */
	.reckoner :global(figure.chart) {
		margin: 0;
	}

	/* A section opens on its heading alone, at --text-2: clearly under the state's name and over a
	   label; left on the page's column; no rule, no label above it. */
	.block h2 {
		margin: 0;
		max-width: none;
		padding: 0;
		font-family: var(--font-heading);
		font-size: var(--text-2);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.02em;
		text-align: left;
		text-wrap: balance;
	}
	/* the section's base, stated once, at the body size in the muted colour */
	.base {
		max-width: 44rem;
		margin: var(--space-p) 0 0;
		font-size: var(--text-body);
		line-height: 1.45;
		color: var(--mute);
		text-wrap: pretty;
	}
	/* a section's findings follow its heading and base a figure's space below */
	.findings {
		margin-top: var(--space-figure);
	}
	/* the map at a size that fits a screen, centred in the column */
	.map :global(svg) {
		max-width: 44rem;
	}

	/* the lookup: the strips, then the map, then the table, each at the column's width */
	.lookup-grid {
		display: grid;
		/* a column that may shrink to the screen, or the charts in it set its width */
		grid-template-columns: minmax(0, 1fr);
		gap: var(--leading);
		margin-top: var(--space-figure);
	}
	@media (min-width: 60rem) {
		.lookup-grid {
			grid-template-columns: minmax(0, 1fr) 28rem;
			column-gap: 2.5rem;
			align-items: start;
		}
	}
	.ctable {
		margin-top: var(--leading);
	}
	/* a strip's name is a shortcut to its measure on the map */
	.lookup :global(svg text.lab),
	.lookup :global(svg text.hdr) {
		cursor: pointer;
	}
	/* the table's sort is shown in its own column head; the line repeating it goes */
	.ctable :global(.legend) {
		display: none;
	}
	/* the measure's keys sit in one row, the house toggle, never stacked */
	.map :global(div.seg) {
		max-width: 100%;
	}
	/* the legend names the measure in full, on one line where the column allows */
	.map :global(.ramp) {
		width: min(22rem, 100%);
	}
	.map :global(.ramp .lbl) {
		line-height: 1.3;
	}
	.map :global(div.seg button) {
		flex: 0 1 auto;
		padding-inline: 0.75rem;
		white-space: nowrap;
	}
	@media (max-width: 30rem) {
		.map :global(div.seg button) {
			padding-inline: 0.5rem;
			font-size: var(--text-caption);
		}
	}
	/* the table's values: ink on white, with a pale tint that deepens with the value, so orange
	   stays an accent and the figures read as a column */
	.reckoner .ctable :global(.chart .body table.grid td:is(.f0, .f1, .f2, .f3)) {
		color: var(--ink);
		font-weight: 400;
	}
	.reckoner .ctable :global(.chart .body table.grid td.f0) {
		background: color-mix(in oklch, var(--d-w0) 25%, var(--background));
	}
	.reckoner .ctable :global(.chart .body table.grid td.f1) {
		background: color-mix(in oklch, var(--d-w0) 50%, var(--background));
	}
	.reckoner .ctable :global(.chart .body table.grid td.f2) {
		background: color-mix(in oklch, var(--d-w0) 80%, var(--background));
	}
	.reckoner .ctable :global(.chart .body table.grid td.f3) {
		background: var(--d-w0);
		font-weight: 700;
	}
	/* chart titles inside the lookup take the body size, a step under the section head */
	.reckoner :global(figure.chart .kicker) {
		font-size: var(--text-body);
		line-height: 1.3;
	}
	.reckoner :global(figure.chart .dek) {
		max-width: none;
		margin-top: 0;
		font-size: var(--text-caption);
		line-height: 1.4;
		color: var(--mute);
	}

	/* ---- the findings ----
	   One unit, the same in every section (Finding.svelte). Findings sit 3rem apart; sections twice
	   that. No rules, boxes, tints or lines. */
	/* The finding being read at full strength, the others dimmed; any finding the reader points at
	   or tabs into comes up at once, so a dimmed one is never in the way. Sections' headings,
	   notes, the card, the lookup and the sources are never dimmed. */
	.dimming :global(.finding) {
		transition: opacity 200ms ease-out;
	}
	.dimming :global(.finding:not(.focus)) {
		opacity: 0.35;
	}
	.dimming :global(.finding:is(:hover, :focus-within)) {
		opacity: 1;
		transition: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.dimming :global(.finding) {
			transition: none;
		}
	}
	@media print {
		.dimming :global(.finding:not(.focus)) {
			opacity: 1;
		}
	}
	.findings {
		display: grid;
		row-gap: var(--space-figure);
	}
	/* a section's overview chart, between its note and its findings, a figure's space from each */
	.overview {
		margin-top: var(--space-figure);
	}
	.returns :global(figure.chart .dek) {
		margin-top: 0;
		font-size: var(--text-caption);
	}

	/* A data table in the essay's grammar: bold heads on a 2px ink rule, every other row on a pale
	   grey so a row can be followed across, labels left, counts right in tabular figures. A table's
	   own furniture, not decoration. */
	.crowd {
		width: 100%;
		/* the visuals column sets the gap above it */
		margin-top: 0;
		border-collapse: collapse;
		font-size: var(--text-caption);
		line-height: 1.3;
		font-variant-numeric: tabular-nums lining-nums;
	}
	.crowd caption {
		margin-bottom: calc(var(--leading) / 4);
		font-size: var(--text-body);
		font-weight: 700;
		line-height: 1.3;
		text-align: left;
		caption-side: top;
	}
	.crowd th {
		padding: 0 0.5rem calc(var(--leading) / 4);
		border-bottom: 2px solid var(--ink);
		font-weight: 700;
		text-align: left;
		vertical-align: bottom;
	}
	.crowd td {
		padding: calc(var(--leading) / 4) 0.5rem;
		text-align: left;
		vertical-align: baseline;
	}
	.crowd tbody tr:nth-child(even) td {
		background: color-mix(in oklch, var(--foreground) 4.5%, var(--background));
	}
	/* the house plain button, as the constituency table's own "Show all"; a phone only */
	.more {
		display: none;
		width: max-content;
		margin: var(--space-p) auto 0;
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: var(--ui-r, 5px);
		background: var(--ui-track, color-mix(in oklch, var(--foreground) 8%, var(--background)));
		color: var(--ink);
		font-family: var(--font-sans);
		font-size: var(--text-caption);
		font-weight: 700;
		line-height: 1.2;
		cursor: pointer;
	}
	.more:hover {
		background: var(
			--ui-track-hover,
			color-mix(in oklch, var(--foreground) 12%, var(--background))
		);
	}
	.more:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 2px;
	}
	@media (max-width: 47.99rem) {
		.crowd:not(.all) tr.later {
			display: none;
		}
		.more {
			display: block;
		}
	}
	/* a phone: closer columns, so a place and its part keep to one line */
	@media (max-width: 30rem) {
		.crowd :is(th, td) {
			padding-inline: 0.25rem;
		}
		.crowd {
			font-size: var(--text-caption);
		}
	}
	.crowd :is(th, td):nth-child(n + 3) {
		text-align: right;
		white-space: nowrap;
	}
	/* the last head may break between its two words on a phone; never inside a word */
	.crowd th:last-child {
		white-space: normal;
		width: 5.5rem;
	}
	@media (min-width: 30rem) {
		.crowd th:last-child {
			white-space: nowrap;
			width: auto;
		}
	}

	.cite {
		display: block;
		font-size: var(--text-caption);
		line-height: 1.4;
		color: var(--mute);
	}
	.cite a {
		color: inherit;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	/* the counts still to come: one quiet line at the section's end, each named */
	.pending {
		max-width: 44rem;
		margin: var(--space-figure) 0 0;
		font-size: var(--text-body);
		line-height: 1.45;
		color: var(--mute);
		text-wrap: pretty;
	}
	.pending b {
		font-weight: 700;
		color: var(--ink);
	}
	/* a second such line sits close under the first: they are one list of what is missing */
	.pending + .pending {
		margin-top: calc(var(--leading) / 4);
	}

	/* the sources: one small aligned table and a line of credits, in the notes' size and colour */
	.src {
		width: auto;
		margin: var(--space-p) 0 0;
		border-collapse: collapse;
		font-size: var(--text-caption);
		line-height: 1.35;
		font-variant-numeric: tabular-nums;
	}
	.src :is(th, td) {
		padding: 0.25rem 1.5rem 0.25rem 0;
		border: 0;
		text-align: left;
		vertical-align: baseline;
		font-weight: 400;
		white-space: nowrap;
		background: none;
	}
	.src th {
		color: var(--ink);
	}
	.src td {
		color: var(--mute);
	}
	.src td.by {
		padding-right: 0;
		white-space: normal;
	}
	.credits {
		max-width: 40rem;
		margin: var(--space-p) 0 0;
		font-size: var(--text-caption);
		line-height: 1.4;
		color: var(--mute);
	}
	.src a,
	.credits a {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: color-mix(in oklab, currentColor 45%, transparent);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	/* phone: the date keeps its column; the publisher drops under the name */
	@media (max-width: 560px) {
		.src {
			width: 100%;
		}
		.src tr {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			padding-block: 0.25rem;
		}
		.src :is(th, td) {
			padding: 0;
		}
		.src td.when {
			text-align: right;
		}
		.src td.by {
			grid-column: 1 / -1;
		}
	}
</style>
