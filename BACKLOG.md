# Backlog

Open, actionable items not yet resolved. See `DECISIONS.md` for the
reasoning behind choices already made; this file is what's still open.
See `README.md` for current status.

## Next up

1. **Expand the golden-chart set** to the 30-50 chart target in
   `docs/requirements-spec.md` §10 (Validation), covering: cusp Ascendants,
   polar/equatorial latitudes, pre-1906 Indian births and the
   Bombay/Calcutta extended-local-time window (now exercised at the unit
   level in `tests/timezone.test.ts`/`tests/location.test.ts`, but not yet
   via a full golden chart through `computeChart()`), DST-affected
   locations, near-midnight births, leap days.
   - **Logged, not urgent -- after Full Blueprint work**: source additional
     real charts from Prokerala specifically, not an arbitrary second
     source. Prokerala.com is the ORIGINAL source of the current single
     golden chart (`tests/golden-charts/reference-chart-1983.json` --
     confirmed in `DECISIONS.md`, 2026-07-28, the Jupiter dignity/Mercury
     combustion correction entry), so more Prokerala-sourced charts give a
     same-source comparison, not a same-fixture-twice one: enough data
     points to tell whether Prokerala's own dignity/combustion conventions
     are systematically different from this project's (already suspected,
     not confirmed, per that same entry) versus this one fixture being an
     outlier. Directly resolves the still-open Sun/Mars/Rahu/Ketu
     longitude-tolerance question in "Known gaps" below, which already names
     "a second, independent golden chart" as its own resolution path --
     this makes that concrete (which source, and why that source
     specifically) rather than leaving it as a generic "expand the set"
     placeholder.
2. **P7b: Jupiter/Saturn transit ingress detection (§9) -- search primitive and
   `.ics` export both done.** `src/engine/transit.ts`: `findNextSignCrossing()`
   is the generic bracket-then-refine root finder (dependency-injected
   longitude function, so the algorithm is unit-tested with a fast synthetic
   function, no WASM -- `tests/transit.test.ts`); `findNextSignIngress()`/
   `findUpcomingSignIngresses()` wrap it for the real ephemeris, Jupiter/Saturn
   only. Precision target (nearest UTC calendar day) decided and logged in
   `DECISIONS.md` before implementation, per the gate that used to be here.
   Validated against real sidereal (Lahiri) transit anchors from multiple
   independent sources (not a primary ephemeris rerun) -- all five checked
   events landed within roughly an hour, and the search correctly reproduced
   both Jupiter's and Saturn's known retrograde preview/permanent-ingress
   patterns without being told to expect them (see `DECISIONS.md`, two
   2026-07-29 entries). `src/export/transitCalendar.ts` maps its output onto
   `ics.ts`'s existing generic builder unchanged: a rolling window of the next
   3 ingresses per planet from a given (default: real "now") instant, each
   represented as a full-UTC-day timed event. **Not yet done:** wiring into
   `computeChart()`'s own output, and a combined dasha+transit single-file
   export (currently two separate `.ics` files/functions -- trivial to merge
   later since both expose a plain `CalendarEvent[]`-returning function, not
   done since it wasn't asked for and transits aren't birth-chart-specific
   the way dasha is).
   Versioned regeneration with diffs (also part of §9) not yet scoped into
   either P7a or P7b.
