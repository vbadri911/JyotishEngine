# Jyotish Engine

An open-source, client-side Vedic (Jyotish) chart engine and life-blueprint
report generator. Three inputs — date, time, and place of birth — computed
entirely in the browser. No birth data is ever transmitted anywhere.

Built on top of AskSoma as a design reference, not a runtime dependency:
this project uses its own Swiss Ephemeris-based engine so the calculation
layer is fully owned, auditable, and free to run indefinitely.

## Status: Phase 1 complete

| Piece | Status |
|---|---|
| Type definitions (`src/types.ts`) | Done |
| Dignity assessment (`src/engine/dignity.ts`) | Done, unit-tested |
| Houses & aspects (`src/engine/houses.ts`) | Done, unit-tested |
| Navamsa/D9 (`src/engine/varga.ts`) | Done, unit-tested |
| Vimshottari dasha (`src/engine/dasha.ts`) | Done, unit-tested |
| Core yoga/dosha detection (`src/rules/yogas.ts`) | Done (5 yogas + Mangal Dosha), unit-tested |
| Ephemeris integration (`src/engine/ephemeris.ts`) | Done, via `@swisseph/browser`. |
| Geocoding data (`src/engine/geocoding.ts`, `data/cities.json`) | Mostly done — city/country matching works; one known gap (see `BACKLOG.md`). |
| Historical timezone resolution (`src/engine/timezone.ts`, `src/engine/location.ts`) | Done, unit-tested (pre-1906 India, plus Bombay/Calcutta's extended local-time windows through 1955/1948). |
| Confidence checks (`src/engine/confidence.ts`) | Done -- implements SKILL.md's "Confidence check" table. |
| Chart pipeline (`src/index.ts`, `computeChart()`) | Done -- geocoding through yoga detection wired end to end. |
| Golden-chart validation | Full `computeChart()` pipeline run against real ephemeris output — 5/9 planets + Ascendant within stated longitude tolerance, all 6 implemented yoga/dosha classifications match exactly (see `BACKLOG.md` for the rest). |
| Narrative templates | Not started (Phase 5) |
| Document assembly (PDF/DOCX) | Not started (Phase 6) |

Open gaps, deferred work, and remaining Phase 1 steps are tracked in
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

Phase 1 is functionally complete. See [`BACKLOG.md`](BACKLOG.md) for what's
still open (expanding the golden-chart set, the geocoding admin1 gap) and
Phase 5-6 (narrative templates, document assembly) for what's next.

## License

AGPL-3.0-only, matching Swiss Ephemeris's actual current open-source terms
(Astrodienst AG dual-licenses it under AGPL or a paid commercial license —
not GPL; see DECISIONS.md).

## Data attribution

`data/cities.json` is derived from the GeoNames `cities15000` dataset,
(c) GeoNames.org contributors, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See
`data/README.md` for provenance details.
