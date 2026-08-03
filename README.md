# Jyotish Engine

An open-source, client-side Vedic (Jyotish) chart engine and life-blueprint
report generator. Three inputs — date, time, and place of birth — computed
entirely in the browser. No birth data is ever transmitted anywhere.

Built on top of AskSoma as a design reference, not a runtime dependency:
this project uses its own Swiss Ephemeris-based engine so the calculation
layer is fully owned, auditable, and free to run indefinitely.

## Status against the project's phase plan (P1-P8)

The authoritative phase plan lives in
[`docs/requirements-spec.md`](docs/requirements-spec.md) -- read that first.
Status below is this project's own honest read of it, not a copy:

| Phase | Status |
|---|---|
| P1 Ephemeris | **Done.** Real Swiss Ephemeris (`@swisseph/browser`), geocoding (one known gap, `BACKLOG.md`), historical timezone (pre-1906 India, Bombay/Calcutta extended local time through 1955/1948, WWII windows). |
| P2 Dasha | **Done.** Full Vimshottari math (`src/engine/dasha.ts`) -- mahadasha/antardasha/pratyantardasha, wired into `computeChart()`, verified against real ephemeris. |
| P3 Rules engine | **Partial, substantially expanded.** Dignity, houses, combustion, D9 all done and verified. Yoga/dosha detection (`src/rules/yogas.ts`) now covers 5 Pancha Mahapurusha yogas + Gajakesari + Kemadruma + Mangal Dosha + Raja Yoga's simplified subset (Ch. 39: Kendra-lord/Trikona-lord conjunction, mutual-Kendra aspect, dignified dual Lagna-lord case) + a deliberate subset of 5 Nabhasa yogas (Ch. 35: Rajju/Musala/Nala/Gada/Vihaga; Mala/Bhujanga Sarpa excluded for genuine, checked primary-source ambiguity; ~26 more not started) -- Kala Sarpa Dosha and Sade Sati remain fully deferred, explicitly held out of the 2026-08-01 pass pending their own source (both confirmed absent from BPHS entirely) and design gate (`BACKLOG.md`). Shakata Yoga's reference material was found mis-attributed to BPHS (which names a different, unrelated "Sakata") and corrected to its real source, Phaladeepika Ch. 6 v.14 -- not yet implemented as a detector. |
| P4 Findings/confidence | **Done.** `src/findings/index.ts` converts dignity, house-lord, combustion, and current-dasha-period facts into `Finding` objects per `interpretation.md`'s schema and domain mapping, combined with yoga findings in `computeChart()`'s output. Confidence checks (`src/engine/confidence.ts`) implement all 5 rows of SKILL.md's table. Health's "planetary body-part associations" and Health/Relationships' 6th/8th/7th occupancy-and-aspect ("affliction") coverage -- previously named in interpretation.md's domain table but never implemented -- are now built (`bodyPartFindings()`, `houseAfflictionFindings()`), reusing the already-existing `aspectedHouses()` primitive. A real dedup bug was found and fixed along the way: `dedupeBySharedFact()` was silently dropping body-part findings in favor of richer dignity/house-lord siblings sharing the same dignity evidence, even though they say something genuinely different (which body system, not domain role) -- see `DECISIONS.md`. |
| P5 Narrative templates | **Done -- all six domains (Career, Purpose, Relationships, Health, Wealth, Timing).** `src/narrative/render.ts` is a domain-agnostic renderer, used by the first five, that quotes `Finding.statement` verbatim rather than regenerating facts (see `DECISIONS.md` for why this departs from the original spec's illustrated template shape), semantically de-duplicates findings describing the same underlying fact (including, since Wealth, correctly keeping multiple house-lord findings when one planet governs two different houses, rather than collapsing them), and renders `full` depth as `overview`'s own content plus a continuation of genuinely new findings. Mahapurusha/Kemadruma yoga domain tags were audited and corrected against `constants.md`'s karaka table after an original blanket tag was caught reading as inaccurate in real rendered prose. A structural sweep (`tests/findingStatementQuality.test.ts`) checks every finding-generating function for developer-facing language that could leak verbatim into a real reader's report. Closing notes support topic-conditional clauses (Relationships' partnership/children framing, Health's illness/longevity framing) that only fire when a finding actually touching that topic was quoted in the text, not unconditionally. Two real, previously-dormant bugs were found and fixed while building this: a `dedupeBySharedFact()` collapse when one planet lords two different domain-relevant houses (found via Wealth), and a raw local-offset timestamp leaking into `currentDashaFinding()`'s reader-facing statement (found via Timing, the first renderer to ever quote that Finding's text) -- both documented in `DECISIONS.md`. **Timing (the sixth domain) uses a genuinely different architecture** (`src/narrative/timing.ts`), confirmed necessary before writing anything: it isn't evaluative the way the other five are (only one, always-neutral Finding tags "timing"), and interpretation.md's own document structure names it "Timeline" and describes it as chronological, not tier-based. Scoped to a confirmed v1 -- current dasha period, near-term timeline, full Mahadasha arc to an age-90 cutoff (principle 2) -- with transit overlay and cross-domain "ranked turning points" explicitly deferred (`BACKLOG.md`). Validated against the golden chart across all six domains, plus dedicated sensitive-domain fixtures for Relationships and Health and hand-built fixtures for cases the golden chart can't exercise (`BACKLOG.md`). |
| P6 Document assembly | **SVG chart (D1 + D9) done; PDF/DOCX export at Essence, Overview, and now Full Blueprint depth done; free-tools cluster and Remedies section not started.** Per requirements-spec.md, P6 is three separate subsystems plus a Remedies section with zero prior code -- confirmed by checking the codebase, not assumed from the spec's phase list (`DECISIONS.md`). `src/chart/southIndianChart.ts` renders D1 as a South Indian grid; the exact layout wasn't documented anywhere in this project's own reference material, so it was verified against four independent open-source implementations before being relied on, then written up as `.claude/skills/jyotish-engine/references/chart-layout.md` with its citation trail. `src/chart/navamsaChart.ts` extends the same renderer to D9. PDF/DOCX libraries (`pdfmake`, `docx`) chosen after real research and validated via two isolated tests (text pagination; SVG embedding, visually confirmed) before any real code was written. `src/export/essenceDocument.ts`/`essencePdf.ts`/`essenceDocx.ts` generate a real one-page Essence document; `overviewDocument.ts`/`overviewPdf.ts`/`overviewDocx.ts` generate a real, chart-embedded Overview document -- both visually confirmed against real chart content. Several real bugs found and fixed along the way, not glossed over: a `@types/pdfmake` mismatch with the package's actual runtime export shape; an overly broad local-file-access lockdown that broke standard-font resolution; a `docx` SVG fallback that was a 1x1 placeholder rather than a real chart image; and a genuine content bug in `renderTimingSection()` where the "Currently running" summary could silently disagree with its own antardasha timeline when rendered at an explicit `asOfISO`. **Full Blueprint's two previously-blocked sections were scoped (design gate, `DECISIONS.md`) and built**: Natal chart decoded extends the existing dignity/house-lord machinery to all 9 planets/12 houses; Personality v1 covers Lagna-sign temperament + Lagna-lord dignity only, built on new reference material after a real classical source (Phaladeepika Ch. 9) was researched, read in full, and deliberately rejected as unsuitable for direct reader-facing use (physiognomy-heavy, some fear-coded/moralizing content -- see `DECISIONS.md`). **Full Blueprint's own document/pagination pipeline is now built** (`src/export/fullDocument.ts`/`fullPdf.ts`/`fullDocx.ts`) -- a real 7-of-8-section document (section 8, Remedies & Executive Summary, explicitly marked not-yet-available, not omitted). **Real, measured finding, since re-confirmed**: the generated PDF is 4 pages against the spec's 40-60 page estimate -- diagnosed as an architectural consequence of P4/P5's own deliberate design (a bounded, evidence-only fact set, quoted verbatim, never padded with generated prose), not a pagination-engineering gap (`DECISIONS.md`, 2026-07-31). Re-measured after P3's Raja Yoga/Nabhasa additions below widened the finding base substantially (findings 22 -> 36, content 6,427 -> 8,466 chars, +32%): page count unchanged at 4. This definitively answers the question that had motivated that widening effort -- more finding-generator coverage does not meaningfully close this gap; closing it for real would need a genuinely different kind of full-depth content generation (e.g. paid/BYOK LLM elaboration), explicitly parked as its own future design conversation, not started (`DECISIONS.md`, 2026-08-02). |
| P7 Living document | Split into P7a and P7b (`BACKLOG.md`). **P7a done**: `.ics` export of dasha/Antardasha/Pratyantardasha transitions (`src/export/ics.ts`, `src/export/dashaCalendar.ts`) -- RFC 5545 compliant (line folding, text escaping, UTC normalization), tested against real `computeChart()` output. **P7b done**: `src/engine/transit.ts` forward-searches for Jupiter/Saturn sidereal sign-ingress crossings (bracket-then-refine root-finding, a new algorithm class -- everything else in this codebase evaluates a single fixed instant), validated against real sidereal transit dates from independent sources -- all five checked ingress events matched within about an hour, including Jupiter's and Saturn's known retrograde preview/permanent-ingress patterns, reproduced without being told to expect them. `src/export/transitCalendar.ts` exports these as `.ics` (next 3 ingresses per planet, reusing `ics.ts`'s builder unchanged). Not yet wired into `computeChart()`'s output, and dasha/transit remain two separate `.ics` files rather than one combined export -- see `BACKLOG.md`. Versioned regeneration with diffs not yet scoped into either P7a or P7b. |
| P8 Languages | Not started; was blocked on P5 existing in English first -- that's now true, but this phase hasn't begun. |

Underlying pure-logic modules (all done, unit-tested): dignity
(`src/engine/dignity.ts`), houses & aspects (`src/engine/houses.ts`),
Navamsa/D9 (`src/engine/varga.ts`), type definitions (`src/types.ts`).

Golden-chart validation: full `computeChart()` pipeline run against real
ephemeris output -- 5/9 planets + Ascendant within stated longitude
tolerance, all 6 implemented yoga/dosha classifications match exactly, full
fixture sweep complete (see `BACKLOG.md` for the remaining known gaps).

Open gaps, deferred work, and next steps are tracked in
[`BACKLOG.md`](BACKLOG.md), not here. Decisions and their reasoning are in
[`DECISIONS.md`](DECISIONS.md).

## Guiding principles

See `.claude/skills/jyotish-engine/SKILL.md`, section "Non-negotiable
interpretive principles," for the authoritative list. Not restated here to
avoid two copies drifting out of sync.

## Getting started

```bash
npm install
npm test           # runs the pure-logic unit tests (dignity, houses, varga, dasha, yogas)
                    # -- these pass WITHOUT the ephemeris integration, since
                    # they're pure functions of already-known positions.
```

`npm run test:golden` runs the golden-chart fixture through the real
pipeline (`tests/golden-charts/`). The suite passes clean end to end (no
red): 4 of 9 planets (Sun, Mars, Rahu, Ketu) land just outside the stated
1 arc-minute tolerance, a known, documented, and deliberately-not-"fixed" gap
(see `BACKLOG.md`) — modeled as `it.fails()` expected failures rather than
plain assertions specifically so the suite's signal stays trustworthy: a
genuinely new failure elsewhere would stand out immediately instead of
blending into "the one that's always red" (see `DECISIONS.md`). Full suite
as of this session: 317/317.

## Next steps

P1-P4 are functionally complete (P3's yoga coverage intentionally partial --
see above). P5 (narrative templates, English) is complete across all six
domains. P7's `.ics` export (both dasha and Jupiter/Saturn transit ingresses)
is done, though not yet wired into `computeChart()`'s own output and
versioned-regeneration-with-diffs isn't scoped yet. P6 is underway: the SVG
chart (D1 + D9) is done, and PDF/DOCX export now works at both Essence and
Overview depth (chart embedded, real bugs found and fixed along the way --
see the status table above and `DECISIONS.md`). Full Blueprint's two
previously-blocked sections (Natal chart decoded, Personality) are now scoped
and built as real, tested content, and Full Blueprint's own document/
pagination pipeline is built and producing real PDF/DOCX output (sections
1-7; section 8 explicitly marked not-yet-available). The real measured page
count (4, against the spec's 40-60 estimate) has been re-confirmed unchanged
even after substantially widening P3's yoga/dosha coverage and P4's Health/
Relationships finding coverage (`DECISIONS.md`, 2026-07-31 and 2026-08-02) --
the gap is architectural, not a findings-coverage shortfall, and closing it
for real is parked as its own future design conversation (paid/BYOK LLM
elaboration), not started. What remains for P6 is the free-tools cluster and
a Remedies section (currently zero code). The narrow
P8 probe (one real rendering, trial-translated and reviewed for grammatical
fit) is done -- concrete feedback already came back on one term choice and is
logged in `BACKLOG.md`; full P8 engineering hasn't started. Timing's own
deferred scope (transit overlay, cross-domain "ranked turning points")
remains open. See [`BACKLOG.md`](BACKLOG.md) for the full current state.

## License

AGPL-3.0-only, matching Swiss Ephemeris's actual current open-source terms
(Astrodienst AG dual-licenses it under AGPL or a paid commercial license —
not GPL; see DECISIONS.md).

## Data attribution

`data/cities.json` is derived from the GeoNames `cities15000` dataset,
(c) GeoNames.org contributors, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See
`data/README.md` for provenance details.
