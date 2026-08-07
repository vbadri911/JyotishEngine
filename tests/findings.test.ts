import { describe, it, expect } from "vitest";
import { dignityFindings, houseLordFindings, combustionFindings, bodyPartFindings, houseAfflictionFindings, currentDashaFinding, aggregateFindings } from "../src/findings/index.js";
import { computeMahadashaSequence } from "../src/engine/dasha.js";
import { computeChart } from "../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../src/types.js";
import type { ChartData, PlanetPosition, Graha, Domain } from "../src/types.js";

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

/** Same reference chart as tests/yogas.test.ts, with houseLords populated (Leo Lagna). */
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
    // Leo Lagna: house N's lord is the ruler of the sign N signs on from Leo.
    houseLords: {
      1: { lord: "Sun", placedInHouse: 9 },
      2: { lord: "Mercury", placedInHouse: 9 },
      3: { lord: "Venus", placedInHouse: 10 },
      4: { lord: "Mars", placedInHouse: 9 },
      5: { lord: "Jupiter", placedInHouse: 4 },
      6: { lord: "Saturn", placedInHouse: 3 },
      7: { lord: "Saturn", placedInHouse: 3 },
      8: { lord: "Jupiter", placedInHouse: 4 },
      9: { lord: "Mars", placedInHouse: 9 }, // own house
      10: { lord: "Venus", placedInHouse: 10 }, // own house -- interpretation.md's literal example
      11: { lord: "Mercury", placedInHouse: 9 },
      12: { lord: "Moon", placedInHouse: 1 },
    },
    confidenceFlags: [],
  };
}

describe("dignityFindings", () => {
  const chart = buildReferenceChart();
  const findings = dignityFindings(chart);

  it("Sun (exalted, Lagna lord) produces a finding tagged career and health", () => {
    const sun = findings.find((f) => f.statement.startsWith("Sun"));
    expect(sun).toBeDefined();
    expect(sun!.domain).toEqual(expect.arrayContaining(["career", "health"]));
    expect(sun!.polarity).toBe("supportive");
    expect(sun!.statement).toContain("Lagna lord");
  });

  it("Saturn (exalted) produces a career finding, not tagged health (not Lagna lord here)", () => {
    const saturn = findings.find((f) => f.statement.startsWith("Saturn"));
    expect(saturn).toBeDefined();
    expect(saturn!.domain).toEqual(["career"]);
  });

  it("Venus (own) produces a wealth+relationships finding", () => {
    const venus = findings.find((f) => f.statement.startsWith("Venus"));
    expect(venus).toBeDefined();
    expect(venus!.domain).toEqual(expect.arrayContaining(["wealth", "relationships"]));
  });

  it("Mars (own, not in GRAHA_DOMAINS, not Lagna lord) produces NO standalone dignity finding", () => {
    expect(findings.find((f) => f.statement.startsWith("Mars"))).toBeUndefined();
  });

  it("Jupiter (friend -- not a notable dignity) produces no finding", () => {
    expect(findings.find((f) => f.statement.startsWith("Jupiter"))).toBeUndefined();
  });

  it("Moon and Rahu/Ketu (neutral or no notable dignity) produce no findings", () => {
    expect(findings.find((f) => f.statement.startsWith("Moon"))).toBeUndefined();
    expect(findings.find((f) => f.statement.startsWith("Rahu"))).toBeUndefined();
    expect(findings.find((f) => f.statement.startsWith("Ketu"))).toBeUndefined();
  });
});

