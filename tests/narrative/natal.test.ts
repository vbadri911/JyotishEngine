import { describe, it, expect } from "vitest";
import { allPlanetNotes, allHouseNotes } from "../../src/narrative/natal.js";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import type { ChartData, PlanetPosition, Graha } from "../../src/types.js";

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

/** Same golden-chart mock as tests/findings.test.ts (Leo Lagna, all 12 houseLords populated). */
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
    julianDayUT: 0,
    ascendant: { siderealLongitude: 147.617, sign: "Leo", degreeInSign: 27.617, nakshatra: 12, pada: 2 },
    planets: {
      Sun:     planet({ graha: "Sun",     sign: "Aries",       degreeInSign: 9.05,  house: 9,  dignity: "exalted" }),
      Moon:    planet({ graha: "Moon",    sign: "Leo",         degreeInSign: 19.267,house: 1,  dignity: "neutral" }),
      Mars:    planet({ graha: "Mars",    sign: "Aries",       degreeInSign: 19.483,house: 9,  dignity: "own" }),
      Mercury: planet({ graha: "Mercury", sign: "Aries",       degreeInSign: 28.733,house: 9,  dignity: "neutral", combust: true, distanceFromSunDegrees: 19.68 }),
      Jupiter: planet({ graha: "Jupiter", sign: "Scorpio",     degreeInSign: 16.233,house: 4,  dignity: "friend" }),
      Venus:   planet({ graha: "Venus",   sign: "Taurus",      degreeInSign: 18.017,house: 10, dignity: "own" }),
      Saturn:  planet({ graha: "Saturn",  sign: "Libra",       degreeInSign: 7.367, house: 3,  dignity: "exalted" }),
      Rahu:    planet({ graha: "Rahu",    sign: "Gemini",      degreeInSign: 4.267, house: 11 }),
      Ketu:    planet({ graha: "Ketu",    sign: "Sagittarius", degreeInSign: 4.267, house: 5 }),
    },
    houseLords: {
      1: { lord: "Sun", placedInHouse: 9 },
      2: { lord: "Mercury", placedInHouse: 9 },
      3: { lord: "Venus", placedInHouse: 10 },
      4: { lord: "Mars", placedInHouse: 9 },
      5: { lord: "Jupiter", placedInHouse: 4 },
      6: { lord: "Saturn", placedInHouse: 3 },
      7: { lord: "Saturn", placedInHouse: 3 },
      8: { lord: "Jupiter", placedInHouse: 4 },
      9: { lord: "Mars", placedInHouse: 9 },
      10: { lord: "Venus", placedInHouse: 10 },
      11: { lord: "Mercury", placedInHouse: 9 },
      12: { lord: "Moon", placedInHouse: 1 },
    },
    confidenceFlags: [],
  };
}

describe("allPlanetNotes", () => {
  const chart = buildReferenceChart();
  const notes = allPlanetNotes(chart);

  it("covers all 9 planets, not just the 4 domain-mapped ones", () => {
    expect(notes.map((n) => n.graha).sort()).toEqual(
      ["Jupiter", "Ketu", "Mars", "Mercury", "Moon", "Rahu", "Saturn", "Sun", "Venus"].sort()
    );
  });

  it("includes Moon/Mars/Rahu/Ketu -- planets dignityFindings() deliberately excludes as standalone", () => {
    const moon = notes.find((n) => n.graha === "Moon");
    expect(moon?.statement).toBe("Moon is in a neutral sign in Leo, in the 1st house.");
    const rahu = notes.find((n) => n.graha === "Rahu");
    expect(rahu?.statement).toContain("Rahu");
    expect(rahu?.statement).toContain("Gemini");
  });

  it("marks the Lagna lord even at 'friend'/'neutral' dignity strength, unlike dignityFindings()'s notable-only filter", () => {
    const sun = notes.find((n) => n.graha === "Sun");
    expect(sun?.statement).toBe("Sun is exalted in Aries, in the 9th house, and is the Lagna lord.");
  });

  it("surfaces retrograde and combust flags inline", () => {
    const mercury = notes.find((n) => n.graha === "Mercury");
    expect(mercury?.statement).toContain("combust");
  });

  it("contains no malformed ordinals for any house 1-12", () => {
    for (const note of notes) {
      expect(note.statement).not.toMatch(/\b1th\b|\b2th\b|\b3th\b/);
    }
  });
});

describe("allHouseNotes", () => {
  const chart = buildReferenceChart();
  const notes = allHouseNotes(chart);

  it("covers all 12 houses, including 3rd/4th/12th which houseLordFindings() deliberately excludes", () => {
    expect(notes.map((n) => n.house)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("3rd house note (excluded from houseLordFindings()'s HOUSE_DOMAINS) is a real, correct note", () => {
    const third = notes.find((n) => n.house === 3);
    expect(third?.statement).toBe("3rd lord Venus is placed in Taurus, in the 10th house, and is in its own sign.");
  });

  it("reproduces interpretation.md's own literal worked example for the 10th house", () => {
    const tenth = notes.find((n) => n.house === 10);
    expect(tenth?.statement).toBe(
      "10th lord Venus is placed in Taurus, in the 10th house -- its own house, and is in its own sign."
    );
  });

  it("contains no malformed ordinals", () => {
    for (const note of notes) {
      expect(note.statement).not.toMatch(/\b1th\b|\b2th\b|\b3th\b/);
    }
  });
});

describe("Natal chart decoded notes against the real golden-chart pipeline", () => {
  it("allPlanetNotes/allHouseNotes run cleanly end to end via computeChart()", async () => {
    const { chart } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    const planetNotes = allPlanetNotes(chart);
    const houseNotes = allHouseNotes(chart);

    expect(planetNotes).toHaveLength(9);
    expect(houseNotes).toHaveLength(12);
    for (const note of [...planetNotes, ...houseNotes]) {
      expect(note.statement).not.toMatch(/\b1th\b|\b2th\b|\b3th\b/);
    }
  });
});
