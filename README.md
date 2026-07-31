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
| P3 Rules engine | **Partial.** Dignity, houses, combustion, D9 all done and verified. Yoga/dosha detection (`src/rules/yogas.ts`) covers a simplified subset (5 Pancha Mahapurusha yogas + Gajakesari + Kemadruma + Mangal Dosha) -- general Raja Yoga, Nabhasa yogas, Kala Sarpa Dosha, and Sade Sati are not implemented (`BACKLOG.md`). |
| P4 Findings/confidence | **Done.** `src/findings/index.ts` converts dignity, house-lord, combustion, and current-dasha-period facts into `Finding` objects per `interpretation.md`'s schema and domain mapping, combined with yoga findings in `computeChart()`'s output. Confidence checks (`src/engine/confidence.ts`) implement all 5 rows of SKILL.md's table. |
| P5 Narrative templates | **Done -- all six domains (Career, Purpose, Relationships, Health, Wealth, Timing).** `src/narrative/render.ts` is a domain-agnostic renderer, used by the first five, that quotes `Finding.statement` verbatim rather than regenerating facts (see `DECISIONS.md` for why this departs from the original spec's illustrated template shape), semantically de-duplicates findings describing the same underlying fact (including, since Wealth, correctly keeping multiple house-lord findings when one planet governs two different houses, rather than collapsing them), and renders `full` depth as `overview`'s own content plus a continuation of genuinely new findings. Mahapurusha/Kemadruma yoga domain tags were audited and corrected against `constants.md`'s karaka table after an original blanket tag was caught reading as inaccurate in real rendered prose. A structural sweep (`tests/findingStatementQuality.test.ts`) checks every finding-generating function for developer-facing language that could leak verbatim into a real reader's report. Closing notes support topic-conditional clauses (Relationships' partnership/children framing, Health's illness/longevity framing) that only fire when a finding actually touching that topic was quoted in the text, not unconditionally. Two real, previously-dormant bugs were found and fixed while building this: a `dedupeBySharedFact()` collapse when one planet lords two different domain-relevant houses (found via Wealth), and a raw local-offset timestamp leaking into `currentDashaFinding()`'s reader-facing statement (found via Timing, the first renderer to ever quote that Finding's text) -- both documented in `DECISIONS.md`. **Timing (the sixth domain) uses a genuinely different architecture** (`src/narrative/timing.ts`), confirmed necessary before writing anything: it isn't evaluative the way the other five are (only one, always-neutral Finding tags "timing"), and interpretation.md's own document structure names it "Timeline" and describes it as chronological, not tier-based. Scoped to a confirmed v1 -- current dasha period, near-term timeline, full Mahadasha arc to an age-90 cutoff (principle 2) -- with transit overlay and cross-domain "ranked turning points" explicitly deferred (`BACKLOG.md`). Validated against the golden chart across all six domains, plus dedicated sensitive-domain fixtures for Relationships and Health and hand-built fixtures for cases the golden chart can't exercise (`BACKLOG.md`). |
| P6 Document assembly | **SVG chart (D1 + D9) done; PDF/DOCX export at Essence and Overview depth done; Natal chart decoded and Personality content built; Full Blueprint's own document/pagination pipeline, free-tools cluster, and Remedies section not started.** Per requirements-spec.md, P6 is three separate subsystems plus a Remedies section with zero prior code -- confirmed by checking the codebase, not assumed from the spec's phase list (`DECISIONS.md`). `src/chart/southIndianChart.ts` renders D1 as a South Indian grid; the exact layout wasn't documented anywhere in this project's own reference material, so it was verified against four independent open-source implementations before being relied on, then written up as `.claude/skills/jyotish-engine/references/chart-layout.md` with its citation trail. `src/chart/navamsaChart.ts` extends the same renderer to D9. PDF/DOCX libraries (`pdfmake`, `docx`) chosen after real research and validated via two isolated tests (text pagination; SVG embedding, visually confirmed) before any real code was written. `src/export/essenceDocument.ts`/`essencePdf.ts`/`essenceDocx.ts` generate a real one-page Essence document; `overviewDocument.ts`/`overviewPdf.ts`/`overviewDocx.ts` generate a real, chart-embedded Overview document (planetary-positions table, all yoga/dosha classifications including absences, six domain summaries, near-term timeline) -- both visually confirmed against real chart content. Several real bugs found and fixed along the way, not glossed over: a `@types/pdfmake` mismatch with the package's actual runtime export shape; an overly broad local-file-access lockdown that broke standard-font resolution; a `docx` SVG fallback that was a 1x1 placeholder rather than a real chart image (found by the user directly unzipping and inspecting the generated file); and a genuine content bug in `renderTimingSection()` where the "Currently running" summary could silently disagree with its own antardasha timeline when rendered at an explicit `asOfISO` -- found by generating a real file rather than trusting existing tests, which had accidentally kept their inputs synchronized every time. **Full Blueprint's two previously-blocked sections were scoped (design gate, `DECISIONS.md`) and built**: Natal chart decoded (`src/narrative/natal.ts`, `src/export/natalChartSection.ts`) extends the existing dignity/house-lord machinery to all 9 planets/12 houses (deliberately broader than the domain-scoped `findings/index.ts` versions, since this section is structural, not one of the 6 evaluative domains); Personality v1 (`src/narrative/personality.ts`, `src/export/personalitySection.ts`) covers Lagna-sign temperament + Lagna-lord dignity only, built on new reference material (`.claude/skills/jyotish-engine/references/personality.md`) after a real classical source (Phaladeepika Ch. 9) was researched, read in full, and deliberately rejected as unsuitable for direct reader-facing use (physiognomy-heavy, some fear-coded/moralizing content -- see `DECISIONS.md`). Both produce real, tested section content; Full Blueprint's own PDF/DOCX assembly/pagination for a 40-60 page document is a separate, not-yet-gated design question, same category as Essence/Overview's own prior library-validation step. |
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
as of this session: 288/288.

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
and built as real, tested content (`DECISIONS.md`); what remains for Full
Blueprint is its own document/pagination pipeline (not yet gated -- a 40-60
page PDF/DOCX is a different problem than Essence/Overview's, likely
deserving the same kind of library-validation step those got), plus the
free-tools cluster and a Remedies section (currently zero code). The narrow
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
