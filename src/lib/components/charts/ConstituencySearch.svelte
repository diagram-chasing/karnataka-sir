<script module>
	import { CONSTITUENCIES } from '$data/constituencies.js';

	/** Name and district search, forgiving about dots, spaces and case; names that start with it first. @param {string} q */
	function search(q) {
		const norm = (/** @type {string} */ s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
		const n = norm(q);
		if (!n) return CONSTITUENCIES;
		const starts = [];
		const has = [];
		for (const d of CONSTITUENCIES) {
			const nm = norm(d.name);
			if (nm.startsWith(n)) starts.push(d);
			else if (nm.includes(n) || norm(d.district).includes(n)) has.push(d);
		}
		return [...starts, ...has];
	}
</script>

<script>
	// Combobox over the 224 constituencies; focusing selects the shown name so typing replaces it.
	import { X } from '@lucide/svelte';
	import { BY_AC } from '$data/constituencies.js';

	/** @type {{ ac: number, id?: string }} */
	let { ac = $bindable(), id = 'constituency-search' } = $props();

	let query = $state('');
	let open = $state(false);
	let active = $state(0);
	let editing = $state(false);
	/** @type {HTMLUListElement | undefined} */
	let list = $state();

	const results = $derived(search(query).slice(0, 8));
	const shown = $derived(editing ? query : (BY_AC.get(ac)?.name ?? ''));

	/** @param {number} next */
	function pick(next) {
		ac = next;
		open = false;
		editing = false;
		query = '';
	}

	/** @param {KeyboardEvent & { currentTarget: HTMLInputElement }} e */
	function onkeydown(e) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			open = true;
			active = Math.min(results.length - 1, active + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(0, active - 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (open && results[active]) pick(results[active].ac);
		} else if (e.key === 'Escape') {
			open = false;
			editing = false;
			query = '';
			e.currentTarget.blur();
		}
	}

	$effect(() => {
		// keep the active option in view while arrowing
		list?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
	});
</script>

<div class="combo field">
	<input
		{id}
		type="search"
		role="combobox"
		autocomplete="off"
		spellcheck="false"
		aria-expanded={open}
		aria-controls="{id}-list"
		aria-activedescendant={open && results[active] ? `${id}-o${active}` : undefined}
		aria-label="Your constituency"
		placeholder="Search for a constituency or district"
		value={shown}
		onfocus={(e) => {
			editing = true;
			query = '';
			open = true;
			active = 0;
			e.currentTarget.select();
		}}
		oninput={(e) => {
			query = e.currentTarget.value;
			editing = true;
			open = true;
			active = 0;
		}}
		onblur={() => {
			// let a click on an option land first
			setTimeout(() => {
				open = false;
				editing = false;
				query = '';
			}, 120);
		}}
		{onkeydown}
	/>
	{#if editing && query}
		<button
			type="button"
			class="clear"
			aria-label="Clear search"
			onpointerdown={(e) => {
				// keep focus in the field, so the list stays open for a new search
				e.preventDefault();
				query = '';
				active = 0;
			}}
			onclick={() => {
				query = '';
				active = 0;
			}}><X size={16} strokeWidth={2.25} aria-hidden="true" /></button
		>
	{/if}
	{#if open}
		<ul class="list" role="listbox" id="{id}-list" bind:this={list}>
			{#each results as d, i (d.ac)}
				<li
					id="{id}-o{i}"
					data-i={i}
					role="option"
					aria-selected={i === active}
					class={{ on: i === active, cur: d.ac === ac }}
					onpointerdown={(e) => {
						e.preventDefault();
						pick(d.ac);
					}}
					onpointermove={() => (active = i)}
				>
					<span class="nm">{d.name}</span> <span class="ds">{d.district}</span>
				</li>
			{:else}
				<li class="none">No constituency by that name</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.combo {
		position: relative;
		width: 21rem;
		max-width: 100%;
	}
	/* the field itself takes ChartFrame's .chart input, as ConstituencyTable's does */
	.list {
		position: absolute;
		z-index: 5;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		max-height: 18rem;
		overflow-y: auto;
		margin: 0;
		padding: 4px;
		list-style: none;
		background: var(--c-bg, var(--background));
		border-radius: var(--ui-r-sheet);
		box-shadow: var(--shadow-print);
		transform-origin: top center;
		animation: drop 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.list {
			animation: none;
		}
	}
	li {
		margin: 0;
		padding: 0.45rem 0.6rem;
		border-radius: var(--ui-r-key);
		font-size: 0.9375rem;
		line-height: 1.25;
		cursor: pointer;
	}
	li.on {
		background: var(--ui-track);
	}
	.nm {
		font-weight: 700;
	}
	.cur .nm {
		color: var(--story-orange);
	}
	.ds {
		font-size: 0.8125rem;
		color: var(--c-text, var(--muted-foreground));
	}
	.none {
		color: var(--c-text, var(--muted-foreground));
		cursor: default;
	}
</style>
