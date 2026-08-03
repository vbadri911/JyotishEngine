import { describe, it, expect } from "vitest";
import {
  detectMahapurushaYogas,
  detectGajakesariYoga,
  detectKemadrumaYoga,
  detectMangalDosha,
  detectRajjuYoga,
  detectMusalaYoga,
  detectGadaYoga,
  detectVihagaYoga,
  detectRajaYoga,
} from "../src/rules/yogas.js";
import type { ChartData, PlanetPosition, Graha, SignName } from "../src/types.js";

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

/**
 * Dedicated correctness tests for the Nabhasa (subset) and Raja Yoga
 * detectors added 2026-08-01 (Piece B, DECISIONS.md) -- previously only
 * exercised incidentally through narrative-rendering tests using charts not
 * specifically designed to probe their classification boundaries. Every
 * other detector in this file gets its own isolated EXACT/ABSENT coverage;
 * these hadn't, which is a real gap, not a stylistic inconsistency.
 */

const CLASSICAL_SEVEN: Graha[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

function buildModalityChart(signOverrides: Partial<Record<Graha, SignName>>): ChartData {
  const defaultSign: SignName = "Aries"; // movable -- overridden per test
  const planets = {} as ChartData["planets"];
  for (const graha of [...CLASSICAL_SEVEN, "Rahu", "Ketu"] as Graha[]) {
    planets[graha] = planet({ graha, sign: signOverrides[graha] ?? defaultSign, house: 1 });
  }
  return {
    input: { date: "1990-01-01", time: "12:00", placeText: "Nowhere", precision: "exact_from_record" },
    location: { placeText: "Nowhere", latitude: 0, longitude: 0, ianaZone: "UTC", utcOffsetMinutesAtBirth: 0 },
    settings: { ayanamsa: "lahiri", nodeType: "mean", houseSystem: "whole_sign", nodesHaveSpecialAspects: false, chartFormat: "south_indian" },
    julianDayUT: 0,
    ascendant: { siderealLongitude: 0, sign: "Aries", degreeInSign: 0, nakshatra: 1, pada: 1 },
    planets,
    houseLords: {},
    confidenceFlags: [],
  };
}

function buildHouseConfinementChart(houseOverrides: Partial<Record<Graha, number>>): ChartData {
  const chart = buildModalityChart({});
  for (const graha of CLASSICAL_SEVEN) {
    const house = houseOverrides[graha] ?? 1;
    chart.planets[graha] = { ...chart.planets[graha], house };
  }
  return chart;
}

describe("Nabhasa yogas (subset: Rajju/Musala/Nala modality; Gada/Vihaga house-confinement)", () => {
  it("detectRajjuYoga is EXACT when all seven classical grahas are in movable signs", () => {
    const chart = buildModalityChart({
      Sun: "Aries", Moon: "Cancer", Mars: "Libra", Mercury: "Capricorn",
      Jupiter: "Aries", Venus: "Cancer", Saturn: "Libra",
    });
    expect(detectRajjuYoga(chart).classification).toBe("EXACT");
  });

  it("detectRajjuYoga is ABSENT when even one classical graha sits in a non-movable sign", () => {
    const chart = buildModalityChart({
      Sun: "Aries", Moon: "Cancer", Mars: "Libra", Mercury: "Capricorn",
      Jupiter: "Aries", Venus: "Cancer", Saturn: "Taurus", // fixed, breaks the condition
    });
    expect(detectRajjuYoga(chart).classification).toBe("ABSENT");
  });

  it("detectMusalaYoga is EXACT when all seven classical grahas are in fixed signs, ABSENT otherwise", () => {
    const exact = buildModalityChart({
      Sun: "Taurus", Moon: "Leo", Mars: "Scorpio", Mercury: "Aquarius",
      Jupiter: "Taurus", Venus: "Leo", Saturn: "Scorpio",
    });
    expect(detectMusalaYoga(exact).classification).toBe("EXACT");

    const absent = buildModalityChart({
      Sun: "Taurus", Moon: "Leo", Mars: "Scorpio", Mercury: "Aquarius",
      Jupiter: "Taurus", Venus: "Leo", Saturn: "Gemini", // dual, breaks the condition
    });
    expect(detectMusalaYoga(absent).classification).toBe("ABSENT");
  });

  it("detectGadaYoga is EXACT when all seven classical grahas are confined to one successive-Kendra pair (7th+10th), ABSENT otherwise", () => {
    const exact = buildHouseConfinementChart({ Sun: 7, Moon: 10, Mars: 7, Mercury: 10, Jupiter: 7, Venus: 10, Saturn: 7 });
    expect(detectGadaYoga(exact).classification).toBe("EXACT");

    const absent = buildHouseConfinementChart({ Sun: 7, Moon: 10, Mars: 7, Mercury: 10, Jupiter: 7, Venus: 10, Saturn: 5 }); // one graha escapes
    expect(detectGadaYoga(absent).classification).toBe("ABSENT");
  });

  it("detectVihagaYoga is EXACT only for the specific 4th+10th pair, not any successive-Kendra pair (disjoint from Gada)", () => {
    const vihaga = buildHouseConfinementChart({ Sun: 4, Moon: 10, Mars: 4, Mercury: 10, Jupiter: 4, Venus: 10, Saturn: 4 });
    expect(detectVihagaYoga(vihaga).classification).toBe("EXACT");
    // The SAME chart must NOT also satisfy Gada (4th+10th are opposite, not
    // successive, in the 1-4-7-10 Kendra cycle -- confirms the two yogas are
    // genuinely disjoint conditions, not one a special case of the other).
    expect(detectGadaYoga(vihaga).classification).toBe("ABSENT");

    const gadaOnly = buildHouseConfinementChart({ Sun: 7, Moon: 10, Mars: 7, Mercury: 10, Jupiter: 7, Venus: 10, Saturn: 7 });
    expect(detectVihagaYoga(gadaOnly).classification).toBe("ABSENT");
  });
});

/** Aries Lagna -- houseLords derived directly from Aries's own sign-lord
 *  table (1:1 house-to-sign under whole-sign houses), matching
 *  tests/narrative/fixtures.ts's convention. Kendra lords: Mars(1),
 *  Moon(4), Venus(7), Saturn(10). Trikona lords: Mars(1), Sun(5),
 *  Jupiter(9). Baseline places every Kendra/Trikona-lord planet in a
 *  mutually "safe" house (checked directly, not assumed) where no pair is
 *  conjunct or exactly 6 apart -- each test then moves exactly the planets
 *  needed to isolate one condition at a time. */
function buildRajaYogaBaseChart(overrides: Partial<Record<Graha, { house: number; dignity?: PlanetPosition["dignity"]; sign?: SignName }>> = {}): ChartData {
  // Checked directly (empirically, not just by hand) against ALL 11 real
  // Kendra-lord/Trikona-lord comparison pairs detectRajaYoga() makes --
  // house 1 is simultaneously Kendra AND Trikona (yogas.md's own point about
  // the Lagna's dual role), so Mars (house 1's lord) is ALSO compared
  // against Moon/Venus/Saturn (the other Kendra lords), not just Sun/Jupiter
  // -- a real mistake made and caught while building this fixture, not
  // assumed safe from a partial hand count.
  const baseline: Record<Graha, { house: number; dignity?: PlanetPosition["dignity"] }> = {
    Sun: { house: 2 }, Moon: { house: 7 }, Mars: { house: 6, dignity: "neutral" },
    Mercury: { house: 6 }, Jupiter: { house: 4 }, Venus: { house: 3 },
    Saturn: { house: 11 }, Rahu: { house: 6 }, Ketu: { house: 6 },
  };
  const planets = {} as ChartData["planets"];
  for (const graha of Object.keys(baseline) as Graha[]) {
    const o = overrides[graha];
    planets[graha] = planet({
      graha,
      house: o?.house ?? baseline[graha].house,
      dignity: o?.dignity ?? baseline[graha].dignity ?? "neutral",
      sign: o?.sign ?? "Gemini",
    });
  }
  return {
    input: { date: "1990-01-01", time: "12:00", placeText: "Nowhere", precision: "exact_from_record" },
    location: { placeText: "Nowhere", latitude: 0, longitude: 0, ianaZone: "UTC", utcOffsetMinutesAtBirth: 0 },
    settings: { ayanamsa: "lahiri", nodeType: "mean", houseSystem: "whole_sign", nodesHaveSpecialAspects: false, chartFormat: "south_indian" },
    julianDayUT: 0,
    ascendant: { siderealLongitude: 0, sign: "Aries", degreeInSign: 0, nakshatra: 1, pada: 1 },
    planets,
    houseLords: {
      1: { lord: "Mars", placedInHouse: planets.Mars!.house },
      2: { lord: "Venus", placedInHouse: planets.Venus!.house },
      3: { lord: "Mercury", placedInHouse: planets.Mercury!.house },
      4: { lord: "Moon", placedInHouse: planets.Moon!.house },
      5: { lord: "Sun", placedInHouse: planets.Sun!.house },
      6: { lord: "Mercury", placedInHouse: planets.Mercury!.house },
      7: { lord: "Venus", placedInHouse: planets.Venus!.house },
      8: { lord: "Mars", placedInHouse: planets.Mars!.house },
      9: { lord: "Jupiter", placedInHouse: planets.Jupiter!.house },
      10: { lord: "Saturn", placedInHouse: planets.Saturn!.house },
      11: { lord: "Saturn", placedInHouse: planets.Saturn!.house },
      12: { lord: "Jupiter", placedInHouse: planets.Jupiter!.house },
    },
    confidenceFlags: [],
  };
}

describe("detectRajaYoga (Aries Lagna, isolated conditions)", () => {
  it("is ABSENT for the baseline chart -- confirms the baseline is genuinely safe, not accidentally triggering", () => {
    const findings = detectRajaYoga(buildRajaYogaBaseChart());
    expect(findings).toHaveLength(1);
    expect(findings[0]!.classification).toBe("ABSENT");
  });

  it("is EXACT via conjunction -- a Kendra lord and Trikona lord occupying the same house together", () => {
    // Moon (4th/Kendra lord) and Jupiter (9th/Trikona lord) both in house 4.
    const findings = detectRajaYoga(buildRajaYogaBaseChart({ Moon: { house: 4 }, Jupiter: { house: 4 } }));
    const conjunctions = findings.filter((f) => f.classification === "EXACT" && f.statement.includes("occupy the same"));
    expect(conjunctions).toHaveLength(1);
    expect(conjunctions[0]!.statement).toContain("4th lord Moon");
    expect(conjunctions[0]!.statement).toContain("9th lord Jupiter");
  });

  it("is EXACT via mutual Kendra -- a Kendra lord and Trikona lord exactly 6 houses apart", () => {
    // Venus (7th/Kendra lord) in house 3, Sun (5th/Trikona lord) in house 9 -- |3-9|=6.
    const findings = detectRajaYoga(buildRajaYogaBaseChart({ Venus: { house: 3 }, Sun: { house: 9 } }));
    const mutual = findings.filter((f) => f.classification === "EXACT" && f.statement.includes("mutual Kendra"));
    expect(mutual).toHaveLength(1);
    expect(mutual[0]!.statement).toContain("7th lord Venus");
    expect(mutual[0]!.statement).toContain("5th lord Sun");
  });

  it("is EXACT via the Lagna lord's own dual Kendra+Trikona role, when dignified", () => {
    const findings = detectRajaYoga(buildRajaYogaBaseChart({ Mars: { house: 6, dignity: "exalted", sign: "Capricorn" } }));
    const lagnaCase = findings.filter((f) => f.classification === "EXACT" && f.statement.includes("simultaneously Kendra and Trikona lord"));
    expect(lagnaCase).toHaveLength(1);
    expect(lagnaCase[0]!.statement).toContain("the Lagna lord Mars");
  });

  it("does not report the same planet pair twice via two different Kendra/Trikona house routes (seenPairs dedup)", () => {
    // Mars is BOTH 1st (Kendra) and 8th (Kendra) lord here, but only ever a
    // TRIKONA-side candidate via house 1 -- this specifically checks that
    // Sun (5th lord, Trikona) conjunct with a Kendra lord doesn't somehow
    // get double-counted through Mars's dual Kendra role. Use the mutual-
    // Kendra case above but confirm the SAME pair key isn't repeated.
    const findings = detectRajaYoga(buildRajaYogaBaseChart({ Venus: { house: 3 }, Sun: { house: 9 } }));
    const statements = findings.map((f) => f.statement);
    expect(new Set(statements).size).toBe(statements.length); // no literal duplicate statement
  });
});
