/**
 * Swiss Ephemeris binding via @swisseph/browser. See DECISIONS.md for why
 * this package was chosen over swisseph-wasm and astro-sweph, why the
 * built-in Moshier ephemeris is used rather than full Swiss Ephemeris data
 * files, and why the Ascendant needs a manual ayanamsa subtraction (this
 * package's calculateHouses() doesn't expose the sidereal flag; getAyanamsa()
 * still comes from the library's own precise ayanamsa table, not a fixed-rate
 * approximation, so this doesn't reintroduce the imprecision the original
 * TODO here warned against).
 */
import { DateTime } from "luxon";
import {
  SwissEphemeris,
  Planet,
  LunarPoint,
  CalculationFlag,
  SiderealMode,
  HouseSystem,
} from "@swisseph/browser";
import type { BirthInput, ResolvedLocation, EngineSettings, Graha } from "../types.js";

export interface RawPlanetLongitude {
  graha: Graha;
  /** Absolute sidereal longitude, 0-360, AFTER ayanamsa subtraction */
  siderealLongitude: number;
  retrograde: boolean;
}

export interface RawEphemerisResult {
  julianDayUT: number;
  ascendantSiderealLongitude: number;
  planets: RawPlanetLongitude[];
}

const CLASSICAL_PLANETS: Record<
  "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn",
  Planet
> = {
  Sun: Planet.Sun,
  Moon: Planet.Moon,
  Mercury: Planet.Mercury,
  Venus: Planet.Venus,
  Mars: Planet.Mars,
  Jupiter: Planet.Jupiter,
  Saturn: Planet.Saturn,
};

const AYANAMSA_MODE: Record<EngineSettings["ayanamsa"], SiderealMode> = {
  lahiri: SiderealMode.Lahiri,
  raman: SiderealMode.Raman,
  kp: SiderealMode.Krishnamurti,
};

const NODE_BODY: Record<EngineSettings["nodeType"], LunarPoint> = {
  mean: LunarPoint.MeanNode,
  true: LunarPoint.TrueNode,
};

// JD 2440587.5 = 1970-01-01T00:00:00 UTC (the Unix epoch expressed as a Julian Day) --
// a fixed astronomical constant, not a project-specific convention. Lives here (not
// index.ts, where it was originally written) because engine-layer callers -- notably
// the transit search below -- need it too, and an engine module importing "up" from
// the pipeline entry point would be a backwards dependency. index.ts re-exports
// julianDayUTToUtcISO for backward compatibility with existing call sites/tests.
export const JULIAN_DAY_UNIX_EPOCH = 2440587.5;

/**
 * Converts a Julian Day (UT) to an absolute UTC instant. Rounds to the nearest
 * millisecond: subtracting two ~2.4-million-magnitude floats and scaling by 86.4M
 * leaves sub-millisecond floating-point noise (observed: ~0.01ms) that doesn't
 * round-trip exactly -- e.g. an exact birth time landing 1ms short of a whole
 * second/minute boundary and silently formatting into the wrong minute.
 */
export function julianDayUTToUtcISO(julianDayUT: number): string {
  const unixMillis = Math.round((julianDayUT - JULIAN_DAY_UNIX_EPOCH) * 86_400_000);
  return DateTime.fromMillis(unixMillis, { zone: "utc" }).toISO()!;
}

/** Inverse of julianDayUTToUtcISO -- needed to turn a search-start instant (e.g. "now") into a JD. */
export function utcISOToJulianDayUT(iso: string): number {
  const millis = DateTime.fromISO(iso, { zone: "utc" }).toMillis();
  return millis / 86_400_000 + JULIAN_DAY_UNIX_EPOCH;
}

let swePromise: Promise<SwissEphemeris> | null = null;

/** Lazily initializes a single shared WASM instance -- init() is expensive, do it once. */
function getSwissEphemeris(): Promise<SwissEphemeris> {
  if (!swePromise) {
    swePromise = (async () => {
      const swe = new SwissEphemeris();
      await swe.init();
      return swe;
    })();
  }
  return swePromise;
}

