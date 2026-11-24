import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { ESSAY } from '$data/states/index.js';

// The story's own address opens the essay.
export function load() {
	redirect(308, `${base}/${ESSAY}`);
}
