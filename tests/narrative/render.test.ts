import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { dignityFindings, houseLordFindings, combustionFindings } from "../../src/findings/index.js";
import { detectAllCoreYogas } from "../../src/rules/yogas.js";
import { renderDomainSection, dedupeBySharedFact, type DomainTemplate } from "../../src/narrative/render.js";
import type { Finding } from "../../src/types.js";
import { buildWeakCareerChart, buildMixedCareerChart, buildExhaustedCareerChart } from "./fixtures.js";
import careerTemplateJson from "../../templates/en/career.json" with { type: "json" };

const template = careerTemplateJson as DomainTemplate;

function weakChartFindings() {
  const chart = buildWeakCareerChart();
  return [
    ...dignityFindings(chart),
    ...houseLordFindings(chart),
    ...combustionFindings(chart),
    ...detectAllCoreYogas(chart),
  ];
}

function mixedFindings() {
  const chart = buildMixedCareerChart();
  return [
    ...dignityFindings(chart),
    ...houseLordFindings(chart),
    ...combustionFindings(chart),
    ...detectAllCoreYogas(chart),
  ];
}

async function goldenFindings() {
  const { findings } = await computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
  return findings;
}

function countOccurrences(text: string, substring: string): number {
  return text.split(substring).length - 1;
}

