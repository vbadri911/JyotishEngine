import { describe, it, expect } from "vitest";
import { computeChart } from "../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../src/types.js";
import type { ChartData, PlanetPosition, Graha, Finding, SignName } from "../src/types.js";
import {
  detectMahapurushaYogas,
  detectGajakesariYoga,
  detectKemadrumaYoga,
  detectMangalDosha,
} from "../src/rules/yogas.js";
import { dignityFindings, houseLordFindings, combustionFindings } from "../src/findings/index.js";
import { lagnaTemperamentNote, lagnaLordNote } from "../src/narrative/personality.js";
import {
  buildWeakCareerChart,
  buildMixedCareerChart,
  buildExhaustedCareerChart,
  buildWeakRelationshipsChart,
} from "./narrative/fixtures.js";

/**
 * Real content-accuracy bug (not caught by any prior test): Mangal Dosha's
 * EXACT statement contained "see references/yogas.md before presenting this
 * as a single universal verdict" -- an instruction written for whoever builds
 * the interpretation layer, quoted VERBATIM into a real end-user's report
 * (this project's render.ts never regenerates a fact, only quotes
 * Finding.statement directly -- see DECISIONS.md). Distinct from the earlier
 * fluency pass (which fixed awkward phrasing of otherwise-valid content):
 * this is about content that was never meant to be reader-facing at all.
 * Swept every finding-generating function's statement across enough real and
 * hand-built charts to exercise every classification branch of every
 * yoga/dosha detector, not just the one branch that happened to expose the
 * original bug (Mangal Dosha EXACT).
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

const BASE_CHART_FIELDS = {
  input: { date: "1990-01-01", time: "12:00", placeText: "Nowhere", precision: "exact_from_record" as const },
  location: { placeText: "Nowhere", latitude: 0, longitude: 0, ianaZone: "UTC", utcOffsetMinutesAtBirth: 0 },
  settings: {
    ayanamsa: "lahiri" as const,
    nodeType: "mean" as const,
    houseSystem: "whole_sign" as const,
    nodesHaveSpecialAspects: false,
    chartFormat: "south_indian" as const,
  },
  julianDayUT: 0,
  ascendant: { siderealLongitude: 0, sign: "Aries" as const, degreeInSign: 0, nakshatra: 1, pada: 1 },
  confidenceFlags: [],
};

// Aries Lagna: 1=Mars, 2=Venus, 3=Mercury, 4=Moon, 5=Sun, 6=Mercury, 7=Venus,
// 8=Mars, 9=Jupiter, 10=Saturn, 11=Saturn, 12=Jupiter. houseLordFindings()
// needs all nine domain-mapped houses populated or it throws on lookup.
function allNeutralChart(): ChartData {
  return {
    ...BASE_CHART_FIELDS,
    planets: {
      Sun: planet({ graha: "Sun", sign: "Leo", house: 5 }),
      Moon: planet({ graha: "Moon", sign: "Aries", house: 2 }),
      Mars: planet({ graha: "Mars", sign: "Gemini", house: 3 }), // NOT a Mangal Dosha house -- keeps this chart genuinely ABSENT
      Mercury: planet({ graha: "Mercury", sign: "Cancer", house: 6 }),
      Jupiter: planet({ graha: "Jupiter", sign: "Leo", house: 9 }),
      Venus: planet({ graha: "Venus", sign: "Virgo", house: 2 }),
      Saturn: planet({ graha: "Saturn", sign: "Libra", house: 10 }),
      Rahu: planet({ graha: "Rahu", sign: "Pisces", house: 12 }),
      Ketu: planet({ graha: "Ketu", sign: "Virgo", house: 6 }),
    },
    houseLords: {
      1: { lord: "Mars", placedInHouse: 3 },
      2: { lord: "Venus", placedInHouse: 2 },
      3: { lord: "Mercury", placedInHouse: 6 },
      4: { lord: "Moon", placedInHouse: 2 },
      5: { lord: "Sun", placedInHouse: 5 },
      6: { lord: "Mercury", placedInHouse: 6 },
      7: { lord: "Venus", placedInHouse: 2 },
      8: { lord: "Mars", placedInHouse: 3 },
      9: { lord: "Jupiter", placedInHouse: 9 },
      10: { lord: "Saturn", placedInHouse: 10 },
      11: { lord: "Saturn", placedInHouse: 10 },
      12: { lord: "Jupiter", placedInHouse: 9 },
    },
  };
}

/** Gajakesari EXACT (Kendra-from-Moon) with Jupiter afflicted (debilitated) -- the
 *  "though Jupiter is weakened here..." branch, not exercised by any existing fixture. */
