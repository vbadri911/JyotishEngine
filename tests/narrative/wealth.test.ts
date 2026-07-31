import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { dignityFindings, houseLordFindings, combustionFindings } from "../../src/findings/index.js";
import { detectAllCoreYogas } from "../../src/rules/yogas.js";
import { renderDomainSection, type DomainTemplate } from "../../src/narrative/render.js";
import { buildWeakWealthChart } from "./fixtures.js";
import wealthTemplateJson from "../../templates/en/wealth.json" with { type: "json" };

const template = wealthTemplateJson as DomainTemplate;

async function goldenFindings() {
  const { findings } = await computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
  return findings;
}

function weakWealthFindings() {
  const chart = buildWeakWealthChart();
  return [...dignityFindings(chart), ...houseLordFindings(chart), ...combustionFindings(chart), ...detectAllCoreYogas(chart)];
}

describe("renderDomainSection: golden chart Wealth (real 'strong' tier -- single EXACT Malavya, no convergence)", () => {
  it("overview cites Malavya alone, via the singleSupportive framing (only 1 substantive supportive finding, not 2+)", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("wealth", findings, "overview", template);
    expect(section.text).toContain("Wealth and material security stand out as one of this chart's clearer strengths.");
    expect(section.text).toContain("One placement stands out here:");
    expect(section.text).toContain("Malavya Yoga: Venus is in its own sign in the 10th house, which is a Kendra.");
    // Venus's own bare dignity finding must NOT also appear -- it dedupes into Malavya (the richer yoga finding).
    expect(section.text).not.toContain("Venus is in its own sign in Taurus");
  });

  it("full depth adds BOTH the 2nd-lord and 11th-lord Mercury findings as additional context -- the double-lord dedup fix, confirmed against real data", async () => {
    const findings = await goldenFindings();
    const overview = renderDomainSection("wealth", findings, "overview", template);
    const full = renderDomainSection("wealth", findings, "full", template);
    expect(full.text.startsWith(overview.text)).toBe(true);
    expect(full.text).toContain("Additional context from this chart:");
    // Leo Lagna makes Mercury BOTH the 2nd and 11th lord (Virgo/Gemini, the same
    // "twin-sign" pattern as Mars/Venus/Jupiter/Saturn) -- both are real, distinct
    // facts and must BOTH survive dedup, not collapse to whichever was generated first.
    expect(full.text).toContain("2nd lord Mercury is placed in Aries, in the 9th house, and is in a neutral sign.");
    expect(full.text).toContain("11th lord Mercury is placed in Aries, in the 9th house, and is in a neutral sign.");
  });

  it("no closing note -- no challenging content exists in this chart's Wealth findings", async () => {
    const findings = await goldenFindings();
    const full = renderDomainSection("wealth", findings, "full", template);
    expect(full.text).not.toContain(template.closingNote[0]);
  });

  it("essence depth contains no house numbers or jargon", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("wealth", findings, "essence", template);
    expect(section.text).not.toMatch(/house\s*\d/i);
    expect(template.essence.strong).toContain(section.text);
  });
});

describe("renderDomainSection: hand-built weak Wealth fixture (real debilitated 2nd-lord Venus, 11th-lord Saturn, and Jupiter)", () => {
  it("full depth renders the 'challenging' tier and cites all three real findings exactly once each", () => {
    const section = renderDomainSection("wealth", weakWealthFindings(), "full", template);

    expect(section.text).toContain("Wealth carries real friction in this chart");
    expect(section.text).toContain("2nd lord Venus is placed in Virgo, in the 6th house, and is debilitated.");
    expect(section.text).toContain("11th lord Saturn is placed in Aries, in the 1st house, and is debilitated.");
    expect(section.text).toContain("Jupiter is debilitated in Capricorn, in the 10th house.");
    // Venus's debilitation is real via BOTH a standalone dignity finding and the
    // 2nd-lord house-lord finding -- must surface once, via the richer house-lord framing.
    expect(section.text).not.toContain("Venus is debilitated in Virgo");
  });

  it("full's text is identical to overview's -- all 3 challenging findings fit within the cap, nothing left to add", () => {
    const findings = weakWealthFindings();
    const overview = renderDomainSection("wealth", findings, "overview", template);
    const full = renderDomainSection("wealth", findings, "full", template);

    expect(full.text).toBe(overview.text);
    expect(overview.sourceFindingIds).toHaveLength(3);
    expect(full.sourceFindingIds).toHaveLength(3);
    expect(full.text).not.toContain("Beyond that");
    expect(full.text).not.toContain("One more placement");
    expect(full.text).not.toContain("Additional context");
  });

  it("closes with the non-fatalism note, since real challenging content is present", () => {
    const section = renderDomainSection("wealth", weakWealthFindings(), "full", template);
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

  it("essence depth uses the challenging-tier plain-language phrase, no house numbers", () => {
    const section = renderDomainSection("wealth", weakWealthFindings(), "essence", template);
    expect(section.text).toBe("Wealth is an area this chart marks as needing sustained, deliberate effort rather than coming easily.");
    expect(section.text).not.toMatch(/house\s*\d/i);
  });
});

describe("renderDomainSection: thin Wealth (no findings at all)", () => {
  it("says so plainly and briefly, at every depth", () => {
    const essence = renderDomainSection("wealth", [], "essence", template);
    const overview = renderDomainSection("wealth", [], "overview", template);
    const full = renderDomainSection("wealth", [], "full", template);

    expect(essence.text).toBe("No single placement dominates the wealth picture in this chart.");
    expect(overview.text).toContain("Wealth does not carry a strong signature in this chart");
    expect(full.text).toBe(overview.text);
    expect(essence.sourceFindingIds).toEqual([]);
  });
});

describe("renderDomainSection: Wealth evidence or silence (mechanical proof)", () => {
  it("full-depth output is composed ENTIRELY of template framing + real finding statements", () => {
    const findings = weakWealthFindings();
    const section = renderDomainSection("wealth", findings, "full", template);

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
    for (const f of findings.filter((f) => f.domain.includes("wealth"))) remainder = remainder.split(f.statement).join("");

    expect(remainder.trim()).toBe("");
  });
});
