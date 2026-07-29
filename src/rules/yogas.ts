/**
 * Yoga/dosha detection. Operates on already-computed ChartData -- does not
 * touch the ephemeris directly, so these are fully unit-testable right now
 * against a hand-constructed mock ChartData (see tests/), independent of
 * whether the WASM ephemeris integration exists yet.
 *
 * Every detector returns a Finding with an explicit classification. See
 * .claude/skills/jyotish-engine/references/yogas.md for the full reasoning
 * behind each condition and cancellation -- this file implements that
 * document; it does not restate the reasoning inline beyond brief comments.
 */
import type { ChartData, Finding, Graha, YogaClassification } from "../types.js";
import { ordinal } from "../util/ordinal.js";

const KENDRAS = [1, 4, 7, 10];

let findingCounter = 0;
function nextId(prefix: string): string {
  findingCounter += 1;
  return `${prefix}-${findingCounter}`;
}

// ---------------------------------------------------------------------------
// Pancha Mahapurusha Yogas
// ---------------------------------------------------------------------------

const MAHAPURUSHA_YOGAS: Array<{ name: string; graha: Graha }> = [
  { name: "Ruchaka", graha: "Mars" },
  { name: "Bhadra", graha: "Mercury" },
  { name: "Hamsa", graha: "Jupiter" },
  { name: "Malavya", graha: "Venus" },
  { name: "Sasa", graha: "Saturn" },
];

/**
 * A Mahapurusha yoga requires BOTH: dignity is exalted or own-sign, AND the
 * planet occupies a Kendra (1/4/7/10) from the Lagna. Meeting the dignity
 * condition alone without the Kendra condition is a real, strong placement
 * -- but is NOT the named yoga. This is the single most common
 * false-positive in astrology software; do not skip the Kendra check.
 */
