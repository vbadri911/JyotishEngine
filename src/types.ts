/**
 * Core type definitions for the Jyotish Engine.
 *
 * These types are the contract between every layer described in the spec:
 * Input -> Ephemeris -> Rules/Findings -> Narrative -> Document.
 *
 * IMPORTANT: facts flow forward only. A Finding may cite ChartData; ChartData
 * must never be derived from or mutated by a Finding or by narrative output.
 * This file exists to make that boundary a type-level guarantee, not just a
 * convention.
 */

// ---------------------------------------------------------------------------
// 1. INPUT
// ---------------------------------------------------------------------------

export type BirthTimePrecision = "exact_from_record" | "approximate" | "unknown";

export interface BirthInput {
  /** ISO date, e.g. "1983-04-23" */
  date: string;
  /** 24h local clock time as given, e.g. "15:30" */
  time: string;
  /** Free-text place as entered by the user, e.g. "Chennai, Tamil Nadu, India" */
  placeText: string;
  precision: BirthTimePrecision;
}

export interface ResolvedLocation {
  placeText: string;
  latitude: number;
  longitude: number;
  /** IANA zone id, e.g. "Asia/Kolkata" — resolved for the birth date, not "now" */
  ianaZone: string;
  /** UTC offset in force ON THE BIRTH DATE, in minutes. Do not assume today's offset. */
  utcOffsetMinutesAtBirth: number;
  /** True if this location/date combination is a known historical edge case
   *  (e.g. pre-1955 India used Bombay/Calcutta local time, not IST). */
  historicalTimezoneCaveat?: string;
}

export interface EngineSettings {
  ayanamsa: "lahiri" | "raman" | "kp";
  nodeType: "mean" | "true";
  houseSystem: "whole_sign"; // Sripati/Placidus reserved for v1, not implemented
  /** Rahu/Ketu graha drishti: most schools omit special aspects for nodes. Default false. */
  nodesHaveSpecialAspects: boolean;
  chartFormat: "south_indian"; // north_indian reserved for v1
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  ayanamsa: "lahiri",
  nodeType: "mean",
  houseSystem: "whole_sign",
  nodesHaveSpecialAspects: false,
  chartFormat: "south_indian",
};

// ---------------------------------------------------------------------------
// 2. EPHEMERIS / CHART
// ---------------------------------------------------------------------------

export type Graha =
  | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn"
  | "Rahu" | "Ketu";

export type SignName =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type Dignity =
  | "exalted" | "moolatrikona" | "own" | "friend" | "neutral" | "enemy" | "debilitated";

export interface PlanetPosition {
  graha: Graha;
  /** Absolute sidereal longitude, 0-360, after ayanamsa subtraction */
  siderealLongitude: number;
  sign: SignName;
  /** Degree within sign, 0-30 */
  degreeInSign: number;
  /** 1-27 */
  nakshatra: number;
  /** 1-4 */
  pada: number;
  /** House number 1-12, computed via whole-sign from Lagna */
  house: number;
  retrograde: boolean;
  combust: boolean;
  /** Orb distance from Sun in degrees, regardless of combust threshold, for transparency */
  distanceFromSunDegrees: number;
  dignity: Dignity;
  /** Degrees from the exact exaltation/debilitation point (0 = exact). Null if dignity is
   *  neither exalted nor debilitated. Store this — "deep exaltation" is a stronger claim
   *  than merely being in the exaltation sign. */
  exactPointOrbDegrees: number | null;
}

export interface ChartData {
  input: BirthInput;
  location: ResolvedLocation;
  settings: EngineSettings;
  /** Julian Day of birth, UT — the single canonical time reference everything else derives from */
  julianDayUT: number;
  ascendant: {
    siderealLongitude: number;
    sign: SignName;
    degreeInSign: number;
    nakshatra: number;
    pada: number;
  };
  planets: Record<Graha, PlanetPosition>;
  /** House lord -> house they are placed in. Derived, not authoritative; recompute, don't cache stale. */
  houseLords: Record<number, { lord: Graha; placedInHouse: number }>;
  confidenceFlags: ConfidenceFlag[];
}

// ---------------------------------------------------------------------------
// 3. CONFIDENCE LAYER — see SKILL.md "Confidence check"
// ---------------------------------------------------------------------------

export type ConfidenceFlagType =
  | "ascendant_near_cusp"
  | "planet_near_cusp"
  | "moon_near_nakshatra_boundary"
  | "birth_time_approximate_or_unknown"
  | "birth_time_round_number";

export interface ConfidenceFlag {
  type: ConfidenceFlagType;
  /** Human-readable explanation, chart-specific, not generic boilerplate */
  message: string;
  /** What this flag requires downstream (e.g. "suppress house-dependent findings") */
  suppresses?: string[];
}

// ---------------------------------------------------------------------------
// 4. DIVISIONAL CHARTS
// ---------------------------------------------------------------------------

export interface VargaChart {
  varga: "D9"; // extend as more vargas are implemented
  ascendantSign: SignName;
  planetSigns: Record<Graha, SignName>;
}

// ---------------------------------------------------------------------------
// 5. DASHA
// ---------------------------------------------------------------------------

export type DashaLord = Graha;

export interface DashaPeriod {
  lord: DashaLord;
  level: "mahadasha" | "antardasha" | "pratyantardasha";
  /** ISO datetime, exact instant — not just a date */
  start: string;
  end: string;
  parent?: DashaPeriod;
}

export interface DashaTimeline {
  /** Balance of the first (birth) Mahadasha remaining, in years, as computed — not looked up */
  birthBalanceYears: number;
  mahadashas: DashaPeriod[]; // each may carry nested antardashas -> pratyantardashas via `parent`-free tree below
}

// ---------------------------------------------------------------------------
// 6. FINDINGS — the atomic unit of interpretation (see references/interpretation.md)
// ---------------------------------------------------------------------------

export type Domain =
  | "career" | "wealth" | "health" | "relationships" | "purpose" | "timing";

export type YogaClassification =
  | "EXACT" | "STRONG_NOT_TEXTBOOK" | "PRESENT_CANCELLED" | "ABSENT";

export type Polarity = "supportive" | "challenging" | "neutral";

export interface EvidenceRef {
  /** Dot-path into ChartData, e.g. "planets.Venus.house" or "houseLords.10.lord" */
  path: string;
  /** The actual value at that path, captured at finding-generation time for auditability */
  value: unknown;
}

export interface Finding {
  id: string;
  domain: Domain[];
  /** Factual, chart-grounded statement. Not prose — a template renders this, this isn't the render. */
  statement: string;
  evidence: EvidenceRef[];
  classification?: YogaClassification; // present only for yoga/dosha-type findings
  /** Named source, e.g. "Brihat Parashara Hora Shastra" or "regional tradition (Tamil)" —
   *  required whenever a rule is known to vary by school (see references/yogas.md) */
  citation?: string;
  strength: number; // 0.0 - 1.0, relative weight within its domain
  polarity: Polarity;
  /** Dasha period ids this finding is most active within, if timing-relevant */
  appliesToPeriods?: string[];
}

// ---------------------------------------------------------------------------
// 7. NARRATIVE
// ---------------------------------------------------------------------------

export type OutputDepth = "essence" | "overview" | "full";
export type OutputLanguage = "en" | "ta" | "hi" | "te";

export interface NarrativeSection {
  domain: Domain;
  depth: OutputDepth;
  language: OutputLanguage;
  /** Which finding ids were used to compose this section — the provenance trail */
  sourceFindingIds: string[];
  text: string;
}
