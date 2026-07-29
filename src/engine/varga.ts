/**
 * Divisional chart (varga) construction. D9 (Navamsa) fully implemented per
 * the algorithm in .claude/skills/jyotish-engine/references/varga.md.
 *
 * Pure function of (sign, degreeInSign) -- no ephemeris dependency.
 *
 * Regression check (from varga.md, hand-verified during design, confirm once
 * real ephemeris output exists): Venus at 18.017 deg Taurus -> D9 sign Gemini.
 */
import type { SignName } from "../types.js";
import signsData from "../../data/signs.json" with { type: "json" };

const SIGN_ORDER: SignName[] = signsData.signs.map((s) => s.name as SignName);
const NAVAMSA_START: Record<SignName, SignName> = signsData.navamsaStartingSign as Record<
  SignName,
  SignName
>;

const NAVAMSA_SPAN_DEGREES = 30 / 9; // 3 deg 20'

export function navamsaSign(rasiSign: SignName, degreeInSign: number): SignName {
  if (degreeInSign < 0 || degreeInSign >= 30) {
    throw new Error(`degreeInSign must be in [0,30), got ${degreeInSign}`);
  }
  const part = Math.floor(degreeInSign / NAVAMSA_SPAN_DEGREES) + 1; // 1-9
  const startSign = NAVAMSA_START[rasiSign];
  const startIdx = SIGN_ORDER.indexOf(startSign);
  const targetIdx = (startIdx + (part - 1)) % 12;
  const result = SIGN_ORDER[targetIdx];
  if (!result) throw new Error(`Unreachable: navamsa index ${targetIdx} out of range`);
  return result;
}

/**
 * D9 part number (1-9) within the sign -- exposed separately since it's
 * useful for pada-adjacent reporting without needing the resulting sign.
 */
export function navamsaPart(degreeInSign: number): number {
  return Math.floor(degreeInSign / NAVAMSA_SPAN_DEGREES) + 1;
}
