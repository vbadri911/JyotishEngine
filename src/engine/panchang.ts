/**
 * Panchang (tithi/vara/karana/yoga/nakshatra) computation for a given
 * date/time/place. Pure functions over Sun/Moon sidereal longitude, the
 * birth/query instant, and location -- same shape as every other module in
 * this directory. Algorithm and citations: see
 * .claude/skills/jyotish-engine/references/panchang.md
 *
 * IMPORTANT: tithi/karana/yoga/nakshatra use SIDEREAL (ayanamsa-subtracted)
 * Sun/Moon longitude, matching the rest of this engine. Sunrise (needed only
 * for vara's civil-day boundary) is a real-sky/tropical event and does NOT
 * use sidereal longitude or ayanamsa at all -- see sunriseJulianDayUT() below.
 */
import { DateTime } from "luxon";
import type { BirthInput, EngineSettings } from "../types.js";
import { DEFAULT_ENGINE_SETTINGS } from "../types.js";
import { computeRawPositions, julianDayUTToUtcISO, JULIAN_DAY_UNIX_EPOCH } from "./ephemeris.js";
import { resolveLocation } from "./location.js";
import { nakshatraPositionFromLongitude } from "./dasha.js";
import panchangConfig from "../../config/panchang.json" with { type: "json" };

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// ---------------------------------------------------------------------------
// Tithi (Surya Siddhanta Ch. II, v.66)
// ---------------------------------------------------------------------------

export interface TithiResult {
  /** 1-30 */
  number: number;
  paksha: "shukla" | "krishna";
  name: string;
}

export function tithiFor(sunSiderealLongitude: number, moonSiderealLongitude: number): TithiResult {
  const diff = normalizeDegrees(moonSiderealLongitude - sunSiderealLongitude);
  const number = Math.floor(diff / 12) + 1; // 1-30
  const paksha: TithiResult["paksha"] = number <= 15 ? "shukla" : "krishna";
  if (number === 15) return { number, paksha, name: "Purnima" };
  if (number === 30) return { number, paksha, name: panchangConfig.tithi.amavasyaName };
  const nameIndex = paksha === "shukla" ? number - 1 : number - 16; // 0-13
  const name = panchangConfig.tithi.names[nameIndex];
  if (!name) throw new Error(`Unreachable: tithi name index ${nameIndex} out of range`);
  return { number, paksha, name };
}

// ---------------------------------------------------------------------------
// Karana (Surya Siddhanta Ch. II, v.67-69)
// ---------------------------------------------------------------------------

export interface KaranaResult {
  /** 1-60 */
  number: number;
  name: string;
}

export function karanaFor(sunSiderealLongitude: number, moonSiderealLongitude: number): KaranaResult {
  const diff = normalizeDegrees(moonSiderealLongitude - sunSiderealLongitude);
  const number = Math.floor(diff / 6) + 1; // 1-60
  const name = karanaName(number);
  return { number, name };
}

function karanaName(number: number): string {
  if (number === 1) return panchangConfig.karana.fixedFirst;
  if (number >= 58 && number <= 60) {
    const fixedLast = panchangConfig.karana.fixedLast[number - 58];
    if (!fixedLast) throw new Error(`Unreachable: karana fixedLast index ${number - 58} out of range`);
    return fixedLast;
  }
  const chara = panchangConfig.karana.chara[(number - 2) % 7];
  if (!chara) throw new Error(`Unreachable: karana chara index for number ${number} out of range`);
  return chara;
}

// ---------------------------------------------------------------------------
// (Nakshatra-)Yoga (Surya Siddhanta Ch. II, v.65) -- distinct from
// src/rules/yogas.ts's Raja/Gajakesari-type yogas. See panchang.md.
// ---------------------------------------------------------------------------

export interface PanchangYogaResult {
  /** 1-27 */
  number: number;
  name: string;
}

const NAKSHATRA_SPAN_DEGREES = 800 / 60; // 13 deg 20', same constant as data/nakshatras.json

export function panchangYogaFor(sunSiderealLongitude: number, moonSiderealLongitude: number): PanchangYogaResult {
  const sum = normalizeDegrees(sunSiderealLongitude + moonSiderealLongitude);
  const index = Math.floor(sum / NAKSHATRA_SPAN_DEGREES); // 0-26
  const number = index + 1;
  const name = panchangConfig.yoga.names[index];
  if (!name) throw new Error(`Unreachable: panchang yoga name index ${index} out of range`);
  return { number, name };
}

// ---------------------------------------------------------------------------
// Nakshatra (Surya Siddhanta Ch. II, v.64) -- reuses dasha.ts's already-
// verified computation, not re-derived. Pada follows the same convention as
// index.ts's nakshatraAndPada().
// ---------------------------------------------------------------------------

