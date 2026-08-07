import { describe, it, expect } from "vitest";
import { checkRemedyCondition, detectDashaRemedy, type DashaRemedyRow } from "../src/rules/dashaRemedies.js";
import { DASHA_REMEDY_ROWS } from "../src/rules/dashaRemedyData.js";
import { computeChart } from "../src/index.js";
import { computeAntardashas, type DashaComputationResult } from "../src/engine/dasha.js";
import { DEFAULT_ENGINE_SETTINGS } from "../src/types.js";
import type { ChartData, PlanetPosition, Graha } from "../src/types.js";

/** Minimal synthetic chart for exercising trigger primitives in isolation,
 *  independent of any real chart -- same rationale as yogas.test.ts's own
 *  buildReferenceChart(): the LOGIC is tested here; the real golden-chart
 *  tests below confirm it against real computed facts. */
function planet(overrides: Partial<PlanetPosition> & { graha: Graha }): PlanetPosition {
  return {
    siderealLongitude: 0, sign: "Aries", degreeInSign: 0, nakshatra: 1, pada: 1,
    house: 1, retrograde: false, combust: false, distanceFromSunDegrees: 0,
    dignity: "neutral", exactPointOrbDegrees: null, ...overrides,
  };
}

function buildSyntheticChart(overrides: Partial<Record<Graha, Partial<PlanetPosition>>> = {}): ChartData {
  const planets = {} as Record<Graha, PlanetPosition>;
  const defaults: Record<Graha, { sign: PlanetPosition["sign"]; house: number }> = {
    Sun: { sign: "Aries", house: 1 }, Moon: { sign: "Taurus", house: 2 }, Mars: { sign: "Gemini", house: 3 },
    Mercury: { sign: "Cancer", house: 4 }, Jupiter: { sign: "Leo", house: 5 }, Venus: { sign: "Virgo", house: 6 },
    Saturn: { sign: "Libra", house: 7 }, Rahu: { sign: "Scorpio", house: 8 }, Ketu: { sign: "Taurus", house: 2 },
  };
  for (const g of Object.keys(defaults) as Graha[]) {
    planets[g] = planet({ graha: g, sign: defaults[g].sign, house: defaults[g].house, ...(overrides[g] ?? {}) });
  }
  return {
    input: { date: "2000-01-01", time: "12:00", placeText: "Test", precision: "exact_from_record" },
    location: { placeText: "Test", latitude: 0, longitude: 0, ianaZone: "UTC", utcOffsetMinutesAtBirth: 0 },
    settings: DEFAULT_ENGINE_SETTINGS,
    julianDayUT: 0,
    ascendant: { siderealLongitude: 0, sign: "Aries", degreeInSign: 0, nakshatra: 1, pada: 1 },
    planets,
    houseLords: {
      1: { lord: "Mars", placedInHouse: 3 }, 2: { lord: "Venus", placedInHouse: 6 }, 3: { lord: "Mercury", placedInHouse: 4 },
      4: { lord: "Moon", placedInHouse: 2 }, 5: { lord: "Sun", placedInHouse: 1 }, 6: { lord: "Mercury", placedInHouse: 4 },
      7: { lord: "Venus", placedInHouse: 6 }, 8: { lord: "Mars", placedInHouse: 3 }, 9: { lord: "Jupiter", placedInHouse: 5 },
      10: { lord: "Saturn", placedInHouse: 7 }, 11: { lord: "Saturn", placedInHouse: 7 }, 12: { lord: "Jupiter", placedInHouse: 5 },
    },
    confidenceFlags: [],
  };
}

function row(mahadashaLord: Graha, antardashaLord: Graha, triggers: DashaRemedyRow["triggers"]): DashaRemedyRow {
  return { mahadashaLord, antardashaLord, triggers, remedyText: "test remedy", citation: "test citation" };
}