function normalizeDegrees(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

export async function computeRawPositions(
  input: BirthInput,
  location: ResolvedLocation,
  settings: EngineSettings
): Promise<RawEphemerisResult> {
  const swe = await getSwissEphemeris();
  swe.setSiderealMode(AYANAMSA_MODE[settings.ayanamsa]);

  const [year, month, day] = input.date.split("-").map(Number) as [number, number, number];
  const [hour, minute] = input.time.split(":").map(Number) as [number, number];
  const localHourDecimal = hour + minute / 60;
  const utHourDecimal = localHourDecimal - location.utcOffsetMinutesAtBirth / 60;
  const julianDayUT = swe.julianDay(year, month, day, utHourDecimal);

  const calcFlags = CalculationFlag.MoshierEphemeris | CalculationFlag.Sidereal | CalculationFlag.Speed;

  const planets: RawPlanetLongitude[] = [];
  for (const [graha, body] of Object.entries(CLASSICAL_PLANETS) as [Graha, Planet][]) {
    const pos = swe.calculatePosition(julianDayUT, body, calcFlags);
    planets.push({
      graha,
      siderealLongitude: normalizeDegrees(pos.longitude),
      retrograde: pos.longitudeSpeed < 0,
    });
  }

  const rahuPos = swe.calculatePosition(julianDayUT, NODE_BODY[settings.nodeType], calcFlags);
  const rahuLongitude = normalizeDegrees(rahuPos.longitude);
  const rahuRetrograde = rahuPos.longitudeSpeed < 0;
  planets.push({ graha: "Rahu", siderealLongitude: rahuLongitude, retrograde: rahuRetrograde });
  // Ketu is always exactly 180 deg from Rahu and moves with it -- not an independently
  // calculated body in Swiss Ephemeris.
  planets.push({
    graha: "Ketu",
    siderealLongitude: normalizeDegrees(rahuLongitude + 180),
    retrograde: rahuRetrograde,
  });

  // calculateHouses() here wraps swe_houses (not swe_houses_ex), which has no sidereal
  // flag -- so the Ascendant it returns is tropical. Subtract the library's own ayanamsa
  // value (not a fixed-rate approximation) to get the sidereal Ascendant.
  // EngineSettings.houseSystem only supports "whole_sign" today (see types.ts).
  const houses = swe.calculateHouses(julianDayUT, location.latitude, location.longitude, HouseSystem.WholeSign);
  const ayanamsa = swe.getAyanamsa(julianDayUT);
  const ascendantSiderealLongitude = normalizeDegrees(houses.ascendant - ayanamsa);

  return { julianDayUT, ascendantSiderealLongitude, planets };
}

/** The subset of Graha that CLASSICAL_PLANETS actually maps -- excludes Rahu/Ketu,
 *  which aren't independently-calculated bodies (see computeRawPositions above). */
export type ClassicalGraha = keyof typeof CLASSICAL_PLANETS;

/**
 * Sidereal longitude of a single classical planet at an arbitrary Julian Day (UT),
 * decoupled from any BirthInput/ResolvedLocation -- unlike computeRawPositions, which
 * is anchored to one birth instant, this is the primitive a forward time-search (transit
 * ingress detection, src/engine/transit.ts) repeatedly evaluates at many different JDs.
 * Deliberately not folded into computeRawPositions' own loop to avoid touching an
 * already golden-chart-tested code path for a refactor this feature doesn't require.
 */
export async function siderealLongitudeAt(
  julianDayUT: number,
  graha: ClassicalGraha,
  settings: Pick<EngineSettings, "ayanamsa">
): Promise<{ siderealLongitude: number; retrograde: boolean }> {
  const swe = await getSwissEphemeris();
  swe.setSiderealMode(AYANAMSA_MODE[settings.ayanamsa]);
  const calcFlags = CalculationFlag.MoshierEphemeris | CalculationFlag.Sidereal | CalculationFlag.Speed;
  const pos = swe.calculatePosition(julianDayUT, CLASSICAL_PLANETS[graha], calcFlags);
  return {
    siderealLongitude: normalizeDegrees(pos.longitude),
    retrograde: pos.longitudeSpeed < 0,
  };
}
