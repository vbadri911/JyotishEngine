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
2. **P7b: Jupiter/Saturn transit ingress detection** (§9) -- not started.
   P7a is done (below); do not start P7b until it's been reviewed. Not just
   an `.ics` packaging detail -- needs a genuinely new engine capability the
   codebase doesn't have: forward-searching for the date a *transiting*
   planet's sidereal longitude next crosses a sign boundary. Everything
   built so far computes a single instant's positions.
   - **Required design, before any implementation code is written:**
     daily-sample the ephemeris to bracket the sign-change window (the pair
     of consecutive sampled days the crossing falls between), then refine
     *within* that bracketed window (e.g. binary search) to a stated
     precision target. Do not let the sampling interval silently become the
     de facto precision by skipping the refinement step.
   - **The precision target itself (e.g. to the hour, to the day) must be
     decided explicitly and logged as its own dated `DECISIONS.md` entry
     *before* implementation starts** -- not decided implicitly by whatever
     interval the first working version happens to sample at, and not left
     for the code/tests to define after the fact. Pick it, write down why,
     then build to it.
   Versioned regeneration with diffs (also part of §9) not yet scoped into
   either P7a or P7b -- revisit once P7b exists.
3. **P5 narrative templates** and **P6 document assembly** -- not started,
   intentionally not begun yet (see `README.md`).

## Known gaps

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

- P5 narrative templates
- P6 document assembly (PDF/DOCX)
- P7b Jupiter/Saturn transit ingress detection (see "Next up" above) -- needs new root-finding capability, transit computation doesn't exist yet, only natal (P7a, the dasha `.ics` export, is done -- `src/export/`)
- P7's versioned-regeneration-with-diffs requirement -- not yet scoped into either P7a or P7b
- P8 languages (`ta`/`hi`/`te` narrative output; type stub exists, no implementation) -- blocked on P5
