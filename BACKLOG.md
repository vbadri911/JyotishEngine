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
   **Not yet built**: Full Blueprint's own document/pagination pipeline (a
   40-60 page PDF/DOCX assembly is a different problem than Essence/
   Overview's single-digit-page ones -- likely deserves its own
   library-validation-style gate before real code, same category as the one
   Essence/Overview got); the free-tools cluster (needs this project's
   first-ever UI-framework decision -- see below); and the Remedies section
   (currently zero code -- even a v1 disclosure-only version, given
   interpretation.md's remedy guardrails route most real recommendations to
   "consult a practitioner" anyway, would be a defensible, much smaller
   starting scope than a full remedy-generation engine).

## Known gaps

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

- **Health's and Relationships' own domain-mapping table rows name factors P4's finding-generators never implemented.** Traced while directly answering why Health's P5 finding coverage structurally caps at 3 possible findings (see `DECISIONS.md`, 2026-07-30 "Health domain templated" entry for the cap itself, and 2026-07-30 "scoping" entry below for this gap specifically): the cap is a real, correct consequence of the Lagna-lord/house-lord mechanism, but that mechanism doesn't cover everything interpretation.md's table names.
  - Health's third named factor, **"planetary body-part associations,"** has zero implementation for any of the nine planets, even though the data already exists: `constants.md`'s karaka table has a body-part column for every graha (Mars: blood, Mercury: nervous system/skin, Jupiter: liver/fat, Venus: kidneys, Saturn: bones/joints/chronic illness, etc.) -- the same table `GRAHA_DOMAINS` already partially draws from for Career/Wealth/Relationships. Unlike the Mars/Mercury-as-Career-karaka question (correctly left untagged per SKILL.md's caution against inventing an unstated mapping), this is the reverse case: the mapping is already written down, just never turned into a Finding.
  - Health's second named factor, **"afflictions to 6th/8th,"** and Relationships' **"aspects onto the 7th,"** currently only mean "the house lord's own dignity" (`houseLordFindings()`). Neither covers which planets *occupy* or *aspect* those houses -- classically at least as central for dusthana/7th-house assessment specifically. The primitive already exists (`aspectedHouses()`, `src/engine/houses.ts`); house occupancy is trivially derivable from each planet's own `.house` field. Relationships already shipped without this, so it's a pre-existing gap, not something introduced today.
  - Not implemented now: each would be a new Finding-generator (parallel in scope to `combustionFindings()`), deserving its own deliberate design pass (in the spirit of P7b's design-gate) rather than a mid-domain addition -- and would change finding counts several existing narrative tests assert on exactly, needing a full re-validation pass regardless of which domain is being worked on when it happens.

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
  respectively). 5/9 planets + Ascendant pass cleanly. Most likely
  explanation: imprecision in this fixture's own hand-derived values, not a
  pipeline bug (see reasoning in the fixture's `_status` field and
  `DECISIONS.md`). Deliberately not "fixed" by tightening ephemeris
  precision or widening tolerance -- resolve via a second, independent
  golden chart once the set expands (item 1 above).

- **Golden chart: every Mahadasha boundary date is a constant ~3 days off
  from the fixture.** Downstream consequence of the same Moon-longitude gap
  above, propagated through `birthBalance.balanceYears` -- exactly what
  SKILL.md's `references/dasha.md` warns "a few arcminutes shifts the
  balance by days, which compounds through every subsequent boundary." The
  offset is constant across all 9 boundaries (not growing), which is the
  expected signature of this cause, not of a chaining bug -- see
  `DECISIONS.md`. Same resolution path as the item above: a second,
  independent golden chart, not tightening ephemeris precision.

## Deferred features (out of scope for now)

Per `.claude/skills/jyotish-engine/SKILL.md`'s "Chapters relevant to work
not yet done" table and `docs/requirements-spec.md` §4/§11 -- check the cited
BPHS chapters directly when any of these become active work, rather than
reconstructing from memory or a secondary source:

- Shadbala (six-fold planetary strength)
- Ashtakavarga
- Divisional charts beyond D1/D9 (D2-D60, remaining shodasavarga)
- Nabhasa yogas (BPHS Ch. 35)
- Raja Yoga combinations beyond the current simplified subset (Ch. 39-41)
- Kala Sarpa, Shakata, Sade Sati doshas
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

- P6 document assembly: Full Blueprint's own document/pagination pipeline, free-tools cluster, Remedies section -- SVG chart (D1+D9), PDF/DOCX export at Essence/Overview depth, and Full Blueprint's Natal-chart-decoded/Personality section *content* are all done (see "Next up" above); assembling that content into an actual 40-60 page Full Blueprint PDF/DOCX, the free-tools cluster, and Remedies remain not yet begun
- P7b Jupiter/Saturn transit ingress detection: search primitive and `.ics` export both done and validated (`src/engine/transit.ts`, `src/export/transitCalendar.ts` -- see "Next up" above); not yet wired into `computeChart()`'s output or merged with the dasha `.ics` into a single file
- P7's versioned-regeneration-with-diffs requirement -- not yet scoped into either P7a or P7b
- Timing's deferred "Timeline" scope (transit overlay, ranked/reasoned turning points) -- see "Known gaps" above
- P8 languages (`ta`/`hi`/`te` narrative output; type stub exists, no implementation) -- unblocked (P5 exists in English now), full engineering not started, but a narrow groundwork probe ran in parallel with P6 (see below)
