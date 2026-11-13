/**
 * @template T
 * @param {(x: number, y: number, e: PointerEvent | MouseEvent) => T | null | undefined} pick
 * @param {(hover: { d: T, px: number, py: number } | null) => void} set
 * @returns {import('svelte/attachments').Attachment<Element>}
 */
export function hoverTap(pick, set) {
	return (node) => {
		/** @param {PointerEvent | MouseEvent} e */
		const at = (e) => {
			const r = node.getBoundingClientRect();
			const px = e.clientX - r.left;
			const py = e.clientY - r.top;
			const d = pick(px, py, e);
			set(d == null ? null : { d, px, py });
		};
		/** @param {PointerEvent} e */
		const onMove = (e) => e.pointerType !== 'touch' && at(e);
		/** @param {PointerEvent} e */
		const onLeave = (e) => e.pointerType !== 'touch' && set(null);
		/** @param {PointerEvent} e */
		const away = (e) =>
			e.pointerType === 'touch' && !node.contains(/** @type {Node} */ (e.target)) && set(null);
		node.addEventListener('pointermove', /** @type {EventListener} */ (onMove));
		node.addEventListener('pointerleave', /** @type {EventListener} */ (onLeave));
		node.addEventListener('click', at);
		document.addEventListener('pointerdown', away, { passive: true });
		return () => {
			node.removeEventListener('pointermove', /** @type {EventListener} */ (onMove));
			node.removeEventListener('pointerleave', /** @type {EventListener} */ (onLeave));
			node.removeEventListener('click', at);
			document.removeEventListener('pointerdown', away);
		};
	};
}
