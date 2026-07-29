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
| P5 Narrative templates | Not started. |
| P6 Document assembly (PDF/DOCX) | Not started. |
| P7 Living document | Split into P7a and P7b (`BACKLOG.md`). **P7a done**: `.ics` export of dasha/Antardasha/Pratyantardasha transitions (`src/export/ics.ts`, `src/export/dashaCalendar.ts`) -- RFC 5545 compliant (line folding, text escaping, UTC normalization), tested against real `computeChart()` output. **P7b not started**: Jupiter/Saturn transit ingress detection needs a new root-finding capability (forward-search for a sign-boundary crossing), not yet designed. Versioned regeneration with diffs not yet scoped into either. |
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
pipeline (`tests/golden-charts/`) — one known-and-documented failure remains
(longitude tolerance on 4 of 9 planets; see `BACKLOG.md`), not a regression.

## Next steps

P1-P4 are functionally complete (P3's yoga coverage intentionally partial --
see above). See [`BACKLOG.md`](BACKLOG.md) for what's still open. P5-P8 are
not started; P7 (the living-document `.ics`/versioned-regeneration feature)
is core MVP scope, not deferred.

## License

AGPL-3.0-only, matching Swiss Ephemeris's actual current open-source terms
(Astrodienst AG dual-licenses it under AGPL or a paid commercial license —
not GPL; see DECISIONS.md).

## Data attribution

`data/cities.json` is derived from the GeoNames `cities15000` dataset,
(c) GeoNames.org contributors, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See
`data/README.md` for provenance details.
