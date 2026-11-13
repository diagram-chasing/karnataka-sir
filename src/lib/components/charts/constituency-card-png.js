// A constituency's card as a share PNG, rendered off screen at a fixed width so it matches on any device.
import { mount, unmount, tick } from 'svelte';
import { domToBlob } from 'modern-screenshot';
import ConstituencyShare from './ConstituencyShare.svelte';

/**
 * @param {import('$data/constituencies.js').Constituency} c
 * @param {{ w?: number }} o the image's width in pixels
 * @returns {Promise<Blob>}
 */
export async function cardToPng(c, { w = 1080 } = {}) {
	// off screen but laid out and painted: a hidden holder would hand its visibility to the copy
	const holder = document.createElement('div');
	holder.setAttribute('aria-hidden', 'true');
	holder.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;contain:layout';
	document.body.appendChild(holder);
	const app = mount(ConstituencyShare, { target: holder, props: { c } });
	try {
		await tick();
		await document.fonts?.ready;
		await Promise.all(
			[...holder.querySelectorAll('img')].map((img) => img.decode().catch(() => {}))
		);
		const node = /** @type {HTMLElement} */ (holder.firstElementChild);
		const blob = await domToBlob(node, {
			scale: w / node.offsetWidth,
			backgroundColor: '#fff',
			type: 'image/png'
		});
		if (!blob) throw new Error('domToBlob failed');
		return blob;
	} finally {
		unmount(app);
		holder.remove();
	}
}