describe("houseLordFindings", () => {
  const chart = buildReferenceChart();
  const findings = houseLordFindings(chart);

  it("produces exactly one finding for each of the 9 domain-mapped houses", () => {
    expect(findings).toHaveLength(9);
  });

  it("10th lord (Venus) in its own house is flagged as such -- interpretation.md's literal example", () => {
    const tenth = findings.find((f) => f.statement.startsWith("10th"));
    expect(tenth!.statement).toContain("own house");
    expect(tenth!.statement).toContain("Venus");
    expect(tenth!.domain).toEqual(["career"]);
  });

  it("9th lord (Mars) in its own house is flagged as such", () => {
    const ninth = findings.find((f) => f.statement.startsWith("9th"));
    expect(ninth!.statement).toContain("own house");
    expect(ninth!.domain).toEqual(["purpose"]);
  });

  it("1st house finding is tagged both health and career", () => {
    const first = findings.find((f) => f.statement.startsWith("1st"));
    expect(first!.domain).toEqual(expect.arrayContaining(["health", "career"]));
  });

  it("a non-own-house placement is not flagged as one (2nd lord Mercury is in the 9th, not 2nd)", () => {
    const second = findings.find((f) => f.statement.startsWith("2nd"));
    expect(second!.statement).not.toContain("own house");
  });
});

describe("combustionFindings", () => {
  const chart = buildReferenceChart();
  const findings = combustionFindings(chart);

  it("flags Mercury (combust in the reference chart) with a challenging finding", () => {
    expect(findings).toHaveLength(1);
    expect(findings[0]!.statement).toContain("Mercury");
    expect(findings[0]!.polarity).toBe("challenging");
    expect(findings[0]!.statement).toContain("19.68");
  });
});

describe("currentDashaFinding", () => {
  const REFERENCE_MOON_LONGITUDE = 139.267;
  const dasha = computeMahadashaSequence("1983-04-23T10:00:00.000Z", REFERENCE_MOON_LONGITUDE);

  it("resolves the full nested Mahadasha -> Antardasha -> Pratyantardasha path for a known instant", () => {
    // Well within the Rahu Mahadasha (2017-2035) per the golden chart's known sequence.
    const finding = currentDashaFinding(dasha, "2020-01-01T00:00:00.000Z");
    expect(finding).not.toBeNull();
    expect(finding!.domain).toEqual(["timing"]);
    expect(finding!.statement).toContain("Rahu ->");
    expect(finding!.statement.split(" -> ")).toHaveLength(3); // Mahadasha, Antardasha, Pratyantardasha
  });

  it("returns null for an instant outside the computed 120-year cycle", () => {
    expect(currentDashaFinding(dasha, "2200-01-01T00:00:00.000Z")).toBeNull();
  });

  it("formats dates as human-readable UTC prose, not a raw local-offset ISO instant -- bug found while building the P5 Timing renderer, the first real consumer of this statement's text", () => {
    // Same underlying Luxon behavior already fixed for .ics UID/DESCRIPTION
    // (DECISIONS.md, P7a): DashaPeriod.start/.end carry whatever local offset
    // the running environment has, so a raw interpolation here would leak an
    // environment-dependent timestamp into reader-facing prose. Never
    // exercised before now because no domain renderer ever quoted this
    // Finding's statement until Timing was built.
    const finding = currentDashaFinding(dasha, "2020-01-01T00:00:00.000Z");
    expect(finding!.statement).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no raw ISO date-time
    expect(finding!.statement).not.toMatch(/[+-]\d{2}:\d{2}\b/); // no raw UTC offset
    expect(finding!.statement).toMatch(/\d{1,2} \w+ \d{4} to \d{1,2} \w+ \d{4}/); // "6 December 2019 to 1 February 2020"
  });
});

