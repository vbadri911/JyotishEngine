import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { dignityFindings, houseLordFindings, combustionFindings } from "../../src/findings/index.js";
import { detectAllCoreYogas } from "../../src/rules/yogas.js";
import { renderDomainSection, type DomainTemplate } from "../../src/narrative/render.js";
import { buildWeakRelationshipsChart } from "./fixtures.js";
import relationshipsTemplateJson from "../../templates/en/relationships.json" with { type: "json" };

const template = relationshipsTemplateJson as DomainTemplate;

async function goldenFindings() {
  const { findings } = await computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
  return findings;
}

function weakRelationshipsFindings() {
  const chart = buildWeakRelationshipsChart();
  return [
    ...dignityFindings(chart),
    ...houseLordFindings(chart),
    ...combustionFindings(chart),
    ...detectAllCoreYogas(chart),
  ];
}

describe("renderDomainSection: golden chart Relationships (real 'strong' tier -- Malavya EXACT + 7th-lord Saturn)", () => {
  it("overview cites Malavya (EXACT) and the 7th-lord Saturn", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("relationships", findings, "overview", template);
    expect(section.text).toContain("Malavya Yoga: Venus is in its own sign in the 10th house, which is a Kendra.");
    expect(section.text).toContain("7th lord Saturn is placed in Libra, in the 3rd house, and is exalted.");
  });

  it("full depth adds the 5th-lord Jupiter as additional (neutral) context, beyond overview", async () => {
    const findings = await goldenFindings();
    const overview = renderDomainSection("relationships", findings, "overview", template);
    const full = renderDomainSection("relationships", findings, "full", template);
    expect(full.text.startsWith(overview.text)).toBe(true);
    expect(full.text).toContain("Additional context from this chart:");
    expect(full.text).toContain("5th lord Jupiter is placed in Scorpio, in the 4th house, and is in a friendly sign.");
  });

  it("essence depth contains no house numbers or jargon", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("relationships", findings, "essence", template);
    expect(section.text).not.toMatch(/house\s*\d/i);
    expect(section.text).toBe("Relationships and partnership are a genuine strength in this chart.");
  });
});

describe("renderDomainSection: hand-built weak Relationships fixture (real triggered Mangal Dosha + debilitated 5th/7th lords)", () => {
  it("full depth renders the 'challenging' tier and cites all three real findings exactly once each", () => {
    const findings = weakRelationshipsFindings();
    const section = renderDomainSection("relationships", findings, "full", template);

    expect(section.text).toContain("Relationships carry real friction in this chart");
    expect(section.text).toContain("5th lord Sun is placed in Libra, in the 7th house, and is debilitated.");
    expect(section.text).toContain(
      "Mangal Dosha (Lagna-based) is present: Mars is in the 1st house from the Lagna. Different astrological traditions apply somewhat different rules for which placements are considered exempt from this dosha."
    );
    // Venus's debilitation is real via BOTH a standalone dignity finding and the
    // 7th-lord house-lord finding -- must surface once, via the richer house-lord framing.
    expect(section.text).toContain("7th lord Venus is placed in Virgo, in the 2nd house, and is debilitated.");
    expect(section.text).not.toContain("Venus is debilitated in Virgo, in the 2nd house.");
  });

  it("sensitivity guardrails (SKILL.md principle 5, interpretation.md's marriage/children rules): no failure/divorce/infidelity language, uses the required 'partner's own chart' framing verbatim", () => {
    const findings = weakRelationshipsFindings();
    const section = renderDomainSection("relationships", findings, "full", template);

    const forbidden = ["divorce", "infidelity", "fail", "cheat", "affair", "unhappy marriage", "break up", "separation"];
    for (const word of forbidden) {
      expect(section.text.toLowerCase()).not.toContain(word);
    }
    expect(section.text).toContain(
      "the partner's own chart carries proportional weight -- this is not a verdict on the relationship by itself"
    );
    expect(section.text).toContain(
      "Where a placement touches children, treat it as a loose tendency, not a claim about the ability to have them."
    );
  });

  it("does not use alarming/fatalistic language anywhere in the template framing", () => {
    const allTemplateText = JSON.stringify(template).toLowerCase();
    const forbidden = [
      "doom", "curse", "disaster", "catastroph", "death", "danger", "fear", "tragic", "ruin", "unavoidable",
      "divorce", "infidelity", "cheat", "affair",
    ];
    for (const word of forbidden) {
      expect(allTemplateText).not.toContain(word);
    }
  });

  it("essence depth uses the challenging-tier plain-language phrase, no house numbers, no alarming framing", () => {
    const findings = weakRelationshipsFindings();
    const section = renderDomainSection("relationships", findings, "essence", template);
    expect(section.text).toBe(
      "Relationships are an area this chart marks as calling for extra care and communication, not a source of easy, automatic harmony."
    );
    expect(section.text).not.toMatch(/house\s*\d/i);
  });
});

