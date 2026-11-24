import { error } from '@sveltejs/kit';
import { BY_SLUG, ESSAY, STATES } from '$data/states/index.js';

// One page of findings for each state other than the essay's.
export const entries = () => STATES.filter((s) => s.slug !== ESSAY).map((s) => ({ state: s.slug }));

export function load({ params }) {
	const state = BY_SLUG.get(params.state);
	if (!state || state.slug === ESSAY) error(404, 'Not found');
	return { state };
}
