import { story } from '$config';

const ANALYTICS =
	import.meta.env.PROD && story.analyticsId
		? `<script defer data-domain="${story.analyticsId}" src="https://analytics.aman.bh/js/script.js"></script>`
		: '';

export async function handle({ event, resolve }) {
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%analytics%', ANALYTICS)
	});
}
