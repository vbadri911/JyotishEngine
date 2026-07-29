# Golden Charts

`reference-chart-1983.json` is the first (and currently only) golden test
case. It came out of an extensive hand-analysis project and its expected
values were cross-checked by re-derivation, but **have not been verified by
running actual Swiss Ephemeris code** -- the environment that authored this
scaffold had no network access and could not install the WASM ephemeris
binding.

## What to do with this file

1. Once `src/engine/ephemeris.ts` is implemented (Phase 1, step 1), compute
   this exact chart through the real pipeline.
2. Compare against every value in `expected` here.
3. Where they disagree by more than the stated tolerance (1 arc-minute for
   longitudes, 1 day for dasha boundaries), **investigate rather than
   silently adjusting either side to match** -- the disagreement is
   frequently a genuine ayanamsa/node/orb convention mismatch worth
   documenting, not a bug in one or the other.
4. Update this fixture's `_status` field once verified. Expanding this
   directory to the full 30-50 chart target is tracked in
   [`BACKLOG.md`](../../BACKLOG.md).

## Second reference source

`.claude/skills/jyotish-engine/references/dasha.md` and `varga.md` contain
the same worked examples with the arithmetic shown step by step -- useful
for isolating exactly where a discrepancy originates if the automated test
fails.

## Resolved items from this fixture

Both of these were open questions until real ephemeris output existed to
check them against -- see `_correctedFrom` notes on the fixture itself and
`DECISIONS.md` for the full resolution:

- Mercury's `combust: true` was wrong -- real computed Sun-Mercury
  separation (19.672 deg) almost exactly matches this fixture's own
  hand-derived estimate (~19.68 deg), ruling out ephemeris imprecision, and
  both far exceed the 14 deg combustion orb in `config/combustion-orbs.json`.
  Corrected to `false`.
- Jupiter's `dignity: neutral` was wrong -- Jupiter and Mars (Scorpio's
  lord) are natural friends per BPHS (`.claude/skills/jyotish-engine/references/constants.md`).
  Corrected to `friend`.

## Open item: one arc-minute tolerance

Tracked in full in [`BACKLOG.md`](../../BACKLOG.md) ("Known gaps"): Sun
(1.20'), Mars (1.25'), Rahu, and Ketu (1.03' each) land just outside the
stated 1 arc-minute longitude tolerance against real ephemeris output; 5/9
planets + Ascendant pass cleanly.
