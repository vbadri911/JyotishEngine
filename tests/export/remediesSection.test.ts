import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { buildRemediesSectionContent, selectTopFindings, type RemediesTemplate } from "../../src/export/remediesSection.js";
import { findingCategoryRank } from "../../src/util/findingCategory.js";
import remediesTemplateJson from "../../templates/en/remedies.json" with { type: "json" };

const template = remediesTemplateJson as RemediesTemplate;

async function goldenChart() {
  return computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
}

describe("selectTopFindings: real golden chart", () => {
  it("returns at most 3 findings, ranked category-first then by strength within a category, none of them the timing-only period-fact findings", async () => {
    const { findings } = await goldenChart();
    const top = selectTopFindings(findings);

    expect(top.length).toBeGreaterThan(0);
    expect(top.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < top.length; i++) {
      const prevCat = findingCategoryRank(top[i - 1]!);
      const curCat = findingCategoryRank(top[i]!);
      expect(prevCat).toBeLessThanOrEqual(curCat); // category never regresses down the list
      if (prevCat === curCat) expect(top[i - 1]!.strength).toBeGreaterThanOrEqual(top[i]!.strength); // strength only decides within the same category
    }
    // currentDashaFinding() and detectDashaRemedy() findings are always domain: ["timing"] only.
    for (const f of top) expect(f.domain.some((d) => d !== "timing")).toBe(true);
  });

  it("never surfaces two findings for the literal same underlying fact (dedup applied before ranking)", async () => {
    const { findings } = await goldenChart();
    const top = selectTopFindings(findings);
    const statements = top.map((f) => f.statement);
    expect(new Set(statements).size).toBe(statements.length);
  });

  it("real golden-chart selection: Malavya Yoga, Gajakesari Yoga, and the Lagna-lord Raja Yoga -- this chart's actual standout facts, confirmed real output not assumed", async () => {
    const { findings } = await goldenChart();
    const top = selectTopFindings(findings);
    expect(top).toHaveLength(3);
    expect(top.every((f) => f.classification === "EXACT")).toBe(true);
    expect(top.some((f) => f.statement.startsWith("Malavya Yoga"))).toBe(true);
    expect(top.some((f) => f.statement.startsWith("Gajakesari Yoga"))).toBe(true);
    expect(top.some((f) => f.statement.includes("Raja Yoga") && f.statement.includes("Lagna lord Sun"))).toBe(true);
  });

  it("category-first ranking fixed a real crowd-out bug (2026-08-04): body-part findings (strength 0.9, calibrated for Health's own tier classification) no longer displace real yoga combinations from Executive Summary despite carrying an equal or higher raw strength number", async () => {
    const { findings } = await goldenChart();
    const top = selectTopFindings(findings);
    // Sun's and Saturn's body-part findings are real, strength 0.9 each -- tied
    // with or above two of the three actual winners on raw strength alone --
    // and must NOT appear in the top-3 now that category outranks strength.
    expect(top.some((f) => f.id.startsWith("body-part"))).toBe(false);
  });
});

describe("buildRemediesSectionContent: real golden chart", () => {
  it("assembles Executive Summary (top findings + current dasha) and the Remedies subsection together", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const content = buildRemediesSectionContent(chart, findings, dasha, template, "2026-08-03T12:00:00.000Z");

    expect(content.title).toBe("Remedies & Executive Summary");
    expect(content.topFindings.length).toBeGreaterThan(0);
    expect(content.topFindings.length).toBeLessThanOrEqual(3);
    expect(content.currentDashaSentence).toContain("Currently running");
    expect(content.summaryIntroText.length).toBeGreaterThan(0);
    expect(content.remedyIntroText.length).toBeGreaterThan(0);
    expect(content.closingText.length).toBeGreaterThan(0);
  });

  it("SURFACES the real remedy for the real currently-running period (Mercury in Rahu Mahadasha, this chart's real maraka lord aspected by Saturn) -- same fact independently confirmed in tests/dashaRemedies.test.ts", async () => {
    const { chart, findings, dasha } = await goldenChart();
    // Any instant within the real Rahu-Mercury Antardasha window (2025-05-06 to 2027-11-23).
    const content = buildRemediesSectionContent(chart, findings, dasha, template, "2026-08-03T12:00:00.000Z");

    expect(content.remedyText).toContain("Antardasha of Mercury within the Mahadasha of Rahu");
    expect(content.remedyText).toContain("Vishnu Sahasranama");
    expect(content.remedyCitation).toContain("Ch.55 v.36-39");
  });

  it("STAYS SILENT (real, correct absence, not a bug) for a period where this chart's Antardasha lord is genuinely well-placed -- Sun in Rahu Mahadasha, exalted, non-maraka", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const rahuMD = dasha.mahadashas.find((m) => m.lord === "Rahu")!;
    // Sun-in-Rahu Antardasha starts 2031-12-11 per the same real dasha sequence
    // already independently verified in tests/dashaRemedies.test.ts.
    const content = buildRemediesSectionContent(chart, findings, dasha, template, "2032-03-01T00:00:00.000Z");

    expect(rahuMD).toBeDefined();
    expect(content.remedyText).toBeNull();
    expect(content.remedyCitation).toBeNull();
    expect(content.noRemedyText.length).toBeGreaterThan(0);
  });

  it("the Remedies subsection is asOfISO-conditional, not baked in at whatever instant computeChart() happened to use -- the exact bug class already fixed once for renderTimingSection()", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const surfacing = buildRemediesSectionContent(chart, findings, dasha, template, "2026-08-03T12:00:00.000Z");
    const silent = buildRemediesSectionContent(chart, findings, dasha, template, "2032-03-01T00:00:00.000Z");
    expect(surfacing.remedyText).not.toBeNull();
    expect(silent.remedyText).toBeNull();
  });

  it("is deterministic: identical input produces byte-identical content, called twice", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const first = buildRemediesSectionContent(chart, findings, dasha, template, "2026-08-03T12:00:00.000Z");
    const second = buildRemediesSectionContent(chart, findings, dasha, template, "2026-08-03T12:00:00.000Z");
    expect(first).toEqual(second);
  });
});
