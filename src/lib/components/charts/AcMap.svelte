<script>
	import { geoCentroid, geoMercator, geoPath } from 'd3';
	import ChartFrame from './ChartFrame.svelte';
	import { hoverTap } from './hoverTap.js';
	import HoverCard from './HoverCard.svelte';
	import RampLegend from './RampLegend.svelte';
	import acPacked from '$data/karnataka-ac.poly.json';
	import statePacked from '$data/karnataka-state.poly.json';
	import blrPacked from '$data/bengaluru-ac.poly.json';
	import { unpack, compactPath, tangents } from './geo.js';
	import { BY_AC, MIN_NOTICES } from '$data/constituencies.js';
	import { inr, pct, lakh, step, RAMP, STRUCK_STEPS } from './theme.js';

	/** @type {{ metric?: 'notice-rate' | 'electors-change' | 'struck-off' }} */
	let { metric = 'notice-rate' } = $props();

	const acGeo = unpack(acPacked);
	const stateGeo = unpack(statePacked);
	// the lens draws Bengaluru from finer boundaries than the state map needs
	const BLR_FINE = new Map(unpack(blrPacked).features.map((f) => [f.properties.ac, f]));
	let active = $state(metric);

	const NA = 'url(#hatch)';
	/** K.R. Pura, R.R. Nagar and Bommanahalli: city seats that sprawl to the edge, left out of the lens's framing. */
	const SPRAWL = new Set([151, 154, 175]);

	const METRICS = {
		'notice-rate': {
			label: 'Sent a notice',
			row: 'Sent a notice',
			value: (d) => d.noticePct,
			fmt: (v) => (v < 1 ? pct(v, 2) : pct(v, 0)),
			thresholds: [0.3, 1, 3, 10, 30],
			title: 'Notices were far more common in Bengaluru than anywhere else in the state',
			dek: 'Share of voters sent a notice, by assembly constituency, Karnataka, August to October 2026',
			legend: 'Voters sent a notice',
			tip: (d) => [
				['Notices', inr(d.notices)],
				['Voters', lakh(d.electors)]
			],
			peak: 'the highest',
			city: {
				lead: 'All 28 Bengaluru constituencies',
				rest: 'sent a notice to over a quarter of their voters.'
			},
			far: { ac: 108, len: 90, lead: 'Mayakonda', rest: 'sent 57 notices, to 0.03% of its voters.' }
		},
		'electors-change': {
			label: 'Voters lost',
			row: 'Lost since Jan 2025',
			value: (d) => (d.change == null ? null : -d.change),
			fmt: (v) => (v >= 0 ? `−${v.toFixed(0)}%` : `+${(-v).toFixed(1)}%`),
			thresholds: [5, 15, 25, 35, 45],
			title: 'Bengaluru lost a far bigger share of its voters than the rest of the state',
			dek: 'Fall in the number of voters, by assembly constituency, Karnataka, January 2025 to October 2026',
			legend: 'Voters lost since January 2025',
			tip: (d) => [
				['January 2025', lakh(d.electors2025)],
				['Final roll', lakh(d.electors)]
			],
			peak: 'the biggest fall',
			city: {
				lead: 'Every Bengaluru constituency',
				rest: 'lost at least 32%. 155 of the 196 elsewhere lost under 15%.'
			},
			far: { ac: 207, len: 60, lead: 'Sullia', rest: 'was the only constituency to grow.' }
		},
		'struck-off': {
			label: 'Struck off after notice',
			row: 'Struck off after notice',
			value: (d) => d.struckPct,
			fmt: (v) => pct(v),
			thresholds: STRUCK_STEPS,
			title: 'The chance of being struck off after a notice varied widely across the state',
			dek: 'Share of voters sent a notice who were struck off as disqualified, by assembly constituency, Karnataka, October 2026',
			legend: 'Struck off after a notice',
			tip: (d) => [
				['Struck off', inr(d.struck)],
				['Notices', inr(d.listedNotices)]
			],
			peak: 'the highest',
			city: {
				lead: 'Inside Bengaluru',
				rest: 'it ran from 0.02% in Gandhinagar to 4% in Bommanahalli.'
			},
			far: {
				ac: 72,
				len: 80,
				lead: 'Hubli-Dharwad East',
				rest: 'struck off 13%, the most in the state.'
			}
		}
	};
	const m = $derived(METRICS[active]);

	const features = $derived(
		acGeo.features.map((f) => {
			const c = BY_AC.get(f.properties.ac);
			const v = m.value(c);
			const [lon, lat] = geoCentroid(f);
			return {
				...c,
				f,
				v,
				fill: v == null || Number.isNaN(v) ? NA : RAMP[step(v, m.thresholds)],
				label: v == null ? 'no data' : m.fmt(v),
				lon,
				lat
			};
		})
	);
	const hasNA = $derived(features.some((d) => d.fill === NA));
	const blr = $derived(features.filter((d) => d.blr));
	// The lens frames the 18 small inner-city seats; the big outer ones run off its edge.
	const core = $derived({
		type: 'FeatureCollection',
		features: blr
			.filter((d) => !SPRAWL.has(d.ac) && d.district.startsWith('Bengaluru'))
			.map((d) => BLR_FINE.get(d.ac))
	});

	const FS = 13;
	const LH = 16;

	let width = $state(640);
	const W = $derived(Math.max(width, 260));
	// below this the lens drops under the state map and the notes move out of the svg
	const narrow = $derived(W < 760);
	const SH = $derived(narrow ? Math.round(Math.min(W * 1.12, 560)) : 470);
	const R = $derived(
		narrow ? Math.round(Math.min(W * 0.27, 130)) : Math.round(Math.min(W * 0.15, 160))
	);
	// on a wide screen the lens leaves room on its right for the peak label
	const LX = $derived(narrow ? W - R - 1 : Math.min(Math.round(W * 0.52) + 60 + R, W - R - 150));
	const ML = $derived(narrow ? 0 : Math.round(W * 0.17));
	const MR = $derived(narrow ? W : Math.min(Math.round(W * 0.52), LX - R - 40));
	// wide: fit the state to the column's width and size the svg to it, so no empty band; narrow: a fixed box
	const proj = $derived.by(() => {
		if (narrow)
			return geoMercator().fitExtent(
				[
					[0, 4],
					[W, SH]
				],
				stateGeo
			);
		const p = geoMercator().fitWidth(MR - ML, stateGeo);
		const [tx, ty] = p.translate();
		return p.translate([tx + ML, ty + 4]);
	});
	const mapH = $derived(Math.ceil(geoPath(proj).bounds(stateGeo)[1][1]) + 4);
	const path = $derived(compactPath(proj));
	const blrY = $derived.by(() => {
		const [[, y0], [, y1]] = geoPath(proj).bounds({
			type: 'FeatureCollection',
			features: blr.map((d) => d.f)
		});
		return (y0 + y1) / 2;
	});
	// wide: the lens sits level with Bengaluru, raised if needed so it and the note under it end with the map
	const cityLines = $derived(wrap(m.city.lead, m.city.rest, 34).length);
	const lens = $derived(
		narrow
			? { x: LX, y: SH + 30 + R, r: R }
			: {
					x: LX,
					y: Math.max(R + 34, Math.min(blrY - 30, mapH - R - 28 - (cityLines - 1) * LH - 6)),
					r: R
				}
	);
	const H = $derived(
		narrow ? lens.y + R + 4 : Math.max(mapH, lens.y + R + 28 + (cityLines - 1) * LH + 6)
	);
	const iproj = $derived(
		geoMercator().fitExtent(
			[
				[lens.x - R * 0.92, lens.y - R * 0.92],
				[lens.x + R * 0.92, lens.y + R * 0.92]
			],
			core
		)
	);
	const ipath = $derived(compactPath(iproj));
	// the small ring on the state map covers exactly what the lens shows
	const ring = $derived.by(() => {
		const [x, y] = /** @type {[number, number]} */ (
			proj(/** @type {[number, number]} */ (iproj.invert([lens.x, lens.y])))
		);
		return { x, y, r: (R * proj.scale()) / iproj.scale() };
	});
	const stateD = $derived(path(stateGeo));
	const shapes = $derived(features.map((d) => ({ ...d, d: path(d.f) })));
	const ishapes = $derived(
		blr.map((d) => {
			const [x, y] = /** @type {[number, number]} */ (iproj([d.lon, d.lat]));
			return { ...d, d: ipath(BLR_FINE.get(d.ac)), x, y };
		})
	);

	/** The peak label's rendered width, for placing it on a phone. */
	let peakW = $state(0);

	/** The highest seat whose centre is well inside the lens, labelled beside it. */
	const peak = $derived.by(() => {
		const seen = ishapes.filter(
			(d) => d.v != null && Math.hypot(d.x - lens.x, d.y - lens.y) < R * 0.8
		);
		const p = seen.reduce((a, b) => (b.v > a.v ? b : a), seen[0]);
		if (!p) return null;
		// "the highest" only when it is the state's highest: a sprawling seat outside the lens can top it
		const top = Math.max(
			...features.filter((d) => d.v != null && !Number.isNaN(d.v)).map((d) => d.v)
		);
		const val = p.v >= top ? `${p.label}, ${m.peak}` : p.label;
		// wide: right of the lens. Narrow: left of it, against the leader's end, unless that would push
		// the text off the frame; then the text sits flush left and the leader reaches across to it
		const dy = p.y - lens.y;
		const rim = Math.sqrt(R * R - dy * dy);
		if (!narrow) {
			const ex = lens.x + rim + 8;
			return { ...p, ex, tx: ex + 5, anchor: 'start', val };
		}
		const ex = Math.max(lens.x - rim - 6, peakW + 5);
		return { ...p, ex, tx: ex - 5, anchor: 'end', val };
	});

	/** @param {string} lead @param {string} rest @param {number} cols */
	function wrap(lead, rest, cols) {
		const words = [
			...lead.split(' ').map((w) => ({ w, b: true })),
			...rest.split(' ').map((w) => ({ w, b: false }))
		];
		const lines = [[]];
		let n = 0;
		for (const t of words) {
			if (n && n + 1 + t.w.length > cols) {
				lines.push([]);
				n = 0;
			}
			lines[lines.length - 1].push(t);
			n += (n ? 1 : 0) + t.w.length;
		}
		return lines;
	}
	const notes = $derived.by(() => {
		if (narrow) return [];
		const f = features.find((d) => d.ac === m.far.ac);
		const [ax, ay] = /** @type {[number, number]} */ (proj([f.lon, f.lat]));
		// the leader ends far enough right that the note (right-aligned to it) keeps ~18 characters a line
		// inside the frame; it still runs up and to the left from the pin
		const ex = Math.min(ax - 24, Math.max(ax - m.far.len, 140));
		const ey = ay - m.far.len;
		return [
			{
				key: 'far',
				ax,
				ay,
				pts: `${ax},${ay} ${ex},${ey} ${ex - 8},${ey}`,
				tx: ex - 13,
				ty: ey + FS * 0.35,
				anchor: 'end',
				// wrap to the room left of the leader (about 6.7px a character at 13px), never past the frame
				lines: wrap(m.far.lead, m.far.rest, Math.max(16, Math.min(26, Math.floor((ex - 13) / 6.7))))
			},
			{
				key: 'city',
				tx: lens.x - R,
				ty: lens.y + R + 28,
				anchor: 'start',
				lines: wrap(m.city.lead, m.city.rest, 34)
			}
		];
	});

	let hover = $state(null);
	const pick = (_x, _y, e) => {
		const p = e.target.closest('path[data-ac]');
		return (
			p && { ...features.find((x) => x.ac === +p.dataset.ac), inset: p.dataset.map === 'inset' }
		);
	};
