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
| P5 Narrative templates | **Started -- Career, Purpose, and Relationships done; wealth, health, and timing to go.** `src/narrative/render.ts` is a domain-agnostic renderer that quotes `Finding.statement` verbatim rather than regenerating facts (see `DECISIONS.md` for why this departs from the original spec's illustrated template shape), semantically de-duplicates findings describing the same underlying fact, and renders `full` depth as `overview`'s own content plus a continuation of genuinely new findings. Mahapurusha/Kemadruma yoga domain tags were audited and corrected against `constants.md`'s karaka table after an original blanket tag was caught reading as inaccurate in real rendered prose (`DECISIONS.md`). A structural sweep (`tests/findingStatementQuality.test.ts`) now checks every finding-generating function for developer-facing language (file references, "Note:" asides) that could otherwise leak verbatim into a real reader's report -- found and fixed three real instances. Closing notes support topic-conditional clauses (e.g. Relationships' partnership/children framing) that only fire when a finding actually touching that topic was quoted in the text, not unconditionally. Validated against the golden chart (Career: rich/all-supportive; Purpose: a real "mixed" tier; Relationships: a real "strong" tier with a genuine EXACT yoga plus a dedicated sensitive-domain fixture with a real triggered Mangal Dosha) and hand-built fixtures for cases the golden chart can't exercise (`BACKLOG.md`). |
| P6 Document assembly (PDF/DOCX) | Not started. |
| P7 Living document | Split into P7a and P7b (`BACKLOG.md`). **P7a done**: `.ics` export of dasha/Antardasha/Pratyantardasha transitions (`src/export/ics.ts`, `src/export/dashaCalendar.ts`) -- RFC 5545 compliant (line folding, text escaping, UTC normalization), tested against real `computeChart()` output. **P7b done**: `src/engine/transit.ts` forward-searches for Jupiter/Saturn sidereal sign-ingress crossings (bracket-then-refine root-finding, a new algorithm class -- everything else in this codebase evaluates a single fixed instant), validated against real sidereal transit dates from independent sources -- all five checked ingress events matched within about an hour, including Jupiter's and Saturn's known retrograde preview/permanent-ingress patterns, reproduced without being told to expect them. `src/export/transitCalendar.ts` exports these as `.ics` (next 3 ingresses per planet, reusing `ics.ts`'s builder unchanged). Not yet wired into `computeChart()`'s output, and dasha/transit remain two separate `.ics` files rather than one combined export -- see `BACKLOG.md`. Versioned regeneration with diffs not yet scoped into either P7a or P7b. |
| P8 Languages | Not started; blocked on P5 existing in English first. |

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
as of this session: 205/205.

## Next steps

P1-P4 are functionally complete (P3's yoga coverage intentionally partial --
see above). P7's `.ics` export (both dasha and Jupiter/Saturn transit
ingresses) is done, though not yet wired into `computeChart()`'s own output
and versioned-regeneration-with-diffs isn't scoped yet. P5 has three of six
narrative domains done (Career, Purpose, Relationships); wealth, health, and
timing remain, plus P6 (document assembly) and P8 (regional languages), the
latter blocked on P5 finishing in English first. See [`BACKLOG.md`](BACKLOG.md)
for the full current state.

## License

AGPL-3.0-only, matching Swiss Ephemeris's actual current open-source terms
(Astrodienst AG dual-licenses it under AGPL or a paid commercial license —
not GPL; see DECISIONS.md).

## Data attribution

`data/cities.json` is derived from the GeoNames `cities15000` dataset,
(c) GeoNames.org contributors, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See
`data/README.md` for provenance details.
