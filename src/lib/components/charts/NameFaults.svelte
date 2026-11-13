<script>
	import { scaleLinear, scaleLog } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import raw from '$data/name_faults.json';
	import { inr, pct } from './theme.js';

	/** @type {Record<string, string[]>} */
	const EXAMPLES = {
		'Printed as symbols': ['¸ÀÄgÉÃ±ï', 'gÁªÀÄ¥Àà', '®PÀëöä', 'ªÀÄAdÄ'],
		'Digits inside the name': ['Ramesh2', 'Manjula1', 'Shiva9', 'Gowri 4'],
		'A single letter or digit': ['K', 'M', 'S', '1', 'B', 'R'],
		'A placeholder': ['nil', 'xxx', 'abc', '.', '-'],
		'A voter ID or phone number': ['98••••••12', 'KA/••/•••'],
		'A date of birth': ['12-04-1987', '01/01/1970'],
		'An email address': ['•••@gmail.com'],
		other: ['wife', 'son', 'daughter']
	};
	const LABELS = { 'A voter ID or phone number': 'An ID or phone number' };

	const lead = raw.find((d) => d.lead);
	const rows = [
		...lead.children.map((c) => ({
			key: `w:${c.kind}`,
			label: c.kind === 'other' ? 'other words' : `“${c.kind}”`,
			n: c.n,
			word: true,
			hatch: false,
			note: 'printed as the relative’s name',
			spec: EXAMPLES[c.kind] ?? [c.kind]
		})),
		...raw
			.filter((d) => !d.lead)
			.map((d) => ({
				key: `k:${d.kind}`,
				label: LABELS[d.kind] ?? d.kind,
				n: d.n,
				word: false,
				hatch: !!d.hatch,
				note: d.note ?? '',
				spec: EXAMPLES[d.kind]
			}))
	].sort((a, b) => b.n - a.n);
	const total = rows.reduce((s, d) => s + d.n, 0);

	/** extra height to spread across the rows, for a frame taller than the chart (the share images) */
	let { stretch = 0 } = $props();

	let width = $state(680);
	const w = $derived(Math.max(width, 300));
	const narrow = $derived(w < 540);
	const LAB = $derived(narrow ? 0 : 176);
	const END = 52;
	const B = $derived(w - LAB - END);
	const RH = $derived((narrow ? 52 : 30) + stretch / rows.length);
	const BAR = $derived(Math.min(28, 22 + stretch / rows.length / 2));
	const AX = 26;
	const TOP = $derived(AX + (narrow ? 26 : 0));
	const H = $derived(TOP + rows.length * RH);

	let log = $state(true);
	let switching = $state(false);
	const MORPH = 450;

	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let switchTimer;
	/** @param {boolean} v */
	function setLog(v) {
		if (v === log) return;
		switching = true;
		log = v;
		clearTimeout(switchTimer);
		switchTimer = setTimeout(() => (switching = false), MORPH + 50);
	}

	const xlog = $derived(scaleLog().domain([1, 10000]).range([0, B]));
	const xlin = $derived(scaleLinear().domain([0, 3500]).range([0, B]));
	/** @param {number} v */
	const x = (v) => (log ? xlog(Math.max(v, 1)) : xlin(v));

	const LOG_TICKS = [1, 10, 100, 1000, 10000];
	const LIN_TICKS = [0, 1000, 2000, 3000];

	/** @param {(typeof rows)[number]} r */
	const tone = (r) => (r.word ? 'lead' : r.hatch ? 'hatch' : 'pale');
	/** @param {string[]} spec */
	const fill = (spec) => Array.from({ length: 80 }, (_, i) => spec[i % spec.length]).join(' ');
	/** @param {string} key */
	const cid = (key) => `nf-${key.replace(/\W/g, '_')}`;

	/** @type {{ d: (typeof rows)[number], px: number, py: number } | null} */
	let hover = $state(null);
	/** @param {number} _x @param {number} _y @param {Event} e */
	const pick = (_x, _y, e) => {
		const g = /** @type {Element} */ (e.target).closest('[data-key]');
		return g && rows.find((r) => r.key === g.getAttribute('data-key'));
	};
</script>

<ChartFrame
	title="About 10,000 voters have something other than a name where a name should be"
	dek="Entries printed in place of a voter's or relative's name, by kind, Karnataka, final roll, October 2026"
	source="Source: Diagram Chasing"
