import { describe, it, expect } from "vitest";
import { Resvg } from "@resvg/resvg-js";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { buildOverviewDocumentContent } from "../../src/export/overviewDocument.js";
import { exportOverviewPdf } from "../../src/export/overviewPdf.js";
import { exportOverviewDocx } from "../../src/export/overviewDocx.js";
import type { SixDomainTemplates } from "../../src/export/templates.js";
import careerTemplateJson from "../../templates/en/career.json" with { type: "json" };
import wealthTemplateJson from "../../templates/en/wealth.json" with { type: "json" };
import healthTemplateJson from "../../templates/en/health.json" with { type: "json" };
import relationshipsTemplateJson from "../../templates/en/relationships.json" with { type: "json" };
import purposeTemplateJson from "../../templates/en/purpose.json" with { type: "json" };
import timingTemplateJson from "../../templates/en/timing.json" with { type: "json" };

const templates = {
  career: careerTemplateJson, wealth: wealthTemplateJson, health: healthTemplateJson,
  relationships: relationshipsTemplateJson, purpose: purposeTemplateJson, timing: timingTemplateJson,
} as unknown as SixDomainTemplates;

const FIXED_ASOF = "2023-01-01T00:00:00.000Z";

async function goldenChart() {
  return computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
}

/** Rasterizes an SVG to PNG for tests/tooling -- NOT how the real, browser-
 *  deployed product would do this (see overviewDocx.ts's module doc: the
 *  real path is the browser's own Canvas API, since `@resvg/resvg-js` is a
 *  native Node addon that cannot run client-side at all). */
function rasterizeForTest(svg: string, size: number): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  return resvg.render().asPng();
}

describe("buildOverviewDocumentContent: real golden chart", () => {
  it("assembles the chart, all 9 planet rows, all 8 yoga/dosha classifications (including ABSENT), domain summaries, and a settings disclosure", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const content = buildOverviewDocumentContent(chart, findings, dasha, templates, FIXED_ASOF);

    expect(content.title).toBe("Overview");
    expect(content.chartSvg).toContain("<svg");
    expect(content.ascendantLine).toBe("Ascendant: Leo 27.63°");

    expect(content.planetRows).toHaveLength(9);
    const sun = content.planetRows.find((r) => r.graha === "Sun")!;
    expect(sun.sign).toBe("Aries");
    expect(sun.house).toBe(9);
    expect(sun.dignity).toBe("exalted");

    // All 8 yoga/dosha detections (5 Mahapurusha + Gajakesari + Kemadruma +
    // Mangal Dosha) must be present, INCLUDING absences -- SKILL.md: "Report
    // notable absences explicitly... informative and often reassuring."
    expect(content.yogaRows).toHaveLength(8);
    expect(content.yogaRows.some((r) => r.classification === "EXACT" && r.statement.includes("Malavya"))).toBe(true);
    expect(content.yogaRows.some((r) => r.classification === "ABSENT")).toBe(true);

    expect(content.domainSections.map((s) => s.label)).toEqual(["Career", "Wealth", "Health", "Relationships", "Purpose", "Timing"]);
    // Overview depth: a full paragraph (lead-in + quoted findings), not essence's single sentence.
    expect(content.domainSections[0]!.text.length).toBeGreaterThan(80);
    expect(content.domainSections[0]!.text).toContain("Sasa Yoga");

    expect(content.settingsDisclosure).toContain("Lahiri");
  });

  it("is deterministic: identical input produces byte-identical content, called twice", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const first = buildOverviewDocumentContent(chart, findings, dasha, templates, FIXED_ASOF);
    const second = buildOverviewDocumentContent(chart, findings, dasha, templates, FIXED_ASOF);
    expect(first).toEqual(second);
  });
});

describe("exportOverviewPdf / exportOverviewDocx: real golden-chart content, chart embedded", () => {
  it("produces a well-formed PDF with the chart embedded natively (no rasterization needed)", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const content = buildOverviewDocumentContent(chart, findings, dasha, templates, FIXED_ASOF);
    const buffer = await exportOverviewPdf(content);

    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(2000); // real content: chart + 2 tables + 6 domain sections
  });

  it("produces a well-formed DOCX with the chart embedded via SVG + a REAL rasterized fallback (not a placeholder)", async () => {
    const { chart, findings, dasha } = await goldenChart();
    const content = buildOverviewDocumentContent(chart, findings, dasha, templates, FIXED_ASOF);
    const fallbackPng = rasterizeForTest(content.chartSvg, 400);

    // Prove the fallback itself is real BEFORE it ever reaches docx -- the
    // exact class of check that caught the placeholder defect last time.
    expect(fallbackPng.length).toBeGreaterThan(1000);

    const buffer = await exportOverviewDocx(content, fallbackPng);
    expect(buffer.subarray(0, 2).toString("ascii")).toBe("PK");
    expect(buffer.length).toBeGreaterThan(2000);
  });
});