describe("renderDomainSection: golden chart (rich, all-supportive Career)", () => {
  // Domain tags were audited and corrected (see DECISIONS.md): Malavya Yoga
  // (Venus, own-sign, 10th house) no longer tags Career -- Venus isn't a
  // Career karaka (interpretation.md names only Sun/Saturn there); Malavya
  // now tags wealth+relationships, matching Venus's own dignity-finding
  // domain. Ruchaka (Mars) lost its domain tag entirely -- Mars isn't a
  // named karaka for any domain, same restraint findings/index.ts already
  // applied to Mars's dignity finding. Neither fact is LOST from Career:
  // Venus's 10th-house placement still surfaces via the (untouched) 10th
  // house-lord finding below.
  it("full depth quotes each underlying fact exactly once -- no semantic duplication across findings", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("career", findings, "full", template);

    // Saturn's exaltation used to appear three ways (dignity finding, house-lord
    // finding, Sasa yoga finding); Sun's twice (dignity finding, house-lord
    // finding). Each must now surface exactly once, via its richest source.
    expect(countOccurrences(section.text, "Saturn is exalted")).toBe(1);
    expect(countOccurrences(section.text, "Lagna lord")).toBe(1);
    expect(section.text).toContain(
      "Saturn is exalted in the 3rd house -- a strong placement, but not Sasa Yoga, since the 3rd house is not a Kendra."
    );
    expect(section.text).not.toContain("6th lord Saturn");
    // Sun's Lagna-lord-dignity finding is now itself absorbed by Raja Yoga's
    // Lagna-lord special case (yoga beats Lagna-lord-dignity beats house-lord,
    // richnessRank's existing chain -- Raja Yoga just occupies rank 0 too, per
    // "classification !== undefined"), so the OLD redundant plain restatement
    // never appears. "1st lord Sun" itself is no longer a safe substring to
    // ban outright: Raja Yoga's OWN, non-redundant statement about Sun's ROLE
    // as 1st-house lord (conjunct with 9th-lord Mars) legitimately uses this
    // exact phrase for a different fact than dignity -- ban the specific old
    // redundant sentence instead.
    expect(section.text).not.toContain("1st lord Sun is placed in Aries, in the 9th house, and is exalted.");
    // Malavya/Ruchaka no longer belong to Career at all (see domain-tag audit above).
    expect(section.text).not.toContain("Malavya");
    expect(section.text).not.toContain("Ruchaka");
  });

  /**
   * UPDATE 2026-08-01 (Piece B, DECISIONS.md): this chart's real Raja Yoga
   * combinations (5 EXACT findings -- the Lagna-lord Sun's dual Kendra/
   * Trikona role, plus 4 Kendra-lord/Trikona-lord conjunctions and mutual-
   * Kendra pairs) push Career well past the old "exactly 3, nothing left to
   * add" shape this test asserted before Raja Yoga existed. Overview's cap
   * (3) still holds -- Raja Yoga just now supplies the top strengths that
   * fill it, displacing what used to be there. Full now genuinely has more
   * to add beyond overview, verified against real output, not assumed.
   */
  it("full's text extends overview's with 4 more Raja Yoga findings and Saturn's Sasa (STRONG_NOT_TEXTBOOK) -- overview's 3-finding cap still holds, full has real additional content now", async () => {
    const findings = await goldenFindings();
    const overview = renderDomainSection("career", findings, "overview", template);
    const full = renderDomainSection("career", findings, "full", template);

    expect(overview.sourceFindingIds.length).toBe(3);
    expect(full.sourceFindingIds.length).toBe(7);
    expect(full.text.startsWith(overview.text)).toBe(true);
    expect(full.text).not.toBe(overview.text);
    expect(full.text).toContain("Beyond that, further support comes from:");
    expect(full.text).toContain(
      "Raja Yoga: 7th lord Saturn and 1st lord Sun are in mutual Kendra positions from each other, in the 3rd and 9th houses."
    );
    expect(full.text).toContain(
      "Raja Yoga: 7th lord Saturn and 9th lord Mars are in mutual Kendra positions from each other, in the 3rd and 9th houses."
    );
    expect(full.text).toContain(
      "Raja Yoga: 10th lord Venus and 5th lord Jupiter are in mutual Kendra positions from each other, in the 10th and 4th houses."
    );
    expect(full.text).toContain(
      "Saturn is exalted in the 3rd house -- a strong placement, but not Sasa Yoga, since the 3rd house is not a Kendra."
    );
  });

  it("overview cites the Lagna-lord Sun (via Raja Yoga), the 10th-lord Venus, and the Sun+Mars Raja Yoga conjunction", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("career", findings, "overview", template);
    // Sun's OWN plain Lagna-lord-dignity finding no longer surfaces standalone
    // -- Raja Yoga's Lagna-lord special case (strength 0.85, classification
    // EXACT) now absorbs it (same dignity evidence, higher rank), and states
    // the same underlying fact (Sun exalted, Lagna lord) with more content.
    expect(section.text).toContain(
      "Raja Yoga: the Lagna lord Sun -- simultaneously Kendra and Trikona lord -- is exalted in Aries."
    );
    expect(section.text).not.toContain("Sun is exalted in Aries, in the 9th house, and is also the Lagna lord.");
    expect(section.text).toContain(
      "10th lord Venus is placed in Taurus, in the 10th house -- its own house, and is in its own sign."
    );
    expect(section.text).toContain("Raja Yoga: 1st lord Sun and 9th lord Mars occupy the same (9th) house together.");
    // Sasa's STRONG_NOT_TEXTBOOK finding (strength 0.6) no longer makes the
    // overview cap now that four real Raja Yoga findings (0.8-0.85) outrank
    // it -- still present at full depth (see the "full's text extends..." test).
    expect(section.text).not.toContain("Sasa Yoga");
  });

  it("essence depth contains no house numbers or jargon", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("career", findings, "essence", template);
    expect(section.text).not.toMatch(/house\s*\d/i);
    expect(section.text).toBe("This chart shows strong natural capability in career and public life.");
  });

  it("classify-don't-flatten: Sasa's STRONG_NOT_TEXTBOOK-specific phrasing survives, not flattened into a plain dignity statement", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("career", findings, "full", template);
    expect(section.text).toContain("a strong placement, but not Sasa Yoga, since the 3rd house is not a Kendra");
  });
});