export interface PanchangNakshatraResult {
  /** 1-27 */
  number: number;
  name: string;
  /** 1-4 */
  pada: number;
}

export function nakshatraFor(moonSiderealLongitude: number): PanchangNakshatraResult {
  const pos = nakshatraPositionFromLongitude(moonSiderealLongitude);
  return {
    number: pos.index + 1,
    name: pos.name,
    pada: Math.floor(pos.fractionElapsed * 4) + 1,
  };
}

// ---------------------------------------------------------------------------
// Sunrise -- Meeus low-precision solar position algorithm (Astronomical
// Algorithms 2nd ed., Ch. 25), self-contained, tropical, no ayanamsa. See
// panchang.md "Sunrise computation -- a real gap this reference closes".
// ---------------------------------------------------------------------------

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
/** Standard sunrise/sunset altitude: -(34' atmospheric refraction + 16' solar semi-diameter). */
const SUNRISE_ALTITUDE_DEGREES = -0.8333;

interface SolarPosition {
  /** Apparent declination, degrees */
  declinationDegrees: number;
  /** Equation of time (apparent - mean solar time), minutes */
  equationOfTimeMinutes: number;
}

/** Sun's apparent declination and the equation of time at a given Julian Day (UT). Tropical, not sidereal. */
function solarPositionAt(julianDayUT: number): SolarPosition {
  const T = (julianDayUT - 2451545.0) / 36525; // Julian centuries since J2000.0

  const L0 = normalizeDegrees(280.46646 + T * (36000.76983 + T * 0.0003032)); // geometric mean longitude
  const M = normalizeDegrees(357.52911 + T * (35999.05029 - 0.0001537 * T)); // geometric mean anomaly
  const Mrad = M * DEG_TO_RAD;
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T); // eccentricity of Earth's orbit

  const C =
    Math.sin(Mrad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mrad) * 0.000289; // equation of center

  const trueLongitude = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega * DEG_TO_RAD);

  const meanObliquity =
    23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const obliquityCorrection = meanObliquity + 0.00256 * Math.cos(omega * DEG_TO_RAD);
  const epsRad = obliquityCorrection * DEG_TO_RAD;

  const declinationRad = Math.asin(Math.sin(epsRad) * Math.sin(apparentLongitude * DEG_TO_RAD));
  const declinationDegrees = declinationRad * RAD_TO_DEG;

  const y = Math.tan(epsRad / 2) ** 2;
  const L0rad = L0 * DEG_TO_RAD;
  const equationOfTimeMinutes =
    4 *
    RAD_TO_DEG *
    (y * Math.sin(2 * L0rad) -
      2 * e * Math.sin(Mrad) +
      4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0rad) -
      0.5 * y * y * Math.sin(4 * L0rad) -
      1.25 * e * e * Math.sin(2 * Mrad));

  return { declinationDegrees, equationOfTimeMinutes };
}

function dateTimeToJulianDayUT(dt: DateTime): number {
  return dt.toUTC().toMillis() / 86_400_000 + JULIAN_DAY_UNIX_EPOCH;
}

/**
 * UTC instant (as a Julian Day) of sunrise at the given latitude/longitude
 * for the LOCAL calendar date `localDateISO` (e.g. "1983-04-23"). Longitude
 * is degrees East positive; `utcOffsetMinutes` is the UTC offset actually in
 * force at that date/location -- reuses the SAME historical-timezone-aware
 * resolution (timezone.ts) already used for the birth instant itself,
 * rather than a rougher longitude-based guess, so a sunrise-boundary check
 * stays consistent with how the birth instant's own civil date was
 * determined.
 *
 * Uses the Sun's position at that date's local noon as a single-pass
 * estimate (equation of time and declination change by well under a
 * minute of time across the few hours this shifts the guess by) -- not
 * iterated, per Meeus's own characterization of this as a low-precision
 * algorithm; empirically validated to a few minutes against a real
 * reference sunrise time, see panchang.test.ts.
 */
