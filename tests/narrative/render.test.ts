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
    expect(section.text).not.toContain("1st lord Sun");
    // Malavya/Ruchaka no longer belong to Career at all (see domain-tag audit above).
    expect(section.text).not.toContain("Malavya");
    expect(section.text).not.toContain("Ruchaka");
  });

  it("full's text is identical to overview's -- exactly 3 deduped supportive findings, all within the cap, nothing left to add", async () => {
    const findings = await goldenFindings();
    const overview = renderDomainSection("career", findings, "overview", template);
    const full = renderDomainSection("career", findings, "full", template);

    // No challenging findings, so no closing note either -- these should be
    // completely identical, not just prefix-related.
    expect(full.text).toBe(overview.text);
    expect(overview.sourceFindingIds.length).toBe(3);
    expect(full.sourceFindingIds.length).toBe(3);
    expect(full.text).not.toContain("Beyond that");
    expect(full.text).not.toContain("One more placement");
  });

  it("overview cites the Lagna-lord Sun, the 10th-lord Venus, and Saturn's Sasa (STRONG_NOT_TEXTBOOK)", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("career", findings, "overview", template);
    expect(section.text).toContain("Sun is exalted in Aries, in the 9th house, and is also the Lagna lord.");
    expect(section.text).toContain(
      "10th lord Venus is placed in Taurus, in the 10th house -- its own house, and is in its own sign."
    );
    expect(section.text).toContain(
      "Saturn is exalted in the 3rd house -- a strong placement, but not Sasa Yoga, since the 3rd house is not a Kendra."
    );
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

describe("renderDomainSection: hand-built weak/challenging Career fixture", () => {
  it("full depth renders the 'challenging' tier and cites each underlying fact exactly once", () => {
    const findings = weakChartFindings();
    const section = renderDomainSection("career", findings, "full", template);

    expect(section.text).toContain("Career carries real friction in this chart");
    // Saturn's debilitation used to appear twice (standalone dignity finding +
    // 10th-lord finding); now once, via the richer house-lord framing. "debilitated"
    // itself legitimately appears 3 times -- Sun, Mars, and Saturn are three
    // genuinely different planets, not a duplicated fact.
    expect(countOccurrences(section.text, "debilitated")).toBe(3);
    expect(countOccurrences(section.text, "Saturn")).toBe(1);
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
    expect(careerFindings).toHaveLength(6); // Sun/Saturn dignity + 3 house-lord + Sasa (ABSENT)
    const section = renderDomainSection("career", findings, "full", template);
    expect(section.text).not.toContain("Sasa Yoga: not present");
    expect(section.sourceFindingIds.length).toBeLessThan(careerFindings.length);
  });

  it("essence depth uses the challenging-tier plain-language phrase, no house numbers", () => {
    const findings = weakChartFindings();
    const section = renderDomainSection("career", findings, "essence", template);
    expect(section.text).toBe("Career is an area this chart marks as needing sustained, deliberate effort rather than coming easily.");
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

  it("findings with no shared dignity evidence never collide -- each passes through unchanged", () => {
    const a = fake("a", "Statement A.", { evidence: [{ path: "planets.Sun.dignity", value: "exalted" }] });
    const b = fake("b", "Statement B.", { evidence: [{ path: "planets.Venus.dignity", value: "own" }] });
    const result = dedupeBySharedFact([a, b]);
    expect(result).toHaveLength(2);
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