describe("aggregateFindings", () => {
  it("combines yoga findings with dignity/house-lord/combustion/dasha findings", () => {
    const chart = buildReferenceChart();
    const dasha = computeMahadashaSequence("1983-04-23T10:00:00.000Z", 139.267);
    const fakeYogaFindings = [
      { id: "yoga-fake", domain: ["purpose"] as Domain[], statement: "fake yoga", evidence: [], strength: 1, polarity: "neutral" as const },
    ];
    const all = aggregateFindings(chart, dasha, fakeYogaFindings, "2020-01-01T00:00:00.000Z");

    expect(all).toContainEqual(fakeYogaFindings[0]);
    expect(all.some((f) => f.statement.startsWith("Sun"))).toBe(true); // dignity
    expect(all.some((f) => f.statement.startsWith("10th"))).toBe(true); // house-lord
    expect(all.some((f) => f.statement.includes("combust"))).toBe(true); // combustion
    expect(all.some((f) => f.domain.includes("timing"))).toBe(true); // current dasha
  });
});

/**
 * Everything above this point tests dignityFindings()/houseLordFindings()/
 * combustionFindings() against a HAND-BUILT mock chart, not real computeChart()
 * output. That's a real, worth-naming distinction: the mock encodes the
 * fixture's already-known expected values, not independently computed
 * positions -- if computeChart()'s real pipeline diverged from the mock, none
 * of the tests above would catch it. This block runs the real pipeline via
 * computeChart() for every specific case interpretation.md names by example,
 * not just Venus.
 */
describe("computeChart() surfaces the currently-active dasha period and full findings (real pipeline, not the mock)", () => {
  it("currentDashaPeriod is populated (not just reachable via a separate exported function)", async () => {
    const { currentDashaPeriod, findings } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    expect(currentDashaPeriod).not.toBeNull();
    expect(currentDashaPeriod!.level).toBe("pratyantardasha");
    expect(findings.some((f) => f.domain.includes("timing"))).toBe(true);
  });

  it("Sun's dignity finding (exalted, Lagna lord, house 9) is tagged career+health+purpose -- interpretation.md's own worked example, checked against real positions", async () => {
    const { findings } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    const sun = findings.find((f) => f.statement.startsWith("Sun") && f.statement.includes("exalted"));
    expect(sun).toBeDefined();
    expect(sun!.domain).toEqual(expect.arrayContaining(["career", "health", "purpose"]));
    expect(sun!.statement).toContain("Lagna lord");
  });

  it("Mercury correctly produces NO combustion finding -- real separation (~19.67 deg) exceeds the combustion orb", async () => {
    // NOT the same claim as "combustionFindings() works" -- that's tested in isolation
    // above, against a mock where combust is forced true. This golden chart doesn't
    // actually have any combust planet in real output: the fixture's own original
    // combust:true for Mercury was itself wrong and was corrected (DECISIONS.md) once
    // real ephemeris confirmed the true ~19.67 deg separation exceeds the 14 deg orb.
    // This test exists so that fact stays pinned -- if it ever flips to "defined",
    // that's either a real astronomical change (impossible, fixed birth data) or a
    // regression in assessCombustion()/the orb config, worth investigating either way.
    const { chart, findings } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    expect(chart.planets.Mercury.combust).toBe(false);
    expect(chart.planets.Mercury.distanceFromSunDegrees).toBeCloseTo(19.67, 1);
    expect(findings.find((f) => f.statement.startsWith("Mercury") && f.statement.includes("combust"))).toBeUndefined();
  });

  it("Venus's house-lord finding specifically (not just 'some finding') shows the 10th lord in its own house", async () => {
    const { findings } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    const tenth = findings.find((f) => f.statement.startsWith("10th lord"));
    expect(tenth).toBeDefined();
    expect(tenth!.statement).toContain("Venus");
    expect(tenth!.statement).toContain("own house");
  });

  it("no finding statement in the real golden chart contains a malformed ordinal", async () => {
    const { findings } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    // House numbers in this project only ever range 1-12, so this is sufficient --
    // 11th/12th are correct as-is, "1th"/"2th"/"3th" are always wrong.
    for (const f of findings) {
      expect(f.statement, f.statement).not.toMatch(/\b[123]th\b/);
    }
  });
});