/**
 * UPDATE 2026-08-01 (Piece B, DECISIONS.md): buildWeakCareerChart()'s own
 * module doc (fixtures.ts) originally claimed "Career ends up with zero
 * supportive findings" -- true for Mahapurusha yogas specifically, but Raja
 * Yoga doesn't care about dignity at all, only which houses Kendra/Trikona
 * lords occupy relative to each other. This exact chart's Aries Lagna +
 * Sun-debilitated(house 7)+Saturn-debilitated(house 1) combination
 * structurally produces two real Raja Yoga EXACT hits (Moon+Jupiter mutual
 * Kendra; Saturn+Sun mutual Kendra) that have nothing to do with either
 * planet's own weak dignity -- a genuine, checked structural consequence of
 * adding Raja Yoga, not a bug, and not avoidable without changing which
 * houses the fixture's already-load-bearing debilitated planets sit in.
 * Tier is now "mixed," not "challenging" -- this fixture no longer exercises
 * a purely-challenging Career path (buildMixedCareerChart() already covers
 * "mixed" from a different angle); a fixture for purely-challenging Career
 * specifically, if still wanted, needs a non-Aries Lagna to avoid this
 * structural coincidence -- flagged in BACKLOG.md as a real, open gap, not
 * silently absorbed.
 */
describe("renderDomainSection: hand-built weak Career fixture (now genuinely 'mixed' once Raja Yoga is considered, not 'challenging')", () => {
  it("full depth renders the 'mixed' tier -- 2 real Raja Yoga EXACT findings alongside the 3 pre-existing challenging ones", () => {
    const findings = weakChartFindings();
    const section = renderDomainSection("career", findings, "full", template);

    expect(section.text).toContain("Career shows a genuine mix here: real strengths sit alongside real friction points.");
    expect(section.text).toContain(
      "Raja Yoga: 4th lord Moon and 9th lord Jupiter are in mutual Kendra positions from each other, in the 9th and 3rd houses."
    );
    expect(section.text).toContain(
      "Raja Yoga: 10th lord Saturn and 5th lord Sun are in mutual Kendra positions from each other, in the 1st and 7th houses."
    );
    // Saturn's debilitation (its OWN dignity/house-lord fact) still appears
    // exactly once, via the richer house-lord framing -- distinct from Raja
    // Yoga's separate statement about Saturn's ROLE as 10th-lord conjunct/
    // mutual-Kendra with Sun, which legitimately mentions "Saturn" again for
    // a different reason (not a dedup failure -- Raja Yoga's evidence never
    // cites planets.Saturn.dignity, so it never competes in that cluster).
    expect(countOccurrences(section.text, "debilitated")).toBe(3);
    expect(countOccurrences(section.text, "Saturn")).toBe(2);
    expect(section.text).toContain("10th lord Saturn is placed in Aries, in the 1st house, and is debilitated.");
    expect(section.text).not.toContain("Saturn is debilitated in Aries");
  });

  it("cites Sun's debilitation, both house-lord debilitations, and closes with the non-fatalism note", () => {
    const findings = weakChartFindings();
    const section = renderDomainSection("career", findings, "full", template);
    expect(section.text).toContain("Sun is debilitated in Libra, in the 7th house.");
    expect(section.text).toContain("1st lord Mars is placed in Cancer, in the 4th house, and is debilitated.");
    expect(section.text).toContain(
      "As with any placement, this describes a tendency and a capacity within the chart, not a fixed outcome -- how it plays out depends on the choices made within it."
    );
  });

  it("does not use alarming/fatalistic language anywhere in the template framing", () => {
    const allTemplateText = JSON.stringify(template).toLowerCase();
    const forbidden = ["doom", "curse", "disaster", "catastroph", "death", "danger", "fear", "tragic", "ruin", "unavoidable"];
    for (const word of forbidden) {
      expect(allTemplateText).not.toContain(word);
    }
  });

  it("does not pad with zero-strength ABSENT yoga findings", () => {
    const findings = weakChartFindings();
    const careerFindings = findings.filter((f) => f.domain.includes("career"));
    // Only Sasa (Saturn, GRAHA_DOMAINS-mapped to career) is career-tagged among the
    // Mahapurusha set post-audit -- Ruchaka/Bhadra/Hamsa/Malavya carry no Career tag
    // at all now, so they don't even reach this domain-filtered list, ABSENT or not.
    // 8 as of 2026-08-01: the original 6 (Sun/Saturn dignity + 3 house-lord +
    // Sasa ABSENT) plus 2 real Raja Yoga EXACT findings (Moon+Jupiter,
    // Saturn+Sun mutual Kendra -- see this describe block's own doc above).
    expect(careerFindings).toHaveLength(8);
    const section = renderDomainSection("career", findings, "full", template);
    expect(section.text).not.toContain("Sasa Yoga: not present");
    expect(section.sourceFindingIds.length).toBeLessThan(careerFindings.length);
  });

  it("essence depth uses the mixed-tier plain-language phrase, no house numbers", () => {
    const findings = weakChartFindings();
    const section = renderDomainSection("career", findings, "essence", template);
    expect(section.text).toBe(
      "Career here combines real strength with real friction -- capability paired with placements that ask for extra effort."
    );
    expect(section.text).not.toMatch(/house\s*\d/i);
  });
});