</script>

<ChartFrame
	title={m.title}
	titleLines={2}
	dek={m.dek}
	source="Sources: CEO Karnataka; Mathakaavalu; Diagram Chasing. Boundaries: KGIS"
>
	{#snippet controls()}
		<div class="seg" role="group" aria-label="Measure">
			{#each Object.entries(METRICS) as [k, v] (k)}
				<button type="button" aria-pressed={active === k} onclick={() => (active = k)}
					>{v.label}</button
				>
			{/each}
		</div>
	{/snippet}
	{#snippet legend()}
		<RampLegend label={m.legend} steps={m.thresholds}>
			<span class={['nakey', { off: !hasNA }]} aria-hidden={!hasNA}
				><i class="hatch"></i>Under {MIN_NOTICES} notices</span
			>
		</RampLegend>
	{/snippet}

	<div class="plot" bind:clientWidth={width}>
		<svg
			width={W}
			height={H}
			role="img"
			aria-label="Map of Karnataka's 224 assembly constituencies shaded by {m.legend.toLowerCase()}, with Bengaluru magnified"
			{@attach hoverTap(pick, (h) => (hover = h))}
		>
			<defs>
				<pattern
					id="hatch"
					width="3"
					height="3"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<rect width="3" height="3" fill="var(--c-bg)" />
					<line x1="0" y1="0" x2="0" y2="3" stroke="var(--c-mute)" stroke-width="0.7" />
				</pattern>
				<clipPath id="ac-lens"><circle cx={lens.x} cy={lens.y} r={R} /></clipPath>
			</defs>
			{#each shapes as s (s.ac)}
				<path class="ac" d={s.d} data-ac={s.ac} data-map="state" style:fill={s.fill} />
			{/each}
			<path class="edge" d={stateD} />

			<!-- the lens: tangents under the rings, the glass under the city -->
			{#each tangents(ring, lens) as [x1, y1, x2, y2], i (i)}
				<line class="tan" {x1} {y1} {x2} {y2} />
			{/each}
			<circle class="ring" cx={ring.x} cy={ring.y} r={ring.r} />
			<circle class="glass" cx={lens.x} cy={lens.y} r={R} />
			<g clip-path="url(#ac-lens)">
				{#each ishapes as s (s.ac)}
					<path class="ac inset" d={s.d} data-ac={s.ac} data-map="inset" style:fill={s.fill} />
				{/each}
			</g>
			<circle class="lens ring" cx={lens.x} cy={lens.y} r={R} />
			<text class="lbl" x={lens.x} y={lens.y - R - 10} text-anchor="middle">Bengaluru</text>

			{#if hover}
				<path
					class="hi"
					d={(hover.d.inset ? ishapes : shapes).find((s) => s.ac === hover.d.ac)?.d}
					clip-path={hover.d.inset ? 'url(#ac-lens)' : null}
				/>
			{/if}

			{#if peak}
				<line class="leader" x1={peak.x} y1={peak.y} x2={peak.ex} y2={peak.y} />
				<circle class="pin" cx={peak.x} cy={peak.y} r="2.5" />
				<text
					class="note"
					x={peak.tx}
					y={peak.y - 3}
					text-anchor={peak.anchor}
					{@attach (node) => {
						// re-measure whenever the label's words change
						void (peak.name + peak.val);
						peakW = /** @type {SVGTextElement} */ (node).getBBox().width;
					}}
				>
					<tspan class="b">{peak.name}</tspan>
					<tspan x={peak.tx} dy={LH}>{peak.val}</tspan>
				</text>
			{/if}

			{#each notes as n (n.key)}
				{#if n.pts}
					<polyline class="leader" points={n.pts} />
					<circle class="pin" cx={n.ax} cy={n.ay} r="2.5" />
				{/if}
				<text class="note" x={n.tx} y={n.ty} text-anchor={n.anchor}>
					{#each n.lines as line, i (i)}
						<tspan x={n.tx} dy={i ? LH : 0}>
							{#each line as t, j (j)}<tspan class:b={t.b}>{j ? ' ' : ''}{t.w}</tspan>{/each}
						</tspan>
					{/each}
				</text>
			{/each}
		</svg>
		{#if hover}
			{@const d = hover.d}
			<HoverCard
				x={hover.px}
				y={hover.py}
				w={W}
				title={d.name}
				sub={d.district === d.name ? '' : d.district}
				rows={[[m.row, d.label], ...m.tip(d)]}
			/>
		{/if}
	</div>
	{#if narrow}
		<ul class="notes">
			<li><b>{m.city.lead}</b> {m.city.rest}</li>
			<li><b>{m.far.lead}</b> {m.far.rest}</li>
		</ul>
	{/if}
</ChartFrame>

<style>
	.ac {
		stroke: var(--c-bg);
		stroke-width: 0.6px;
		stroke-linejoin: round;
	}
	.ac.inset {
		stroke-width: 0.9px;
	}
	.edge {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1px;
		pointer-events: none;
	}
	.tan {
		stroke: var(--c-ink);
		stroke-width: 1px;
		pointer-events: none;
	}
	.ring {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1.25px;
		pointer-events: none;
	}
	.ring.lens {
		stroke-width: 1.5px;
	}
	.glass {
		fill: var(--c-bg);
	}
	.hi {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 2px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.leader {
		fill: none;
		stroke: var(--c-ink);
		stroke-width: 1px;
		pointer-events: none;
	}
	.pin {
		fill: var(--c-bg);
		stroke: var(--c-ink);
		stroke-width: 1.5px;
		pointer-events: none;
	}
	.note {
		font-size: 13px;
		fill: var(--c-ink);
		paint-order: stroke;
		stroke: var(--c-bg);
		stroke-width: 4px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.note .b {
		font-weight: 700;
	}
	svg .lbl {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 13px;
		font-weight: 700;
		fill: var(--c-ink);
	}

	.nakey {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		color: var(--c-text);
	}
	.nakey i {
		display: block;
		width: 1.2rem;
		height: 0.75rem;
		box-shadow: 0 0 0 1px var(--ui-line);
		background: repeating-linear-gradient(45deg, var(--c-mute) 0 0.7px, var(--c-bg) 0.7px 3px);
	}
	.nakey.off {
		visibility: hidden;
	}
	@media (min-width: 36rem) {
		:global(.ramp:has(.nakey)) {
			position: relative;
		}
		.nakey {
			position: absolute;
			left: calc(100% + 1.25rem);
			bottom: 0.6rem;
			height: 1rem;
			white-space: nowrap;
		}
	}
	.notes {
		list-style: none;
		margin: 0.7rem 0 0;
		padding: 0;
	}
	.notes li {
		margin: 0;
		padding: 0;
		font-size: 14px;
		line-height: 1.4;
		color: var(--c-ink);
	}
	.notes li + li {
		margin-top: 0.3rem;
	}
</style>
