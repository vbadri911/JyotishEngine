/**
 * Transit sign-ingress detection (P7b). Forward-searches for the next instant a
 * transiting planet's sidereal longitude crosses a 30-degree sign boundary --
 * a genuinely different algorithm class from everything else in this codebase,
 * which only ever evaluates a single fixed instant (the birth moment). See
 * BACKLOG.md's P7b entry for the required design and DECISIONS.md (2026-07-29,
 * "P7b design gate") for why the reported precision target is the nearest UTC
 * calendar day, and why the refinement phase still matters even so.
 *
 * Two phases, per the design gate:
 *   1. Bracket -- sample daily until the sign index (floor(longitude/30)) changes,
 *      in EITHER direction. Jupiter and Saturn each retrograde several months a
 *      year and can cross back over a boundary they just entered (a real,
 *      documented pattern for these two planets -- e.g. Saturn's 2027 ingress
 *      into Aries, retrograde back into Pisces, then permanent Aries in 2028).
 *   2. Refine -- binary search within that <=1-day bracket down to sub-day
 *      precision (well under the 1-day reporting target), because the bracket's
 *      two ends are not necessarily UTC-midnight-aligned (a real search starts
 *      from "now", an arbitrary instant) -- only the refinement step correctly
 *      resolves which single UTC calendar date actually contains the crossing.
 */
import { DateTime } from "luxon";
import type { EngineSettings, SignName } from "../types.js";
import { siderealLongitudeAt, julianDayUTToUtcISO, utcISOToJulianDayUT, type ClassicalGraha } from "./ephemeris.js";
import signsData from "../../data/signs.json" with { type: "json" };

const SIGN_ORDER = signsData.signs.map((s) => s.name) as SignName[];

/** P7b scope is these two -- the slow-moving grahas whose sign-ingress dates are
 *  meaningful multi-month/multi-year astrological events. Not generalized to all
 *  seven classical planets: the Moon changes sign roughly every 2.25 days and the
 *  inner/faster planets have no comparable "living document" use case here. */
export type TransitGraha = Extract<ClassicalGraha, "Jupiter" | "Saturn">;

export interface SignIngressEvent {
  graha: TransitGraha;
  fromSign: SignName;
  toSign: SignName;
  /** UTC calendar date the crossing falls on, e.g. "2026-06-02" -- see DECISIONS.md
   *  for why day-level, not finer. */
  dateUTC: string;
  /** The refined crossing instant (Julian Day UT) -- an internal precision artifact
   *  of the binary search, not itself the reported/disclosed value. */
  julianDayUT: number;
}

/** Daily sampling step for the bracket phase. Both Jupiter (~0.08 deg/day) and Saturn
 *  (~0.03 deg/day) move far too slowly to cross a 30-degree boundary within a single
 *  day more than once, so one bracket per crossing is guaranteed at this interval. */
const SAMPLE_INTERVAL_DAYS = 1;

/** Refinement stops once the bracket is under 1 minute of JD -- comfortably finer
 *  than the 1-day reporting target, so the reported UTC date is never ambiguous. */
const REFINE_EPSILON_DAYS = 1 / 1440;

/** Saturn spends roughly 2.5-3 years per sign even without retrograde loops; this
 *  gives generous headroom before treating a search as failed/misconfigured. */
const DEFAULT_MAX_SEARCH_DAYS = 365 * 4;

function signIndexOf(siderealLongitude: number): number {
  return Math.floor((((siderealLongitude % 360) + 360) % 360) / 30);
}

function signNameAt(index: number): SignName {
  const sign = SIGN_ORDER[index];
  if (!sign) throw new Error(`Unreachable: sign index ${index} out of range`);
  return sign;
}

/**
 * Generic bracket-then-refine root finder, parametrized by a longitude-at-JD
 * function so the algorithm itself is testable with a synthetic function --
 * fast and exact -- without depending on the real (WASM) ephemeris. See
 * tests/transit.test.ts.
 */