describe("renderDomainSection: hand-built mixed fixture (real supportive AND real challenging together)", () => {
  it("full depth renders the 'mixed' tier, not 'strong' or 'challenging'", () => {
    const section = renderDomainSection("career", mixedFindings(), "full", template);
    expect(section.text).toContain("Career shows a genuine mix here");
    expect(section.text).not.toContain("Career stands out as one of this chart's clearer strengths");
    expect(section.text).not.toContain("Career carries real friction in this chart");
  });

  it("cites BOTH the supportive finding AND the challenging findings -- neither polarity is dropped", () => {
    const section = renderDomainSection("career", mixedFindings(), "full", template);
    expect(section.text).toContain("Sun is exalted in Libra, in the 7th house.");
    expect(section.text).toContain("1st lord Mars is placed in Cancer, in the 4th house, and is debilitated.");
    expect(section.text).toContain("10th lord Saturn is placed in Aries, in the 1st house, and is debilitated.");
  });

  it("still closes with the non-fatalism note, since real challenging content is present", () => {
    const section = renderDomainSection("career", mixedFindings(), "full", template);
    expect(section.text).toContain(
      "As with any placement, this describes a tendency and a capacity within the chart, not a fixed outcome -- how it plays out depends on the choices made within it."
    );
  });

  it("essence depth uses the mixed-tier plain-language phrase, no house numbers", () => {
    const section = renderDomainSection("career", mixedFindings(), "essence", template);
    expect(section.text).toBe(
      "Career here combines real strength with real friction -- capability paired with placements that ask for extra effort."
    );
    expect(section.text).not.toMatch(/house\s*\d/i);
  });
});

describe("renderDomainSection: full depth when overview already covers everything", () => {
  function exhaustedFindings() {
    const chart = buildExhaustedCareerChart();
    return [
      ...dignityFindings(chart),
      ...houseLordFindings(chart),
      ...combustionFindings(chart),
      ...detectAllCoreYogas(chart),
    ];
  }

  it("produces exactly 3 deduped supportive findings, all within the overview cap", () => {
    const findings = exhaustedFindings();
    const overview = renderDomainSection("career", findings, "overview", template);
    expect(overview.sourceFindingIds).toHaveLength(3);
  });

  it("full's text is byte-identical to overview's -- no dangling continuation lead-in, nothing after it", () => {
    const findings = exhaustedFindings();
    const overview = renderDomainSection("career", findings, "overview", template);
    const full = renderDomainSection("career", findings, "full", template);

    expect(full.text).toBe(overview.text);
    expect(full.sourceFindingIds).toEqual(overview.sourceFindingIds);
    expect(full.text).not.toContain("Beyond that");
    expect(full.text).not.toContain("One more placement");
    expect(full.text).not.toContain("Additional context");
  });
});

