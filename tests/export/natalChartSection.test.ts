import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { buildNatalChartSectionContent, type NatalChartTemplate } from "../../src/export/natalChartSection.js";
import natalTemplateJson from "../../templates/en/natal.json" with { type: "json" };

const template = natalTemplateJson as NatalChartTemplate;

async function goldenChart() {
  return computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
}

describe("buildNatalChartSectionContent: real golden chart", () => {
  it("assembles D1 + D9 charts, all 9 planet rows, all-planet/all-house notes, and the full yoga table", async () => {
    const { chart, findings } = await goldenChart();
    const content = buildNatalChartSectionContent(chart, findings, template);

    expect(content.title).toBe("Natal chart decoded");

    expect(content.chartSvgD1).toContain("<svg");
    expect(content.ascendantLine).toBe("Ascendant: Leo 27.63°");

    expect(content.chartSvgD9).toContain("<svg");
    expect(content.d9AscendantLine).toBe("D9 Ascendant: Sagittarius");

    expect(content.planetRows).toHaveLength(9);
    const sun = content.planetRows.find((r) => r.graha === "Sun")!;
    expect(sun.sign).toBe("Aries");
    expect(sun.dignity).toBe("exalted");
    expect(sun.nakshatraName).toBeTruthy();

    // The whole point of extending beyond dignityFindings()/houseLordFindings():
    // Moon/Mars/Rahu/Ketu and houses 3/4/12 must show up here even though
    // they never get a standalone Finding in the 6-domain pipeline.
    expect(content.planetNotes).toHaveLength(9);
    expect(content.planetNotes.some((n) => n.graha === "Moon")).toBe(true);
    expect(content.planetNotes.some((n) => n.graha === "Rahu")).toBe(true);

    expect(content.houseNotes).toHaveLength(12);
    expect(content.houseNotes.some((n) => n.house === 3)).toBe(true);
    expect(content.houseNotes.some((n) => n.house === 4)).toBe(true);
    expect(content.houseNotes.some((n) => n.house === 12)).toBe(true);

    // Same 18 yoga/dosha rows Overview already validates as of 2026-08-01
    // (5 Mahapurusha + Gajakesari + Kemadruma + Mangal Dosha + 5 Nabhasa +
    // 5 Raja Yoga for this golden chart), including ABSENT.
    expect(content.yogaRows).toHaveLength(18);
    expect(content.yogaRows.some((r) => r.classification === "ABSENT")).toBe(true);

    expect(content.settingsDisclosure).toContain("Lahiri");
    expect(content.introChartTablesText.length).toBeGreaterThan(0);
    expect(content.closingText.length).toBeGreaterThan(0);
  });

  it("is deterministic: identical input produces byte-identical content, called twice", async () => {
    const { chart, findings } = await goldenChart();
    const first = buildNatalChartSectionContent(chart, findings, template);
    const second = buildNatalChartSectionContent(chart, findings, template);
    expect(first).toEqual(second);
  });

  // Two sections computing from the same chart must agree -- confirmed, not
  // assumed, per the golden chart's own already-verified per-planet dignity
  // (tests/golden-charts/reference-chart-1983.json / full-chart.test.ts, plus
  // the Jupiter dignity correction logged in DECISIONS.md, 2026-07-28).
  it("all-planet dignity notes agree exactly with the shared planetRows table (the same one Overview uses) and with the golden chart's own verified values", async () => {
    const { chart, findings } = await goldenChart();
    const content = buildNatalChartSectionContent(chart, findings, template);

    const expectedDignity: Record<string, string> = {
      Sun: "exalted",
      Moon: "friend",
      Mercury: "neutral",
      Venus: "own",
      Mars: "own",
      Jupiter: "friend",
      Saturn: "exalted",
      Rahu: "neutral",
      Ketu: "neutral",
    };

    for (const [graha, expected] of Object.entries(expectedDignity)) {
      const row = content.planetRows.find((r) => r.graha === graha)!;
      const note = content.planetNotes.find((n) => n.graha === graha)!;

      expect(row.dignity, `${graha} planetRows dignity`).toBe(expected);
      expect(note.statement, `${graha} note should state its real dignity`).toContain(
        row.dignity === "own" ? "own sign" : row.dignity
      );
    }
  });
});