3. **P5 narrative templates -- ALL SIX domains done (Career, Purpose,
   Relationships, Health, Wealth, Timing).** `src/narrative/render.ts` is a
   domain-agnostic renderer for the first five: quotes `Finding.statement`
   verbatim (never regenerates a fact -- see `DECISIONS.md` for why this
   departs from requirements-spec.md §7's illustrated `rule`-keyed template
   shape), semantically de-duplicates findings that describe the same
   underlying fact via shared `planets.X.dignity` evidence (explicit priority
   chain, directly tested against a controlled 4-way collision, not just
   incidental real-chart cases -- and, since Wealth, also correctly keeps
   MULTIPLE house-lord findings for the SAME planet governing DIFFERENT
   houses, rather than collapsing them), and renders `full` depth as
   `overview`'s own core content plus a continuation of genuinely new
   findings (closing note appended once at the true end). Mahapurusha/
   Kemadruma domain tags were audited and corrected against `constants.md`'s
   karaka table after Malavya's original blanket tag was caught reading as
   inaccurate in real Purpose prose. Validated against the golden chart
   (Career: rich/all-supportive; Purpose: a real "mixed" tier; Relationships:
   a real "strong" tier with a genuine EXACT yoga; Health: a real "strong"
   tier, structurally thin -- see "Known gaps"; Wealth: a real "strong" tier
   from a single supportive finding, the first domain to exercise
   `singleSupportive` framing rather than convergence) and hand-built
   fixtures for cases the golden chart can't exercise (`tests/narrative/
   fixtures.ts`). Closing notes support an optional `conditionalClosingNotes`
   mechanism (topic-scoped clauses that only fire when a QUOTED finding
   actually matches that topic's trigger patterns, checked against what's
   genuinely in the text at that depth) -- used by Relationships (partnership/
   children) and Health (illness/longevity).
   **Timing (sixth domain) is architecturally different, confirmed before
   building anything, not assumed** (`src/narrative/timing.ts`,
   `templates/en/timing.json`, `DECISIONS.md` two 2026-07-30 entries): only
   ONE Finding tags "timing" (`currentDashaFinding()`, always neutral
   polarity by design), so the polarity-tier classifier would always resolve
   to "thin" and silently discard the one real fact available -- and
   interpretation.md's own document structure names this section "Timeline,"
   describing it as chronological/ranked, not evaluative. Built as a genuinely
   separate render function (`renderTimingSection()`), scoped to a confirmed
   v1: essence (current period + next significant transition, plain
   language), overview (near-term timeline -- current Mahadasha's remaining
   Antardashas), full (full Mahadasha arc to an age-90 cutoff, principle 2,
   plus the current Mahadasha's complete Antardasha breakdown). Explicitly
   deferred: transit overlay and "ranked turning points with reasoning" (see
   "Known gaps" below). Also surfaced and fixed a real, previously-dormant
   bug: `currentDashaFinding()`'s statement interpolated raw, environment-
   dependent local-offset timestamps (same underlying cause as the already-
   fixed `.ics` UID/DESCRIPTION bugs, P7a) -- never caught before because no
   domain renderer had ever actually quoted this Finding's text until Timing
   was built.
4. **P6 document assembly -- SVG chart (D1) done; PDF/DOCX export done at
   Essence and Overview depth (Full not yet); free-tools cluster and
   Remedies section not started.** Per
   requirements-spec.md §11/§3, P6 is genuinely three separate subsystems
   (South Indian SVG chart, client-side-only PDF/DOCX export, a free-tools
   cluster: kundli calculator/Panchang/dasha-timeline-viewer/confidence-
   checker) plus a Remedies section the Full Blueprint structure (§8) names
   but nothing has ever been built for -- confirmed by checking the actual
   codebase (zero SVG code, zero remedy code, zero PDF/DOCX dependency)
   before assuming scope, not from the spec's phase list alone. Given a
   reasoned tradeoff rather than picking unilaterally (see `DECISIONS.md`),
   user confirmed: SVG chart first, as its own scoped sub-phase.
   `src/chart/southIndianChart.ts` renders D1 (Rasi) as a South Indian grid --
   the layout itself wasn't documented anywhere in this project's own
   reference material, so it was verified against four independent
   open-source implementations before being relied on, then written up as a
   new skill reference (`chart-layout.md`) with its citation trail, matching
   this project's standard for any easy-to-misremember constant. Deliberately
   decoupled from `ChartData` (takes a Lagna sign + planet-to-sign map, not
   the full chart object) so the same renderer works for D9/other vargas
   later without changes.
   **PDF/DOCX library choice validated, then built as a real export module
   (Essence depth) -- see below.** `pdfmake` (PDF) and `docx`/dolanmiu (DOCX) chosen after real
   research (not by reputation) and confirmed via two isolated tests, each
   proving one specific risk rather than one combined test proving nothing
   precisely (see `DECISIONS.md`): (1) essence-only PDF/DOCX -- all six real
   domain essence sentences, no chart -- validated text pagination for both
   libraries. (2) SVG-chart-only PDF/DOCX -- nothing but the South Indian
   chart SVG -- validated the embedding path specifically, confirmed by
   actual visual rendering for the PDF case (every planet in its correct
   cell, ASC marker, center title -- not just "no exception thrown"). Both
   passed; both dependencies now in `package.json` for real.
   **Essence-depth export module done** (`src/export/essenceDocument.ts`,
   `essencePdf.ts`, `essenceDocx.ts`) -- real PDF/DOCX generation from real
   golden-chart content, both visually confirmed (see `DECISIONS.md`).
   Surfaced and fixed two real bugs along the way: `@types/pdfmake` models an
   API shape (named ES exports) that doesn't exist at runtime for this
   CommonJS package, and an initial local-access lockdown broke standard-font
   resolution entirely rather than just the file paths it was meant to
   restrict.
   **Overview-depth export module done** (`src/export/overviewDocument.ts`,
   `overviewPdf.ts`, `overviewDocx.ts`) -- the first tier to embed the natal
   chart, both PDF and DOCX visually/structurally re-confirmed after a real
   bug fix (see `DECISIONS.md`, two 2026-07-30 entries): `renderTimingSection()`
   was quoting a Finding baked in at whatever instant the caller's
   `computeChart()` happened to use, independent of its OWN `asOfISO`
   parameter -- a real, previously-shipped, previously-tested-around
   inconsistency between the "Currently running" summary and its own
   antardasha timeline, caught by generating a REAL file with a fixed
   `asOfISO` rather than trusting existing tests (which had accidentally kept
   `findings` synchronized every time). Fixed by deriving that summary fresh
   from `dasha`+`asOfISO` instead of a `Finding[]` lookup, which also let the
   now-unused `Finding[]` parameter be removed from `renderTimingSection()`'s
   signature entirely. **Full Blueprint's two previously-missing sections are
   now built** (scoping confirmed with the user first, `DECISIONS.md`,
   2026-07-30 "Full Blueprint design gate" entry):
   - **Natal chart decoded** (`src/chart/navamsaChart.ts`,
     `src/narrative/natal.ts`, `src/export/natalChartSection.ts`,
     `templates/en/natal.json`): D1/D9 tables (D9 via the new
     `buildD9ChartInput()`), dignity/yoga table, and nakshatra+pada reuse
     `chartTables.ts` content (extracted from `overviewDocument.ts` once this
     became a second consumer); planet-by-planet/house-by-house notes
     (`allPlanetNotes()`/`allHouseNotes()`) cover all 9 planets/12 houses,
     deliberately broader than `dignityFindings()`/`houseLordFindings()`'s
     domain-scoped versions, since this section isn't one of the 6 domains.
     Verified against the golden chart + a determinism check.
   - **Personality v1** (`src/narrative/personality.ts`,
     `src/export/personalitySection.ts`, `templates/en/personality.json`):
     Lagna-sign temperament (element + modality + Lagna-lord karaka,
     `data/signs.json`) + Lagna-lord dignity as a strength/blind-spot signal
     (reuses `DIGNITY_POLARITY`, exported from `findings/index.ts`). Built on
     new reference material
     (`.claude/skills/jyotish-engine/references/personality.md`) after a real
     classical source (Phaladeepika Ch. 9) was researched, read in full, and
     rejected as unsuitable for direct reader-facing use (physiognomy-heavy,
     some fear-coded/moralizing content) -- see `DECISIONS.md` for the full
     finding. Moon-nakshatra traits and decision-making/communication
     (Mercury-specific) remain explicitly deferred, each needing its own
     separate sourcing pass. Tests include a negative check that no
     Phaladeepika-style physiognomy/fear-coded language reaches generated
     output.
   **Full Blueprint pagination now built** (`src/export/fullDocument.ts`,
   `fullPdf.ts`, `fullDocx.ts`) -- a real 7-of-8-section document (sections
   1-7; section 8 explicitly marked not-yet-available, not omitted),
   assembling sections 3-7 for the first time (`renderDomainSection`/
   `renderTimingSection` at `full` depth existed and were tested, but nothing
   had pulled them into one object before this). **Real, measured finding
   (`DECISIONS.md`, 2026-07-31), then explicitly RE-measured after Piece A+B
   widened the finding base (`DECISIONS.md`, 2026-08-02): the PDF is still 4
   pages, not 40-60, unchanged despite total content growing ~32% (findings
   22 -> 36, prose+table content 6,427 -> 8,466 chars).** This definitively
   answers the question that motivated Piece A/B's fact-base-widening effort
   in the first place: more finding-generator coverage does not meaningfully
   close this gap. Root cause is architectural, confirmed complete not just
   plausible -- P4's findings layer generates a bounded, evidence-only fact
   set and P5's renderers only ever quote `Finding.statement` verbatim, never
   regenerate/paraphrase; a 40-60 page document needs roughly 80,000-180,000
   characters of body text, and even real, well-sourced content growth is a
   rounding error against that gap. **Closing it for real, if wanted, needs a
   genuinely different kind of full-depth content generation -- e.g. paid/
   BYOK LLM elaboration over the existing evidence-grounded findings --
   explicitly parked as its own future design conversation, not scoped or
   started.** "Length follows data" (SKILL.md principle 3) may mean a shorter
   Full Blueprint is simply correct; not decided.
   **Not yet built (real free-tools UI)**: both of the cluster's blocking
   design gates were researched and written up 2026-08-07 (`DECISIONS.md`),
   same discipline as the PDF-library/SVG-chart-layout gates -- both are now
   implemented (2026-08-07):
   - **UI framework: SCAFFOLDED.** Vite + SvelteKit (`adapter-static`),
     recommended earlier this session as the only one where static-output
     fidelity, bundle size, and "already-Vite" (present transitively via
     `vitest`) all point the same direction. Lives in a new `web/`
     subdirectory app (Option 1 of three repo-layout choices laid out and
     confirmed this session: separate app + own `package.json`, not a full
     npm-workspaces restructure of the existing, already-tested engine) with
     `jyotish-engine` wired in as a `file:..` dependency (root `package.json`
     gained `main`/`types` fields so `dist/` -- which already built cleanly,
     just had no declared entry point -- is actually consumable;
     `web/`'s `predev`/`prebuild` scripts rebuild it automatically so it
     can't go stale). A real integration bug (Vite's dev-server filesystem
     sandbox 403ing `@swisseph/browser`'s `.wasm` file, since it resolves
     outside `web/`'s own root through the symlinked dependency) was found
     by actually loading the app in a browser and fixed with
     `server.fs.allow` in `web/vite.config.ts` -- confirmed fixed in a real
     browser session (200 OK, real WASM init log), not just "the config
     changed." A demo page (`web/src/routes/+page.svelte`) proves the whole
     chain end to end: both `npm run dev` and the real static
     `adapter-static` production build (`npm run preview`) render the
     golden chart's own real Panchang, computed live in-browser via
     `computePanchang()` inside `onMount` (never during prerendering, per
     this project's zero-server-computation design). `.claude/launch.json`
     added for `run`/browser-preview tooling. This wiring-check demo page
     has since been REPLACED by the real Kundli Calculator page (below) --
     it no longer exists as a separate route. A PWA manifest/service worker
     (requirements-spec.md SS3) is still not added. The ~5.7MB
     `data/cities.json` geocoding dataset is now code-split out of the main
     bundle (`src/engine/geocoding.ts`, `geocodePlace()`/`resolveLocation()`
     made async, lazy `import()` cached after first call -- see
     `DECISIONS.md`, includes a real dev-only Vite MIME-type fix for
     `web/vite.config.ts`) -- done, not open.
   - **Kundli Calculator page: BUILT -- the first of the four real free
     tools.** `web/src/routes/kundli/+page.svelte` (South Indian D1 + D9
     charts, a 9-planet position table) plus
     `web/src/lib/components/BirthInputForm.svelte`, the shared
     date/time/place/precision input every one of the four tools needs, built
     as its own reusable component from the start rather than inlined in
     this one page. Calls the real `computeChart()` client-side, only from a
     click handler, never at prerender time. Real golden-chart verification
     in an actual browser (fresh tab, both dev server and the real
     `adapter-static` production build): Ascendant, all 9 planets, and both
     the D1 and D9 chart grids match `reference-chart-1983.json` exactly.
     Along the way, extracted `buildD1ChartInput()` (`southIndianChart.ts`,
     the D9-side `buildD9ChartInput()`'s counterpart) out of
     `natalChartSection.ts`'s own previously-duplicated inline version --
     confirmed a pure extraction (16 existing tests re-run, unchanged). Root
     `/` now a minimal four-tool hub linking to `/kundli`; the other three
     tools listed as "coming soon," not yet linked. See `DECISIONS.md`.
   - **Dasha Timeline Viewer page: BUILT -- the second of the four real
     free tools.** `web/src/routes/dasha-timeline/+page.svelte`: an
     expandable Mahadasha -> Antardasha -> Pratyantardasha tree (each level
     computed lazily on click, not all 810 boundaries eagerly up front),
     plus an "as of" date picker (`findActivePeriod()`) that finds and
     auto-expands whichever period was/is/will be active on any date, not
     just today. Reuses `BirthInputForm` as-is (no changes needed -- the
     first real proof it's genuinely shareable, as intended when it was
     built for the kundli calculator). Reuses `result.dasha` from
     `computeChart()` (already `computeMahadashaSequence()`'s own output)
     rather than calling that function a second time for the same input.
     `formatUtcDate()` added to `free-tools.ts`'s export list for the
     tree's date labels. Real golden-chart verification in a live browser
     (fresh tab, dev server AND the real `adapter-static` production
     build): all 9 Mahadasha boundaries match `reference-chart-1983.json`
     within the same already-documented ~3-day systematic offset every
     other dasha check in this project carries; Antardasha/Pratyantardasha
     chaining and lord-sequencing confirmed internally consistent; the "as
     of" feature independently verified against a specific historical date
     from the checked-in dasha-detail fixture. See `DECISIONS.md`. Root `/`
     updated -- no longer "coming soon."
   - **Panchang computation (tithi/vara/karana/yoga): BUILT.**
     `src/engine/panchang.ts` (`tithiFor`, `karanaFor`, `panchangYogaFor`,
     `nakshatraFor`, `varaFor`, `computePanchang`) plus
     `.claude/skills/jyotish-engine/references/panchang.md` and
     `config/panchang.json`, per the Surya Siddhanta sourcing (Burgess
     translation, Ch. II v.64-69 for nakshatra/yoga/tithi/karana, Ch. I
     v.36/51-52 for vara's sunrise-to-sunrise civil day) already researched
     and confirmed 2026-08-07. `@swisseph/browser` has no rise/transit/set
     function (confirmed by reading its full API) -- vara's sunrise
     boundary uses a new, self-contained, cited sunrise primitive instead
     (Meeus low-precision solar position algorithm, same as NOAA's ESRL
     Solar Calculator), empirically validated to 2m49s against the golden
     chart's real reported sunrise (05:55 AM IST, Chennai, 1983-04-23). A
     real bug (`cos` used where the hour-angle formula needs `sin` of the
     sunrise altitude, a >6 hour error) was caught specifically by testing
     against that real reference value, not by internal consistency alone
     -- see `DECISIONS.md`. `computePanchang()` run through the real
     pipeline reproduces all five of the golden chart's own Prokerala-
     reported panchang elements exactly (Nakshatra Purva Phalguni pada 2,
     Tithi Ekadashi Shukla Paksha, Yoga Dhruva, Karana Vishti, Vara
     Shanivara/Saturday). `tests/panchang.test.ts`, 17 tests. Suite:
     355 -> 372. Its real reachability from `web/` was proven via a
     wiring-check demo page (since replaced by the real Kundli Calculator
     page, below) -- the Panchang tool's OWN UI (as opposed to the Kundli
     Calculator, the first of the four to get a real page) is not yet built
     (the free tools are standalone utility outputs per requirements-spec.md
     §8, not part of the interpretive Findings/report pipeline) -- that's
     still open, separate work.
   - **Confidence Checker page: BUILT -- the third of the four real free
     tools.** `web/src/routes/confidence/+page.svelte`: calls `computeChart()`
     and reads `chart.confidenceFlags` directly (already
     `computeConfidenceFlags()`'s own output) rather than calling that
     function a second time. Absence of flags is stated as an explicit,
     positive result, not left blank, per SKILL.md's own
     report-absences-explicitly principle. Real golden-chart verification in
     a live browser (fresh tab, dev server AND the real `adapter-static`
     production build): reproduces exactly the 2 real flags this chart
     triggers -- `ascendant_near_cusp` (matching `confidence.test.ts`'s own
     existing golden-chart assertion) and `birth_time_round_number`
     (predicted from reading `confidence.ts` before testing, then confirmed,
     not discovered as a surprise). Reuses `BirthInputForm` unchanged. Root
     `/` updated -- no longer "coming soon." See `DECISIONS.md`.
   - **Panchang page: BUILT -- the fourth and last of the four real free
     tools.** `web/src/routes/panchang/+page.svelte`: reuses `BirthInputForm`
     unchanged and calls `computePanchang()` directly (no `computeChart()`
     needed -- Panchang is the one tool that only needs Sun/Moon longitude
     and the birth instant, not a full chart). A real discrepancy was caught
     and flagged before this was built, not smoothed over: the instruction
     that requested the Confidence Checker called it "the last of the four,"
     but Panchang's engine had never gotten its own page (its earlier
     wiring-check demo page was replaced by the Kundli Calculator) -- user
     confirmed building it now. Real golden-chart verification, all five
     elements, in a live browser (fresh tab, dev server AND the real
     `adapter-static` production build): Shanivara, Ekadashi (Shukla Paksha),
     Purva Phalguni pada 2, Dhruva, Vishti -- exact match to the raw
     Prokerala source, the same standard `tests/panchang.test.ts` already
     holds this engine to. Root `/` now links all four tools; the unused
     `.pending` CSS class removed. See `DECISIONS.md`. **All four free tools
     named in requirements-spec.md §8 now genuinely exist** -- the free-tools
     cluster's UI is complete at v1 scope. Remaining open items (at the time):
     geocoding admin1/state-hint disambiguation, a PWA manifest/service
     worker, and code-splitting beyond the geocoding dataset.
   - **Geocoding admin1 (state/province) disambiguation: DONE.**
     `geocodePlace()`'s own long-standing KNOWN GAP (only country-level
     disambiguation existed; state/province hints like "Illinois" in
     "Springfield, Illinois, USA" were parsed but ignored, so ties fell back
     to population and could return the wrong city). Closed via
     `data/admin1.json` (GeoNames' own `admin1CodesASCII.txt`, fetched
     directly -- `download.geonames.org` is reachable from this full Claude
     Code CLI session even though it wasn't from the original sandboxed
     session `cities.json`/`countries.json` were built in) and
     `scripts/build-admin1-data.mjs`. `geocodePlace()` now tries an
     admin1-code match first, then country, then population -- one more tier
     on the same fallback chain, not a restructure. Real-data verification:
     "Springfield, Illinois, USA" now correctly resolves to Springfield, IL
     (lat 39.80172, matching `data/cities.json`'s own real entry) instead of
     the higher-population Springfield, MO. Verified end-to-end through the
     real Kundli Calculator UI too (dev server and the static production
     build), not just at the engine/test level -- `admin1.json` needed the
     same dev-only Vite MIME-type fix `cities.json`/`countries.json` already
     had. `data/README.md`'s "Known gap" section rewritten to "DONE". See
     `DECISIONS.md`. Suite: 372 -> 374.
   - **PWA manifest and service worker: DONE** -- closes
     requirements-spec.md §3's "a PWA manifest for offline and installable
     use", the last open free-tools-cluster item. `@vite-pwa/sveltekit`
     (`web/vite.config.ts`), a real on-brand icon generated via
     `scripts/build-pwa-icons.mjs` (reusing `@resvg/resvg-js`, already a root
     dependency -- not the SvelteKit scaffold's own default Svelte-logo
     favicon), manifest link + service-worker registration wired into
     `web/src/routes/+layout.svelte` (a real gap the plugin didn't handle
     automatically, found by checking the actual built HTML, not assumed
     from "zero-config" framing). The geocoding dataset chunks are
     explicitly excluded from precaching (`maximumFileSizeToCacheInBytes`)
     so installing the PWA doesn't silently undo the geocoding lazy-load fix
     above. Verified in a real static-preview browser session: active
     service-worker registration, valid fetched manifest, 37 precached
     entries including `/kundli`'s own prerendered HTML (real offline
     availability of the app shell, not just a manifest file existing on
     disk). See `DECISIONS.md`.
   **Section 8 (Remedies & Executive Summary): BUILT AND WIRED IN --
   Full Blueprint is now a genuine 8/8-section document, real page count
   re-measured at 4 (via 5, briefly, before a real Executive Summary
   ranking bug was found and fixed -- see below) (`DECISIONS.md`,
   2026-08-03/04):**
   - **Executive Summary** (`src/export/remediesSection.ts`): built --
     reuses interpretation.md's own literal
     Essence description (top 2-3 findings by strength across the WHOLE
     chart + current dasha in one sentence), the exact thing P5 deliberately
     did NOT build when it chose "one sentence per domain" instead
     (`essenceDocument.ts`'s own module doc). Zero new content, zero new
     sourcing -- a selection over already-computed `Finding.strength` values.
   - **Remedies, Tier 1 (dasha-period remedy) -- both blocking conditions
     resolved, engine built and tested for all 9 Mahadashas:**
     1. **RESOLVED**: the real BPHS chapters are Ch. 52-60 (R. Santhanam
        translation, Vol. 2), NOT the originally guessed Ch. 46-53 (which is
        dasha mechanics/predictive results, not remedies) -- a real,
        logged correction (`DECISIONS.md`), same discipline as the Shakata
        Yoga citation fix. One chapter per Mahadasha lord, each walking all
        9 Antardashas; the real structure is a genuine 9x9=81-cell table,
        matching the secondary compilation's own shape. Built in two passes:
        Sun/Moon/Rahu/Saturn first (a benefic luminary, a shadow planet, a
        naturally malefic planet), then Jupiter -- the one classical
        benefic none of the first four were -- read and checked in
        isolation BEFORE the remaining four (Mars/Mercury/Ketu/Venus),
        specifically to confirm the trigger vocabulary generalizes rather
        than assuming it from malefic/luminary chapters alone. It did: no
        new condition type, no fewer evil-effects clauses just for being a
        benefic's chapter. **Real research finding that reshaped the
        design**: every row's remedy is conditional on the Antardasha lord
        being AFFLICTED in that specific chart (debilitated, in
        6th/8th/12th from Ascendant or from the Mahadasha lord's own sign, a
        maraka-house lord, aspected by a malefic) -- not a flat "this period
        is running" trigger. A naive MD x AD lookup would show a remedy even
        to a reader whose Antardasha lord is genuinely well-placed,
        manufacturing an affliction BPHS's own text doesn't describe for
        that placement. `src/rules/dashaRemedies.ts` implements this as a
        generic, chart-conditional engine (5 atomic condition types --
        dignity, house-from-Ascendant, house-from-Mahadasha-lord's-sign,
        maraka-lordship, aspect/conjunction-with-malefics -- verified
        uniform across 5 stress-test chapters before generalizing to all 9);
        `src/rules/dashaRemedyData.ts` holds the verse-verified row data,
        checked chapter-by-chapter for the same OCR page-order scrambling
        that hit Ch. 52 originally (confirmed: none of the other 7 chapters
        were actually scrambled, checked rather than assumed clean). **Four
        real, deliberate omissions, not gaps -- two different kinds**:
        Mars-in-Moon and Moon-in-Venus genuinely have no remedy verse at
        all; Ketu-in-Mars and Mars-in-Venus have ONLY R. Santhanam's own
        explicitly-flagged translator speculation ("Perhaps..."/"we
        believe...") standing in for a missing verse -- correctly excluded
        as translator commentary, not Parashara's text, the same standard
        the original Ch. 57 note-contamination check established. Table
        holds 77 of 81 rows. Real-tested against the golden chart
        (`tests/dashaRemedies.test.ts`, 29 tests): today's real running
        Antardasha (Mercury in Rahu Mahadasha) genuinely surfaces a remedy
        (Mercury is this chart's real 2nd-house/maraka lord AND sits in
        Saturn's 7th-house aspect); Mars surfaces in its own Mahadasha via a
        different real mechanism (Saturn's aspect alone, non-maraka,
        own-sign); Saturn surfaces in Ketu Mahadasha for two independent
        real causes at once (its own maraka lordship AND Mars's aspect) --
        caught one incomplete hand-verification along the way when the
        second cause was found only after actually checking rather than
        assuming a single cause. Jupiter, Ketu, and Venus all correctly stay
        silent in their own Mahadashas, and Venus-in-Mercury separately
        stays silent too -- every outcome confirmed against real computed
        chart facts, not asserted either way.
     2. **RESOLVED in the engine's own design**: the Finding's reader-facing
        `statement` is framed as "a traditional supportive practice
        associated with the current Antardasha," and never states the
        underlying affliction reasoning (maraka lordship, malefic aspect,
        etc.) in that text -- Mahamrityunjaya Japa's literal name and any
        other remedy text never appears paired with words like "evil
        effects" or "danger." The actual chart-fact reasoning is preserved
        in `Finding.evidence` for provenance/audit, not in reader-facing
        prose -- the same disclosed-choice-out-of-statement-text pattern
        `bodyPartFindings()`/`houseAfflictionFindings()` already use.
     - **Real research correction also logged**: Mahamrityunjaya Japa's
       prevalence across sampled rows (3 of 18 in the first two chapters
       read) is lower than "most of the 81 rows" as originally
       characterized -- the framing requirement still stands wherever it
       does appear, just less pervasive than assumed.
   - **On record, not a bug to reconcile later**: Tier 1's real content
     (mantra/charity/ritual) differs substantively from the gemstone-centric
     remedies `interpretation.md`'s own guardrails section was written
     assuming (a reasonable assumption at spec-writing time, following
     common convention -- just not what this project's actual primary
     source teaches). The guardrails' safety intent (don't over-strengthen;
     route high-impact remedies to a practitioner; distinguish
     chart-mandated from general-optional) stays fully valid and now
     literally governs Tier 1's real engine (a remedy only surfaces when the
     chart itself mandates it); only the assumed remedy modality changes.
   - Tier 2 (dignity/affliction-targeted remedy, independent of dasha period
     -- what the existing guardrails were actually written for) is explicitly
     NOT in this v1: nothing found so far confirms BPHS teaches a distinct
     per-planet-dignity remedy framework separate from the dasha table. A
     real, separate, unconfirmed research question for later, not bundled in.
   - **DONE**: Executive Summary built (`src/export/remediesSection.ts`,
     `selectTopFindings()`); wired into `buildFullDocumentContent()`'s real
     Section 8 (`fullDocument.ts`/`fullPdf.ts`/`fullDocx.ts`), replacing the
     old "not yet available" notice. `detectDashaRemedy()` is called fresh
     from the section's own `asOfISO`, not read off the pre-aggregated
     `findings` array (which is baked in at `computeChart()`'s own internal
     "now") -- the same fix already needed once for `renderTimingSection()`,
     applied proactively this time instead of being rediscovered as a bug.
     Real output visually confirmed (generated DOCX unzipped and read
     directly) and tested (`tests/export/remediesSection.test.ts`;
     `tests/export/fullDocument.test.ts` updated for real section-8
     assertions in place of the old placeholder check).
   - **DONE, real bug found and fixed post-build, not left unremarked**: the
     Executive Summary's original strength-only top-3 ranking was a genuine
     tuning gap, not a legitimate ranking, once real golden-chart output was
     inspected -- body-part findings (strength copied wholesale from
     `DIGNITY_STRENGTH`, calibrated in Piece A purely for Health's own
     single-domain tier classification, never for competing against yoga
     classifications across domains) crowded this chart's actual standout
     facts (5 Raja Yoga EXACT combinations, Gajakesari EXACT) entirely out
     of the top-3. Fixed via a shared `findingCategoryRank()`
     (`src/util/findingCategory.ts`, extracted from `render.ts`'s
     `richnessRank()` as a pure, byte-identical delegation, not a rewrite --
     verified unchanged against all 7 of `render.test.ts`'s explicit
     collision cases by direct inspection, not just passing tests) --
     Executive Summary now ranks category-first, `Finding.strength` only as
     the tiebreak within a category, the same judgment call
     `dedupeBySharedFact()` already made for within-cluster ties, now
     generalized to the whole candidate pool. Real, re-verified result: top-3
     is now Malavya Yoga, Gajakesari Yoga, and the Lagna-lord Raja Yoga --
     this chart's genuine standouts. A regression-guard test asserts
     body-part findings never win a slot again despite an equal-or-higher
     raw strength number.
   - **Real, measured page count: 4** -- briefly 5 immediately after Section 8
     was first wired in (before the ranking bug above was caught and fixed);
     the 3 shorter yoga statements that now win vs. the 3 longer two-sentence
     body-part statements they replaced was enough of a real content-length
     difference to land back under a page boundary. Confirmed by regenerating
     and re-measuring, not assumed. Still nowhere near the spec's 40-60
     estimate, exactly as the already-complete architectural diagnosis
     predicted -- this re-measurement (twice) was taken to have the honest
     current number on record, not because the diagnosis was expected to
     change, and it didn't.
     The 4 deliberately-omitted remedy rows' own alternate handling, if any
     is ever wanted, remains not planned -- see above for why each was
     excluded.
   - **Separately found and fixed while investigating the ranking bug**:
     `tsconfig.json` excluded `tests/` from `npm run typecheck` for this
     project's entire history -- real infrastructure debt, not introduced
     this session, just found this session. New `tsconfig.typecheck.json`
     (kept separate from the build-facing `tsconfig.json` so `dist/` never
     picks up compiled test files) now covers both; `package.json`'s
     `typecheck` script updated. Immediately surfaced two real, latent,
     pre-existing type errors in test files (a `readonly` tuple mismatch, a
     duplicate object-literal key silently overwriting itself) -- both fixed,
     both confirmed type-only (no runtime behavior change, affected tests
     rerun and still passing). Proved the new config actually catches
     regressions by injecting and reverting a deliberate type error.

## Known gaps

- **RESOLVED 2026-08-01 (reference material only, see `DECISIONS.md`): `yogas.md`'s Shakata Yoga entry was mis-attributed.** BPHS Ch. 35 (Nabhasa yogas) names its own, unrelated "Sakata" (all seven grahas confined to the Lagna and 7th house together -- a sign-pattern condition, consistent with Musala/Rajju/etc.'s geometric character, not implemented anywhere in this codebase). This project's actual Shakata Yoga (Moon 6th/8th/12th from Jupiter) is real and was already correctly STATED in substance, but had no citation and turned out to come from a different primary text entirely -- **Phaladeepika (Mantreswara), Ch. 6 ("Yogas and their effects"), Sloka 14** (`https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621578.html`), fetched and confirmed directly, not from a secondary summary. A second, smaller error surfaced in the same check: the entry's stated cancellation ("Jupiter otherwise strong and well-aspected") didn't match the verse's own text (Moon in Kendra from the LAGNA negates it -- the same mechanism Kemadruma Yoga's own primary cancellation already uses) -- corrected. `yogas.md` now states both the correct citation and an explicit non-conflation note. No code was affected -- `detectShakataYoga()` doesn't exist yet (see "Deferred features" above).

- **Real, structural test-coverage gap surfaced while adding Raja Yoga (2026-08-01, DECISIONS.md): `tests/narrative/fixtures.ts`'s `buildWeakCareerChart()` no longer exercises a genuinely all-challenging ("zero supportive findings") Career case.** Its Aries-Lagna + Sun-debilitated(house 7) + Saturn-debilitated(house 1) combination structurally produces two real Raja Yoga EXACT hits (10th-lord Saturn + 5th-lord Sun mutual Kendra; among others depending on the other planets' placement) that are completely independent of either planet's own weak dignity -- not avoidable by moving an unrelated planet, since Sun's and Saturn's houses here are forced by their own debilitation signs under Aries Lagna, and both houses are load-bearing for other assertions. The fixture (and its tests) were updated to reflect its new, correct "mixed" classification rather than forcing an artificial workaround. A dedicated purely-challenging-Career fixture, if still wanted, needs a non-Aries Lagna chosen specifically to avoid this same structural coincidence -- not built, since it wasn't asked for and `buildMixedCareerChart()` already covers "mixed" from a different angle; genuinely different test coverage (currently missing) is a real gap, not a bug.

- **Two concrete follow-ups surfaced by the PDF/DOCX library validation (see `DECISIONS.md`, 2026-07-30), neither blocking the Essence-depth v1 but both real before Overview/Full or P8 output goes through this pipeline:**
  - `pdfmake`'s standard-14 fonts (Helvetica etc., used for the English-only validation) support ANSI/English characters only. Once P8's Tamil/Hindi/Telugu output needs to go through PDF export, a real embedded font with the right script coverage (e.g. Noto Sans Devanagari/Tamil/Telugu) will be needed -- not scoped or chosen yet.
  - **Resolved** (see `DECISIONS.md`, 2026-07-30): `docx`'s SVG image type requires a raster `fallback` image (confirmed via its own type definitions) -- there's no SVG-only path for Word compatibility, and the initial validation's 1x1 placeholder was found, by the user directly unzipping and inspecting the generated `.docx`, to be a real, wired, visible-box fallback rather than a harmless stand-in -- any non-SVG-aware viewer would have silently shown a blank square. Fixed with `@resvg/resvg-js` (added as a devDependency) rasterizing the real chart SVG to a genuine 400x400 PNG.
  - **Architecture question also resolved, while building the real Overview-depth export module** (`src/export/overviewDocx.ts`): `exportOverviewDocx()` takes the rasterized fallback PNG as a parameter, not something it computes internally -- `@resvg/resvg-js` is a native Node addon and cannot run in a browser at all, so making it a hard internal dependency of "portable" export code would have been a real bug in this project's actual (client-side-only) deployment target, not just an open question. The caller supplies the PNG however fits its own environment (Node tooling/tests use `@resvg/resvg-js`; the real browser product would use its own Canvas API) -- same dependency-injection pattern already used for `findNextSignCrossing()`'s injected longitude callback (transit.ts).

- **P8's narrow groundwork probe (Hindi, one real rendering trial-translated -- see `DECISIONS.md`, 2026-07-30) surfaced concrete architecture requirements P8's eventual real scoping pass should start from, not re-derive from scratch:**
  - `Finding.statement` construction (`findings/index.ts`, `yogas.ts`) is hardcoded English sentence frames with facts interpolated -- Hindi's verb-final word order means a translated language likely needs its own sentence-construction logic, not a translated lookup table of English phrases plugged into the same frame shape.
  - `src/util/ordinal.ts` is English-suffix-only (confirmed by reading it) -- a Hindi equivalent needs Jyotish-register Sanskritized ordinals (नवम/दशम/तृतीय), not colloquial ones, per the probe; open question for native review whether that register choice is correct.
  - Sanskrit-origin terms already in the English text (Lagna, Kendra, Yoga) transliterate close to 1:1 into Devanagari -- likely true for Tamil/Telugu too given their own Sanskrit borrowing, but not checked.
  - Compound-title forms (दशमेश for "10th lord," matching लग्नेश's existing pattern) vs. fuller phrases is an open style question, not resolved by this probe.
  - **Domain-name translation is its own term-selection problem, distinct from the four sentence-assembly findings above.** User feedback on the draft: "Career" rendered as करियर (a direct English loanword transliterated into Devanagari) specifically didn't land well, while the rest of the trial translation read fine. This means at least one of the six domain names (career/wealth/health/relationships/purpose/timing) needs a deliberately chosen term per language, not an assumed-safe loanword or literal translation -- unlike Lagna/Kendra/Yoga (already Sanskrit, transliterate cleanly), a modern English word like "Career" has no single obvious Sanskrit/Hindi equivalent (candidates worth native review: व्यवसाय, कर्म-क्षेत्र, पेशा -- none confirmed). Whoever picks up full P8 engineering should treat all six domain names as their own review item, not assume they're as straightforward as the astrological jargon terms that did transliterate cleanly.
  - Not yet checked: whether any of this holds for Tamil or Telugu specifically -- the probe covered Hindi only. A full P8 scoping pass needs at minimum one equivalent trial for each of the other two languages before assuming Hindi's findings generalize.

- **`renderSouthIndianChartSVG()` only renders D1 (Rasi) -- D9 (Navamsa) and other vargas have no chart-renderable sign-placement data assembled anywhere.** The renderer itself is already decoupled from `ChartData` specifically so it can take D9's sign placements without any renderer changes once they exist -- the missing piece is a function that computes each planet's D9 sign (via the existing `navamsaSign()` in `src/engine/varga.ts`) plus the D9 Lagna sign, and assembles them into the same `SouthIndianChartInput` shape. Small, bounded, not done because D1 was the only scope asked for.

- **RESOLVED 2026-08-01 ("Piece A" -- see DECISIONS.md for the full design-gate and build entry). Health's and Relationships' own domain-mapping table rows named factors P4's finding-generators never implemented; both are now built.**
  - Health's third named factor, **"planetary body-part associations"** -- `bodyPartFindings()` (`src/findings/index.ts`), one finding per graha with both a notable dignity and a body-part entry in `constants.md`'s Karakas table (Rahu/Ketu excluded, no entry exists for them). Verified against the golden chart: Sun, Saturn, Venus, and Mars all now produce real body-part findings quoted in Health's full-depth text.
  - Health's second named factor, **"afflictions to 6th/8th,"** and Relationships' **"aspects onto the 7th"** -- `houseAfflictionFindings()` (`src/findings/index.ts`), reusing the already-existing `aspectedHouses()` primitive plus each planet's own `.house` field. "Affliction" means occupancy or aspect by a natural malefic (Saturn, Mars, Rahu, Ketu) -- a disclosed implementation choice (Sun/Mercury/Moon excluded, `constants.md`'s new "Natural malefics and benefics" section), not settled classical fact, same disclosure standard as Mangal Dosha's own reference-point choice. The golden chart has no real 6th/8th/7th affliction by this definition (confirmed, not assumed -- a dedicated synthetic-chart test suite proves the mechanism detects correctly when it should).
  - **Real bug found and fixed while verifying real output, not left to stand**: `bodyPartFindings()`'s new findings shared `dedupeBySharedFact()`'s dignity-evidence collision key with existing dignity/house-lord findings for the same planet, and were being silently dropped by richer siblings (verified: Sun's and Saturn's body-part findings were missing from Health's real rendered text before the fix). Fixed in `render.ts`'s `dignityEvidenceKey()` -- body-part findings are now excluded from that clustering entirely, since they say something genuinely different (which body system) with the same underlying fact, not a restatement of it. Verified by reverting the fix and watching the new regression test fail with exactly the predicted mismatch, then restoring it.

- **Timing's P5 v1 (`src/narrative/timing.ts`) deliberately does not build interpretation.md's full "Timeline" section (§ Full-depth document structure, item 7) -- explicitly scoped down, confirmed with the user before implementing, not silently trimmed.** Two pieces remain open, each real new design surface, not a quick follow-on:
  - **Transit overlay** -- Jupiter/Saturn sign ingresses (`src/engine/transit.ts`, already built and validated for P7b) aren't shown anywhere in Timing's render, and transit data still isn't wired into `computeChart()`'s own output at all (a pre-existing gap, tracked above under P7b's own entry). Needs a decision on how a transit ingress and a dasha transition should be interleaved in one "near-term timeline" narrative, not just two separate lists.
  - **"Ranked turning points with reasoning shown"** -- interpretation.md's literal ask for the full Timeline section. This requires cross-referencing an UPCOMING dasha lord's own dignity/strength (already known via the other five domains' findings, e.g. "Jupiter is exalted in your 9th house") against the fact that their period is approaching, to say something like "the Jupiter Antardasha beginning in 2025 may be a supportive window, given Jupiter's placement." Nothing in this codebase currently connects a future dasha lord to that lord's OWN chart-strength -- a genuinely new synthesis step, not a template addition.
  - Related, smaller gap: every period sentence in `timing.ts` beyond the CURRENT one is built directly from `DashaPeriod` data, not from a `Finding` object -- future dasha periods (and, if implemented, transit ingresses) have no `Finding` representation at all right now. This is fine for v1 (the data is still real and evidence-grounded, just not Finding-wrapped -- see `DECISIONS.md`), but would need addressing if a future pass wants findings-level provenance for every period cited, not just the current one.

- **`dedupeBySharedFact()`'s yoga/Lagna-lord-dignity finding (rank 0/1) still absorbs EVERY house-lord sibling for the same planet unconditionally, regardless of how many distinct houses they govern -- only fixed for the rank-2-vs-rank-2 (house-lord vs. house-lord) case (see `DECISIONS.md`, 2026-07-30 dedup bug entry).** Deliberately scoped narrowly to the one case a real chart actually produced (Mercury as both 2nd and 11th lord, no competing yoga). Not yet exercised by any real chart: a SINGLE planet that is BOTH (a) in a Mahapurusha yoga or Lagna-lord-flagged, AND (b) lording two or more OTHER domain-relevant houses at once -- under current code, the yoga/dignity finding would still absorb and silently drop every one of those house-lord findings, the same failure mode just fixed, in a shape that hasn't been checked. Revisit if a future golden-chart expansion (or a Timing/Wealth combination) produces this concretely, rather than fixing a case with no real instance to validate against yet.

- **Bhadra Yoga (Mercury) domain tag: a real, if thin, argument for wealth+relationships not acted on.** Currently untagged (no domain), matching the per-graha consistency rule the whole Mahapurusha domain-tag audit rests on (Mercury isn't a named karaka in interpretation.md's table). But BPHS Ch. 75's actual verses (fetched by the user directly, not reachable by this project's own tooling) specifically mention wealth shared with friends and a happy life with "wife and children" for Bhadra -- more textually specific than the generic rulership praise shared by all five Mahapurusha yogas. Deliberately not acted on: retagging Bhadra alone would break the uniform per-graha rule (Mercury's own dignity finding would still carry no domain, creating an unexplained special case), and it hasn't been checked whether this wealth/family language is actually differentiating for Bhadra specifically or just more shared praise-language across the other four yogas' own verses (the same trap the "ruler of region" line turned out to be). See `DECISIONS.md` (2026-07-29, "Follow-up on the audit above") for the full reasoning. Revisit only if a future pass reads all five yogas' verses side by side specifically to check this.

- **Kemadruma Yoga: only one of `yogas.md`'s two listed cancellations is
  checked.** `detectKemadrumaYoga()` (`src/rules/yogas.ts`) checks the
  Moon-in-Kendra-from-Lagna cancellation only. The second listed
  cancellation (Moon conjunct/aspected by a benefic -- Jupiter/Mercury/Venus)
  isn't implemented. Some real EXACT classifications may in fact be
  cancelled under a tradition that also honors that second check. Previously
  flagged only inside the Finding's own reader-facing statement text ("consider
  checking benefic aspects..."), which was itself a bug (see `DECISIONS.md` --
  that phrasing addressed whoever audits the system, not the person reading
  their own chart, and got quoted verbatim into real output). Moved to this
  backlog item and a code comment; the statement itself no longer mentions it.

- **Geocoding: no state/province (admin1) disambiguation.**
  `geocodePlace()` (`src/engine/geocoding.ts`) falls back to population
  within a country, ignoring state/province hints in the input --
  concretely, "Springfield, Illinois, USA" resolves to Springfield,
  Missouri. Real impact: 625/25,613 (~2.4%) same-country city names in the
  bundled dataset collide. GeoNames' `admin1CodesASCII.txt` (the code -> name
  table needed to fix this) wasn't reachable from the sandbox this was built
  in -- checked npm, GitHub raw, PyPI, no luck. Each city retains its raw
  admin1 code already, so fixing this needs only that one file, not a data
  model change. Full detail: `data/README.md`, code comment in
  `geocoding.ts`, test documenting current behavior in `tests/geocoding.test.ts`.

- **Golden chart: Sun, Mars, Rahu, and Ketu land just outside the stated
  1 arc-minute longitude tolerance** (1.20', 1.25', 1.03', 1.03'
  respectively). 5/9 planets + Ascendant pass cleanly. **RESOLVED as to
  cause, 2026-08-07 (DECISIONS.md): NOT imprecision in this fixture's own
  hand-derived values** -- the fixture's raw Prokerala source was located,
  checked into the repo (`tests/golden-charts/sources/
  reference-chart-1983-prokerala-raw.md`), and independently verified to
  match the fixture's own numbers exactly, closing the "is this a
  transcription error" question this entry originally raised. The real gap
  is a genuine Prokerala-vs-this-project's-own-engine (`@swisseph/browser`,
  Moshier-based) difference. **Still open**: which source is actually closer
  to true -- that needs a genuinely independent THIRD source (not another
  read of the same Prokerala report), same resolution path as item 1 above,
  not tightening ephemeris precision or widening tolerance.

- **Golden chart: every Mahadasha boundary date is a constant ~3 days off
  from the fixture** -- and, confirmed 2026-08-07, so is every Antardasha
  and Pratyantardasha boundary beneath it (checked against the same raw
  source, all 81 + 729 of them; the offset stays constant with depth, never
  compounds). Downstream consequence of the same Moon-longitude gap above,
  propagated through `birthBalance.balanceYears` -- exactly what SKILL.md's
  `references/dasha.md` warns "a few arcminutes shifts the balance by days,
  which compounds through every subsequent boundary." The offset is constant
  across all 9 Mahadasha boundaries (not growing), which is the expected
  signature of this cause, not of a chaining bug -- see `DECISIONS.md`. Same
  resolution path as the item above: a genuinely independent third source,
  not tightening ephemeris precision.

## Deferred features (out of scope for now)

Per `.claude/skills/jyotish-engine/SKILL.md`'s "Chapters relevant to work
not yet done" table and `docs/requirements-spec.md` §4/§11 -- check the cited
BPHS chapters directly when any of these become active work, rather than
reconstructing from memory or a secondary source:

- Shadbala (six-fold planetary strength)
- Ashtakavarga
- Divisional charts beyond D1/D9 (D2-D60, remaining shodasavarga)
- **DONE 2026-08-01 (Piece B, DECISIONS.md): Raja Yoga's simplified subset** (`detectRajaYoga()`, Ch. 39) -- Kendra-lord/Trikona-lord conjunction, mutual-Kendra aspect, and the dignified dual Lagna-lord case. The Jaimini/Chara-Karaka method (Ch. 39 vv.3-5's OTHER named method) remains deferred -- Chara Karakas aren't computed anywhere in this project (still listed below).
- **PARTIALLY DONE 2026-08-01: Nabhasa yogas** (BPHS Ch. 35) -- a deliberate subset implemented (`detectRajjuYoga`/`detectMusalaYoga`/`detectNalaYoga`/`detectGadaYoga`/`detectVihagaYoga`), not exhaustive: Ch. 35 names roughly 32 total. Mala/Bhujanga (Sarpa) Yoga was deliberately excluded -- the fetched primary-source verse left genuine ambiguity about whether every occupant of the 3 Kendras must be benefic/malefic or merely one present, confirmed by asking the source directly and getting "does not explicitly state" back; yogas.md's own Musala caution ("when in doubt, do not report") applied. The remaining ~26 unnamed Nabhasa yogas are still fully deferred, not started.
- **Kala Sarpa, Sade Sati doshas -- held, not queued as automatically next.** Explicitly held out of the 2026-08-01 Piece B pass per direct instruction; both confirmed ABSENT from BPHS entirely (checked directly, both volumes) and need their own separate design gate before any work starts, same category as Personality's own Phaladeepika detour -- real primary-source research, not a quick lookup. **2026-08-02: the specific question that had been motivating continued fact-base-widening work (does more findings coverage close the Full Blueprint page-count gap) is now definitively answered -- no** (re-measured after Piece A+B: page count unchanged at 4 despite ~32% real content growth; see the page-count entry above and `DECISIONS.md`). Decided to regroup on priority before spending Kala Sarpa/Sade Sati's research effort, rather than treating them as automatically next just because they were named alongside Nabhasa/Raja Yoga in the original Piece B scope.
- Shakata Yoga (Moon 6th/8th/12th from Jupiter, correctly re-sourced to Phaladeepika Ch. 6 v.14, not BPHS -- see "Known gaps" below) -- reference material is fixed, but `detectShakataYoga()` itself still doesn't exist as code; not implemented in the 2026-08-01 pass, since only the pre-existing citation error was in scope to fix, not new detection logic. BPHS's own unrelated "Sakata" Nabhasa yoga (all seven grahas in Lagna+7th) remains separately unimplemented too.
- Karakas / Atmakaraka (Jaimini-style, Ch. 32-33)
- Dasha systems other than Vimshottari (Ashtottari, Kalachakra, etc.)
- House systems other than Whole Sign; chart formats other than South Indian
  (North Indian, Bengali)
- Birth-time rectification wizard; compatibility/synastry; multi-chart
  family view; practitioner review/annotation export; conversational chat
  over the chart
- Longevity calculation -- explicitly out of scope per "never trade on
  fear"; do not implement without revisiting that constraint first

## Not started

- P6 document assembly: the free-tools cluster remains the only unbuilt piece -- SVG chart (D1+D9), PDF/DOCX export at Essence/Overview depth, and Full Blueprint's own document/pagination pipeline are all built, and as of 2026-08-03/04 Full Blueprint is a genuine 8/8-section document (section 8, Remedies & Executive Summary, built and wired in -- see "Next up" above). Real, measured page count: 4 (not 5, not 40-60) -- briefly 5 immediately after Section 8 first landed, then back to 4 once a real Executive Summary ranking bug was found and fixed (see "Next up" above); re-measured each time specifically because content changed, not because the count was expected to move on its own; the architectural diagnosis (`render.ts` only ever quotes `Finding.statement` verbatim, never generates elaborated prose) is unchanged and still the reason the 40-60 estimate isn't close. Whether to pursue paid/BYOK LLM elaboration to actually close that gap is its own future design conversation, not started. Free-tools cluster's own two blocking design gates (UI framework; Panchang calculation method) were researched and written up 2026-08-07 (`DECISIONS.md` -- see "Next up" above); both are now implemented: Panchang is golden-chart-verified (`src/engine/panchang.ts`), and the UI framework is scaffolded (`web/`, Vite + SvelteKit + `adapter-static`). **All four real free-tool pages are now built and golden-chart-verified in a real browser: Kundli Calculator (`web/src/routes/kundli/`), Panchang (`web/src/routes/panchang/`), Dasha Timeline Viewer (`web/src/routes/dasha-timeline/`), and the Confidence Checker (`web/src/routes/confidence/`).** The free-tools cluster's UI is complete at v1 scope. Geocoding's admin1/state-hint disambiguation gap is now closed too (`data/admin1.json`), and so is the PWA manifest/service worker (`@vite-pwa/sveltekit`, see "Next up" above) -- **every item requirements-spec.md §3/§8 named for the free-tools cluster is now built.** Remaining open item: bundle code-splitting beyond the geocoding dataset (a real, stated limitation, not a spec requirement).
- P7b Jupiter/Saturn transit ingress detection: search primitive and `.ics` export both done and validated (`src/engine/transit.ts`, `src/export/transitCalendar.ts` -- see "Next up" above); not yet wired into `computeChart()`'s output or merged with the dasha `.ics` into a single file
- P7's versioned-regeneration-with-diffs requirement -- not yet scoped into either P7a or P7b
- Timing's deferred "Timeline" scope (transit overlay, ranked/reasoned turning points) -- see "Known gaps" above
- P8 languages (`ta`/`hi`/`te` narrative output; type stub exists, no implementation) -- unblocked (P5 exists in English now), full engineering not started, but a narrow groundwork probe ran in parallel with P6 (see below)
