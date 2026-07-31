import { describe, it, expect } from "vitest";
import { lagnaTemperamentNote, lagnaLordNote } from "../../src/narrative/personality.js";
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

/** Same reference chart as tests/narrative/natal.test.ts (Leo Lagna). */
function buildReferenceChart(overrides: { lagnaLordDignity?: PlanetPosition["dignity"] } = {}): ChartData {
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
      Sun:     planet({ graha: "Sun",     sign: "Aries",       degreeInSign: 9.05,  house: 9,  dignity: overrides.lagnaLordDignity ?? "exalted" }),
      Moon:    planet({ graha: "Moon",    sign: "Leo",         degreeInSign: 19.267,house: 1,  dignity: "neutral" }),
      Mars:    planet({ graha: "Mars",    sign: "Aries",       degreeInSign: 19.483,house: 9,  dignity: "own" }),
      Mercury: planet({ graha: "Mercury", sign: "Aries",       degreeInSign: 28.733,house: 9,  dignity: "neutral" }),
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

describe("lagnaTemperamentNote", () => {
  it("Leo Lagna: Fire + Fixed + lord Sun, composed from already-verified sign data", () => {
    const chart = buildReferenceChart();
    const note = lagnaTemperamentNote(chart);
    expect(note.statement).toContain("Leo Lagna");
    expect(note.statement).toContain("energetic, direct temperament");
    expect(note.statement).toContain("persistence");
    expect(note.statement).toContain("Sun");
    expect(note.statement).toContain("authority and vitality");
  });

  // The Phaladeepika-style physiognomy/fear-coded-language sweep lives in
  // tests/findingStatementQuality.test.ts (consolidated there, not duplicated
  // here, so a future addition to that pattern list doesn't need updating in
  // two places) -- it covers this note across every real Lagna sign/lord/
  // dignity combination, not just this one reference chart.
});

describe("lagnaLordNote", () => {
  it("exalted Lagna lord (Sun) is framed as a strength", () => {
    const chart = buildReferenceChart({ lagnaLordDignity: "exalted" });
    const note = lagnaLordNote(chart);
    expect(note.polarity).toBe("supportive");
    expect(note.statement).toContain("Sun");
    expect(note.statement).toContain("exalted");
    expect(note.statement).toContain("strength");
  });

  it("debilitated Lagna lord is framed as an honest blind spot", () => {
    const chart = buildReferenceChart({ lagnaLordDignity: "debilitated" });
    const note = lagnaLordNote(chart);
    expect(note.polarity).toBe("challenging");
    expect(note.statement).toContain("blind spot");
  });

  it("neutral-strength Lagna lord (friend/neutral/enemy) is neither a strength nor a blind spot", () => {
    const chart = buildReferenceChart({ lagnaLordDignity: "friend" });
    const note = lagnaLordNote(chart);
    expect(note.polarity).toBe("neutral");
  });
});

describe("Personality notes against the real golden-chart pipeline", () => {
  it("run cleanly end to end via computeChart()", async () => {
    const { chart } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    const temperament = lagnaTemperamentNote(chart);
    const lord = lagnaLordNote(chart);
    expect(temperament.statement.length).toBeGreaterThan(0);
    expect(lord.statement.length).toBeGreaterThan(0);
    // Golden chart: Leo Lagna, Sun exalted in Aries -- a real, known strength.
    expect(lord.polarity).toBe("supportive");
  });
});