export async function findNextSignCrossing(
  longitudeAtJD: (julianDayUT: number) => Promise<number> | number,
  fromJulianDayUT: number,
  maxSearchDays: number = DEFAULT_MAX_SEARCH_DAYS
): Promise<{ fromSignIndex: number; toSignIndex: number; julianDayUT: number }> {
  const startLongitude = await longitudeAtJD(fromJulianDayUT);
  let prevJD = fromJulianDayUT;
  let prevSignIndex = signIndexOf(startLongitude);

  let bracketLo = prevJD;
  let bracketHi = prevJD;
  let hiSignIndex = prevSignIndex;
  let bracketed = false;

  for (let day = SAMPLE_INTERVAL_DAYS; day <= maxSearchDays; day += SAMPLE_INTERVAL_DAYS) {
    const sampleJD = fromJulianDayUT + day;
    const longitude = await longitudeAtJD(sampleJD);
    const sampleSignIndex = signIndexOf(longitude);
    if (sampleSignIndex !== prevSignIndex) {
      bracketLo = prevJD;
      bracketHi = sampleJD;
      hiSignIndex = sampleSignIndex;
      bracketed = true;
      break;
    }
    prevJD = sampleJD;
  }

  if (!bracketed) {
    throw new Error(
      `No sign-boundary crossing found within ${maxSearchDays} days of JD ${fromJulianDayUT}`
    );
  }

  const fromSignIndex = prevSignIndex;
  let lo = bracketLo;
  let hi = bracketHi;
  while (hi - lo > REFINE_EPSILON_DAYS) {
    const mid = (lo + hi) / 2;
    const midLongitude = await longitudeAtJD(mid);
    const midSignIndex = signIndexOf(midLongitude);
    if (midSignIndex === fromSignIndex) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return { fromSignIndex, toSignIndex: hiSignIndex, julianDayUT: hi };
}

/**
 * Finds the next sign ingress for Jupiter or Saturn after a given instant, using the
 * real ephemeris. `fromJulianDayUT` is an explicit parameter (not implicitly "now")
 * to match this codebase's existing convention (e.g. dasha.ts's findActivePeriod
 * takes an explicit `atISO`) and to keep the function testable/deterministic.
 */
export async function findNextSignIngress(
  graha: TransitGraha,
  fromJulianDayUT: number,
  settings: Pick<EngineSettings, "ayanamsa">,
  maxSearchDays?: number
): Promise<SignIngressEvent> {
  const result = await findNextSignCrossing(
    (jd) => siderealLongitudeAt(jd, graha, settings).then((r) => r.siderealLongitude),
    fromJulianDayUT,
    maxSearchDays
  );

  return {
    graha,
    fromSign: signNameAt(result.fromSignIndex),
    toSign: signNameAt(result.toSignIndex),
    dateUTC: julianDayUTToUtcISO(result.julianDayUT).slice(0, 10),
    julianDayUT: result.julianDayUT,
  };
}

/**
 * Convenience: the next `count` sign ingresses in sequence, each search starting
 * from the previous crossing's own instant. Correctly captures retrograde
 * re-entries (a crossing found need not be "forward progress" through the
 * zodiac -- see module docs) since each search re-brackets from scratch rather
 * than assuming a direction.
 */
export async function findUpcomingSignIngresses(
  graha: TransitGraha,
  fromJulianDayUT: number,
  settings: Pick<EngineSettings, "ayanamsa">,
  count: number,
  maxSearchDaysPerStep?: number
): Promise<SignIngressEvent[]> {
  const events: SignIngressEvent[] = [];
  let cursor = fromJulianDayUT;
  for (let i = 0; i < count; i++) {
    const event = await findNextSignIngress(graha, cursor, settings, maxSearchDaysPerStep);
    events.push(event);
    cursor = event.julianDayUT;
  }
  return events;
}

/** Convenience for callers starting from "now" rather than an already-known Julian Day. */
export function nowAsJulianDayUT(): number {
  return utcISOToJulianDayUT(DateTime.now().toUTC().toISO()!);
}
