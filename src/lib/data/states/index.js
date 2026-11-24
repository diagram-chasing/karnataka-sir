// Every state the story covers, read from states/<slug>/state.json. Karnataka is the essay; the
// others are pages of findings.
import { build, CONSTITUENCIES } from '../constituencies.js';

/** @typedef {import('./findings.js').StateFile} StateFile */

const files = /** @type {Record<string, StateFile>} */ (
	import.meta.glob('./*/state.json', { eager: true, import: 'default' })
);
const acFiles = /** @type {Record<string, any[]>} */ (
	import.meta.glob('./*/by_ac.json', { eager: true, import: 'default' })
);

const chartFiles = /** @type {Record<string, any>} */ (
	import.meta.glob(
		[
			'./*/funnel.json',
			'./*/return*.json',
			'./*/crowded_houses.json',
			'./*/duplicates.json',
			'./*/reused_ids.json',
			'./*/examples.json',
			'./*/exhibits.json',
			'./*/findings_complete.json',
			'./*/name_faults.json'
		],
		{ eager: true, import: 'default' }
	)
);

/**
 * The chart inputs a state has, each null until its file arrives. Returns counted on the whole
 * state are used where they exist; otherwise those counted on its complete constituencies, and
 * `subset` is how many those are.
 * @param {string} slug
 */
export function chartsOf(slug) {
	const f = (/** @type {string} */ name) => chartFiles[`./${slug}/${name}.json`] ?? null;
	const whole = f('return') && f('return_age');
	return {
		funnel: f('funnel'),
		returns: whole ? f('return') : f('return_complete'),
		returnAge: whole ? f('return_age') : f('return_age_complete'),
		/** how many constituencies the returns cover, when not the whole state */
		subset: !whole && f('return_complete') ? (f('return_meta')?.constituencies ?? 0) : 0,
		crowded: f('crowded_houses'),
		// counts behind the duplicates chart, drawn only once `extraAdded` is known
		duplicates: f('duplicates'),
		reusedIds: f('reused_ids'),
		examples: f('examples'),
		/** kinds of faulty name, with the roll they were counted on and whether pages were checked */
		nameFaults: f('name_faults'),
		/** the removal counts on the complete constituencies only, for use until the state's own are in */
		findingsSubset: f('findings_complete'),
		/** the examples drawn for each count: a list of examples, each one page or a pair read together */
		exhibits: /** @type {Record<string, string[][]>} */ (f('exhibits') ?? {})
	};
}

const mapFiles = /** @type {Record<string, any>} */ (
	import.meta.glob(['../*-ac.poly.json', '../*-state.poly.json'], {
		eager: true,
		import: 'default'
	})
);

/** A state's packed constituency boundaries and outline, or null where the repo has none. @param {string} slug */
export function boundariesOf(slug) {
	const ac = mapFiles[`../${slug}-ac.poly.json`];
	const state = mapFiles[`../${slug}-state.poly.json`];
	return ac && state ? { ac, state } : null;
}

/** The state the essay is about. */
export const ESSAY = 'karnataka';

/** In the order they were added to the story: the essay's state first, then by name. */
export const STATES = Object.values(files).sort(
	(a, b) => Number(b.slug === ESSAY) - Number(a.slug === ESSAY) || a.name.localeCompare(b.name)
);

export const BY_SLUG = new Map(STATES.map((s) => [s.slug, s]));

/** A state's constituencies with the rates the charts show; empty until its by_ac.json arrives. @param {string} slug */
export const constituenciesOf = (slug) =>
	slug === ESSAY ? CONSTITUENCIES : build(acFiles[`./${slug}/by_ac.json`] ?? []);
