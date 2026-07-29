/**
 * Planetary dignity assessment. Pure function of (graha, sign, degreeInSign) --
 * no ephemeris dependency, fully implemented and testable now.
 *
 * See .claude/skills/jyotish-engine/references/constants.md for the source reasoning.
 */
import type { Graha, SignName, Dignity } from "../types.js";
import dignityConfig from "../../config/dignity.json" with { type: "json" };

interface DignityResult {
  dignity: Dignity;
  /** Degrees from the exact exaltation/debilitation point. Null unless dignity is
   *  exalted or debilitated. A small value = "deep" exaltation, a materially
   *  stronger claim than merely being in the exaltation sign. */
  exactPointOrbDegrees: number | null;
}

export function assessDignity(
  graha: Graha,
  sign: SignName,
  degreeInSign: number
): DignityResult {
  const exalt = (dignityConfig.exaltation as any)[graha];
  const debil = (dignityConfig.debilitation as any)[graha];
  const moola = (dignityConfig.moolatrikona as any)[graha];
  const ownSigns: string[] = (dignityConfig.ownSigns as any)[graha] ?? [];

  // IMPORTANT (found via primary-source verification against BPHS Ch.3 v49-54):
  // for Moon (Taurus) and Mercury (Virgo), BPHS explicitly bounds "exalted" to a
  // narrow zone (0-3 deg and 0-15 deg respectively) because the same sign also
  // hosts moolatrikona/own-sign. For the other 5 planets, no zoneEndDegree is
  // set and the WHOLE exaltation sign counts as exalted -- do not "helpfully"
  // add a zone bound for those without re-checking BPHS first.
  if (exalt && exalt.sign === sign) {
    const zoneEnd = exalt.zoneEndDegree ?? 30; // absence = whole sign
    if (degreeInSign < zoneEnd) {
      const orb = exalt.degree != null ? Math.abs(degreeInSign - exalt.degree) : null;
      return { dignity: "exalted", exactPointOrbDegrees: orb };
    }
    // else: falls through to moolatrikona/own-sign checks below, which is the
    // correct behavior for Mercury at e.g. 17 deg Virgo (moolatrikona) or
    // 25 deg Virgo (own), and for Moon at e.g. 10 deg Taurus (moolatrikona).
  }
  if (debil && debil.sign === sign) {
    const orb = debil.degree != null ? Math.abs(degreeInSign - debil.degree) : null;
    return { dignity: "debilitated", exactPointOrbDegrees: orb };
  }
  if (moola && moola.sign === sign && degreeInSign >= moola.startDegree && degreeInSign <= moola.endDegree) {
    return { dignity: "moolatrikona", exactPointOrbDegrees: null };
  }
  if (ownSigns.includes(sign)) {
    return { dignity: "own", exactPointOrbDegrees: null };
  }

  // Natural friendship for the sign's ruling lord, from the perspective of `graha`.
  const signLord = signLordOf(sign);
  if (signLord && signLord !== graha) {
    const rel = (dignityConfig.naturalFriendships as any)[graha];
    if (rel) {
      if (rel.friends?.includes(signLord)) return { dignity: "friend", exactPointOrbDegrees: null };
      if (rel.enemies?.includes(signLord)) return { dignity: "enemy", exactPointOrbDegrees: null };
    }
  }
  return { dignity: "neutral", exactPointOrbDegrees: null };
}

// Local helper -- avoids a circular import on data/signs.json's own lord field.
// Kept intentionally small and explicit rather than clever.
function signLordOf(sign: SignName): Graha | null {
  const map: Record<SignName, Graha> = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
  };
  return map[sign] ?? null;
}

/**
 * Combustion check. Requires the planet's absolute longitude and the Sun's,
 * plus retrograde status. Pure function, no ephemeris dependency beyond the
 * longitudes already computed elsewhere.
 */
import combustionConfig from "../../config/combustion-orbs.json" with { type: "json" };

export function assessCombustion(
  graha: Graha,
  planetLongitude: number,
  sunLongitude: number,
  retrograde: boolean
): { combust: boolean; distanceFromSunDegrees: number } {
  if (graha === "Sun") return { combust: false, distanceFromSunDegrees: 0 };

  let diff = Math.abs(planetLongitude - sunLongitude);
  if (diff > 180) diff = 360 - diff; // shortest angular distance

  const orbEntry = (combustionConfig.orbsDegrees as any)[graha];
  if (!orbEntry) return { combust: false, distanceFromSunDegrees: diff };

  const orb = retrograde && orbEntry.retrograde != null ? orbEntry.retrograde : orbEntry.direct;
  return { combust: diff <= orb, distanceFromSunDegrees: diff };
}
