// Checks each state's data against the contract in src/lib/data/states/findings.js.
//
//   pnpm states                  every state under src/lib/data/states/
//   pnpm states uttar-pradesh    one state
//
// A state is a folder holding state.json (its documents and the twelve ledger counts) and
// by_ac.json (one row per constituency). A count given without the documents it needs, or rows
// that don't add up, fail the run. Counts still to come and blanks still to fill are listed.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AC_FIELDS, DOCUMENTS, FINDINGS } from '../src/lib/data/states/findings.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/data/states');
const CORE = ['ac', 'constituency', 'district', 'electors'];

const json = (/** @type {string} */ p) => JSON.parse(readFileSync(p, 'utf8'));
const isCount = (/** @type {unknown} */ v) => Number.isInteger(v) && /** @type {number} */ (v) >= 0;
const sum = (/** @type {number[]} */ xs) => xs.reduce((s, x) => s + x, 0);

/** The first set of documents the state has in full. @param {string[][]} needs @param {Set<string>} have */
const met = (needs, have) => needs.find((set) => set.every((d) => have.has(d))) ?? null;
/** @param {string[][]} needs */
const wants = (needs) => needs.map((set) => set.join(' + ')).join(', or ');

/**
 * The constituency rows, or null when the file has not arrived. Karnataka's still sit in the
 * story's original two files, named by `legacyFiles`.
 * @param {string} dir @param {import('../src/lib/data/states/findings.js').StateFile} state
 */
function loadRows(dir, state) {
	if (state.legacyFiles) {
		const before = new Map(
			json(join(dir, state.legacyFiles.electorsBefore)).map((/** @type {any} */ d) => [
				d.ac,
				d.electors_2025
			])
		);
		return json(join(dir, state.legacyFiles.byAc)).map((/** @type {any} */ d) =>
			before.has(d.ac) ? { ...d, electors_before: before.get(d.ac) } : d
		);
	}
	const file = join(dir, 'by_ac.json');
	return existsSync(file) ? json(file) : null;
}

