/**
 * Vimshottari Dasha computation, to Pratyantardasha depth.
 * Pure function of the Moon's absolute sidereal longitude and the birth
 * instant -- no ephemeris dependency beyond a longitude already computed
 * elsewhere.
 *
 * Algorithm and worked example: see
 * .claude/skills/jyotish-engine/references/dasha.md
 *
 * IMPORTANT correctness note (see reference doc): sub-periods are computed
 * as exact proportional fractions of the PARENT's real elapsed span, chained
 * consecutively, never independently rounded. This file follows that rule
 * throughout -- do not "simplify" by computing each level from nominal
 * calendar-year lengths.
 */
import { DateTime } from "luxon";
import type { Graha, DashaPeriod } from "../types.js";
import dashaConfig from "../../config/dasha-years.json" with { type: "json" };
import nakshatraData from "../../data/nakshatras.json" with { type: "json" };

/**
 * Dasha-year length in days. Classical Vimshottari math treats a "year" as a
 * fixed length for proportionality purposes, NOT the true irregular calendar
 * year. 365.25 days is the common convention. This is a config-not-code
 * decision precisely because some software uses other constants (e.g. exact
 * 365 days, or a sidereal year length) -- if validation against a reference
 * report shows boundary dates off by a few days, THIS constant is the first
 * place to check.
 */
export const DASHA_YEAR_DAYS = 365.25;

const SEQUENCE: Graha[] = dashaConfig.sequence.map((s) => s.lord as Graha);
const YEARS_BY_LORD: Record<Graha, number> = Object.fromEntries(
  dashaConfig.sequence.map((s) => [s.lord, s.years])
) as Record<Graha, number>;

function nextLordInSequence(lord: Graha): Graha {
  const idx = SEQUENCE.indexOf(lord);
  const nextIdx = idx + 1 >= SEQUENCE.length ? 0 : idx + 1; // avoids sparse-array indexing
  const result = SEQUENCE[nextIdx];
  if (!result) throw new Error(`Unreachable: dasha sequence index ${nextIdx} out of range`);
  return result;
}

interface NakshatraPosition {
  index: number; // 0-26
  name: string;
  lord: Graha;
  fractionElapsed: number; // 0-1 within this nakshatra
}

export function nakshatraPositionFromLongitude(absoluteSiderealLongitude: number): NakshatraPosition {
  const span = nakshatraData.spanDegrees;
  const norm = ((absoluteSiderealLongitude % 360) + 360) % 360;
  const index = Math.floor(norm / span); // 0-26
  const entry = nakshatraData.list[index];
  if (!entry) throw new Error(`Unreachable: nakshatra index ${index} out of range`);
  const fractionElapsed = (norm - entry.startDeg) / span;
  return {
    index,
    name: entry.name,
    lord: entry.lord as Graha,
    fractionElapsed,
  };
}

/** Balance, in years, of the birth Mahadasha remaining from the birth instant forward. */
export function birthDashaBalanceYears(absoluteMoonLongitude: number): {
  lord: Graha;
  balanceYears: number;
} {
  const pos = nakshatraPositionFromLongitude(absoluteMoonLongitude);
  const totalYears = YEARS_BY_LORD[pos.lord];
  return { lord: pos.lord, balanceYears: (1 - pos.fractionElapsed) * totalYears };
}

/**
 * Subdivide a parent period into 9 sub-periods (one per graha), each
 * proportional to (subLordYears / 120) * parentDurationDays, starting with
 * the parent's own lord and continuing through the fixed sequence.
 * Works identically whether the parent is a Mahadasha (-> Antardashas) or an
 * Antardasha (-> Pratyantardashas).
 */
function subdivide(parent: DashaPeriod): DashaPeriod[] {
  const start = DateTime.fromISO(parent.start);
  const end = DateTime.fromISO(parent.end);
  const parentDurationDays = end.diff(start, "days").days;

  const level = parent.level === "mahadasha" ? "antardasha" : "pratyantardasha";
  const subs: DashaPeriod[] = [];
  let cursor = start;
  let lord = parent.lord;

  for (let i = 0; i < 9; i++) {
    const fraction = YEARS_BY_LORD[lord] / dashaConfig.totalYears;
    const durationDays = fraction * parentDurationDays;
    const subEnd = i === 8 ? end : cursor.plus({ days: durationDays }); // last one closes exactly on parent end
    subs.push({
      lord,
      level,
      start: cursor.toISO()!,
      end: subEnd.toISO()!,
      parent,
    });
    cursor = subEnd;
    lord = nextLordInSequence(lord);
  }
  return subs;
}

