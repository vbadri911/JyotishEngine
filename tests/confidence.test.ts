import { describe, it, expect } from "vitest";
import { computeConfidenceFlags } from "../src/engine/confidence.js";
import { computeChart } from "../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../src/types.js";
import type { BirthInput, ConfidenceFlagType, Graha, PlanetPosition } from "../src/types.js";

const GRAHAS: Graha[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

/** A full set of 9 planets, none near any cusp/nakshatra boundary -- a "quiet" baseline
 *  so each test can override just the one field it cares about. */
function basePlanets(overrides: Partial<Record<Graha, Partial<PlanetPosition>>> = {}): Record<Graha, PlanetPosition> {
  const planets = {} as Record<Graha, PlanetPosition>;
  for (const graha of GRAHAS) {
    planets[graha] = {
      graha,
      siderealLongitude: 15, // mid-Aries: far from any sign or nakshatra boundary
      sign: "Aries",
      degreeInSign: 15,
      nakshatra: 2,
      pada: 3,
      house: 1,
      retrograde: false,
      combust: false,
      distanceFromSunDegrees: 90,
      dignity: "neutral",
      exactPointOrbDegrees: null,
      ...overrides[graha],
    };
  }
  return planets;
}

const BASE_INPUT: BirthInput = {
  date: "2000-06-15",
  time: "14:17", // deliberately not a round number
  placeText: "Chennai, Tamil Nadu, India",
  precision: "exact_from_record",
};

const QUIET_ASCENDANT = { sign: "Taurus", degreeInSign: 15 }; // far from any boundary

function flagTypes(flags: { type: ConfidenceFlagType }[]): ConfidenceFlagType[] {
  return flags.map((f) => f.type);
}

describe("computeConfidenceFlags: SKILL.md 'Confidence check' table, all 5 rows", () => {
  it("baseline: a quiet chart (no boundary conditions) produces no flags", () => {
    const flags = computeConfidenceFlags(BASE_INPUT, QUIET_ASCENDANT, basePlanets());
    expect(flags).toEqual([]);
  });

  it("row 1 -- ascendant within 3 deg of a sign boundary: flags ascendant_near_cusp", () => {
    const flags = computeConfidenceFlags(BASE_INPUT, { sign: "Leo", degreeInSign: 27.617 }, basePlanets());
    expect(flagTypes(flags)).toContain("ascendant_near_cusp");
  });

  it("row 1 -- ascendant well clear of a boundary: does not flag", () => {
    const flags = computeConfidenceFlags(BASE_INPUT, { sign: "Leo", degreeInSign: 15 }, basePlanets());
    expect(flagTypes(flags)).not.toContain("ascendant_near_cusp");
  });

  it("row 2 -- birth time approximate: flags birth_time_approximate_or_unknown", () => {
    const flags = computeConfidenceFlags(
      { ...BASE_INPUT, precision: "approximate" },
      QUIET_ASCENDANT,
      basePlanets()
    );
    expect(flagTypes(flags)).toContain("birth_time_approximate_or_unknown");
  });

  it("row 2 -- birth time unknown: flags birth_time_approximate_or_unknown", () => {
    const flags = computeConfidenceFlags({ ...BASE_INPUT, precision: "unknown" }, QUIET_ASCENDANT, basePlanets());
    expect(flagTypes(flags)).toContain("birth_time_approximate_or_unknown");
  });

  it("row 3 -- any graha within 1 deg of a sign boundary: flags planet_near_cusp", () => {
    const flags = computeConfidenceFlags(
      BASE_INPUT,
      QUIET_ASCENDANT,
      basePlanets({ Mars: { degreeInSign: 29.5 } })
    );
    expect(flagTypes(flags)).toContain("planet_near_cusp");
    expect(flags.find((f) => f.type === "planet_near_cusp")?.message).toContain("Mars");
  });

  it("row 3 -- multiple grahas near a boundary each produce their own flag", () => {
    const flags = computeConfidenceFlags(
      BASE_INPUT,
      QUIET_ASCENDANT,
      basePlanets({ Mars: { degreeInSign: 0.4 }, Venus: { degreeInSign: 29.8 } })
    );
    const cuspFlags = flags.filter((f) => f.type === "planet_near_cusp");
    expect(cuspFlags).toHaveLength(2);
  });

  it("row 4 -- Moon within ~1 deg of a nakshatra boundary: flags moon_near_nakshatra_boundary", () => {
    // Nakshatra span is 13.3333 deg; Ashwini/Bharani boundary is at absolute longitude 13.3333
    const flags = computeConfidenceFlags(
      BASE_INPUT,
      QUIET_ASCENDANT,
      basePlanets({ Moon: { siderealLongitude: 13.3333 - 0.2 } })
    );
    expect(flagTypes(flags)).toContain("moon_near_nakshatra_boundary");
  });

  it("row 4 -- Moon mid-nakshatra: does not flag", () => {
    const flags = computeConfidenceFlags(
      BASE_INPUT,
      QUIET_ASCENDANT,
      basePlanets({ Moon: { siderealLongitude: 6.667 } }) // dead center of Ashwini
    );
    expect(flagTypes(flags)).not.toContain("moon_near_nakshatra_boundary");
  });

  it("row 5 -- birth time given as a round number: flags birth_time_round_number", () => {
    const flagsOnHour = computeConfidenceFlags({ ...BASE_INPUT, time: "09:00" }, QUIET_ASCENDANT, basePlanets());
    expect(flagTypes(flagsOnHour)).toContain("birth_time_round_number");

    const flagsOnHalfHour = computeConfidenceFlags({ ...BASE_INPUT, time: "09:30" }, QUIET_ASCENDANT, basePlanets());
    expect(flagTypes(flagsOnHalfHour)).toContain("birth_time_round_number");
  });

  it("row 5 -- round number does not double-flag when precision is already approximate/unknown", () => {
    // Per SKILL.md: round-number is a heuristic for suspecting approximation: once precision
    // already says approximate/unknown, that's redundant, not an additional finding.
    const flags = computeConfidenceFlags(
      { ...BASE_INPUT, time: "09:00", precision: "approximate" },
      QUIET_ASCENDANT,
      basePlanets()
    );
    expect(flagTypes(flags)).toContain("birth_time_approximate_or_unknown");
    expect(flagTypes(flags)).not.toContain("birth_time_round_number");
  });

  it("a chart can trigger several rows at once, each producing its own flag", () => {
    const flags = computeConfidenceFlags(
      { ...BASE_INPUT, time: "10:00" },
      { sign: "Leo", degreeInSign: 0.5 },
      basePlanets({ Mercury: { degreeInSign: 0.1 }, Moon: { siderealLongitude: 13.3333 } })
    );
    expect(flagTypes(flags)).toEqual(
      expect.arrayContaining([
        "ascendant_near_cusp",
        "birth_time_round_number",
        "planet_near_cusp",
        "moon_near_nakshatra_boundary",
      ])
    );
  });
});

describe("computeConfidenceFlags: golden chart's real Ascendant", () => {
  it("flags the golden chart's own Ascendant (27.617 deg Leo, 2.38 deg from the Virgo boundary) as ascendant_near_cusp", async () => {
    const { chart } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );

    // Real computed Ascendant (27.624 deg Leo) is within the fixture's own 1' tolerance of
    // the hand-derived 27.617 deg -- either way this is well inside the 3 deg cusp orb.
    expect(chart.ascendant.sign).toBe("Leo");
    expect(30 - chart.ascendant.degreeInSign).toBeLessThan(3);

    const flags = chart.confidenceFlags.filter((f) => f.type === "ascendant_near_cusp");
    expect(flags).toHaveLength(1);
    expect(flags[0]!.message).toContain("Leo");
  });
});
