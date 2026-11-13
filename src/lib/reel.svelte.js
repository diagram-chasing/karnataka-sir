// Sections for the reading strip (Reel.svelte), found by film title or anchor, and a scroll tracker.

/** The heading that holds a film title. @param {string} film */
const heading = (film) => (/** @type {HTMLElement} */ a) =>
	/** @type {HTMLElement | null} */ (
		a.querySelector(`[data-film="${film}"]`)?.closest('h2, h3') ?? null
	);

/**
 * In reading order. Part breaks fold into the section after them.
 * @type {{ key: string, word: string, find: (a: HTMLElement) => HTMLElement | null }[]}
 */
export const REEL = [
	{ key: 'intro', word: 'The claim', find: (a) => a },
	{
		key: 'duplicates',
		word: 'Duplicates',
		find: (a) => a.querySelector('#part-1-no-ineligible-person-is-included')
	},
	{ key: 'two-places', word: 'Two constituencies', find: heading('duplicate') },
	{ key: 'houses', word: 'House numbers', find: heading('housefull') },
	{ key: 'garbled', word: 'Garbled names', find: heading('gumnaam') },
	{ key: 'fathers', word: 'Fathers', find: heading('hum-aapke-hain-koun') },
	{
		key: 'struck-off',
		word: 'Struck off',
		find: (a) => a.querySelector('#part-2-no-eligible-citizen-is-left-out')
	},
	{ key: 'unmapped', word: 'Unmapped', find: heading('main-hoon-na') },
	{ key: 'twins', word: 'Twins', find: heading('judwaa') },
	{ key: 'reused', word: 'Reused IDs', find: heading('pehchaan') },
	{ key: 'dead', word: 'Marked dead', find: heading('zinda') },
	{
		key: 'notices',
		word: 'Notices',
		find: (a) => a.querySelector('#notices')
	},
	{ key: 'so-what', word: 'So what', find: heading('jaane-bhi-do-yaaro') },
	{ key: 'methodology', word: 'Methodology', find: (a) => a.querySelector('.methodology') }
];

const LINE = 0.35; // the reading line, as a share of the viewport height from the top

/**
 * Measures the sections and follows the scroll. Call from a component's script.
 */
export function reelTracker() {
	/** @type {{ top: number, bottom: number }[]} */
	let geo = [];
	/** @type {HTMLElement | null} */
	let art = null;

	const s = $state({
		ready: false,
		current: 0,
		/** 0–1 through each section */
		fill: /** @type {number[]} */ ([]),
		/** each section's share of the story's length */
		share: /** @type {number[]} */ ([]),
		/** the reading line has entered the article (the hero is behind us) */
		pastHero: false
	});

	function measure() {
		art = document.querySelector('article.article');
		if (!art) return;
		const y = scrollY;
		const tops = REEL.map((sec) => {
			const el = sec.find(/** @type {HTMLElement} */ (art));
			return el ? el.getBoundingClientRect().top + y : NaN;
		});
		const end = art.getBoundingClientRect().bottom + y;
		geo = tops.map((top, i) => ({
			top,
			bottom: tops.slice(i + 1).find((t) => !Number.isNaN(t)) ?? end
		}));
		const total = end - geo[0].top;
		s.share = geo.map((g) => (Number.isNaN(g.top) ? 0 : (g.bottom - g.top) / total));
		s.ready = true;
		update();
	}

	function update() {
		if (!geo.length) return;
		const y = scrollY;
		const line = y + innerHeight * LINE;
		s.pastHero = line > geo[0].top + innerHeight * 0.1;
		const atEnd = y + innerHeight >= document.documentElement.scrollHeight - 2;
		const cur = atEnd
			? geo.length - 1
			: Math.max(
					0,
					geo.findLastIndex((g) => g.top <= line)
				);
		s.current = cur;
		s.fill = geo.map((g, i) =>
			atEnd || i < cur
				? 1
				: i > cur
					? 0
					: Math.min(1, Math.max(0, (line - g.top) / (g.bottom - g.top)))
		);
	}

	/** @param {number} i */
	function jump(i) {
		const el = art && REEL[i].find(art);
		if (!el) return;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const top = i === 0 ? 0 : el.getBoundingClientRect().top + scrollY - 24;
		scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
	}

	$effect(() => {
		let raf = 0;
		const schedule = (/** @type {() => void} */ fn) => () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(fn);
		};
		const onScroll = schedule(update);
		const onResize = schedule(measure);
		// first measure on the next frame, outside this effect, so it doesn't track what it writes
		onResize();
		// exhibits, charts and fonts settle after mount and move every heading below them
		const ro = new ResizeObserver(onResize);
		const a = document.querySelector('article.article');
		if (a) ro.observe(a);
		addEventListener('scroll', onScroll, { passive: true });
		addEventListener('resize', onResize);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			removeEventListener('scroll', onScroll);
			removeEventListener('resize', onResize);
		};
	});

	return { s, jump };
}
