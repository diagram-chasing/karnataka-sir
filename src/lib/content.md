<script>
    import booklet from '$images/booklet-page-6.png?w=1400&format=webp';
    import Part from '$lib/components/Part.svelte';
    import AcMap from '$charts/AcMap.svelte';
    import ConstituencyTable from '$charts/ConstituencyTable.svelte';
    import DuplicateCards from '$charts/DuplicateCards.svelte';
    import Exhibit from '$charts/Exhibit.svelte';
    import FindingsLedger from '$charts/FindingsLedger.svelte';
    import GarbledBooths from '$charts/GarbledBooths.svelte';
    import NameFaults from '$charts/NameFaults.svelte';
    import NoticeScatter from '$charts/NoticeScatter.svelte';
    import ReasonsTable from '$charts/ReasonsTable.svelte';
    import ReturnRates from '$charts/ReturnRates.svelte';
    import ReusedIds from '$charts/ReusedIds.svelte';
    import ReturnWall from '$charts/ReturnWall.svelte';
    import RollFunnel from '$charts/RollFunnel.svelte';
    import YourConstituency from '$charts/YourConstituency.svelte';
    import ConstituencyCard from '$charts/ConstituencyCard.svelte';
    import FilmTitle from '$lib/components/FilmTitle.svelte';
    import Num from '$lib/components/Num.svelte';
    import Term from '$lib/components/Term.svelte';
    import Note from '$lib/components/Note.svelte';
    import Pull from '$lib/components/Pull.svelte';
    import Excerpt from '$lib/components/Excerpt.svelte';
    import DataTrail from '$lib/components/DataTrail.svelte';
    import Trail from '$lib/components/Trail.svelte';
    import TrailStep from '$lib/components/TrailStep.svelte';
    import DonateCTA from '$lib/components/DonateCTA.svelte';
    import Tally from '$lib/components/Tally.svelte';
    import { GARBLED_NAMES, NO_HOUSE_NUMBER } from '$data/totals.js';
</script>

<div class="epigraph">

<blockquote>

No eligible citizen is left out while no ineligible person is included in the electoral roll.

<footer>The Chief Electoral Officer of Karnataka, 27&nbsp;October&nbsp;2026</footer> </blockquote> </div>

