/**
 * Confidence checks -- see SKILL.md "Confidence check (run before interpreting)".
 * Pure function of already-computed positions; run once per chart, before
 * any interpretation/finding generation, per that section's own instruction.
 */
import type { BirthInput, ConfidenceFlag, Graha, PlanetPosition } from "../types.js";

const CUSP_ORB_ASCENDANT = 3; // degrees
const CUSP_ORB_PLANET = 1; // degrees
const NAKSHATRA_SPAN_DEGREES = 13.333333333333334;
const NAKSHATRA_BOUNDARY_ORB = 1; // degrees, per SKILL.md "~1 deg"

function nearSignBoundary(degreeInSign: number, orb: number): boolean {
  return degreeInSign < orb || degreeInSign > 30 - orb;
}

export function computeConfidenceFlags(
  input: BirthInput,
  ascendant: { sign: string; degreeInSign: number },
  planets: Record<Graha, PlanetPosition>
): ConfidenceFlag[] {
  const flags: ConfidenceFlag[] = [];

  if (nearSignBoundary(ascendant.degreeInSign, CUSP_ORB_ASCENDANT)) {
    flags.push({
      type: "ascendant_near_cusp",
      message: `Ascendant is ${ascendant.degreeInSign.toFixed(2)} deg into ${ascendant.sign}, within ${CUSP_ORB_ASCENDANT} deg of a sign boundary. Small birth-time errors could shift the Lagna to the adjacent sign, changing every house-dependent claim. Recommend birth-time rectification.`,
      suppresses: ["house_dependent_findings_high_confidence"],
    });
  }

  if (input.precision !== "exact_from_record") {
    flags.push({
      type: "birth_time_approximate_or_unknown",
      message: `Birth time precision is "${input.precision}" -- Ascendant and house-dependent claims are suppressed; falling back to Moon-sign analysis, which is far more robust to time error.`,
      suppresses: ["ascendant_dependent_findings", "house_dependent_findings"],
    });
  } else if (/(:00|:30)$/.test(input.time)) {
    flags.push({
      type: "birth_time_round_number",
      message: `Birth time (${input.time}) is a round number. Treated as likely approximate even though precision is marked "exact_from_record" -- confirm this came directly from a birth record rather than a rounded recollection.`,
    });
  }

  for (const planet of Object.values(planets)) {
    if (nearSignBoundary(planet.degreeInSign, CUSP_ORB_PLANET)) {
      flags.push({
        type: "planet_near_cusp",
        message: `${planet.graha} is ${planet.degreeInSign.toFixed(2)} deg into ${planet.sign}, within ${CUSP_ORB_PLANET} deg of a sign boundary -- soften findings depending on this exact placement.`,
        suppresses: [`${planet.graha}_sign_dependent_findings_high_confidence`],
      });
    }
  }

  const moon = planets.Moon;
  const moonNorm = ((moon.siderealLongitude % 360) + 360) % 360;
  const fractionIntoNakshatra = (moonNorm % NAKSHATRA_SPAN_DEGREES) / NAKSHATRA_SPAN_DEGREES;
  const degreesFromNakshatraBoundary = Math.min(
    fractionIntoNakshatra * NAKSHATRA_SPAN_DEGREES,
    (1 - fractionIntoNakshatra) * NAKSHATRA_SPAN_DEGREES
  );
  if (degreesFromNakshatraBoundary < NAKSHATRA_BOUNDARY_ORB) {
    flags.push({
      type: "moon_near_nakshatra_boundary",
      message: `Moon is within ${degreesFromNakshatraBoundary.toFixed(2)} deg of a nakshatra boundary -- the entire Vimshottari dasha timeline shifts with it. Treat dasha boundary dates as approximate.`,
      suppresses: ["dasha_boundary_precision"],
    });
  }

  return flags;
}