function gajakesariAfflictedChart(): ChartData {
  const chart = allNeutralChart();
  return {
    ...chart,
    planets: { ...chart.planets, Jupiter: planet({ graha: "Jupiter", sign: "Cancer", house: 9, dignity: "debilitated" }) },
  };
}

/** Kemadruma EXACT (present, NOT cancelled -- Moon outside a Kendra from Lagna,
 *  no planet in 2nd/12th from Moon) -- not exercised by any existing fixture. */
function kemadrumaExactChart(): ChartData {
  // Moon in Aries (house 2, not a Kendra). 2nd-from-Moon = Taurus, 12th-from-Moon = Pisces.
  // No other planet (excl. Moon/Rahu/Ketu/Sun) is in either sign below.
  return allNeutralChart(); // Mars=Gemini, Mercury=Cancer, Jupiter=Leo, Venus=Virgo, Saturn=Libra -- none in Taurus/Pisces
}

/** Mangal Dosha PRESENT_CANCELLED (dosha house, but Mars own/exalted there) --
 *  not exercised by any existing fixture. */
function mangalDoshaCancelledChart(): ChartData {
  const chart = allNeutralChart();
  return {
    ...chart,
    planets: { ...chart.planets, Mars: planet({ graha: "Mars", sign: "Aries", house: 1, dignity: "own" }) },
  };
}

function allYogaFindings(chart: ChartData): Finding[] {
  return [
    ...detectMahapurushaYogas(chart),
    detectGajakesariYoga(chart),
    detectKemadrumaYoga(chart),
    detectMangalDosha(chart),
  ];
}

function allFindingsFor(chart: ChartData): Finding[] {
  return [
    ...allYogaFindings(chart),
    ...dignityFindings(chart),
    ...houseLordFindings(chart),
    ...combustionFindings(chart),
  ];
}

// Forbidden per the bug class found: internal file/path references, "see
// references/..." pointers, "Note:"-prefixed asides, and process language that
// addresses whoever audits/builds the system rather than the person reading
// about their own chart.
const DEVELOPER_LANGUAGE_PATTERNS: RegExp[] = [
  /see references\//i,
  /\.md\b/i,
  /\bnote:\s/i,
  /\bconsider checking\b/i,
  /\bbefore (presenting|treating) this as\b/i,
  /\buniversal verdict\b/i,
];

// Added when Personality v1 was built (DECISIONS.md, 2026-07-30): a real
// classical source (Phaladeepika Ch. 9) was researched and deliberately
// rejected specifically because it was physiognomy-heavy with fear-coded/
// moralizing content. This sweep proves that rejection reasoning actually
// holds in this project's OWN generated output, not just in the source that
// was declined -- the same principle-5 ("Never trade on fear") discipline
// applied to code, not just to source selection.
const FEAR_CODED_OR_PHYSIOGNOMY_PATTERNS: RegExp[] = [
  /\beyes\b/i,
  /\bthighs\b/i,
  /\bfalsehood/i,
  /\bsinful\b/i,
  /\bkilling\b/i,
  /\bdanger\b/i,
  /\bdoom\b/i,
  /\bcurse/i,
  /\bwarn(ing)?\b/i,
];

/** Generic sweep over any reader-facing statement strings, not just `Finding`
 *  objects -- Personality's notes (`narrative/personality.ts`) deliberately
 *  don't produce `Finding`s at all (see that module's doc), so a
 *  `Finding[]`-only helper couldn't have covered them. */
function assertNoForbiddenLanguage(statements: string[], patterns: RegExp[]) {
  for (const statement of statements) {
    for (const pattern of patterns) {
      expect(statement, `"${statement}"`).not.toMatch(pattern);
    }
  }
}

function assertNoDeveloperLanguage(findings: Finding[]) {
  assertNoForbiddenLanguage(findings.map((f) => f.statement), DEVELOPER_LANGUAGE_PATTERNS);
}

