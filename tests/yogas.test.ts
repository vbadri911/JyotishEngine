import { describe, it, expect } from "vitest";
import {
  detectMahapurushaYogas,
  detectGajakesariYoga,
  detectKemadrumaYoga,
  detectMangalDosha,
} from "../src/rules/yogas.js";
import type { ChartData, PlanetPosition, Graha } from "../src/types.js";

/**
 * Hand-built mock chart matching tests/golden-charts/reference-chart-1983.json.
 * This lets the yoga-detection LOGIC be verified now, independent of whether
 * the ephemeris integration exists yet. Once real ephemeris output is wired
 * up, the same assertions should hold against ChartData built from actual
 * computed positions -- if they don't, the discrepancy is in the ephemeris
 * wiring or the mock, not in this detection logic (which is tested here in
 * isolation).
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

function buildReferenceChart(): ChartData {
  return {
    input: { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    location: {
      placeText: "Chennai, Tamil Nadu, India",
      latitude: 13.0827,
      longitude: 80.2707,
      ianaZone: "Asia/Kolkata",
      utcOffsetMinutesAtBirth: 330,
    },
    settings: { ayanamsa: "lahiri", nodeType: "mean", houseSystem: "whole_sign", nodesHaveSpecialAspects: false, chartFormat: "south_indian" },
    julianDayUT: 0, // not exercised by these tests
    ascendant: { siderealLongitude: 147.617, sign: "Leo", degreeInSign: 27.617, nakshatra: 12, pada: 2 },
    planets: {
      Sun:     planet({ graha: "Sun",     sign: "Aries",       degreeInSign: 9.05,  house: 9,  dignity: "exalted" }),
      Moon:    planet({ graha: "Moon",    sign: "Leo",         degreeInSign: 19.267,house: 1,  dignity: "neutral" }),
      Mars:    planet({ graha: "Mars",    sign: "Aries",       degreeInSign: 19.483,house: 9,  dignity: "own" }),
      Mercury: planet({ graha: "Mercury", sign: "Aries",       degreeInSign: 28.733,house: 9,  dignity: "neutral", combust: true }),
      Jupiter: planet({ graha: "Jupiter", sign: "Scorpio",     degreeInSign: 16.233,house: 4,  dignity: "friend" }),
      Venus:   planet({ graha: "Venus",   sign: "Taurus",      degreeInSign: 18.017,house: 10, dignity: "own" }),
      Saturn:  planet({ graha: "Saturn",  sign: "Libra",       degreeInSign: 7.367, house: 3,  dignity: "exalted" }),
      Rahu:    planet({ graha: "Rahu",    sign: "Gemini",      degreeInSign: 4.267, house: 11 }),
      Ketu:    planet({ graha: "Ketu",    sign: "Sagittarius", degreeInSign: 4.267, house: 5 }),
    },
    houseLords: {}, // not exercised by these tests
    confidenceFlags: [
      {
        type: "ascendant_near_cusp",
        message: "Ascendant at 27.617 deg Leo is within 3 deg of the Virgo boundary.",
      },
    ],
  };
}

describe("detectMahapurushaYogas (reference chart)", () => {
  const findings = detectMahapurushaYogas(buildReferenceChart());
  const byName = (n: string) => findings.find((f) => f.id.includes(n.toLowerCase()));

  it("Malavya (Venus, own sign, 10th house/Kendra) is EXACT", () => {
    expect(byName("malavya")?.classification).toBe("EXACT");
  });
  it("Ruchaka (Mars, own sign, 9th house/Trikona not Kendra) is STRONG_NOT_TEXTBOOK", () => {
    expect(byName("ruchaka")?.classification).toBe("STRONG_NOT_TEXTBOOK");
  });
  it("Sasa (Saturn, exalted, 3rd house, neither Kendra nor Trikona) is STRONG_NOT_TEXTBOOK", () => {
    expect(byName("sasa")?.classification).toBe("STRONG_NOT_TEXTBOOK");
  });
  it("Hamsa (Jupiter, friend dignity, not exalted/own) is ABSENT", () => {
    expect(byName("hamsa")?.classification).toBe("ABSENT");
  });

  // Statement text, not just structure -- these previously only asserted on
  // .classification, which let a live ordinal-suffix bug ("3th house" instead
  // of "3rd") sit undetected. Saturn's house is 3 specifically because that's
  // the one house number in this reference chart where naive `${n}th` and a
  // correct ordinal diverge (see DECISIONS.md).
  it("Sasa's statement renders '3rd house', not '3th house'", () => {
    expect(byName("sasa")?.statement).toContain("3rd house");
    expect(byName("sasa")?.statement).not.toContain("3th");
  });
  it("no Mahapurusha statement contains a malformed ordinal (1th/2th/3th)", () => {
    for (const f of findings) {
      expect(f.statement).not.toMatch(/\b1th\b|\b2th\b|\b3th\b/);
    }
  });
});

describe("detectGajakesariYoga (reference chart: Jupiter in Scorpio, Moon in Leo)", () => {
  it("is EXACT -- Scorpio is 4 signs from Leo, a Kendra relationship", () => {
    const finding = detectGajakesariYoga(buildReferenceChart());
    expect(finding.classification).toBe("EXACT");
  });
});

describe("detectKemadrumaYoga (reference chart: Moon in Leo/house 1, a Kendra from Lagna)", () => {
  it("is PRESENT_CANCELLED -- condition met but Moon-in-Kendra cancellation applies", () => {
    const finding = detectKemadrumaYoga(buildReferenceChart());
    expect(finding.classification).toBe("PRESENT_CANCELLED");
  });
});

describe("detectMangalDosha (reference chart: Mars in house 9, not a dosha house)", () => {
  it("is ABSENT", () => {
    const finding = detectMangalDosha(buildReferenceChart());
    expect(finding.classification).toBe("ABSENT");
  });

  it("statement uses a real ordinal (9th), not just something that happens to end in 'th'", () => {
    const finding = detectMangalDosha(buildReferenceChart());
    expect(finding.statement).toContain("9th house");
  });

  it("statement renders '3rd house', not '3th house', for a Mars-in-house-3 (non-dosha-house) variant", () => {
    // house 9's "9th" is correct by coincidence either way (9%10=9); house 3 actually
    // distinguishes a naive `${n}th` template from a real ordinal function. House 3
    // isn't a dosha-triggering house, so this stays in the ABSENT branch, whose
    // statement is the one that renders an ordinal (the PRESENT_CANCELLED branch's
    // text doesn't use one at all).
    const chart = buildReferenceChart();
    chart.planets.Mars = { ...chart.planets.Mars, house: 3 };
    const finding = detectMangalDosha(chart);
    expect(finding.classification).toBe("ABSENT");
    expect(finding.statement).toContain("3rd house");
    expect(finding.statement).not.toContain("3th");
  });
});
