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
3. **P5 narrative templates -- Career, Purpose, and Relationships done;
   wealth/health/timing not started.** `src/narrative/render.ts` is a
   domain-agnostic renderer: quotes `Finding.statement` verbatim (never
   regenerates a fact -- see `DECISIONS.md` for why this departs from
   requirements-spec.md §7's illustrated `rule`-keyed template shape),
   semantically de-duplicates findings that describe the same underlying
   fact via shared `planets.X.dignity` evidence (explicit priority chain,
   directly tested against a controlled 4-way collision, not just incidental
   real-chart cases), and renders `full` depth as `overview`'s own core
   content plus a continuation of genuinely new findings (closing note
   appended once at the true end -- see `DECISIONS.md` for a precision fix
   found while extending to Purpose). Mahapurusha/Kemadruma domain tags were
   audited and corrected against `constants.md`'s karaka table (see
   `DECISIONS.md`) after Malavya's original blanket ["purpose","career"] tag
   was caught reading as inaccurate in real Purpose prose. Validated against
   the golden chart (Career: rich/all-supportive; Purpose: a real "mixed"
   tier; Relationships: a real "strong" tier with a genuine EXACT yoga) and
   hand-built fixtures for cases the golden chart can't exercise
   (`tests/narrative/fixtures.ts`: weak/all-challenging, mixed, "overview
   already exhausts everything", and -- for Relationships specifically, one
   of interpretation.md's named SENSITIVE domains -- a real triggered Mangal
   Dosha, verified to never drift into marriage-failure language and to use
   the required "partner's own chart carries proportional weight" framing).
   Closing notes support an optional `conditionalClosingNotes` mechanism
   (topic-scoped clauses that only fire when a QUOTED finding actually
   matches that topic's trigger patterns, checked against what's genuinely in
   the text at that depth -- not the full domain data) after Relationships'
   original single fixed closing note was found to append its children-topic
   caveat even to renders with no children-related content at all (see
   `DECISIONS.md`). Health will need the same discipline (a body-part/illness
   topic split) when it's built. **Next**: templates for wealth/health/timing
   -- same renderer, new JSON files only. **P6 document assembly** -- not
   started, blocked on P5 existing for
   more than one domain.

## Known gaps

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

- P5 narrative templates for wealth/health/timing (Career, Purpose, and Relationships done -- see "Next up" above)
- P6 document assembly (PDF/DOCX)
- P7b Jupiter/Saturn transit ingress detection: search primitive and `.ics` export both done and validated (`src/engine/transit.ts`, `src/export/transitCalendar.ts` -- see "Next up" above); not yet wired into `computeChart()`'s output or merged with the dasha `.ics` into a single file
- P7's versioned-regeneration-with-diffs requirement -- not yet scoped into either P7a or P7b
- P8 languages (`ta`/`hi`/`te` narrative output; type stub exists, no implementation) -- blocked on P5