describe("renderDomainSection: closing-note clauses are topic-conditional, not unconditional boilerplate", () => {
  const PARTNERSHIP_CLAUSE =
    "Where a placement touches partnership, the partner's own chart carries proportional weight -- this is not a verdict on the relationship by itself.";
  const CHILDREN_CLAUSE =
    "Where a placement touches children, treat it as a loose tendency, not a claim about the ability to have them.";

  /**
   * Same weak fixture, but the 5th lord (Sun) is set to neutral dignity instead
   * of debilitated -- isolates the case to partnership-touching challenging
   * content (Mangal Dosha, debilitated 7th-lord Venus) with NO challenging
   * children-touching content. The neutral 5th-lord finding still exists (house-lord
   * findings are unconditional) but is only ever quoted as "additional context"
   * at full depth, never at overview.
   */
  function partnershipOnlyFindings() {
    const chart = buildWeakRelationshipsChart();
    const isolated = {
      ...chart,
      planets: { ...chart.planets, Sun: { ...chart.planets.Sun, dignity: "neutral" as const } },
    };
    return [
      ...dignityFindings(isolated),
      ...houseLordFindings(isolated),
      ...combustionFindings(isolated),
      ...detectAllCoreYogas(isolated),
    ];
  }

  it("overview: partnership clause fires, children clause does NOT -- the neutral 5th-lord finding isn't quoted yet", () => {
    const section = renderDomainSection("relationships", partnershipOnlyFindings(), "overview", template);
    expect(section.text).toContain(PARTNERSHIP_CLAUSE);
    expect(section.text).not.toContain(CHILDREN_CLAUSE);
    expect(section.text).not.toContain("5th lord");
  });

  it("full: BOTH clauses fire once the neutral 5th-lord finding surfaces as additional context", () => {
    const section = renderDomainSection("relationships", partnershipOnlyFindings(), "full", template);
    expect(section.text).toContain(PARTNERSHIP_CLAUSE);
    expect(section.text).toContain(CHILDREN_CLAUSE);
    expect(section.text).toContain("5th lord Sun is placed in Libra, in the 7th house, and is in a neutral sign.");
  });

  it("the weak fixture's real content earns both clauses (both topics genuinely present)", () => {
    const section = renderDomainSection("relationships", weakRelationshipsFindings(), "overview", template);
    expect(section.text).toContain(PARTNERSHIP_CLAUSE);
    expect(section.text).toContain(CHILDREN_CLAUSE);
  });
});

describe("renderDomainSection: Relationships evidence or silence (mechanical proof)", () => {
  it("full-depth output is composed ENTIRELY of template framing + real finding statements", () => {
    const findings = weakRelationshipsFindings();
    const section = renderDomainSection("relationships", findings, "full", template);

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
      ...(template.conditionalClosingNotes ?? []).flatMap((c) => c.text),
    ];
    for (const frag of allTemplateFragments) remainder = remainder.split(frag).join("");
    for (const f of findings) remainder = remainder.split(f.statement).join("");

    expect(remainder.trim()).toBe("");
  });
});
