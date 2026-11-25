// What the story tests in a state's rolls, and the documents each test needs. A state supplies
// counts only, in states/<slug>/state.json and states/<slug>/by_ac.json; `pnpm states` checks them.
// The wording is FindingsLedger's.

/**
 * The documents a revision leaves behind, in date order. A state lists the ones its analysis had.
 *
 * - lastSir: the roll from the last intensive revision, which voters were matched against
 * - before: the roll as it stood before this revision began
 * - removals: the list of people removed before the draft roll, with the reason for each
 * - draft: the draft roll
 * - notices: the lists of people sent a notice, with the reason for each
 * - report: the Chief Electoral Officer's own summary of the revision, by constituency
 * - final: the final roll
 * - next: the first roll published after the final one
 */
export const DOCUMENTS = /** @type {const} */ ([
	'lastSir',
	'before',
	'removals',
	'draft',
	'notices',
	'report',
	'final',
	'next'
]);

/** @typedef {(typeof DOCUMENTS)[number]} DocId */

/**
 * The twelve counts in the findings ledger, in its order.
 *
 * `needs` lists the sets of documents that can each produce the count; one complete set is enough.
 * Where the removals list is missing, a count can be taken as the difference between the roll
 * before and the draft roll. That also catches ordinary deletions made between the two, so it is
 * not the same measure as a count from the list.
 *
 * `{year}` in a label is the state's lastSirYear. `film` is the section the count closes, and
 * `tally` the words under the section's closing number, where it has one.
 *
 * The comment on each entry is the rule as the story states it, so that a count means the same
 * thing in every state. Every count is a floor, and is among voters still on the final roll unless
 * the rule says otherwise. The rules that compare names were written for rolls in Latin script:
 * a roll in another script, or one read by OCR, needs its own test for a garbled name and for two
 * names being the same.
 *
 * @type {{ key: string, half: 1 | 2, film: string | null, label: string, tally: string | null, needs: DocId[][] }[]}
 */
export const FINDINGS = [
	{
		// People, not cards: cards in one booth with the same name, relative's name, age and sex
		// under different voter IDs are one person.
		key: 'duplicatesInBooth',
		half: 1,
		film: 'hum-paanch',
		label: 'People on the roll more than once in their own booth',
		tally: 'people on the roll more than once in their own booth',
		needs: [['final']]
	},
	{
		// The same voter ID on the final roll of two constituencies.
		key: 'idInTwoConstituencies',
		half: 1,
		film: 'duplicate',
		label: 'The same voter ID on the roll in two constituencies',
		tally: 'voter IDs on the roll in two constituencies at once',
		needs: [['final']]
	},
	{
		// House numbers in one booth with 100 or more voters who name 50 or more different relatives.
		key: 'crowdedHouses',
		half: 1,
		film: 'housefull',
		label: 'House numbers with 100 or more voters',
		tally: null,
		needs: [['final']]
	},
	{
		// A 0, a dash or nothing where the house number should be. The sum of by_ac's house0.
		key: 'noHouseNumber',
		half: 1,
		film: 'housefull',
		label: 'Voters with no real house number',
		tally: 'voters still on the roll with no usable address',
		needs: [['final']]
	},
	{
		// The name or the relative's name printed as a string of symbols, checked against the page.
		key: 'garbledNames',
		half: 1,
		film: 'gumnaam',
		label: 'Names printed as symbols',
		tally: 'unreadable names',
		needs: [['final']]
	},
	{
		// Two voters in one house, close in age, each with the other's name as their father.
		key: 'mutualFathers',
		half: 1,
		film: 'hum-aapke-hain-koun',
		label: "Pairs of voters who are each other's father",
		tally: "pairs of voters who are each other's father",
		needs: [['final']]
	},
	{
		// Removed before the draft roll and found, by voter ID, on the roll before the revision.
		// The sum of by_ac's dropped.
		key: 'struckOff',
		half: 2,
		film: null,
		label: 'Voters struck off before the draft roll',
		tally: null,
		needs: [
			['before', 'removals'],
			['before', 'draft']
		]
	},
	{
		// Of those, added to the final roll in the same constituency with the same name, relative
		// and age. Someone on another constituency's roll under their old voter ID is not counted.
		key: 'cameBack',
		half: 2,
		film: null,
		label: 'Of those, back on the final roll',
		tally: 'back on the final roll',
		needs: [
			['before', 'removals', 'final'],
			['before', 'draft', 'final']
		]
	},
	{
		// Sent a notice as unmapped, though their voter ID, name and age match the last intensive
		// revision's roll.
		key: 'unmapped',
		half: 2,
		film: 'main-hoon-na',
		label: 'Told they are not on the {year} roll, though they are',
		tally: 'told they are not on the {year} roll even though they are',
		needs: [['lastSir', 'notices']]
	},
	{
		// Sent a notice for a sibling born within nine months, and struck off as disqualified.
		key: 'nineMonthRule',
		half: 2,
		film: 'judwaa',
		label: 'Struck off after a notice under the nine-month rule',
		tally: 'struck off after a notice under the nine-month rule',
		needs: [['notices', 'final']]
	},
	{
		// Removed before the draft roll with the reason given as dead, and counted in cameBack.
		key: 'deadCameBack',
		half: 2,
		film: 'zinda',
		label: 'Marked dead, and back on the final roll',
		tally: 'back on the final roll after proving they are alive',
		needs: [['before', 'removals', 'final']]
	},
	{
		// Voters added to the final roll under a voter ID that belonged, on the roll before the
		// revision, to a different person who was removed before the draft roll.
		key: 'reusedIds',
		half: 2,
		film: 'pehchaan',
		label: "New voters holding a removed voter's ID",
		tally: "new voters with a struck-off voter's ID",
		needs: [
			['before', 'removals', 'final'],
			['before', 'draft', 'final']
		]
	}
];

