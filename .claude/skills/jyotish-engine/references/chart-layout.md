# Chart Layout Reference

Visual layout rules for rendering a chart, as opposed to computing one. Read this before
building or modifying any chart-drawing code (SVG, PDF, print layout).

## South Indian style (this project's only supported format for now — see SKILL.md)

A fixed 4×4 grid. The center 2×2 block (4 cells) is unused by signs — left blank or reserved
for a title/name, never assigned a zodiac sign. The 12 outer cells hold the 12 signs in a
**fixed** arrangement that never changes regardless of the chart's Lagna — this is the
defining difference from North Indian style, where houses (not signs) are fixed and signs
rotate with the Lagna.

Row-by-row (row 0 = top, col 0 = left):

| | col 0 | col 1 | col 2 | col 3 |
|---|---|---|---|---|
| row 0 | Pisces | Aries | Taurus | Gemini |
| row 1 | Aquarius | *(center)* | *(center)* | Cancer |
| row 2 | Capricorn | *(center)* | *(center)* | Leo |
| row 3 | Sagittarius | Scorpio | Libra | Virgo |

Reading clockwise starting from Aries (row 0, col 1): Aries → Taurus → Gemini → Cancer → Leo →
Virgo → Libra → Scorpio → Sagittarius → Capricorn → Aquarius → Pisces → (back to Aries). This
is the standard zodiacal order traced clockwise around the grid's perimeter — not a
school-dependent convention like ayanamsa or dosha exemptions; every South Indian chart, from
any tradition, uses this exact fixed arrangement.

**Not directly documented elsewhere in this skill** (SKILL.md's own "Chart format" row is a
single line — "South Indian (fixed signs)" — with no grid detail), so this was verified against
multiple independent, unrelated open-source implementations before being relied on for chart
rendering, the same standard applied to any other constant in this project: `stellium` (Python,
SVG renderer), `go-vedic-astro-charts` (Go), a SolidJS Vedic chart component, and a React Native
tutorial's South Indian chart renderer — all four independently describe the identical grid and
clockwise order. Cross-referenced 2026-07-30; see `DECISIONS.md` for the check itself.

### Other conventions confirmed across those same sources

- **Planets are placed by sign**, not by house — a planet's cell is determined by
  `PlanetPosition.sign`, never by its house number.
- **Lagna (Ascendant) marker**: the cell holding the Lagna's own sign is marked distinctly (an
  "ASC" label and/or a highlighted border) — it is not a separate cell, since houses aren't
  fixed positions in this format.
- **House numbers are optional, computed labels**, not separate layout elements — house N's
  label belongs in whichever cell holds the sign N houses forward of the Lagna sign (i.e.
  `houseOf(lagnaSign, cellSign)`, already implemented in `src/engine/houses.ts` — reuse it,
  don't recompute).
- **Multiple planets in one sign stack within that cell** (vertically, in the sources checked)
  rather than requiring a separate multi-planet layout.
- **Retrograde is marked** (commonly an "R" suffix/superscript) at the chart level, same as in
  narrative findings. Combustion is not conventionally shown as a chart-level visual marker in
  any of the sources checked — it stays an interpretive (narrative) fact, not a chart glyph.