export function detectMahapurushaYogas(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  for (const { name, graha } of MAHAPURUSHA_YOGAS) {
    const planet = chart.planets[graha];
    const dignified = planet.dignity === "exalted" || planet.dignity === "own";
    const inKendra = KENDRAS.includes(planet.house);

    let classification: YogaClassification;
    let statement: string;
    if (dignified && inKendra) {
      classification = "EXACT";
      statement = `${name} Yoga: ${graha} is ${planet.dignity} in the ${ordinal(planet.house)} house, a Kendra.`;
    } else if (dignified && !inKendra) {
      classification = "STRONG_NOT_TEXTBOOK";
      statement = `${graha} is ${planet.dignity} in the ${ordinal(planet.house)} house -- a strong placement, but not ${name} Yoga since the ${ordinal(planet.house)} is not a Kendra.`;
    } else {
      classification = "ABSENT";
      statement = `${name} Yoga: not present. ${graha} is ${planet.dignity} in the ${ordinal(planet.house)} house.`;
    }

    findings.push({
      id: nextId(`yoga-${name.toLowerCase()}`),
      domain: ["purpose", "career"],
      statement,
      evidence: [
        { path: `planets.${graha}.dignity`, value: planet.dignity },
        { path: `planets.${graha}.house`, value: planet.house },
      ],
      classification,
      strength: classification === "EXACT" ? 0.9 : classification === "STRONG_NOT_TEXTBOOK" ? 0.6 : 0,
      polarity: classification === "ABSENT" ? "neutral" : "supportive",
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Gajakesari Yoga
// ---------------------------------------------------------------------------

/** Kendra-from-Moon check: is Jupiter 1st, 4th, 7th, or 10th sign away from the Moon (inclusive)? */
export function detectGajakesariYoga(chart: ChartData): Finding {
  const moon = chart.planets.Moon;
  const jupiter = chart.planets.Jupiter;

  // House-of-Jupiter-counted-from-Moon's-sign, using the same whole-sign
  // counting convention as houses.ts, but anchored to the Moon rather than
  // the Lagna.
  const SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  const moonIdx = SIGN_ORDER.indexOf(moon.sign);
  const jupIdx = SIGN_ORDER.indexOf(jupiter.sign);
  const offsetFromMoon = ((jupIdx - moonIdx + 12) % 12) + 1; // 1-12

  const isKendraFromMoon = KENDRAS.includes(offsetFromMoon);
  const notAfflicted = jupiter.dignity !== "debilitated" && !jupiter.combust;

  const classification: YogaClassification = isKendraFromMoon ? "EXACT" : "ABSENT";
  return {
    id: nextId("yoga-gajakesari"),
    domain: ["purpose"],
    statement: isKendraFromMoon
      ? `Gajakesari Yoga: Jupiter is ${offsetFromMoon} signs from the Moon -- a Kendra relationship.${
          notAfflicted ? "" : " Note: Jupiter's dignity/combustion here moderates the yoga's strength."
        }`
      : `Gajakesari Yoga: not present. Jupiter is ${offsetFromMoon} signs from the Moon, not a Kendra position.`,
    evidence: [
      { path: "planets.Moon.sign", value: moon.sign },
      { path: "planets.Jupiter.sign", value: jupiter.sign },
    ],
    classification,
    strength: isKendraFromMoon ? (notAfflicted ? 0.85 : 0.6) : 0,
    polarity: classification === "EXACT" ? "supportive" : "neutral",
  };
}

// ---------------------------------------------------------------------------
// Kemadruma Yoga (with cancellation checks -- do not report without them)
// ---------------------------------------------------------------------------

export function detectKemadrumaYoga(chart: ChartData): Finding {
  const moon = chart.planets.Moon;
  const SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  const moonIdx = SIGN_ORDER.indexOf(moon.sign);
  const secondFromMoonSign = SIGN_ORDER[(moonIdx + 1) % 12];
  const twelfthFromMoonSign = SIGN_ORDER[(moonIdx + 11) % 12];

  const occupants = (Object.values(chart.planets) as typeof chart.planets.Sun[]).filter(
    (p) => p.graha !== "Moon" && p.graha !== "Rahu" && p.graha !== "Ketu" && p.graha !== "Sun"
  );
  const secondOccupied = occupants.some((p) => p.sign === secondFromMoonSign);
  const twelfthOccupied = occupants.some((p) => p.sign === twelfthFromMoonSign);
  const conditionMet = !secondOccupied && !twelfthOccupied;

  // Cancellation: Moon in a Kendra (1/4/7/10) from the LAGNA.
  const moonInKendraFromLagna = KENDRAS.includes(moon.house);

  let classification: YogaClassification;
  let statement: string;
  if (!conditionMet) {
    classification = "ABSENT";
    statement = "Kemadruma Yoga: condition not met -- at least one planet occupies the 2nd or 12th house from the Moon.";
  } else if (moonInKendraFromLagna) {
    classification = "PRESENT_CANCELLED";
    statement = `Kemadruma Yoga: technically present (2nd and 12th from Moon are empty), but cancelled -- the Moon is in a Kendra (house ${moon.house}) from the Lagna. Not a concern.`;
  } else {
    classification = "EXACT";
    statement = "Kemadruma Yoga: present, and the standard Moon-in-Kendra cancellation does not apply here. Consider checking benefic aspects on the Moon as a further, secondary cancellation before treating this as unmitigated.";
  }

  return {
    id: nextId("yoga-kemadruma"),
    domain: ["relationships", "wealth"],
    statement,
    evidence: [
      { path: "planets.Moon.house", value: moon.house },
      { path: "planets.Moon.sign", value: moon.sign },
    ],
    classification,
    strength: classification === "EXACT" ? 0.5 : 0,
    polarity: classification === "EXACT" ? "challenging" : "neutral",
  };
}

// ---------------------------------------------------------------------------
// Mangal Dosha / Kuja Dosha
// ---------------------------------------------------------------------------

const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

/**
 * Lagna-based check only (the most universally cited reference point).
 * Moon-based and Venus-based checks are additional, tradition-dependent
 * variants -- see references/yogas.md. Flagged clearly as Lagna-only here
 * rather than silently presenting it as the complete picture.
 */
export function detectMangalDosha(chart: ChartData): Finding {
  const mars = chart.planets.Mars;
  const inDoshaHouse = MANGAL_DOSHA_HOUSES.includes(mars.house);

  const marsOwnOrExalted = mars.dignity === "own" || mars.dignity === "exalted";

  let classification: YogaClassification;
  let statement: string;
  if (!inDoshaHouse) {
    classification = "ABSENT";
    statement = `Mangal Dosha (Lagna-based): absent. Mars is in the ${ordinal(mars.house)} house, not one of the dosha-triggering houses (1, 2, 4, 7, 8, 12).`;
  } else if (marsOwnOrExalted) {
    classification = "PRESENT_CANCELLED";
    statement = `Mangal Dosha (Lagna-based): technically triggered (Mars in house ${mars.house}), but a standard exemption applies -- Mars is ${mars.dignity} there.`;
  } else {
    classification = "EXACT";
    statement = `Mangal Dosha (Lagna-based): present. Mars is in the ${ordinal(mars.house)} house from the Lagna. Note this dosha's exemption criteria vary meaningfully by regional tradition -- see references/yogas.md before presenting this as a single universal verdict.`;
  }

  return {
    id: nextId("dosha-mangal"),
    domain: ["relationships"],
    statement,
    evidence: [
      { path: "planets.Mars.house", value: mars.house },
      { path: "planets.Mars.dignity", value: mars.dignity },
    ],
    classification,
    citation: "Lagna-based reckoning; regional traditions vary on exemptions",
    strength: classification === "EXACT" ? 0.6 : 0,
    polarity: classification === "EXACT" ? "challenging" : "neutral",
  };
}

// ---------------------------------------------------------------------------
// Aggregate entry point
// ---------------------------------------------------------------------------

export function detectAllCoreYogas(chart: ChartData): Finding[] {
  return [
    ...detectMahapurushaYogas(chart),
    detectGajakesariYoga(chart),
    detectKemadrumaYoga(chart),
    detectMangalDosha(chart),
  ];
}
