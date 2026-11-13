// Statewide counts the charts quote, taken from the data files so they follow a data refresh.
import returns from './asddo_return.json';
import duplicates from './duplicates.json';
import nameFaults from './name_faults.json';
import reusedIds from './reused_ids.json';
import { CONSTITUENCIES } from './constituencies.js';

const sum = (/** @type {number[]} */ xs) => xs.reduce((s, x) => s + x, 0);

/** @template T @param {T[]} rows @param {(d: T) => boolean} test @param {string} what */
function one(rows, test, what) {
	const d = rows.find(test);
	if (!d) throw new Error(`no ${what} row in the data`);
	return d;
}

/** Struck off before the draft roll and found, by voter ID, in the January 2025 roll. */
export const STRUCK_OFF = sum(returns.map((d) => d.dropped));
/** Of those, back on the final roll in the same constituency. */
export const CAME_BACK = sum(returns.map((d) => d.back));
/** The match finds about 85% of those who came back, so the count is quoted to the hundred. */
export const CAME_BACK_ROUNDED = Math.round(CAME_BACK / 100) * 100;
export const DEAD_CAME_BACK = one(returns, (d) => d.category === 'dead', 'dead').back;
export const DUPLICATE_PEOPLE = duplicates.people;
export const GARBLED_NAMES = one(
	nameFaults,
	(d) => d.kind === 'Printed as symbols',
	'garbled-name'
).n;
export const REUSED_IDS = reusedIds.length;
export const NO_HOUSE_NUMBER = sum(CONSTITUENCIES.map((d) => d.house0));
