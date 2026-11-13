const icons = import.meta.glob('/src/lib/assets/favicons/*.png', {
	eager: true,
	query: '?url',
	import: 'default'
});

/** @param {string} key */
export const iconUrl = (key) =>
	/** @type {string | undefined} */ (icons[`/src/lib/assets/favicons/${key}.png`]);

/** @typedef {{ pub: string, icon: string, date: string, title: string, url: string, text: string }} Source */

/** @type {Record<string, Source>} */
export const SOURCES = {
	print: {
		pub: 'ThePrint',
		icon: 'theprint',
		date: '15 October 2026',
		title:
			'All of the eight past SIRs upped the electorate. Why this is the only time voter numbers shrank',
		url: 'https://theprint.in/india/governance/all-of-the-eight-past-sirs-upped-the-electorate-why-this-is-the-only-time-voter-numbers-shrank/3071676/',
		text: 'All eight intensive revisions since 1952 added voters. This is the first to shrink the rolls: the drafts flagged 13.4 crore of 95.4 crore voters nationwide.'
	},
	outlook: {
		pub: 'Outlook',
		icon: 'outlook',
		date: '27 October 2026',
		title: 'Karnataka SIR: What The Final Electoral Roll Reveals About Nearly 1 Cr Voter Deletions',
		url: 'https://www.outlookindia.com/national/karnataka-sir-what-the-final-electoral-roll-reveals-about-nearly-1-cr-voter-deletions',
		text: 'At least 61,059 deletion requests filed by officials gave no reason, though the 1960 rules require one. Officials said the system generated them under their digital signatures.'
	},
	newslaundry: {
		pub: 'Newslaundry',
		icon: 'newslaundry',
		date: '18 August 2025',
		title: 'CEC Gyanesh Kumar’s defence on Bihar’s ‘0’ house numbers not convincing',
		url: 'https://www.newslaundry.com/2025/08/18/cec-gyanesh-kumars-defence-on-bihars-0-house-numbers-not-convincing',
		text: "When the Chief Election Commissioner said this about Bihar, Bihar's own electoral office called the zeros errors, and officials said BLOs have no rules for assigning notional numbers."
	},
	form6: {
		pub: 'Scroll',
		icon: 'scroll',
		date: '4 November 2026',
		title:
			'Voters will not face action for submitting Form 6 after being deleted during SIR, says EC',
		url: 'https://scroll.in/latest/1096858/voters-will-not-face-action-for-submitting-form-6-after-being-deleted-during-sir-says-ec',
		text: 'Form 6 asks you to declare you have never been enrolled. Only on 4 November, a week after the final roll, did the Commission say nobody would be prosecuted for it.'
	},
	bengal: {
		pub: 'Scroll',
		icon: 'scroll',
		date: '29 December 2025',
		title:
			'West Bengal SIR: EC halts hearings for ‘unmapped’ voters whose names were present in 2002 rolls',
		url: 'https://scroll.in/latest/1089637/west-bengal-sir-ec-halts-hearings-for-unmapped-voters-whose-names-were-present-in-2002-rolls',
		text: "In West Bengal the same failure had a known cause: the 2002 roll was never fully converted to text, so the software couldn't match people to it. The Commission halted those hearings."
	},
	logical: {
		pub: 'The News Minute',
		icon: 'tnm',
		date: '10 July 2026',
		title: 'Explained: ‘Logical discrepancies’ in the SIR process and how it works',
		url: 'https://www.thenewsminute.com/karnataka/explained-logical-discrepancies-in-the-sir-process-and-how-it-works',
		text: "The term isn't in election law. Karnataka's notices can cite up to 11 such flags, including submitting only Aadhaar, or a woman now linked to her husband rather than her father."
	},
	wire: {
		pub: 'The Wire',
		icon: 'wire',
		date: '21 October 2026',
		title:
			"Election Commission Makes Four Changes to ECINet Software After Maharashtra CEO's Intervention",
		url: 'https://m.thewire.in/article/rights/election-commission-makes-four-changes-to-ecinet-software-after-maharashtra-ceos-intervention',
		text: "Midway through the revision, after Maharashtra's CEO objected, the Commission let each Electoral Registration Officer decide logical discrepancy cases on their own judgement."
	},
	sc: {
		pub: 'Supreme Court of India',
		icon: 'sci',
		date: '12 October 2018',
		title: 'Kamal Nath v. Election Commission of India',
		url: 'https://api.sci.gov.in/supremecourt/2018/29281/29281_2018_Judgement_12-Oct-2018.pdf',
		text: 'The court left the format of the rolls to the Commission, which argued that searchable text would enable voter profiling and data mining.'
	}
};
