/**
 * Whole-sign house computation and house-lordship, plus graha drishti (aspects).
 * Both are pure functions of already-known sign positions -- no ephemeris
 * dependency, fully implemented and testable now.
 */
import type { SignName, Graha } from "../types.js";
import signsData from "../../data/signs.json" with { type: "json" };
import aspectsConfig from "../../config/aspects.json" with { type: "json" };

const SIGN_ORDER: SignName[] = signsData.signs.map((s) => s.name as SignName);

function signIndex(sign: SignName): number {
  const i = SIGN_ORDER.indexOf(sign);
  if (i === -1) throw new Error(`Unknown sign: ${sign}`);
  return i; // 0-based
}

/**
 * Whole-sign house number (1-12) of a planet given the Lagna sign.
 * House 1 = the Lagna sign itself; houses proceed in zodiacal order.
 */
export function houseOf(lagnaSign: SignName, planetSign: SignName): number {
  const diff = (signIndex(planetSign) - signIndex(lagnaSign) + 12) % 12;
  return diff + 1;
}

export function signOfHouse(lagnaSign: SignName, house: number): SignName {
  if (house < 1 || house > 12) throw new Error(`House must be 1-12, got ${house}`);
  const idx = (signIndex(lagnaSign) + (house - 1)) % 12;
  const sign = SIGN_ORDER[idx];
  if (!sign) throw new Error(`Unreachable: sign index ${idx} out of range`);
  return sign;
}

const SIGN_LORD: Record<SignName, Graha> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

/** Which graha owns a given house, by whole-sign reckoning from the Lagna. */
export function houseLord(lagnaSign: SignName, house: number): Graha {
  return SIGN_LORD[signOfHouse(lagnaSign, house)];
}

/**
 * Graha drishti: returns the list of houses (1-12) a planet in `fromHouse`
 * aspects, given its universal 7th aspect plus any special aspects.
 */
export function aspectedHouses(graha: Graha, fromHouse: number): number[] {
  const wrap = (h: number) => ((h - 1) % 12) + 1;
  const houses = new Set<number>();
  houses.add(wrap(fromHouse + aspectsConfig.universalAspectOffset - 1));

  const special = (aspectsConfig.specialAspectOffsets as Record<string, number[]>)[graha];
  if (special) {
    for (const offset of special) houses.add(wrap(fromHouse + offset - 1));
  }
  if (
    aspectsConfig.nodesSpecialAspects?.enabled &&
    (graha === "Rahu" || graha === "Ketu")
  ) {
    const nodeOffsets = (aspectsConfig.nodesSpecialAspects.offsetsIfEnabled as Record<string, number[]>)[graha];
    if (nodeOffsets) for (const offset of nodeOffsets) houses.add(wrap(fromHouse + offset - 1));
  }
  return Array.from(houses).sort((a, b) => a - b);
}