/**
 * Piece A (BACKLOG.md "Health's and Relationships' own domain-mapping table
 * rows name factors P4's finding-generators never implemented"), built
 * 2026-08-01 per the design gate in DECISIONS.md. Both against the
 * hand-built mock chart, mirroring dignityFindings()/houseLordFindings()'s
 * own test structure above.
 */
describe("bodyPartFindings", () => {
  const chart = buildReferenceChart();
  const findings = bodyPartFindings(chart);

  it("produces a finding for every planet with BOTH a notable dignity AND a body-part entry", () => {
    // Sun (exalted), Mars (own), Venus (own), Saturn (exalted) all qualify.
    // Moon/Mercury are notable-dignity-excluded (neutral); Rahu/Ketu have no
    // body-part entry in constants.md's Karakas table at all.
    const grahas = findings.map((f) => f.statement.split(" ")[0]).sort();
    expect(grahas).toEqual(["Mars", "Saturn", "Sun", "Venus"]);
  });

  it("all tagged health only, all challenging strength/polarity matching the dignity table", () => {
    for (const f of findings) {
      expect(f.domain).toEqual(["health"]);
    }
    const sun = findings.find((f) => f.statement.startsWith("Sun"))!;
    expect(sun.statement).toBe("Sun is classically associated with bones and eyes. Sun is exalted in Aries, suggesting general resilience in this area.");
    expect(sun.polarity).toBe("supportive");
    const saturn = findings.find((f) => f.statement.startsWith("Saturn"))!;
    expect(saturn.statement).toBe("Saturn is classically associated with bones, joints, and chronic conditions. Saturn is exalted in Libra, suggesting general resilience in this area.");
  });

  it("the body-part association and the dignity are stated as two independent sentences, not fused, so dignity doesn't read as the REASON for the association -- real fluency issue, fixed 2026-08-01", () => {
    const sun = findings.find((f) => f.statement.startsWith("Sun"))!;
    const sentences = sun.statement.split(". ");
    expect(sentences).toHaveLength(2);
    expect(sentences[0]).toBe("Sun is classically associated with bones and eyes");
    expect(sentences[1]).toContain("exalted");
    expect(sentences[1]).toContain("resilience");
  });

  it("a debilitated (challenging) planet gets 'worth general attention' framing, not 'resilience' -- tendency differs by dignity, the association itself does not", () => {
    const challenging = bodyPartFindings({
      ...chart,
      planets: { ...chart.planets, Saturn: planet({ graha: "Saturn", sign: "Cancer", house: 3, dignity: "debilitated" }) },
    });
    const saturn = challenging.find((f) => f.statement.startsWith("Saturn"))!;
    expect(saturn.statement).toBe("Saturn is classically associated with bones, joints, and chronic conditions. Saturn is debilitated in Cancer, suggesting this may be an area worth general attention.");
    expect(saturn.polarity).toBe("challenging");
  });

  it("does not fire for a planet with a body-part entry but no notable dignity (Mercury: neutral)", () => {
    expect(findings.some((f) => f.statement.startsWith("Mercury"))).toBe(false);
  });

  it("does not fire for Rahu/Ketu even with a notable dignity (no body-part entry exists for either)", () => {
    const chartWithNotableNodes: ChartData = {
      ...chart,
      planets: {
        ...chart.planets,
        Rahu: planet({ graha: "Rahu", sign: "Gemini", house: 11, dignity: "exalted" }),
        Ketu: planet({ graha: "Ketu", sign: "Sagittarius", house: 5, dignity: "debilitated" }),
      },
    };
    const withNodes = bodyPartFindings(chartWithNotableNodes);
    expect(withNodes.some((f) => f.statement.startsWith("Rahu") || f.statement.startsWith("Ketu"))).toBe(false);
  });
});

