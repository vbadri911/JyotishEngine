/**
 * Public API surface for the free-tools cluster (requirements-spec.md SS8:
 * kundli calculator, Panchang, dasha timeline viewer, birth-time confidence
 * checker) -- a second barrel, sibling to index.ts's computeChart() pipeline,
 * not a superset of it. These four tools are standalone utility outputs, not
 * part of the interpretive Findings/report pipeline index.ts serves, so they
 * get their own entry point rather than being folded into that one (see
 * DECISIONS.md, 2026-08-07, Panchang implementation entry).
 *
 * Consumers (web/) should import from here or from the package root ("."),
 * never reach into dist/engine/*.js or dist/chart/*.js directly -- add the
 * re-export here instead of a new deep import when a tool needs something
 * this file doesn't yet expose.
 */

// Shared input/settings types every free tool needs.
export type { BirthInput, BirthTimePrecision, EngineSettings, ChartData, Graha, SignName } from "./types.js";
export { DEFAULT_ENGINE_SETTINGS } from "./types.js";

// Location resolution (place text -> lat/long/timezone) -- all four tools need this.
export { resolveLocation } from "./engine/location.js";
export { geocodePlace, type GeocodeMatch } from "./engine/geocoding.js";
export type { ResolvedLocation } from "./types.js";

// Panchang (tithi/vara/karana/yoga/nakshatra for any date/time/place).
export {
  computePanchang,
  tithiFor,
  karanaFor,
  panchangYogaFor,
  nakshatraFor,
  varaFor,
  type PanchangResult,
  type TithiResult,
  type KaranaResult,
  type PanchangYogaResult,
  type PanchangNakshatraResult,
  type VaraResult,
} from "./engine/panchang.js";

// South Indian chart rendering (kundli calculator's D1, and D9 for the same page).
export {
  renderSouthIndianChartSVG,
  buildD1ChartInput,
  type SouthIndianChartInput,
  type SouthIndianChartPlanet,
  type SouthIndianChartOptions,
} from "./chart/southIndianChart.js";
export { buildD9ChartInput } from "./chart/navamsaChart.js";

// Dasha timeline (Vimshottari Mahadasha/Antardasha/Pratyantardasha).
export {
  computeMahadashaSequence,
  computeAntardashas,
  computePratyantardashas,
  findActivePeriod,
  birthDashaBalanceYears,
  nakshatraPositionFromLongitude,
  type DashaComputationResult,
} from "./engine/dasha.js";
export type { DashaPeriod, DashaLord } from "./types.js";

// Birth-time confidence checker. computeChart() (package root, ".") already
// returns ChartData.confidenceFlags computed this same way -- this direct
// export is for a tool that wants the check without the full chart/report
// pipeline behind it.
export { computeConfidenceFlags } from "./engine/confidence.js";
export type { ConfidenceFlag, ConfidenceFlagType } from "./types.js";