describe("dedupeBySharedFact: explicit priority-chain test (real charts have only produced 2-/3-way collisions incidentally)", () => {
  const sharedEvidence = [{ path: "planets.Mars.dignity", value: "exalted" }];

  function fake(id: string, statement: string, extra: Partial<Finding> = {}): Finding {
    return {
      id,
      domain: ["career"],
      statement,
      evidence: sharedEvidence,
      strength: 0.5,
      polarity: "supportive",
      ...extra,
    };
  }

  it("a genuine 4-way collision resolves to the yoga finding, regardless of input order or strength", () => {
    const yoga = fake("yoga-fake-1", "Yoga statement.", { classification: "EXACT", strength: 0.5 });
    // Deliberately given a HIGHER strength than the yoga finding, to prove rank -- not strength -- decides.
    const lagnaLordDignity = fake("dignity-fake-2", "Mars is exalted, and is also the Lagna lord.", { strength: 0.9 });
    const houseLord = fake("house-lord-fake-3", "1st lord Mars is exalted.", { strength: 0.5 });
    const plain = fake("combustion-fake-4", "Some other Mars statement.", { strength: 0.5 });

    // Shuffled input order -- the winner must not depend on which came first.
    const result = dedupeBySharedFact([plain, lagnaLordDignity, houseLord, yoga]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("yoga-fake-1");
  });

  it("without a yoga finding, the Lagna-lord-flagging dignity finding wins over a house-lord finding", () => {
    const lagnaLordDignity = fake("dignity-fake-2", "Mars is exalted, and is also the Lagna lord.", { strength: 0.5 });
    const houseLord = fake("house-lord-fake-3", "1st lord Mars is exalted.", { strength: 0.9 }); // higher strength, still loses

    const result = dedupeBySharedFact([houseLord, lagnaLordDignity]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("dignity-fake-2");
  });

  it("without a yoga or Lagna-lord finding, the house-lord finding wins over a plain finding", () => {
    const houseLord = fake("house-lord-fake-3", "1st lord Mars is exalted.", { strength: 0.5 });
    const plain = fake("combustion-fake-4", "Some other Mars statement.", { strength: 0.9 }); // higher strength, still loses

    const result = dedupeBySharedFact([plain, houseLord]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("house-lord-fake-3");
  });

  it("two house-lord findings for DIFFERENT governed houses (same planet, same dignity) BOTH survive -- e.g. Mercury as both 2nd and 11th lord", () => {
    const secondLord = fake("house-lord-2-fake-1", "2nd lord Mars is exalted.", {
      evidence: [...sharedEvidence, { path: "houseLords.2.lord", value: "Mars" }],
    });
    const eleventhLord = fake("house-lord-11-fake-2", "11th lord Mars is exalted.", {
      evidence: [...sharedEvidence, { path: "houseLords.11.lord", value: "Mars" }],
      strength: 0.9, // higher strength, but must NOT cause the other to be dropped -- they're peers, not rivals
    });

    const result = dedupeBySharedFact([secondLord, eleventhLord]);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id).sort()).toEqual(["house-lord-11-fake-2", "house-lord-2-fake-1"]);
  });

  it("a yoga finding still absorbs MULTIPLE house-lord siblings for different governed houses, not just one -- the yoga/Lagna-lord precedent generalizes", () => {
    const yoga = fake("yoga-fake-1", "Yoga statement.", { classification: "EXACT" });
    const secondLord = fake("house-lord-2-fake-2", "2nd lord Mars is exalted.", {
      evidence: [...sharedEvidence, { path: "houseLords.2.lord", value: "Mars" }],
    });
    const eleventhLord = fake("house-lord-11-fake-3", "11th lord Mars is exalted.", {
      evidence: [...sharedEvidence, { path: "houseLords.11.lord", value: "Mars" }],
    });

    const result = dedupeBySharedFact([secondLord, eleventhLord, yoga]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("yoga-fake-1");
  });

  it("findings with no shared dignity evidence never collide -- each passes through unchanged", () => {
    const a = fake("a", "Statement A.", { evidence: [{ path: "planets.Sun.dignity", value: "exalted" }] });
    const b = fake("b", "Statement B.", { evidence: [{ path: "planets.Venus.dignity", value: "own" }] });
    const result = dedupeBySharedFact([a, b]);
    expect(result).toHaveLength(2);
  });

  it("a bodyPartFindings() finding survives even when a richer Lagna-lord-dignity finding shares its exact dignity evidence -- real bug, found and fixed 2026-08-01", () => {
    // Real defect, not contrived: bodyPartFindings() (findings/index.ts) cites
    // the SAME planets.X.dignity fact a Lagna-lord dignity finding does, but
    // says something genuinely different with it (which body system, not
    // domain/Lagna-lord role). Before the fix, dignityEvidenceKey() clustered
    // them together and richnessRank() (rank 1, "Lagna lord" in the text)
    // silently dropped the body-part finding -- verified against the real
    // golden chart (Sun's and Saturn's body-part findings were missing from
    // rendered Health text) before this test was written.
    const lagnaLordDignity = fake("dignity-fake-1", "Mars is exalted, and is also the Lagna lord.", { domain: ["health"] });
    const bodyPart = fake("body-part-fake-2", "Mars is exalted in Aries -- classically associated with blood.", { domain: ["health"] });

    const result = dedupeBySharedFact([lagnaLordDignity, bodyPart]);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id).sort()).toEqual(["body-part-fake-2", "dignity-fake-1"]);
  });
});

