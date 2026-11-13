<script>
	// Know your constituency: search, the chosen constituency's voter card, and share and copy-link keys.
	import { Share2, Check, Link } from '@lucide/svelte';
	import ChartFrame from './ChartFrame.svelte';
	import ConstituencySearch from './ConstituencySearch.svelte';
	import ConstituencyVoterCard from './ConstituencyVoterCard.svelte';
	import { BY_AC, DEFAULT_AC } from './constituency-card.js';
	import { cardToPng } from './constituency-card-png.js';
	import { onMount } from 'svelte';

	/** @typedef {import('$data/constituencies.js').Constituency} Constituency */

	let ac = $state(DEFAULT_AC);
	const c = $derived(/** @type {Constituency} */ (BY_AC.get(ac)));

	let busy = $state(false);
	let done = $state(/** @type {'' | 'png' | 'link'} */ (''));
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let t;
	function flash(/** @type {'png' | 'link'} */ k) {
		done = k;
		clearTimeout(t);
		t = setTimeout(() => (done = ''), 1600);
	}

	/** drawn ahead and kept per constituency: Safari opens the share sheet only close to the tap */
	/** @type {{ ac: number, png: Promise<Blob> } | null} */
	let drawn = null;
	function draw(/** @type {Constituency} */ k) {
		if (drawn?.ac !== k.ac) {
			const png = cardToPng(k);
			png.catch(() => {
				if (drawn?.png === png) drawn = null;
			});
			drawn = { ac: k.ac, png };
		}
		return drawn.png;
	}

	let seen = $state(false);
	/** @type {import('svelte/action').Action<HTMLElement>} */
	function near(node) {
		const io = new IntersectionObserver(
			(es) => {
				if (es.some((e) => e.isIntersecting)) {
					seen = true;
					io.disconnect();
				}
			},
			{ rootMargin: '200px 0px' }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}
	$effect(() => {
		if (!seen) return;
		const k = c;
		const id = setTimeout(() => draw(k), 300);
		return () => clearTimeout(id);
	});

	async function share() {
		if (busy) return;
		busy = true;
		try {
			const blob = await draw(c);
			const file = new File([blob], `${c.name.replace(/\s+/g, '-')}-sir.png`, {
				type: 'image/png'
			});
			if (navigator.canShare?.({ files: [file] })) {
				try {
					await navigator.share({ files: [file], title: c.name });
					flash('png');
					return;
				} catch (e) {
					// closing the share sheet is an answer, not a failure; anything else falls back to a download
					if (/** @type {Error} */ (e).name === 'AbortError') return;
				}
			}
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = file.name;
			a.click();
			setTimeout(() => URL.revokeObjectURL(a.href), 1000);
			flash('png');
		} finally {
			busy = false;
		}
	}
	/** the link to this card: the page's own address (so it works on previews too), the
	 * constituency as ?ac=, and the section's anchor */
	function link() {
		return `${location.origin}${location.pathname}?ac=${ac}#your-constituency`;
	}
	async function copyLink() {
		const text = link();
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// no async clipboard (an http page, an older browser): copy through a selected field
			const f = document.createElement('textarea');
			f.value = text;
			f.setAttribute('readonly', '');
			f.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
			document.body.appendChild(f);
			f.select();
			const ok = document.execCommand('copy');
			f.remove();
			if (!ok) return;
		}
		flash('link');
	}

	// a shared link opens on its constituency
	onMount(() => {
		const n = Number(new URLSearchParams(location.search).get('ac'));
		if (BY_AC.has(n)) ac = n;
	});
</script>

<div class="kyc" use:near>
	<ChartFrame>
		{#snippet controls()}
			<ConstituencySearch bind:ac id="your-constituency-search" />
		{/snippet}

		{#key ac}
			<div class="stage">
				<ConstituencyVoterCard {c} />
			</div>
		{/key}

		<div class="actions">
			<button type="button" class="key" onclick={share} disabled={busy}>
				{#if done === 'png'}<Check size={16} strokeWidth={2.25} aria-hidden="true" /> Saved{:else}<Share2
						size={16}
						strokeWidth={2.25}
						aria-hidden="true"
					/> Share this card{/if}
			</button>
			<button type="button" class="key quiet" onclick={copyLink}>
				{#if done === 'link'}<Check size={16} strokeWidth={2.25} aria-hidden="true" /> Copied{:else}<Link
						size={16}
						strokeWidth={2.25}
						aria-hidden="true"
					/> Copy link{/if}
			</button>
		</div>
	</ChartFrame>
</div>

<style>
	.kyc {
		max-width: 36rem;
		margin-inline: auto;
	}
	.kyc :global(.combo.field) {
		width: 100%;
	}
	.stage {
		box-shadow: var(--shadow-sheet);
		animation: in 220ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 40px;
		padding: 0 1rem;
		border: 0;
		border-radius: var(--ui-r);
		background: var(--foreground);
		color: var(--background);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--shadow-sheet);
		transition: background-color 120ms ease-out;
	}
	.key:hover {
		background: color-mix(in oklch, var(--foreground) 85%, var(--background));
	}
	.key:active {
		transform: translateY(0.5px);
	}
	.key:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.key.quiet {
		background: var(--ui-track);
		color: var(--foreground);
		box-shadow: none;
	}
	.key.quiet:hover {
		background: var(--ui-track-hover);
	}
	.key:focus-visible {
		outline: 2px solid var(--story-orange);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.stage {
			animation: none;
		}
	}
</style>
