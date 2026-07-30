import type { ChartData, PlanetPosition, Graha } from "../../src/types.js";

/**
 * Hand-built mock charts for narrative-template testing, same pattern as
 * tests/yogas.test.ts's buildReferenceChart(). Dignity fields are set directly
 * as overrides, not derived from sign -- that's already covered by
 * dignity.test.ts; these fixtures exist to exercise the template layer, not
 * dignity computation.
 */
function planet(overrides: Partial<PlanetPosition> & { graha: Graha }): PlanetPosition {
  return {
    siderealLongitude: 0,
    sign: "Aries",
    degreeInSign: 0,
    nakshatra: 1,
    pada: 1,
    house: 1,
    retrograde: false,
    combust: false,
    distanceFromSunDegrees: 0,
    dignity: "neutral",
    exactPointOrbDegrees: null,
    ...overrides,
  };
}

const BASE = {
  input: { date: "1990-01-01", time: "12:00", placeText: "Nowhere", precision: "exact_from_record" as const },
  location: {
    placeText: "Nowhere",
    latitude: 0,
    longitude: 0,
    ianaZone: "UTC",
    utcOffsetMinutesAtBirth: 0,
  },
  settings: {
    ayanamsa: "lahiri" as const,
    nodeType: "mean" as const,
    houseSystem: "whole_sign" as const,
    nodesHaveSpecialAspects: false,
    chartFormat: "south_indian" as const,
  },
  julianDayUT: 0,
  confidenceFlags: [],
};

/**
 * Deliberately weak/afflicted for Career specifically: Aries Lagna (Mars
 * lord), with Sun (career graha), Saturn (career graha + 10th lord), and Mars
 * (1st lord) all debilitated. Every Mahapurusha yoga is ABSENT (no dignified
 * planet is in a Kendra). Career ends up with zero supportive findings and
 * several real challenging ones -- the specific shape needed to stress-test
 * "length follows data" (raw finding count is still ~10, same order of
 * magnitude as the golden chart's Career count, but the substantive signal
 * is almost entirely challenging, not supportive) and "never trade on fear"
 * (real affliction, not manufactured, must still render without fatalism).
 * See DECISIONS.md for the domain-coverage tally that led to Career as P5's
 * first domain and this fixture's specific construction.
 */
export function buildWeakCareerChart(): ChartData {
  return {
    ...BASE,
    ascendant: { siderealLongitude: 0, sign: "Aries", degreeInSign: 0, nakshatra: 1, pada: 1 },
    planets: {
      Sun: planet({ graha: "Sun", sign: "Libra", degreeInSign: 15, house: 7, dignity: "debilitated" }),
      Moon: planet({ graha: "Moon", sign: "Sagittarius", degreeInSign: 10, house: 9, dignity: "neutral" }),
      Mars: planet({ graha: "Mars", sign: "Cancer", degreeInSign: 5, house: 4, dignity: "debilitated" }),
      Mercury: planet({
        graha: "Mercury",
        sign: "Scorpio",
        degreeInSign: 12,
        house: 8,
        dignity: "enemy",
        combust: true,
        distanceFromSunDegrees: 8,
      }),
      Jupiter: planet({ graha: "Jupiter", sign: "Gemini", degreeInSign: 20, house: 3, dignity: "neutral" }),
      Venus: planet({ graha: "Venus", sign: "Virgo", degreeInSign: 8, house: 6, dignity: "enemy" }),
      Saturn: planet({ graha: "Saturn", sign: "Aries", degreeInSign: 3, house: 1, dignity: "debilitated" }),
      Rahu: planet({ graha: "Rahu", sign: "Pisces", degreeInSign: 18, house: 12, dignity: "neutral" }),
      Ketu: planet({ graha: "Ketu", sign: "Virgo", degreeInSign: 18, house: 6, dignity: "neutral" }),
    },
    houseLords: {
      1: { lord: "Mars", placedInHouse: 4 },
      2: { lord: "Venus", placedInHouse: 6 },
      3: { lord: "Mercury", placedInHouse: 8 },
      4: { lord: "Moon", placedInHouse: 9 },
      5: { lord: "Sun", placedInHouse: 7 },
      6: { lord: "Mercury", placedInHouse: 8 },
      7: { lord: "Venus", placedInHouse: 6 },
      8: { lord: "Mars", placedInHouse: 4 },
      9: { lord: "Jupiter", placedInHouse: 3 },
      10: { lord: "Saturn", placedInHouse: 1 },
      11: { lord: "Saturn", placedInHouse: 1 },
      12: { lord: "Jupiter", placedInHouse: 3 },
    },
  };
}

/**
 * Same structure as buildWeakCareerChart(), with exactly one change: Sun's
 * dignity flipped from debilitated to exalted. Produces genuine SUPPORTIVE
 * signal (Sun, career-tagged) alongside the challenging signal that was
 * already there (Saturn debilitated as both a standalone dignity finding and
 * the 10th lord; Mars debilitated as the 1st lord) -- neither
 * buildWeakCareerChart() (all-challenging) nor the golden chart (all-
 * supportive) exercises a domain with both polarities present at once,
 * which is plausibly the most common real-world shape, not an edge case.
 */
export function buildMixedCareerChart(): ChartData {
  const chart = buildWeakCareerChart();
  return {
    ...chart,
    planets: {
      ...chart.planets,
      Sun: planet({ graha: "Sun", sign: "Libra", degreeInSign: 15, house: 7, dignity: "exalted" }),
    },
  };
}