export function sunriseJulianDayUT(
  localDateISO: string,
  latitude: number,
  longitudeEast: number,
  utcOffsetMinutes: number
): number {
  const localNoon = DateTime.fromISO(`${localDateISO}T12:00:00`, { zone: "utc" }).minus({ minutes: utcOffsetMinutes });
  const guessJD = dateTimeToJulianDayUT(localNoon);

  const { declinationDegrees, equationOfTimeMinutes } = solarPositionAt(guessJD);
  const latRad = latitude * DEG_TO_RAD;
  const decRad = declinationDegrees * DEG_TO_RAD;

  // cos(H0) = (sin(altitude) - sin(lat)sin(dec)) / (cos(lat)cos(dec)) -- SUNRISE_ALTITUDE_DEGREES
  // is an ALTITUDE (negative, below horizon), so this is sin(), not cos(), of that angle.
  const cosH0 =
    Math.sin(SUNRISE_ALTITUDE_DEGREES * DEG_TO_RAD) / (Math.cos(latRad) * Math.cos(decRad)) -
    Math.tan(latRad) * Math.tan(decRad);
  const clamped = Math.max(-1, Math.min(1, cosH0)); // guards polar day/night (no real sunrise) rather than NaN
  const hourAngleDegrees = Math.acos(clamped) * RAD_TO_DEG;

  // Hours from UT midnight of guessJD's own UT calendar date -- can legitimately
  // fall outside [0, 24) (sunrise crossing into an adjacent UT calendar date);
  // JD is an absolute continuous scale, so no wraparound handling is needed.
  const hoursFromUtMidnight = 12 - hourAngleDegrees / 15 - longitudeEast / 15 - equationOfTimeMinutes / 60;
  const utMidnightJD = Math.floor(guessJD - 0.5) + 0.5; // JD ends in .5 at UT midnight, by convention
  return utMidnightJD + hoursFromUtMidnight / 24;
}

// ---------------------------------------------------------------------------
// Vara (Surya Siddhanta Ch. I, v.36 commentary + v.51-52) -- sunrise-to-
// sunrise civil day.
// ---------------------------------------------------------------------------

export interface VaraResult {
  /** 0 = Sunday ... 6 = Saturday */
  index: number;
  name: string;
}

/**
 * @param localDateISO the birth/query LOCAL calendar date, e.g. "1983-04-23"
 * @param birthInstantUtcISO the exact birth/query instant, UTC ISO -- used
 *   only to compare against that date's own computed sunrise instant
 * @param latitude, longitudeEast birth location, degrees (longitude East positive)
 * @param utcOffsetMinutes UTC offset in force at that date/location -- see sunriseJulianDayUT
 */
export function varaFor(
  localDateISO: string,
  birthInstantUtcISO: string,
  latitude: number,
  longitudeEast: number,
  utcOffsetMinutes: number
): VaraResult {
  const sunriseJD = sunriseJulianDayUT(localDateISO, latitude, longitudeEast, utcOffsetMinutes);
  const birthJD = dateTimeToJulianDayUT(DateTime.fromISO(birthInstantUtcISO, { zone: "utc" }));

  const civilDate =
    birthJD < sunriseJD
      ? DateTime.fromISO(localDateISO, { zone: "utc" }).minus({ days: 1 })
      : DateTime.fromISO(localDateISO, { zone: "utc" });

  const index = civilDate.weekday % 7; // Luxon: 1=Mon..7=Sun -> 0=Sun..6=Sat
  const name = panchangConfig.vara.names[index];
  if (!name) throw new Error(`Unreachable: vara name index ${index} out of range`);
  return { index, name };
}

// ---------------------------------------------------------------------------
// computePanchang -- the full result for one date/time/place, reusing the
// already-tested resolveLocation/computeRawPositions pipeline (rather than
// re-deriving julianDayUT/timezone handling here) for Sun/Moon sidereal
// longitude and the exact birth/query instant.
// ---------------------------------------------------------------------------

export interface PanchangResult {
  tithi: TithiResult;
  karana: KaranaResult;
  yoga: PanchangYogaResult;
  nakshatra: PanchangNakshatraResult;
  vara: VaraResult;
  sunriseUtcISO: string;
}

export async function computePanchang(
  input: BirthInput,
  settings: EngineSettings = DEFAULT_ENGINE_SETTINGS
): Promise<PanchangResult> {
  const location = await resolveLocation(input);
  if (!location) {
    throw new Error(
      `Could not resolve location for "${input.placeText}" -- see data/README.md and BACKLOG.md ` +
        "for current geocoding coverage and known limitations."
    );
  }

  const raw = await computeRawPositions(input, location, settings);
  const sun = raw.planets.find((p) => p.graha === "Sun");
  const moon = raw.planets.find((p) => p.graha === "Moon");
  if (!sun || !moon) throw new Error("Unreachable: Sun/Moon missing from raw ephemeris positions");

  const birthInstantUtcISO = julianDayUTToUtcISO(raw.julianDayUT);
  const sunriseJD = sunriseJulianDayUT(
    input.date,
    location.latitude,
    location.longitude,
    location.utcOffsetMinutesAtBirth
  );

  return {
    tithi: tithiFor(sun.siderealLongitude, moon.siderealLongitude),
    karana: karanaFor(sun.siderealLongitude, moon.siderealLongitude),
    yoga: panchangYogaFor(sun.siderealLongitude, moon.siderealLongitude),
    nakshatra: nakshatraFor(moon.siderealLongitude),
    vara: varaFor(
      input.date,
      birthInstantUtcISO,
      location.latitude,
      location.longitude,
      location.utcOffsetMinutesAtBirth
    ),
    sunriseUtcISO: julianDayUTToUtcISO(sunriseJD),
  };
}