>
	{#snippet controls()}
		<div class="seg" role="group" aria-label="Scale">
			<button aria-pressed={log} onclick={() => setLog(true)}>Log</button>
			<button aria-pressed={!log} onclick={() => setLog(false)}>Normal</button>
		</div>
	{/snippet}
	<div class={['plot', { switching }]} style:--morph="{MORPH}ms" bind:clientWidth={width}>
		<svg
			width={w}
			height={H}
			role="img"
			aria-label="Bars for {inr(total)} name-field faults by kind, on a {log
				? 'log'
				: 'normal'} scale"
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			<defs>
				{#each rows as r (r.key)}
					<clipPath id={cid(r.key)}>
						<rect
							class="grow"
							y={-BAR / 2}
							width={B}
							height={BAR}
							style:transform="scaleX({x(r.n) / B})"
						/>
					</clipPath>
				{/each}
			</defs>

			<text
				class="axt"
				x={narrow ? 0 : LAB - 12}
				y={narrow ? AX + 14 : 12}
				text-anchor={narrow ? 'start' : 'end'}>Printed in place of a name</text
			>

			<g transform="translate({LAB}, 0)">
				{#each LOG_TICKS as v (v)}
					<g class="tk" style:transform="translateX({x(v)}px)" style:opacity={log ? 1 : 0}>
						<line y1={AX - 8} y2={H} />
						<text y="12" text-anchor={v === 1 ? 'start' : 'middle'}>{inr(v)}</text>
					</g>
				{/each}
				{#each LIN_TICKS as v (v)}
					<g class="tk" style:transform="translateX({x(v)}px)" style:opacity={log ? 0 : 1}>
						<line y1={AX - 8} y2={H} />
						<text y="12" text-anchor={v === 0 ? 'start' : 'middle'}>{inr(v)}</text>
					</g>
				{/each}
			</g>

			{#each rows as r, i (r.key)}
				{@const sx = x(r.n) / B}
				<g
					class={['row', tone(r), { hot: hover?.d.key === r.key }]}
					transform="translate(0, {TOP + i * RH + RH / 2 + (narrow ? 10 : 0)})"
					data-key={r.key}
				>
					<rect class="hit" x="0" y={-RH / 2 - (narrow ? 10 : 0)} width={w} height={RH} />
					<text
						class="lab"
						x={narrow ? 0 : LAB - 12}
						y={narrow ? -BAR / 2 - 10 : 0}
						text-anchor={narrow ? 'start' : 'end'}>{r.label}</text
					>
					<g transform="translate({LAB}, 0)">
						<rect
							class="bar grow"
							y={-BAR / 2}
							width={B}
							height={BAR}
							vector-effect="non-scaling-stroke"
							style:transform="scaleX({sx})"
						/>
						<text class="words" x="6" clip-path="url(#{cid(r.key)})">{fill(r.spec)}</text>
						<text class="val grow" style:transform="translateX({sx * B + 8}px)">{inr(r.n)}</text>
					</g>
				</g>
			{/each}
		</svg>
		{#if hover}
			<HoverCard
				x={hover.px}
				y={hover.py}
				{w}
				title={hover.d.label}
				sub={hover.d.note}
				rows={[
					['Entries', inr(hover.d.n)],
					['Share of all', pct((100 * hover.d.n) / total, 1)]
				]}
			/>
		{/if}
	</div>
</ChartFrame>

<style>
	.plot {
		--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
		--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
		overflow-x: clip;
	}
	text {
		dominant-baseline: middle;
	}

	.tk {
		transition: opacity 200ms var(--ease-out);
	}
	.tk line {
		stroke: var(--c-grid);
	}
	.tk text {
		fill: var(--c-mute);
		font-size: 12px;
	}
	.switching .tk {
		transition:
			transform var(--morph) var(--ease-in-out),
			opacity 200ms var(--ease-out);
	}

	/* on a phone the labels sit over the gridlines; a halo in the page colour cuts the lines behind them */
	.axt,
	.lab,
	.val {
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 4px;
		stroke-linejoin: round;
	}
	.axt {
		fill: var(--c-mute);
		font-size: 12px;
	}
	.hit {
		fill: transparent;
	}
	.lab {
		fill: var(--c-ink);
		font-size: 14px;
	}
	.lead .lab {
		font-weight: 700;
	}

	.grow {
		transform-origin: 0 0;
	}
	.switching .grow {
		transition: transform var(--morph) var(--ease-in-out);
	}
	.bar {
		stroke: var(--c-outline);
		stroke-width: 2px;
		shape-rendering: crispEdges;
		transition: fill 150ms ease;
	}
	.switching .bar {
		transition:
			transform var(--morph) var(--ease-in-out),
			fill 150ms ease;
	}
	.lead .bar {
		fill: var(--d-w3);
	}
	.pale .bar {
		fill: var(--d-wx);
	}
	.hatch .bar {
		fill: var(--c-bg);
	}
	.lead.hot .bar {
		fill: var(--d-w2);
	}
	.pale.hot .bar {
		fill: var(--d-w0);
	}
	.hatch.hot .bar {
		fill: var(--c-panel);
	}
	.words {
		font-size: 12px;
		white-space: pre;
		pointer-events: none;
	}
	.lead .words {
		fill: rgb(255 255 255 / 0.85);
	}
	.pale .words {
		fill: color-mix(in oklch, #2b2b2b 62%, var(--d-wx));
	}
	.hatch .words {
		fill: color-mix(in oklch, var(--c-ink) 62%, var(--c-bg));
	}
	.val {
		fill: var(--c-ink);
		font-size: 14px;
		font-weight: 700;
	}

	@media (prefers-reduced-motion: reduce) {
		.switching .grow,
		.switching .tk {
			transition: opacity 200ms var(--ease-out);
		}
		.switching .bar {
			transition: fill 150ms ease;
		}
	}
</style>