/** @param {string} slug */
function check(slug) {
	const dir = join(ROOT, slug);
	/** @type {string[]} */
	const errors = [];
	/** @type {[string, string][]} */
	const lines = [];
	/** @type {import('../src/lib/data/states/findings.js').StateFile} */
	const state = json(join(dir, 'state.json'));

	if (state.slug !== slug) errors.push(`slug is "${state.slug}", folder is "${slug}"`);
	if (!state.name) errors.push('name is missing');
	if (!/^[SU]\d{2}$/.test(state.eciCode ?? '')) errors.push('eciCode should look like S10');
	if (!isCount(state.constituencies) || !state.constituencies)
		errors.push('constituencies should be a whole number');

	// documents
	const docs = state.documents ?? {};
	const have = new Set(Object.keys(docs));
	for (const d of have) {
		if (!DOCUMENTS.includes(/** @type {any} */ (d))) errors.push(`unknown document "${d}"`);
	}
	if (!have.has('final')) errors.push('no final roll among the documents');
	lines.push(['documents', DOCUMENTS.filter((d) => have.has(d)).join(', ')]);

	const blanks = [];
	for (const d of DOCUMENTS.filter((x) => have.has(x))) {
		for (const k of /** @type {const} */ (['name', 'when', 'by'])) {
			if (!docs[d]?.[k]) blanks.push(`documents.${d}.${k}`);
		}
	}
	if (!state.finalRollDate) blanks.push('finalRollDate');
	if (!state.credit) blanks.push('credit');

	// the twelve counts
	const findings = state.findings ?? {};
	for (const k of Object.keys(findings)) {
		if (!FINDINGS.some((f) => f.key === k)) errors.push(`unknown finding "${k}"`);
	}
	const counted = [];
	const pending = [];
	const untestable = [];
	const byDifference = [];
	for (const f of FINDINGS) {
		const v = findings[f.key];
		const via = met(f.needs, have);
		if (v == null) {
			if (via) pending.push(f.key);
			else untestable.push(`${f.key} (needs ${wants(f.needs)})`);
			continue;
		}
		if (!isCount(v)) errors.push(`${f.key} should be a whole number, got ${JSON.stringify(v)}`);
		else if (!via) errors.push(`${f.key} is counted, but needs ${wants(f.needs)}`);
		else {
			counted.push(f.key);
			if (via !== f.needs[0]) byDifference.push(f.key);
			if (f.label.includes('{year}') && !state.lastSirYear) blanks.push('lastSirYear');
		}
	}
	const n = (/** @type {string} */ k) => /** @type {number} */ (findings[k]);
	if (findings.cameBack != null && findings.struckOff != null && n('cameBack') > n('struckOff'))
		errors.push('cameBack is more than struckOff');
	if (
		findings.deadCameBack != null &&
		findings.cameBack != null &&
		n('deadCameBack') > n('cameBack')
	)
		errors.push('deadCameBack is more than cameBack');

	lines.push(['counted', `${counted.length} of ${FINDINGS.length}`]);
	if (byDifference.length) lines.push(['by difference', byDifference.join(', ')]);
	if (pending.length) lines.push(['to count', pending.join(', ')]);
	if (untestable.length) lines.push(['cannot test', untestable.join('; ')]);

	// constituency rows
	const rows = loadRows(dir, state);
	if (!rows) {
		lines.push(['by_ac.json', 'not there yet']);
	} else {
		if (rows.length !== state.constituencies)
			errors.push(`by_ac has ${rows.length} rows for ${state.constituencies} constituencies`);
		if (new Set(rows.map((/** @type {any} */ r) => r.ac)).size !== rows.length)
			errors.push('by_ac repeats a constituency number');
		const known = new Set([...CORE, ...Object.keys(AC_FIELDS)]);
		const extra = new Set();
		const coverage = [];
		const acPending = [];
		for (const r of rows) {
			if (!Number.isInteger(r.ac) || r.ac < 1) errors.push(`by_ac: bad ac ${JSON.stringify(r.ac)}`);
			if (!r.constituency) errors.push(`by_ac ${r.ac}: name missing`);
			if (!r.district) blanks.push('by_ac district');
			if (!isCount(r.electors) || !r.electors) errors.push(`by_ac ${r.ac}: electors missing`);
			for (const k of Object.keys(r)) if (!known.has(k)) extra.add(k);
			if (r.dropped != null && r.electors_before != null && r.dropped > r.electors_before)
				errors.push(`by_ac ${r.ac}: dropped is more than electors_before`);
			if (r.struck_q != null && r.notices_partner != null && r.struck_q > r.notices_partner)
				errors.push(`by_ac ${r.ac}: struck_q is more than notices_partner`);
		}
		for (const [k, needs] of Object.entries(AC_FIELDS)) {
			const vals = rows.map((/** @type {any} */ r) => r[k]).filter((v) => v != null);
			const via = met(needs, have);
			if (!vals.length) {
				if (via) acPending.push(k);
				continue;
			}
			if (!via) errors.push(`by_ac.${k} is given, but needs ${wants(needs)}`);
			if (!vals.every(isCount)) errors.push(`by_ac.${k} should be whole numbers`);
			coverage.push(vals.length === rows.length ? k : `${k} (${vals.length} rows)`);
		}
		const total = (/** @type {string} */ k) => sum(rows.map((/** @type {any} */ r) => r[k] ?? 0));
		const has = (/** @type {string} */ k) => rows.some((/** @type {any} */ r) => r[k] != null);
		// each statewide count is the sum of its constituencies
		for (const [field, key] of [
			['house0', 'noHouseNumber'],
			['dropped', 'struckOff']
		]) {
			if (has(field) && findings[key] != null && total(field) !== findings[key])
				errors.push(`by_ac.${field} sums to ${total(field)}, ${key} is ${findings[key]}`);
		}
		lines.push(['by_ac', `${rows.length} rows; ${coverage.join(', ')}`]);
		if (acPending.length) lines.push(['by_ac to add', acPending.join(', ')]);
		if (extra.size) lines.push(['by_ac extras', `${[...extra].join(', ')} (not in the contract)`]);
	}

	if (blanks.length) lines.push(['to fill', [...new Set(blanks)].join(', ')]);

	console.log(`\n${state.name ?? slug}, ${state.constituencies} constituencies`);
	for (const [k, v] of lines) console.log(`  ${k.padEnd(14)}${v}`);
	for (const e of errors) console.log(`  ${'error'.padEnd(14)}${e}`);
	return errors.length;
}

const asked = process.argv.slice(2);
const slugs = asked.length
	? asked
	: readdirSync(ROOT, { withFileTypes: true })
			.filter((d) => d.isDirectory() && existsSync(join(ROOT, d.name, 'state.json')))
			.map((d) => d.name)
			.sort();

let failed = 0;
for (const slug of slugs) failed += check(slug);
console.log(failed ? `\n${failed} error${failed === 1 ? '' : 's'}` : '\nNo errors');
process.exit(failed ? 1 : 0);