describe("checkRemedyCondition: individual trigger types", () => {
  it("debilitated: matches only when the Antardasha lord's own dignity is debilitated", () => {
    const chart = buildSyntheticChart({ Mars: { dignity: "debilitated" } });
    const r = row("Sun", "Mars", [{ type: "debilitated" }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
    const chartOk = buildSyntheticChart({ Mars: { dignity: "own" } });
    expect(checkRemedyCondition(chartOk, r).matched).toBe(false);
  });

  it("combust: matches only when the Antardasha lord is flagged combust", () => {
    const chart = buildSyntheticChart({ Mercury: { combust: true } });
    const r = row("Sun", "Mercury", [{ type: "combust" }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
    expect(checkRemedyCondition(buildSyntheticChart(), r).matched).toBe(false);
  });

  it("enemySign: matches only when dignity is exactly 'enemy'", () => {
    const chart = buildSyntheticChart({ Moon: { dignity: "enemy" } });
    const r = row("Sun", "Moon", [{ type: "enemySign" }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
    expect(checkRemedyCondition(buildSyntheticChart({ Moon: { dignity: "neutral" } }), r).matched).toBe(false);
  });

  it("houseFromAscendant: matches on the Antardasha lord's already-known whole-sign house", () => {
    const chart = buildSyntheticChart({ Saturn: { house: 6 } });
    const r = row("Sun", "Saturn", [{ type: "houseFromAscendant", houses: [6, 8, 12] }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
    expect(checkRemedyCondition(buildSyntheticChart({ Saturn: { house: 5 } }), r).matched).toBe(false);
  });

  it("houseFromMahadashaLord: counts houses from the MD lord's own sign, not Lagna -- the one new call site this engine needed", () => {
    // Sun in Aries, Moon in Scorpio -- Scorpio is the 8th sign from Aries.
    const chart = buildSyntheticChart({ Sun: { sign: "Aries" }, Moon: { sign: "Scorpio" } });
    const r = row("Sun", "Moon", [{ type: "houseFromMahadashaLord", houses: [6, 8, 12] }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
    expect(checkRemedyCondition(buildSyntheticChart({ Sun: { sign: "Aries" }, Moon: { sign: "Cancer" } }), r).matched).toBe(false);
  });

  it("marakaLord: matches only when the Antardasha lord itself rules house 2 or 7 from Lagna", () => {
    const chart = buildSyntheticChart(); // Venus lords house 2 and 7 in the synthetic houseLords
    const r = row("Sun", "Venus", [{ type: "marakaLord" }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
    const rOther = row("Sun", "Jupiter", [{ type: "marakaLord" }]);
    expect(checkRemedyCondition(chart, rOther).matched).toBe(false);
  });

  it("marakaLord is never true for Rahu/Ketu -- houseLords never names a node as a sign lord", () => {
    const chart = buildSyntheticChart();
    const r = row("Sun", "Rahu", [{ type: "marakaLord" }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(false);
  });

  it("lordOfHouses: generalizes marakaLord to an arbitrary, non-maraka house set", () => {
    const chart = buildSyntheticChart(); // Jupiter lords houses 9 and 12
    const r = row("Sun", "Jupiter", [{ type: "lordOfHouses", houses: [9, 12] }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
  });

  it("occupiesHouseFromAscendant: physical placement, distinct from lordship -- what Rahu/Ketu's 'be in the 2nd/7th' verses actually mean", () => {
    const chart = buildSyntheticChart({ Rahu: { house: 7 } });
    const r = row("Sun", "Rahu", [{ type: "occupiesHouseFromAscendant", houses: [2, 7] }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
  });

  it("aspectedByOrConjunctWith: matches on conjunction (same house)", () => {
    const chart = buildSyntheticChart({ Mercury: { house: 7 }, Saturn: { house: 7 } });
    const r = row("Sun", "Mercury", [{ type: "aspectedByOrConjunctWith", grahas: ["Saturn"] }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
  });

  it("aspectedByOrConjunctWith: matches on Saturn's real 7th-house aspect, not just conjunction", () => {
    // Saturn in house 2 aspects house 8 (2 + 7 - 1) via the universal 7th aspect.
    const chart = buildSyntheticChart({ Saturn: { house: 2 }, Mercury: { house: 8 } });
    const r = row("Sun", "Mercury", [{ type: "aspectedByOrConjunctWith", grahas: ["Saturn"] }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
  });

  it("aspectedByOrConjunctWithHouseLords: resolves to whichever graha currently lords the given houses in THIS chart", () => {
    // House 2's lord is Venus (synthetic houseLords); Venus conjunct Mercury (both house 6).
    const chart = buildSyntheticChart({ Mercury: { house: 6 }, Venus: { house: 6 } });
    const r = row("Sun", "Mercury", [{ type: "aspectedByOrConjunctWithHouseLords", houses: [2] }]);
    expect(checkRemedyCondition(chart, r).matched).toBe(true);
  });

  it("OR semantics: matched=true and evidence collected from every matched trigger, not just the first", () => {
    const chart = buildSyntheticChart({ Mars: { dignity: "debilitated", house: 6 } });
    const r = row("Sun", "Mars", [{ type: "debilitated" }, { type: "houseFromAscendant", houses: [6] }, { type: "combust" }]);
    const result = checkRemedyCondition(chart, r);
    expect(result.matched).toBe(true);
    expect(result.evidence.length).toBe(2); // debilitated + house match; combust did not match
  });

  it("no trigger matches: matched=false, evidence=[]", () => {
    const chart = buildSyntheticChart();
    const r = row("Sun", "Jupiter", [{ type: "debilitated" }, { type: "houseFromAscendant", houses: [6, 8, 12] }]);
    const result = checkRemedyCondition(chart, r);
    expect(result.matched).toBe(false);
    expect(result.evidence).toEqual([]);
  });
});

describe("DASHA_REMEDY_ROWS: data-integrity sweep", () => {
  it("covers all 9 Mahadashas, 77 of the 81 possible rows -- 4 deliberate omissions, not gaps", () => {
    const byMD = new Map<string, number>();
    for (const r of DASHA_REMEDY_ROWS) byMD.set(r.mahadashaLord, (byMD.get(r.mahadashaLord) ?? 0) + 1);
    expect(byMD.get("Sun")).toBe(9);
    expect(byMD.get("Moon")).toBe(8); // Mars-in-Moon: no remedy verse at all -- see dashaRemedyData.ts
    expect(byMD.get("Mars")).toBe(8); // Ketu-in-Mars: only a translator's own speculative guess, not verse text
    expect(byMD.get("Rahu")).toBe(9);
    expect(byMD.get("Jupiter")).toBe(9);
    expect(byMD.get("Saturn")).toBe(9);
    expect(byMD.get("Mercury")).toBe(9);
    expect(byMD.get("Ketu")).toBe(9);
    expect(byMD.get("Venus")).toBe(7); // Moon-in-Venus: no remedy verse; Mars-in-Venus: translator speculation only
    expect(byMD.size).toBe(9);
    expect(DASHA_REMEDY_ROWS.length).toBe(77);
  });

  it("no row uses marakaLord with a Rahu/Ketu Antardasha lord -- that trigger can never fire for a node (houseLords never names one a sign lord); real bug once found in Rahu/Ketu-in-Venus, fixed to occupiesHouseFromAscendant, guarded here against recurring elsewhere", () => {
    for (const r of DASHA_REMEDY_ROWS) {
      if (r.antardashaLord === "Rahu" || r.antardashaLord === "Ketu") {
        expect(r.triggers.some((t) => t.type === "marakaLord")).toBe(false);
      }
    }
  });

  it("Rahu-in-Venus and Ketu-in-Venus (Ch.60) actually fire via node occupancy, not just avoid the dead marakaLord trigger -- a positive check, not only the absence check above", () => {
    const rahuInVenus = DASHA_REMEDY_ROWS.find((r) => r.mahadashaLord === "Venus" && r.antardashaLord === "Rahu")!;
    const ketuInVenus = DASHA_REMEDY_ROWS.find((r) => r.mahadashaLord === "Venus" && r.antardashaLord === "Ketu")!;
    const chartRahuIn7th = buildSyntheticChart({ Rahu: { house: 7 } });
    const chartKetuIn2nd = buildSyntheticChart({ Ketu: { house: 2 } });
    expect(checkRemedyCondition(chartRahuIn7th, rahuInVenus).matched).toBe(true);
    expect(checkRemedyCondition(chartKetuIn2nd, ketuInVenus).matched).toBe(true);
  });

  it("every row has a non-empty citation and at least one trigger", () => {
    for (const r of DASHA_REMEDY_ROWS) {
      expect(r.citation.length).toBeGreaterThan(0);
      expect(r.triggers.length).toBeGreaterThan(0);
      expect(r.remedyText.length).toBeGreaterThan(0);
    }
  });

  it("no row's remedy text mentions a gemstone -- BPHS's own remedial framework is Japa/Dana/Yagna/Poojan (DECISIONS.md, 2026-08-02)", () => {
    const gemstoneWords = /gemstone|ruby|emerald|pearl setting|coral ring|blue sapphire|hessonite|cat's eye|yellow sapphire|diamond ring/i;
    for (const r of DASHA_REMEDY_ROWS) {
      expect(r.remedyText).not.toMatch(gemstoneWords);
    }
  });
});

describe("detectDashaRemedy: real golden chart, real dasha-period conditionality", () => {
  async function goldenChart() {
    return computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
  }

  it("SURFACES for the real current Antardasha (Mercury in Rahu Mahadasha, running now): Mercury genuinely lords this chart's 2nd house (maraka) AND sits in Saturn's 7th-house aspect", async () => {
    const { chart, dasha } = await goldenChart();
    // Confirm the real facts this test's expectation depends on, not just assert the outcome blind.
    expect(chart.houseLords[2]!.lord).toBe("Mercury");
    expect(chart.planets.Saturn.house).toBe(3);
    expect(chart.planets.Mercury.house).toBe(9); // Saturn's universal 7th aspect from house 3 lands on house 9

    const findings = detectDashaRemedy(chart, dasha); // real "now" -- today falls inside Rahu MD's Mercury Antardasha (2025-05-06 to 2027-11-23)
    expect(findings).toHaveLength(1);
    expect(findings[0]!.statement).toContain("Antardasha of Mercury within the Mahadasha of Rahu");
    expect(findings[0]!.statement).toContain("Vishnu Sahasranama");
    expect(findings[0]!.citation).toContain("Ch.55 v.36-39");
    expect(findings[0]!.domain).toEqual(["timing"]);
    expect(findings[0]!.polarity).toBe("neutral");
    // Framing requirement (DECISIONS.md, 2026-08-02): never state WHY it applies in reader-facing text.
    expect(findings[0]!.statement).not.toMatch(/evil|afflict|danger|maraka|premature death/i);
    // But the reasoning IS preserved as evidence, for provenance/audit.
    expect(findings[0]!.evidence.some((e) => e.path === "houseLords.2.lord")).toBe(true);
    expect(findings[0]!.evidence.some((e) => e.path === "planets.Saturn.house")).toBe(true);
  });

  it("STAYS SILENT for Ketu in Rahu Mahadasha: Ketu (house 5) meets none of this row's real conditions -- correct silence, not a gap", async () => {
    const { chart, dasha } = await goldenChart();
    expect(chart.planets.Ketu.house).toBe(5);
    const rahuMD = dasha.mahadashas.find((m) => m.lord === "Rahu")!;
    const ketuAD = computeAntardashas(rahuMD).find((a) => a.lord === "Ketu")!;
    const findings = detectDashaRemedy(chart, dasha, ketuAD.start);
    expect(findings).toEqual([]);
  });

  it("STAYS SILENT for the Sun in Rahu Mahadasha: Sun is real-chart exalted, not a maraka lord here, and not in the afflicted houses from Rahu's sign", async () => {
    const { chart, dasha } = await goldenChart();
    expect(chart.planets.Sun.dignity).toBe("exalted");
    const rahuMD = dasha.mahadashas.find((m) => m.lord === "Rahu")!;
    const sunAD = computeAntardashas(rahuMD).find((a) => a.lord === "Sun")!;
    const findings = detectDashaRemedy(chart, dasha, sunAD.start);
    expect(findings).toEqual([]);
  });

  it("SURFACES for Mars in its own Mahadasha (2010-2017): Mars (house 9, own sign, not maraka) is aspected by Saturn's real universal 7th aspect from house 3 -- the same aspect mechanism as the Rahu-Mercury case, now confirmed in a different Mahadasha", async () => {
    const { chart, dasha } = await goldenChart();
    expect(chart.planets.Mars.house).toBe(9);
    expect(chart.planets.Mars.dignity).toBe("own");
    expect(chart.planets.Saturn.house).toBe(3); // 3 + 7 - 1 = 9, Saturn's universal aspect lands on Mars's house
    const marsMD = dasha.mahadashas.find((m) => m.lord === "Mars")!;
    const marsAD = computeAntardashas(marsMD).find((a) => a.lord === "Mars")!;
    const findings = detectDashaRemedy(chart, dasha, marsAD.start);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.statement).toContain("Antardasha of Mars within the Mahadasha of Mars");
    expect(findings[0]!.citation).toContain("Ch.54 v.5-8");
    // Own-sign, non-maraka Mars still surfaces here for exactly one real reason -- Saturn's aspect -- not a blanket "period is running" trigger.
    expect(findings[0]!.evidence).toEqual([{ path: "planets.Saturn.house", value: 3 }]);
  });

  it("SURFACES for Saturn in Ketu Mahadasha (2087-2094) for two independent real causes: Saturn is this chart's own 7th-house (maraka) lord, AND sits in Mars's real universal 7th-house aspect (Mars, house 9, aspects house 3)", async () => {
    const { chart, dasha } = await goldenChart();
    expect(chart.houseLords[7]!.lord).toBe("Saturn");
    expect(chart.planets.Saturn.house).toBe(3);
    expect(chart.planets.Mars.house).toBe(9); // 9 + 7 - 1 = 15 -> wraps to house 3, where Saturn sits
    const ketuMD = dasha.mahadashas.find((m) => m.lord === "Ketu")!;
    const saturnAD = computeAntardashas(ketuMD).find((a) => a.lord === "Saturn")!;
    const findings = detectDashaRemedy(chart, dasha, saturnAD.start);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.statement).toContain("Antardasha of Saturn within the Mahadasha of Ketu");
    expect(findings[0]!.citation).toContain("Ch.59 v.67-68");
    expect(findings[0]!.evidence).toEqual(
      expect.arrayContaining([
        { path: "planets.Mars.house", value: 9 },
        { path: "houseLords.7.lord", value: "Saturn" },
      ])
    );
    expect(findings[0]!.evidence).toHaveLength(2);
  });

  it("STAYS SILENT for Jupiter in its own Mahadasha (2035-2051): Jupiter (house 4, a friendly, non-maraka, non-6/8/12 placement) meets none of this specific row's real conditions -- this row names no generic-malefic-aspect trigger at all, unlike most others", async () => {
    const { chart, dasha } = await goldenChart();
    expect(chart.planets.Jupiter.house).toBe(4);
    expect(chart.planets.Jupiter.dignity).toBe("friend");
    const jupiterMD = dasha.mahadashas.find((m) => m.lord === "Jupiter")!;
    const jupiterAD = computeAntardashas(jupiterMD).find((a) => a.lord === "Jupiter")!;
    const findings = detectDashaRemedy(chart, dasha, jupiterAD.start);
    expect(findings).toEqual([]);
  });

  it("STAYS SILENT for Venus in Mercury Mahadasha (2070-2087): Venus (own sign, house 10) is genuinely well-placed here too", async () => {
    const { chart, dasha } = await goldenChart();
    const mercuryMD = dasha.mahadashas.find((m) => m.lord === "Mercury")!;
    const venusAD = computeAntardashas(mercuryMD).find((a) => a.lord === "Venus")!;
    const findings = detectDashaRemedy(chart, dasha, venusAD.start);
    expect(findings).toEqual([]);
  });

  it("STAYS SILENT for Ketu in its own Mahadasha (2087-2094): Ketu (house 5) matches none of this row's conditions, including the two node-specific occupancy checks", async () => {
    const { chart, dasha } = await goldenChart();
    expect(chart.planets.Ketu.house).toBe(5);
    const ketuMD = dasha.mahadashas.find((m) => m.lord === "Ketu")!;
    const ketuAD = computeAntardashas(ketuMD).find((a) => a.lord === "Ketu")!;
    const findings = detectDashaRemedy(chart, dasha, ketuAD.start);
    expect(findings).toEqual([]);
  });

  it("STAYS SILENT for Venus in its own (birth) Mahadasha (1974-1994): own-sign Venus in house 10, unafflicted by any of this chart's real malefic placements", async () => {
    const { chart, dasha } = await goldenChart();
    const venusMD = dasha.mahadashas.find((m) => m.lord === "Venus")!;
    const venusAD = computeAntardashas(venusMD).find((a) => a.lord === "Venus")!;
    const findings = detectDashaRemedy(chart, dasha, venusAD.start);
    expect(findings).toEqual([]);
  });

  it("is deterministic: the same chart and asOfISO produce byte-identical output on repeat calls", async () => {
    const { chart, dasha } = await goldenChart();
    const first = detectDashaRemedy(chart, dasha);
    const second = detectDashaRemedy(chart, dasha);
    expect(first.map((f) => ({ ...f, id: "" }))).toEqual(second.map((f) => ({ ...f, id: "" })));
  });
});