export interface DashaComputationResult {
  birthBalance: { lord: Graha; balanceYears: number };
  mahadashas: DashaPeriod[]; // does not include sub-periods inline; call subdivide() per-period as needed
}

/**
 * Full Mahadasha sequence for one 120-year cycle. The birth Mahadasha (the
 * first entry) is reported with its TRUE start instant, back-dated from
 * birth by its already-elapsed portion -- not the birth instant itself.
 * This matches how the birth balance is defined (SKILL.md references/dasha.md,
 * "Everything before birth in that Mahadasha is not part of the person's
 * timeline" -- a statement about what's *relevant*, not a redefinition of
 * when the Mahadasha itself began) and how every real dasha report presents
 * it (worked example there: Venus MD "started" 25 May 1974 for a 23 Apr 1983
 * birth, not birth date). This isn't just cosmetic: computeAntardashas() and
 * computePratyantardashas() derive sub-period proportions from a parent's
 * `start`/`end` span (see subdivide() below) -- if `start` were the birth
 * instant instead of the Mahadasha's true start, every Antardasha inside the
 * birth Mahadasha would be computed against the wrong (truncated) parent
 * duration, not just its reported start date being off.
 */
export function computeMahadashaSequence(
  birthDateTimeISO: string,
  absoluteMoonLongitude: number
): DashaComputationResult {
  const birthBalance = birthDashaBalanceYears(absoluteMoonLongitude);
  const birthDt = DateTime.fromISO(birthDateTimeISO);

  const birthLordTotalYears = YEARS_BY_LORD[birthBalance.lord];
  const elapsedYears = birthLordTotalYears - birthBalance.balanceYears;
  const birthMahadashaTrueStart = birthDt.minus({ days: elapsedYears * DASHA_YEAR_DAYS });

  const mahadashas: DashaPeriod[] = [];
  let cursor = birthMahadashaTrueStart;
  let lord = birthBalance.lord;
  let yearsForThisPeriod = birthLordTotalYears;

  // One full 120-year cycle (9 Mahadashas from the birth Mahadasha's true start onward).
  for (let i = 0; i < 9; i++) {
    const durationDays = yearsForThisPeriod * DASHA_YEAR_DAYS;
    const end = cursor.plus({ days: durationDays });
    mahadashas.push({
      lord,
      level: "mahadasha",
      start: cursor.toISO()!,
      end: end.toISO()!,
    });
    cursor = end;
    lord = nextLordInSequence(lord);
    yearsForThisPeriod = YEARS_BY_LORD[lord]; // subsequent periods run their full count
  }

  return { birthBalance, mahadashas };
}

/** Convenience: Antardashas of a given Mahadasha. */
export function computeAntardashas(mahadasha: DashaPeriod): DashaPeriod[] {
  return subdivide(mahadasha);
}

/** Convenience: Pratyantardashas of a given Antardasha. */
export function computePratyantardashas(antardasha: DashaPeriod): DashaPeriod[] {
  return subdivide(antardasha);
}

/**
 * Find the currently-active period at any nesting level, at a given instant.
 * Returns the deepest level requested (mahadasha / antardasha / pratyantardasha).
 */
export function findActivePeriod(
  mahadashas: DashaPeriod[],
  atISO: string,
  depth: "mahadasha" | "antardasha" | "pratyantardasha" = "pratyantardasha"
): DashaPeriod | null {
  const at = DateTime.fromISO(atISO);
  const md = mahadashas.find((m) => at >= DateTime.fromISO(m.start) && at < DateTime.fromISO(m.end));
  if (!md || depth === "mahadasha") return md ?? null;

  const ads = computeAntardashas(md);
  const ad = ads.find((a) => at >= DateTime.fromISO(a.start) && at < DateTime.fromISO(a.end));
  if (!ad || depth === "antardasha") return ad ?? null;

  const pds = computePratyantardashas(ad);
  const pd = pds.find((p) => at >= DateTime.fromISO(p.start) && at < DateTime.fromISO(p.end));
  return pd ?? ad;
}