describe("renderDomainSection: evidence or silence (mechanical proof, not just a claim)", () => {
  it("full-depth output is composed ENTIRELY of template framing + real finding statements -- nothing else", () => {
    const findings = weakChartFindings();
    const section = renderDomainSection("career", findings, "full", template);

    let remainder = section.text;
    const allTemplateFragments = [
      ...template.overviewIntro.strong,
      ...template.overviewIntro.mixed,
      ...template.overviewIntro.challenging,
      ...template.overviewIntro.thin,
      ...template.convergenceSupportive,
      ...template.convergenceChallenging,
      ...template.singleSupportive,
      ...template.singleChallenging,
      ...template.moreSupportive,
      ...template.oneMoreSupportive,
      ...template.moreChallenging,
      ...template.oneMoreChallenging,
      ...template.additionalContext,
      ...template.closingNote,
    ];
    for (const frag of allTemplateFragments) remainder = remainder.split(frag).join("");
    for (const f of findings) remainder = remainder.split(f.statement).join("");

    expect(remainder.trim()).toBe("");
  });
});

describe("renderDomainSection: thin domain (no findings at all)", () => {
  it("says so plainly and briefly, at every depth", () => {
    const essence = renderDomainSection("career", [], "essence", template);
    const overview = renderDomainSection("career", [], "overview", template);
    const full = renderDomainSection("career", [], "full", template);

    expect(essence.text).toBe("No single placement dominates the career picture in this chart.");
    expect(overview.text).toContain("Career does not carry a strong signature in this chart");
    expect(full.text).toBe(overview.text);
    expect(essence.sourceFindingIds).toEqual([]);
  });
});

describe("renderDomainSection: determinism", () => {
  it("renders identical text for identical input, called twice", () => {
    const findings = weakChartFindings();
    const first = renderDomainSection("career", findings, "full", template);
    const second = renderDomainSection("career", findings, "full", template);
    expect(first.text).toBe(second.text);
  });
});
