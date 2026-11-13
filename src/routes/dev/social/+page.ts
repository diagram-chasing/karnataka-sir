import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

export const prerender = false;
export const ssr = false;
export const load = ({ url }) => {
	if (!dev) error(404, 'Not found');
	return { f: url.searchParams.get('f') ?? 'portrait', c: url.searchParams.get('c') ?? 'cover' };
};