/**
 * A constituency's row in by_ac.json. `ac`, `constituency`, `district` and `electors` (voters on
 * the final roll) are required; each field below is a whole number and needs the documents listed.
 * Leave a field out where the state has no such document: a missing field is not a zero.
 *
 * @type {Record<string, DocId[][]>}
 */
export const AC_FIELDS = {
	/** voters on the roll before the revision */
	electors_before: [['before']],
	/** removed before the draft roll */
	dropped: [
		['before', 'removals'],
		['before', 'draft']
	],
	/** notices issued, as the Chief Electoral Officer reports them */
	notices_generated: [['report']],
	/** found ineligible after a hearing, as the Chief Electoral Officer reports them */
	bk_ineligible: [['report']],
	/** notices in the digitized notice lists */
	notices_partner: [['notices']],
	/** of those, struck off the final roll as disqualified */
	struck_q: [['notices', 'final']],
	/** cards that repeat another card in the same booth under a different voter ID */
	dup_entries: [['final']],
	/** voters with a 0, a dash or nothing for a house number */
	house0: [['final']],
	/** booths (parts) in the constituency's final roll */
	parts: [['final']],
	/** of those, booths whose file the analysis does not hold; every count leaves them out */
	parts_missing: [['final']],
	/** voters in those missing booths on the final roll, read from each booth's printed summary */
	electors_missing_parts: [['final']],
	/** and on the draft roll */
	draft_electors_missing_parts: [['draft'], ['final']]
};

/**
 * states/<slug>/state.json.
 *
 * @typedef {{ name: string | null, when: string | null, by: string | null, roll?: string, url?: string, maker?: string, makerUrl?: string }} StateDocument
 * `name` as captions cite it ("January 2025 roll"), `when` it describes, `by` who published or
 * digitized it; `roll` is the dataset's own id for it, where it has one. The state's `credit` is
 * the source line under its charts.
 *
 * @typedef {{
 *   slug: string,
 *   name: string,
 *   eciCode: string,
 *   constituencies: number,
 *   lastSirYear: number | null,
 *   finalRollDate: string | null,
 *   credit: string | null,
 *   mapCredit?: string,
 *   coverage?: { parts: number, held: number },
 *   updated?: string,
 *   moreSources?: StateDocument[],
 *   noneFound?: string[],
 *   documents: Partial<Record<DocId, StateDocument>>,
 *   findings: Record<string, number | null>,
 *   legacyFiles?: { byAc: string, electorsBefore: string }
 * }} StateFile
 */