/**
 * Built specifically to force "overview already cites everything -- full has
 * nothing new to add." Aries Lagna (Mars lord); Mars (1st lord, physically in
 * house 1 -- a Kendra), Mercury (6th lord), and Saturn (10th lord, physically
 * in house 10 -- a Kendra) are all own-sign, giving Ruchaka/Bhadra/Sasa Yoga
 * findings that each dedupe cleanly with their matching house-lord finding
 * (yoga wins). That's exactly 3 deduped supportive Career findings -- within
 * the overview cap, so nothing should remain for full to add. Jupiter, Venus,
 * and Sun are deliberately given non-notable dignity so Hamsa/Malavya stay
 * ABSENT and Sun contributes no standalone dignity finding -- keeping the
 * count at exactly 3, not accidentally more.
 */
export function buildExhaustedCareerChart(): ChartData {
  return {
    ...BASE,
    ascendant: { siderealLongitude: 0, sign: "Aries", degreeInSign: 0, nakshatra: 1, pada: 1 },
    planets: {
      Sun: planet({ graha: "Sun", sign: "Leo", degreeInSign: 10, house: 5, dignity: "neutral" }),
      Moon: planet({ graha: "Moon", sign: "Cancer", degreeInSign: 10, house: 4, dignity: "neutral" }),
      Mars: planet({ graha: "Mars", sign: "Aries", degreeInSign: 5, house: 1, dignity: "own" }),
      Mercury: planet({ graha: "Mercury", sign: "Virgo", degreeInSign: 12, house: 6, dignity: "own" }),
      Jupiter: planet({ graha: "Jupiter", sign: "Sagittarius", degreeInSign: 8, house: 9, dignity: "neutral" }),
      Venus: planet({ graha: "Venus", sign: "Taurus", degreeInSign: 6, house: 2, dignity: "neutral" }),
      Saturn: planet({ graha: "Saturn", sign: "Capricorn", degreeInSign: 3, house: 10, dignity: "own" }),
      Rahu: planet({ graha: "Rahu", sign: "Pisces", degreeInSign: 18, house: 12, dignity: "neutral" }),
      Ketu: planet({ graha: "Ketu", sign: "Virgo", degreeInSign: 18, house: 6, dignity: "neutral" }),
    },
    houseLords: {
      1: { lord: "Mars", placedInHouse: 1 },
      2: { lord: "Venus", placedInHouse: 2 },
      3: { lord: "Mercury", placedInHouse: 6 },
      4: { lord: "Moon", placedInHouse: 4 },
      5: { lord: "Sun", placedInHouse: 5 },
      6: { lord: "Mercury", placedInHouse: 6 },
      7: { lord: "Venus", placedInHouse: 2 },
      8: { lord: "Mars", placedInHouse: 1 },
      9: { lord: "Jupiter", placedInHouse: 9 },
      10: { lord: "Saturn", placedInHouse: 10 },
      11: { lord: "Saturn", placedInHouse: 10 },
      12: { lord: "Jupiter", placedInHouse: 9 },
    },
  };
}

/**
 * Built to stress-test Relationships specifically -- one of interpretation.md's
 * named SENSITIVE domains (marriage/children get non-negotiable framing rules
 * SKILL.md principle 5 ties to). Aries Lagna, Mars physically in house 1 (also
 * the Lagna lord) -- a genuine, triggered Mangal Dosha (EXACT, not cancelled),
 * plus the 7th lord (Venus) and 5th lord (Sun) both debilitated. All three are
 * real, non-manufactured challenging findings for Relationships, giving a
 * concrete case to check the template never drifts into predicting marriage
 * failure/divorce/infidelity and correctly uses the "partner's own chart
 * carries proportional weight" framing interpretation.md requires.
 */
export function buildWeakRelationshipsChart(): ChartData {
  return {
    ...BASE,
    ascendant: { siderealLongitude: 0, sign: "Aries", degreeInSign: 0, nakshatra: 1, pada: 1 },
    planets: {
      Sun: planet({ graha: "Sun", sign: "Libra", degreeInSign: 12, house: 7, dignity: "debilitated" }),
      Moon: planet({ graha: "Moon", sign: "Cancer", degreeInSign: 10, house: 4, dignity: "neutral" }),
      Mars: planet({ graha: "Mars", sign: "Aries", degreeInSign: 5, house: 1, dignity: "neutral" }),
      Mercury: planet({ graha: "Mercury", sign: "Gemini", degreeInSign: 8, house: 3, dignity: "neutral" }),
      Jupiter: planet({ graha: "Jupiter", sign: "Sagittarius", degreeInSign: 15, house: 9, dignity: "neutral" }),
      Venus: planet({ graha: "Venus", sign: "Virgo", degreeInSign: 6, house: 2, dignity: "debilitated" }),
      Saturn: planet({ graha: "Saturn", sign: "Capricorn", degreeInSign: 20, house: 10, dignity: "neutral" }),
      Rahu: planet({ graha: "Rahu", sign: "Pisces", degreeInSign: 18, house: 12, dignity: "neutral" }),
      Ketu: planet({ graha: "Ketu", sign: "Virgo", degreeInSign: 18, house: 2, dignity: "neutral" }),
    },
    houseLords: {
      1: { lord: "Mars", placedInHouse: 1 },
      2: { lord: "Venus", placedInHouse: 2 },
      3: { lord: "Mercury", placedInHouse: 3 },
      4: { lord: "Moon", placedInHouse: 4 },
      5: { lord: "Sun", placedInHouse: 7 },
      6: { lord: "Mercury", placedInHouse: 3 },
      7: { lord: "Venus", placedInHouse: 2 },
      8: { lord: "Mars", placedInHouse: 1 },
      9: { lord: "Jupiter", placedInHouse: 9 },
      10: { lord: "Saturn", placedInHouse: 10 },
      11: { lord: "Saturn", placedInHouse: 10 },
      12: { lord: "Jupiter", placedInHouse: 9 },
    },
  };
}