On October 27, Karnataka's Chief Electoral Officer released the final electoral roll for the <Term id="sir" text="Special Intensive Revision" />. This is the 8th such revision of voter rolls to happen in India but is distinct because all eight earlier revisions of this kind grew the electorate, and [this has been the first to shrink it](https://theprint.in/india/governance/all-of-the-eight-past-sirs-upped-the-electorate-why-this-is-the-only-time-voter-numbers-shrank/3071676/)<Note id="print" />, for reasons the Election Commission [has not been consistent about](https://www.thenewsminute.com/news/sir-process-ie-investigation-raises-critical-questions-on-ecs-conduct). Every page of the CEO's [summary booklet](https://ceo.karnataka.gov.in/uploads/PDF%20FINAL%20AC%20WISE%2027_1793094730.pdf) carries the same footer: **"No eligible citizen is left out while no ineligible person is included in the electoral roll."**

<figure class="plate">
    <div class="sheet"><img src={booklet} width="1400" height="446" fetchpriority="low" decoding="async" alt="Page 6 of the CEO's booklet. The footer reads: No eligible citizen is left out while no ineligible person is included in the electoral roll." /></div>
    <figcaption>Page 6 of the CEO's summary booklet, with the footer highlighted.</figcaption>
</figure>

That is a reassuring claim. Since it is also absolute, a single contradictory example should be enough to fail it.

Problems with the SIR have been reported so widely across the country that each new one arrives with the air of "well, no surprises there." Bihar had [identical duplicate voters](https://www.reporters-collective.in/trc/ecis-final-voter-list-for-bihar) and [the living declared dead](https://www.livelaw.in/top-stories/bihar-sir-is-intensive-deletion-exercise-yogendra-yadav-appears-in-supreme-court-with-two-persons-deleted-as-dead-by-eci-from-draft-300679), and Bengal had voters [on the 2002 roll who were told they weren't](https://scroll.in/latest/1089637/west-bengal-sir-ec-halts-hearings-for-unmapped-voters-whose-names-were-present-in-2002-rolls). Karnataka has had [twins flagged as a "logical discrepancy"](https://www.thenewsminute.com/karnataka/twins-flagged-as-logical-discrepancy-in-karnatakas-sir-as-lakhs-get-notices), [people marked "shifted" who never moved](https://www.thenewsminute.com/karnataka/wrongly-flagged-as-shifted-sir-errors-spark-voter-complaints-across-karnataka) and [deletions with no reason given](https://www.outlookindia.com/national/karnataka-sir-what-the-final-electoral-roll-reveals-about-nearly-1-cr-voter-deletions).<Note id="outlook" />

<Pull who="Prithviraj, a Bengaluru voter marked “shifted”" src="The News Minute, 7 August 2026">I did everything I was supposed to do, and they still marked me as shifted.</Pull>

Two days after the final roll went up, I [published a 45&nbsp;million row dataset](https://github.com/diagram-chasing/karnataka-sir-voter-rolls-data) processed from 60,923 PDFs. The public version is anonymized, but I still maintain a complete dataset for further research. So when [The Hindu found nonsense names](https://www.thehindu.com/news/national/karnataka/husband-husband-to-and-xxx-bengalurus-sir-electoral-rolls-riddled-with-errors/article71653201.ece) in the roll (such as `µ¢µÌèÌ`, "Husband Husband", a father called `r•••••••••••@gmail.com`), I knew I must dig deeper to see what the scope of the problem was.

My dataset could not answer the question alone. As its published documentation says, its numbers cover only this latest version of the SIR. It shows that about <Num v="1.88 lakh" explain /> deletions took place, while the headline number most people know says Karnataka's voter list is <Num v="99.32 lakh" /> people shorter than it was in June. This gap exists because <Num v="1.08 crore" /> voters (people who could vote in the 2024 general election) were left out of the draft roll when it was first released. They were removed and then given a chance to file "claims" and reapply. During this "Claims and Objections" period, the Election Commission [added](https://www.theweek.in/news/india/2026/10/27/karnataka-final-electorate-count-2026.html) <Num v="10.08 lakh" /> names, which includes new voters and people who had moved, and made the <Num v="1.88 lakh" /> deletions that my dataset shows.

To reach the headline number independently, I needed the rolls from before the revision. The folks at [Mathakaavalu](https://mathakaavalu.com) and Edellu Karnataka had digitized them and were willing to collaborate on this exercise. Their efforts gave me the 2002 roll that everyone was supposed to be matched against, the electoral roll as it stood in January 2025, the draft roll for the 2026 SIR, and the first list of the <Num v="1.08 crore" /> people removed _before_ the draft, along with the reason for each person. With all of these you can follow one person from 2002 to the end of October and see what happened to them.

So I joined these rolls by voter ID (the <Term id="epic" text="EPIC" /> number) and tested each half of the slogan. Neither half is completely true. I found duplicates, voters declared dead who filed an objection to the news, nonsense names, notices spread very unevenly across constituencies supposedly working under the same rules, and more. I will show examples of each and link to the original PDFs where I can, but for the counts I am publishing only aggregates.

I went through this process myself, and travelled 300&nbsp;km for a hearing that did not happen because the rules had been changed halfway due to the protests regarding it in Delhi. Rules have been changed plenty of times during the course of this exercise, making the process quite stress-inducing. I had my documents, the time to travel, and an upper-class, educated, majority identity household behind me; many people do not.

In case you're short on time and just want your SIR numbers to-go, here's the TL;DR.

<div class="breakout-sm">
<FindingsLedger />
</div>

<div class="breakout-sm">
<YourConstituency />
</div>

The rest of this piece shows the evidence for each. For no reason other than whimsy (and to encourage the consumption of long-form content), the sections are named after films.

<Part n={1} id="part-1-no-ineligible-person-is-included">No ineligible person is included</Part>

Who is an ineligible person? It sounds like an existential question, but let us try to attempt answering it in a tangible way.

### <FilmTitle film="hum-paanch" title="Hum Paanch" />

<Exhibit id="01-duplicates" alt="Nine voter cards from a list of additions. Five of them, highlighted, are identical in name, father, house number, age and sex, and carry five different voter IDs.">Final roll, Shorapur <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/36/2026-EROLLGEN-S10-36-SIR-FinalRoll-Revision1-ENG-53-WI.pdf">part 53</a>, page 32, list of additions.</Exhibit>

This is from the list of people _added_ to the roll in Shorapur during the revision. Gousiya Begam, 18, appears five times on one page, identical in name, father, house number, age and sex, each time with a different voter ID. Further down the same page, Abdul Rahiman and Shankarnag, both also 18, each appear twice.

This is not confined to Shorapur. During the revision, 762 duplicate voters were deleted and 8,268 new duplicates were added, about eleven new duplicates for each one removed.

At least 8,992 people now show up more than once in their own polling booth, with the same name, relative's name, age and sex each time. Between them they have 18,271 voter cards, each with a different ID.

<div class="breakout-sm">
<DuplicateCards />
</div>

<Tally id="tally-duplicates" n={8992} what="people on the roll more than once in their own booth" />

### <FilmTitle film="duplicate" title="Duplicate" />

In theory, your voter ID is unique and yours for life. When you move, you file a [Form 8](https://voters.eci.gov.in/formspdf/Form_8_English.pdf) and your old entry gets deleted. Sometimes, SIR or no SIR, that does not happen.

<Trail prefix="TDB" suffix="1993">
<TrailStep doc="Final roll, Bagalkot">

This is Sangappa, who is 33, on the roll in Bagalkot.

<Exhibit compact id="02a-bagalkot" alt="Three voter cards from the Bagalkot part 18 final roll, the middle one in full: a man of 33, his voter ID highlighted.">Final roll, Bagalkot <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/24/2026-EROLLGEN-S10-24-SIR-FinalRoll-Revision1-ENG-18-WI.pdf">part 18</a>, page 13.</Exhibit>

</TrailStep>
<TrailStep doc="Final roll, Yeshwanthapura">

And this is Sangappa again, on the roll in Yeshwanthapura, 500&nbsp;kilometres away, with the same voter ID.

<Exhibit compact id="02b-yeshwanthapura" alt="Three voter cards from the Yeshwanthapura part 535 final roll; the one in full carries the same voter ID, name, father and age as the Bagalkot card.">Final roll, Yeshwanthapura <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/153/2026-EROLLGEN-S10-153-SIR-FinalRoll-Revision1-ENG-535-WI.pdf">part 535</a>, page 28.</Exhibit>

</TrailStep>
</Trail>

At least 461 voter IDs appear in two constituencies at once just like him.

<Tally id="tally-two-places" n={461} what="voter IDs on the roll in two constituencies at once" />

### <FilmTitle film="housefull" title="Housefull" />

<div class="breakout-sm">
<Exhibit id="03-house-396" alt="A full page of thirty voter cards. The house number, 396, is highlighted on every card.">Final roll, Kagwad <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/4/2026-EROLLGEN-S10-4-SIR-FinalRoll-Revision1-ENG-174-WI.pdf">part 174</a>, page 6. House 396 runs from page 5 to page 34.</Exhibit>
</div>

All thirty voters on this page reside at house number 396 in Kagwad, and so is everyone on the twenty-nine pages before and after it. I realize this is India; some houses are small, some houses are big. According to <Term id="nfhs" text="NFHS" /> data, the average household in India has 4.4 people. Which makes this one one with 688 people, nearly three quarters of the booth, a massive outlier. They also have around 418 different fathers, husbands and mothers between them. [Relevant Chup Chup Ke Scene](https://www.youtube.com/watch?v=TYA35LSTEH0).

The Commission's answer is that these are ["notional numbers"](https://www.newslaundry.com/2025/08/18/cec-gyanesh-kumars-defence-on-bihars-0-house-numbers-not-convincing).<Note id="newslaundry" /> That may be so. But the enumeration phase of this revision was a _house-to-house visit_, which dropped <Num v="65 lakh" /> people because they were "permanently shifted" and <Num v="19 lakh" /> as "absent". How does an official establish that someone has left a house whose number is only 'notional'?

House 396 is not alone. Karnataka has 381 house numbers that each have 100 or more voters naming 50 or more different relatives, with around 54,778 voters in all. Another <Num v="20.7 lakh" /> voters still on the roll have a 0, a dash or nothing at all where the house number should be.

In one Tumkur City booth, 545 of the 663 voters have no usable house number, and for most of them the roll just says 0. How does a <Term id="blo" text="BLO" /> knock on house number 0?

<div class="breakout-sm">
<Exhibit id="04-house-zero" alt="A full page of thirty voter cards. The house number is highlighted on every card, and on every card it is 0.">Final roll, Tumkur City <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/132/2026-EROLLGEN-S10-132-SIR-FinalRoll-Revision1-ENG-169-WI.pdf">part 169</a>, page 3.</Exhibit>
</div>

<Tally id="tally-house-number" n={NO_HOUSE_NUMBER} what="voters still on the roll with no usable address" />

### <FilmTitle film="gumnaam" title="Gumnaam" />

A rose by any other name would smell just as sweet. What about a voter by any other name?

On this one page of the Raichur Rural roll, twenty of the thirty voters have strings of symbols where their name or their relative's name should be. As a result, these people cannot be found on the Election Commission's own search portal.

<div class="breakout-sm">
<Exhibit id="05-garbled" alt="A full page of thirty voter cards. On twenty of them the name or the relative's name is a string of Latin-1 symbols, highlighted.">Final roll, Raichur Rural <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/53/2026-EROLLGEN-S10-53-SIR-FinalRoll-Revision1-ENG-212-WI.pdf">part 212</a>, page 20.</Exhibit>
</div>

Raichur in particular has been affected by font issues. (If you are the Commission, the folks at Sanchaya have put together [a whole library of Kannada fonts that work](https://fonts.sanchaya.net/) for next time!)

<div class="breakout-sm">
<GarbledBooths />
</div>

Garbled symbols aside, there are plenty of other oddly shaped names, like a relative named `father` or `husband husband`, a name that is a single letter, or a phone number where a mother's name should be.

<div class="breakout-sm">
<NameFaults />
</div>

<Tally id="tally-garbled" n={GARBLED_NAMES} what="unreadable names" />

### <FilmTitle film="hum-aapke-hain-koun" title="Hum Aapke Hain Koun" />

In the movie [_Paa_](https://en.wikipedia.org/wiki/Paa_%28film%29), Amitabh Bachchan played Abhishek Bachchan's son. The voter rolls suggest that this kind of an arrangement is more common than one would think.

The first card below belongs to Chanda Sab from Shorapur. His father is Allisab.

<Exhibit id="05b-shorapur-fathers" alt="Three voter cards from the Shorapur part 135 final roll. On the first, Chanda Sab, 40, has Allisab as his father. On the second, Allisab, 40, has Chanda Sab as his father. Both live in house E/41.">Final roll, Shorapur <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/36/2026-EROLLGEN-S10-36-SIR-FinalRoll-Revision1-ENG-135-WI.pdf">part 135</a>, page 9.</Exhibit>

And on the very next card is Allisab, who is also 40 and lives in the same house and his father is Chanda Sab.

I found 296 pairs like this, where two voters were in one house, close in age, and each had the other's name as their father. In 27 of those pairs, the two are the same age. In the case of Syed Mohammed Saleem and Shaik Naseem Banu in K.R. Pura, who are both 43 and live in the same house, he is a man, she is a woman, and each of them is the other's father.

<Exhibit id="05c-krpura-fathers" alt="Six voter cards from the K.R. Pura part 348 final roll. Syed Mohammed Saleem, male, 43, has Shaik Naseem Banu as his father. Shaik Naseem Banu, female, 43, has Syed Mohammed Saleem as her father. Both live in house 03.">Final roll, K.R. Pura <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/151/2026-EROLLGEN-S10-151-SIR-FinalRoll-Revision1-ENG-348-WI.pdf">part 348</a>, page 3.</Exhibit>

<Tally id="tally-fathers" n={296} what="pairs of voters who are each other's father" />

<Part n={2} id="part-2-no-eligible-citizen-is-left-out">No eligible citizen is left out</Part>

From the end of June this year, BLOs went house to house handing out enumeration forms to <Num v="5.54 crore" /> voters. [1.08&nbsp;crore people did not submit forms back](https://m.thewire.in/article/government/karnataka-sir-shaves-off-close-to-one-crore-names-from-electorate), and they were struck off before the draft roll was published. Each was assigned a reason: Absent, Shifted, Dead, or Duplicate (and an "Other", giving this the moniker [the ASDDO list](https://www.thenewsminute.com/karnataka/karnataka-sir-draft-rolls-are-out-what-voters-need-to-do-next)). If you were wrongly struck off, your hope was to file <Term id="form6" text="Form 6" /> during claims and objections and apply again, [as a brand new voter](https://scroll.in/latest/1096858/voters-will-not-face-action-for-submitting-form-6-after-being-deleted-during-sir-says-ec).<Note id="form6" />

I wanted to know how many of those people made it back. I found <Num v="1,05,48,148" /> of the ASDDO voters in the January 2025 roll and looked for each of them among the people added to the final roll in the same constituency with the same name, relative and age. Nobody is supposed to come back under their old voter ID as because reapplying gets you a new one. About 2,300 of them are on another constituency's roll under their old ID, which suggests they had moved, so I have not counted them as coming 'back'.

<div class="breakout-sm">
<RollFunnel />
</div>

About 14,900 people were added back, which is 0.14%. Of the <Num v="8.9 lakh" /> people aged 75 and above who were struck off, only 206 came back.

<div class="breakout-sm">
<ReturnWall />
</div>

There are two ways to understand this. Either the BLOs were incredibly accurate, and 99.86% of a crore of people really had died, moved or were duplicates. Or most people who were wrongly struck off never found out, or found out and could not do anything about it. [Aroon Deep offers a third reading](https://archive.ph/IVFck), that a lot of the voters who didn't come back were only ever on the roll because a BLO once enrolled them sometime in their lives, that they anyway vote rarely, and that the revision is counting on them not caring enough to reapply.

<Tally id="tally-came-back" n="14,900" of="1.05 crore struck off" what="back on the final roll" floor={false} />

### <FilmTitle film="main-hoon-na" title="Main Hoon Na" />

The premise of the SIR was that if you could find yourself or your parent in the 2002-03 roll, you were in. If you could not be found, you got a notice saying you were "Unmapped with Last SIR", and then you had to go to a hearing with documents and prove that you exist.

But some of the people who got this notice are in the Chief Electoral Officer's own published CSV of the 2002 roll under the exact same voter ID. Hoblamma, 95 years old, is one of them.

<Trail prefix="MZS" suffix="2292">
<TrailStep doc="2002 roll">

Here is Hoblamma in the CEO's own 2002 roll, aged 69, under the voter ID she still holds today.

<Exhibit compact id="07b-siraguppa-2002" alt="One line of the CEO's 2002 roll CSV: the same voter ID, at age 69, highlighted."><a href="https://ceo.karnataka.gov.in/csv_upload/english/A031.csv">CEO's 2002 roll</a>, constituency 31, part 79.</Exhibit>

</TrailStep>
<TrailStep doc="Notice list">

Twenty-four years later, the notice list for her booth in Siraguppa tells her she is "Unmapped with Last SIR".

<Exhibit compact id="07a-siraguppa-notice" alt="Notice list row for Siraguppa part 118: a woman of 95, reason Unmapped with Last SIR, her voter ID highlighted.">Notice list, Siraguppa part 118, page 5.</Exhibit>

</TrailStep>
<TrailStep doc="Final roll" when="27 Oct 2026">

And here she is in the final roll, deleted.

<Exhibit compact id="07c-siraguppa-final" alt="Three cards from the Siraguppa part 118 final roll; the middle one, for the same voter ID, is marked Q and stamped DELETED, age 95.">Final roll, Siraguppa <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/92/2026-EROLLGEN-S10-92-SIR-FinalRoll-Revision1-ENG-118-WI.pdf">part 118</a>, page 9.</Exhibit>

</TrailStep>
</Trail>

No explanation for the failed mapping has been given even in other states.<Note id="bengal" />

3,115 voters like her were told they could not be matched to the 2002 roll even though their voter ID, name and age all match the CEO's copy of it analyzed by me.

<Tally id="tally-unmapped" n={3115} what="told they are not on the 2002 roll even though they are" />

### <FilmTitle film="judwaa" title="Judwaa" />

The notices also list out the Commission's ["logical discrepancy" reasons](https://www.thenewsminute.com/karnataka/explained-logical-discrepancies-in-the-sir-process-and-how-it-works)<Note id="logical" />, which are worth reading because they tell you what government software thinks a normal human family looks like. We encounter conditions like `Parent Age Difference <15`, `Parent Age difference >50`, `Grandparent Age difference <40`, `Progeny >= 6`, and my favourite, `Progeny Age Gap <9 Month`. That last one means two children of one parent can't be born less than nine months apart, which is true **unless they're twins.**

<div class="breakout-sm">
<ReasonsTable />
</div>

<Pull who="A mother of twins in Karnataka, under a changed name" src="The News Minute, 7 September 2026">My son and daughter are twins, but there are no documents that say so.</Pull>

In Chintamani, a brother and a sister, both 36, with the same father and the same house, were each sent a notice for being born less than nine months apart.

<Exhibit id="08a-chintamani-final" alt="Three cards from the Chintamani part 57 final roll; two siblings aged 36 with the same father and house number, one stamped DELETED. Names partly withheld.">Final roll, Chintamani <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/143/2026-EROLLGEN-S10-143-SIR-FinalRoll-Revision1-ENG-57-WI.pdf">part 57</a>, page 6. Names partly withheld.</Exhibit>

In the final rolls, the sister has been struck off as disqualified while her brother is still a voter.

<Exhibit id="08b-chintamani-notice" alt="Notice list rows for both siblings, each with the reason Progeny Age Gap under 9 months. Names partly withheld.">Notice list, Chintamani part 57, page 2.</Exhibit>

This is a known defect in the system and has been [reported elsewhere in the country too](https://theprobe.in/elections/eci-software-cant-recognise-twins-leaving-delhi-families-in-limbo-12643878).

In Karnataka, at least 4,954 people were flagged under the nine-month rule and struck off as disqualified, and for 3,735 of them it was the _only_ reason given. One can also imagine that not all of them will be twins, since the rule would also catch mis-entered ages and wrongly linked parents.

<Tally id="tally-twins" n={4954} what="struck off after a notice under the nine-month rule" />

### <FilmTitle film="pehchaan" title="Pehchan" />

One of the issues with my phone number is that it _used_ to belong to someone else. To this day, when I make payments via UPI, sometimes the sender details show up as Nethravati (my nickname with some of my friends is Neetu because of this).

A voter ID is supposed to be different and is yours for life. In Dasarahalli, in Bengaluru, it appears to work more like my phone number, with consequences more serious than being called Neetu.

<Trail prefix="XMK" suffix="7019">
<TrailStep doc="January 2025 roll">

This is Shivananjamma, who is 80, on the roll in January 2025, with her voter ID.

<Exhibit compact id="11b-dasarahalli-2025" alt="Three cards from the January 2025 roll for Dasarahalli part 115, the middle one in full: a woman of 80, her voter ID highlighted.">January 2025 roll, Dasarahalli part 115, page 7. Via Mathakaavalu.</Exhibit>

</TrailStep>
<TrailStep doc="ASDDO list">

By the time her BLO drew up the ASDDO list for her booth, she had been marked dead.

<Exhibit compact id="11a-dasarahalli-asdd" alt="A row of the Kannada ASDDO list for Dasarahalli part 115: a woman of 80, reason dead, her voter ID highlighted.">ASDDO list, Dasarahalli part 115, page 6. Kannada, translated in italics.</Exhibit>

</TrailStep>
<TrailStep doc="Final roll" when="27 Oct 2026">

New voter Vaibhav, 19, was added to the Dasarahalli roll and assigned her exact same voter ID.

<Exhibit compact id="11c-dasarahalli-final" alt="Three cards from the Dasarahalli part 42 list of additions; the one in full is a man of 19 with the same voter ID, highlighted.">Final roll, Dasarahalli <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/155/2026-EROLLGEN-S10-155-SIR-FinalRoll-Revision1-ENG-42-WI.pdf">part 42</a>, page 28, list of additions.</Exhibit>

</TrailStep>
</Trail>

I found at least 234 new voters in Dasarahalli whose voter ID belonged, in January 2025, to a different person who was then struck off before the draft roll. Most of those people were marked as shifted or absent, and around ten of them, like Shivananjamma, are marked dead.

<div class="breakout-sm">
<ReusedIds />
</div>

This was surprising enough for me to check by hand and I could not find something similar in any other constituency or any other category (i.e, reason for disqualification) of person. Is a voter ID freed up for reuse once its owner is struck off? I don't know. But if any of these people turn out to be alive and apply again, their old ID now belongs to a stranger.

<Tally id="tally-reused" n={234} what="new voters with a struck-off voter's ID" />

### <FilmTitle film="zinda" title="Zinda" />

Reincarnation is a popular theme in Bollywood movies and apparently, election SIRs.

<Trail prefix="YVA" suffix="8162" next={{ prefix: 'YVA', suffix: '0865', from: 3 }}>
<TrailStep doc="January 2025 roll">

Here is a 53-year-old woman in Belthangady on the roll in January 2025, before the revision started.

<Exhibit compact id="09b-belthangady-2025" alt="Three cards from the January 2025 roll for Belthangady part 41, the middle one in full with the old voter ID highlighted.">January 2025 roll, Belthangady part 41. Via Mathakaavalu.</Exhibit>

</TrailStep>
<TrailStep doc="ASDDO list">

Months later, her BLO's ASDDO list marked her dead.

<Exhibit compact id="09a-belthangady-asdd" alt="A row of the Kannada ASDDO list for Belthangady part 46: a woman of 53, reason dead, her voter ID highlighted.">ASDDO list, Belthangady part 46, page 6. Kannada, translated in italics.</Exhibit>

</TrailStep>
<TrailStep doc="Final roll" when="27 Oct 2026">

After proving she's alive, she rejoined the voter roll with her same house and husband but a new ID.

<Exhibit compact id="09c-belthangady-final" alt="Three cards from the Belthangady part 46 list of additions; the one in full has the same name, husband and house number under a new voter ID, highlighted.">Final roll, Belthangady <a href="https://voters.eci.gov.in/eroll/2026/s10/sir-finalroll/200/2026-EROLLGEN-S10-200-SIR-FinalRoll-Revision1-ENG-46-WI.pdf">part 46</a>, page 34, list of additions.</Exhibit>

</TrailStep>
</Trail>

Granted this plot reminds one of the movie Om Shanti Om, but thankfully this is not very common. Of the <Num v="16.3 lakh" /> people who were struck off as dead, 332 are back, which is the lowest rate of the four reasons.

<div class="breakout-sm">
<ReturnRates />
</div>

<Tally id="tally-dead-back" n={332} of="16.3 lakh marked dead" what="back on the final roll after proving they are alive" />

<p id="notices">The SIR process does not appear to treat voters evenly and what happens to you varies with where you live, and possibly with which BLO you get, which <Term id="ero" text="electoral officer" /> you get and how your data was entered.</p>

Under the same rules and the same kind of form, **57 voters in Mayakonda** got a notice, which is 0.03% of its voters, and only 65 in Kollegal. However, in **C.V. Raman Nagar**, **80,890** did, or 59% of all voters. It is not clear how such a difference can occur.

Here is the share of voters who got a notice in each constituency.

<div class="breakout-sm">
<AcMap metric="notice-rate" />
</div>

What happens after the notices is just as uneven. Nine constituencies report that not one of their notices ended in a finding of ineligibility. Belgaum Uttar is one of them, with 24,368 notices and nobody found ineligible. In Hubli-Dharwad-East, 13% of the people who got a notice were struck off. In other states, this might be explained by understanding [which Electoral Registration Officer you got](https://m.thewire.in/article/rights/election-commission-makes-four-changes-to-ecinet-software-after-maharashtra-ceos-intervention)<Note id="wire" />.

Here is every constituency by how many of its voters got a notice and how many of those were then struck off.

<div class="breakout-sm">
<NoticeScatter />
</div>

You can look up your own constituency below.

<div class="breakout-sm">
<ConstituencyTable />
</div>

## <FilmTitle film="jaane-bhi-do-yaaro" title="Jaane Bhi Do Yaaro" />

Now you might say, so what? Whatever your politics, there are maybe four things to consider.

First, the cost. This exercise took months of time, money and effort from citizens and administrators alike. BLOs are often school teachers working dual roles, and there have been [reports of classes being disrupted and parents moving their children out of government schools](https://www.telegraphindia.com/india/government-school-enrolment-drops-as-teacher-shortages-and-sir-duty-raise-parent-concerns-prnt/cid/2169228) because teachers were too occupied with it. [Some BLOs have also died by suicide](https://www.aljazeera.com/news/2025/12/17/indias-new-suicide-crisis-poll-workers-take-lives-amid-voter-recount-rush), allegedly because of the stress involved.

Second, this is the _final_ roll, not a draft or a work in progress. Some BLOs noticed garbled names and details that seemed wrong while they were entering this data, and the ones who spoke to The Hindu said the garbled names would be fixed after the final upload. Well, _this_ is the final upload. If there is another Special Intensive Revision twenty years from now, the duplicates, the people who were marked dead and came back, and the twins will all be part of the roll that the future voters will be asked to clarify. This roll may also soon matter for more than voting; at the end of October, Union minister Rajiv Ranjan Singh [said](https://indianexpress.com/article/india/biometrics-voter-ids-for-beneficiary-payments-not-aadhaar-minister-rajiv-ranjan-singh-10949512/) that benefit payments now made on the basis of Aadhaar will soon be made using biometrics and voter ID numbers instead.

Third is the idea of such an asymmetry. As a voter, you are not allowed any margin of error. If you have the wrong document, if you missed a hearing, if you didn't travel all the way back to town to present yourself, if your name is spelt differently from 2002, if your father cannot find his documents, you're out. The institution that demands this does not meet the standard it applies to voters.

Fourth, checking any of this is harder than it should be. The Election Commission has this data, and it [chooses](https://api.sci.gov.in/supremecourt/2018/29281/29281_2018_Judgement_12-Oct-2018.pdf)<Note id="sc" /> to publish it as PDFs. Anyone who wants to verify the roll has to spend time, money and attention digitizing it first. I did some of that and Mathakaavalu did more. Verifying a public record currently depends on the goodwill of a few people with disk space and money to spare, who are willing to OCR tens of thousands of documents.

<Excerpt source="Supreme Court of India, Kamal Nath v. Election Commission of India" where="12 October 2018, paragraph 25" href="https://api.sci.gov.in/supremecourt/2018/29281/29281_2018_Judgement_12-Oct-2018.pdf">It may be added that <mark>if the petitioner so wants, he can always convert it into searchable mode which, of course, would require him to put his own efforts</mark>.</Excerpt>

## Know your constituency

<div class="breakout-sm" id="your-constituency">
<ConstituencyCard />
</div>

<div class="methodology">

## Methodology

<DataTrail />

The final roll's count, obtained by downloading and OCRing all 60,923 Election Commission booth PDFs, was within 0.01% of the state's official total. Mathakaavalu and Edellu Karnataka digitized older documents, including the January 2025 roll, draft roll, 2002 roll, deletions, and notices. Mistakes are possible since OCR is an automated process.

Voter IDs were used for voter tracking across lists. If someone was removed from the same constituency and reapplied (i.e., received a new ID), their name, the name of a relative, and their age were used to match them. The term "duplicates" is used to describe cards in the same booth that had different voter IDs but the same names, ages, sexes, and relatives' names. Since rolls by themselves cannot conclusively establish identity, all duplicate counts or anomalies should be considered minimum figures.

Each example in this post was double-checked against the original PDF and a second OCR scan. Parts of voter IDs and serial numbers are hidden in the pictures, but all the links go straight to public ECI files so that they can be verified if needed.

The anonymized final roll dataset is [on GitHub](https://github.com/diagram-chasing/karnataka-sir-voter-rolls-data). Please [contact us](mailto:hi@diagramchasing.fun) for public-interest work with the named version, although approval is not guaranteed.

We would love to do this analysis for every state where the SIR has happened, but the lack of digitalized rolls makes that very hard. Until this data becomes available in an analysable format, breakdowns for more states remain unfortunately out of reach.

Claude Opus 5.5 was used for development and analysis but not to write the reader-facing story. This website is built with Sveltekit and D3. We collect basic visitor analytics using Plausible.

</div>

<DonateCTA />