describe("houseAfflictionFindings", () => {
  it("is silent for all three target houses when no natural malefic occupies or aspects them (golden-mock chart)", () => {
    const chart = buildReferenceChart();
    // Saturn=house3, Mars=house9, Rahu=house11, Ketu=house5 -- confirmed
    // (via aspects.json's real offsets) none occupy or aspect houses 6/7/8
    // for this chart. Real absence, not an untested assumption.
    expect(houseAfflictionFindings(chart)).toEqual([]);
  });

  it("detects 6th-house occupancy by a natural malefic (Health)", () => {
    const chart = buildReferenceChart();
    const afflicted: ChartData = { ...chart, planets: { ...chart.planets, Saturn: planet({ graha: "Saturn", sign: "Virgo", house: 6, dignity: "exalted" }) } };
    const findings = houseAfflictionFindings(afflicted);
    const sixth = findings.find((f) => f.statement.startsWith("The 6th house"));
    expect(sixth).toBeDefined();
    expect(sixth!.domain).toEqual(["health"]);
    expect(sixth!.statement).toContain("Saturn occupies it");
  });

  it("detects 8th-house aspect (not occupancy) by a natural malefic via Mars's special 4th-house aspect offset (Health)", () => {
    const chart = buildReferenceChart();
    // Mars in house 5: special offset 4 -> wrap(5+4-1)=8 (aspects.json).
    const afflicted: ChartData = { ...chart, planets: { ...chart.planets, Mars: planet({ graha: "Mars", sign: "Leo", house: 5, dignity: "friend" }) } };
    const findings = houseAfflictionFindings(afflicted);
    const eighth = findings.find((f) => f.statement.startsWith("The 8th house"));
    expect(eighth).toBeDefined();
    expect(eighth!.domain).toEqual(["health"]);
    expect(eighth!.statement).toContain("Mars aspects it from the 5th house");
  });

  it("detects 7th-house aspect by a natural malefic via Rahu's universal 7th-house aspect (Relationships)", () => {
    const chart = buildReferenceChart();
    // Rahu in house 1: universal offset 7 -> wrap(1+7-1)=7 (aspects.json).
    const afflicted: ChartData = { ...chart, planets: { ...chart.planets, Rahu: planet({ graha: "Rahu", sign: "Leo", house: 1 }) } };
    const findings = houseAfflictionFindings(afflicted);
    const seventh = findings.find((f) => f.statement.startsWith("The 7th house"));
    expect(seventh).toBeDefined();
    expect(seventh!.domain).toEqual(["relationships"]);
    expect(seventh!.statement).toContain("Rahu aspects it from the 1st house");
  });

  it("combines multiple afflicting malefics for the same house into one finding, not one per malefic", () => {
    const chart = buildReferenceChart();
    const afflicted: ChartData = {
      ...chart,
      planets: {
        ...chart.planets,
        Saturn: planet({ graha: "Saturn", sign: "Virgo", house: 6, dignity: "exalted" }),
        Mars: planet({ graha: "Mars", sign: "Virgo", house: 6, dignity: "friend" }),
      },
    };
    const findings = houseAfflictionFindings(afflicted);
    const sixthHouseFindings = findings.filter((f) => f.statement.startsWith("The 6th house"));
    expect(sixthHouseFindings).toHaveLength(1);
    expect(sixthHouseFindings[0]!.statement).toContain("Saturn occupies it");
    expect(sixthHouseFindings[0]!.statement).toContain("Mars occupies it");
  });

  it("never uses Sun/Mercury/Moon as an afflicting malefic (disclosed exclusion, constants.md)", () => {
    const chart = buildReferenceChart();
    // Sun in house 6 (occupies) -- should NOT produce a 6th-house affliction finding.
    const notAfflicted: ChartData = { ...chart, planets: { ...chart.planets, Sun: planet({ graha: "Sun", sign: "Virgo", house: 6, dignity: "exalted" }) } };
    const findings = houseAfflictionFindings(notAfflicted);
    expect(findings.some((f) => f.statement.startsWith("The 6th house"))).toBe(false);
  });
});