// Every rasi and its real lord, per `data/signs.json` (Rahu/Ketu never lord a
// rasi, so `LORD_EMPHASIS`'s entries for them in `narrative/personality.ts`
// are unreachable via this path, not a gap). Covers every element/modality/
// lord combination `lagnaTemperamentNote()`'s lookup tables can actually
// produce, not just the golden chart's one Leo Lagna case.
const SIGN_LORDS: [SignName, Graha][] = [
  ["Aries", "Mars"], ["Taurus", "Venus"], ["Gemini", "Mercury"], ["Cancer", "Moon"],
  ["Leo", "Sun"], ["Virgo", "Mercury"], ["Libra", "Venus"], ["Scorpio", "Mars"],
  ["Sagittarius", "Jupiter"], ["Capricorn", "Saturn"], ["Aquarius", "Saturn"], ["Pisces", "Jupiter"],
];

function chartWithLagna(sign: SignName, lagnaLord: Graha, lagnaLordDignity: PlanetPosition["dignity"]): ChartData {
  const chart = allNeutralChart();
  return {
    ...chart,
    ascendant: { ...chart.ascendant, sign },
    houseLords: { ...chart.houseLords, 1: { lord: lagnaLord, placedInHouse: chart.planets[lagnaLord]!.house } },
    planets: { ...chart.planets, [lagnaLord]: planet({ graha: lagnaLord, ...chart.planets[lagnaLord]!, dignity: lagnaLordDignity }) },
  };
}

describe("Finding statement sweep: no developer/process language leaks into reader-facing text", () => {
  it("real golden chart -- every finding-generating function's output", async () => {
    const { findings } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    assertNoDeveloperLanguage(findings);
  });

  it("hand-built fixtures already used for narrative testing (weak/mixed/exhausted Career, weak Relationships)", () => {
    for (const chart of [
      buildWeakCareerChart(),
      buildMixedCareerChart(),
      buildExhaustedCareerChart(),
      buildWeakRelationshipsChart(),
    ]) {
      assertNoDeveloperLanguage(allFindingsFor(chart));
    }
  });

  it("Gajakesari EXACT with Jupiter afflicted (debilitated/combust) -- the one branch not otherwise exercised", () => {
    const findings = allYogaFindings(gajakesariAfflictedChart());
    const gajakesari = findings.find((f) => f.id.startsWith("yoga-gajakesari"))!;
    expect(gajakesari.classification).toBe("EXACT");
    expect(gajakesari.statement).toContain("weakened here");
    assertNoDeveloperLanguage(findings);
  });

  it("Kemadruma EXACT (present, not cancelled) -- the one branch not otherwise exercised", () => {
    const findings = allYogaFindings(kemadrumaExactChart());
    const kemadruma = findings.find((f) => f.id.startsWith("yoga-kemadruma"))!;
    expect(kemadruma.classification).toBe("EXACT");
    assertNoDeveloperLanguage(findings);
  });

  it("Mangal Dosha PRESENT_CANCELLED -- the one branch not otherwise exercised", () => {
    const findings = allYogaFindings(mangalDoshaCancelledChart());
    const mangal = findings.find((f) => f.id.startsWith("dosha-mangal"))!;
    expect(mangal.classification).toBe("PRESENT_CANCELLED");
    assertNoDeveloperLanguage(findings);
  });

  it("all-neutral chart (every Mahapurusha ABSENT, Gajakesari/Kemadruma/Mangal Dosha ABSENT)", () => {
    assertNoDeveloperLanguage(allFindingsFor(allNeutralChart()));
  });
});

describe("Personality note sweep: no Phaladeepika-style physiognomy or fear-coded language", () => {
  it("real golden chart -- Lagna temperament + Lagna-lord notes", async () => {
    const { chart } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    assertNoForbiddenLanguage(
      [lagnaTemperamentNote(chart).statement, lagnaLordNote(chart).statement],
      FEAR_CODED_OR_PHYSIOGNOMY_PATTERNS
    );
  });

  it("every real Lagna sign/lord combination, at every dignity -- not just the golden chart's one Leo Lagna case", () => {
    const dignities: PlanetPosition["dignity"][] = ["exalted", "own", "moolatrikona", "friend", "neutral", "enemy", "debilitated"];
    for (const [sign, lord] of SIGN_LORDS) {
      for (const dignity of dignities) {
        const chart = chartWithLagna(sign, lord, dignity);
        assertNoForbiddenLanguage(
          [lagnaTemperamentNote(chart).statement, lagnaLordNote(chart).statement],
          FEAR_CODED_OR_PHYSIOGNOMY_PATTERNS
        );
      }
    }
  });
});
