import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { buildD9ChartInput } from "../../src/chart/navamsaChart.js";
import { renderSouthIndianChartSVG } from "../../src/chart/southIndianChart.js";
import { DEFAULT_ENGINE_SETTINGS, type Graha } from "../../src/types.js";
import fixture from "../golden-charts/reference-chart-1983.json";

async function goldenChart() {
  const { chart } = await computeChart(
    {
      date: fixture.input.date,
      time: fixture.input.time,
      placeText: fixture.input.placeText,
      precision: "exact_from_record",
    },
    DEFAULT_ENGINE_SETTINGS
  );
  return chart;
}

describe("buildD9ChartInput", () => {
  it("matches the golden chart's own verified navamsaD9 fixture (Lagna + all 9 planets)", async () => {
    const chart = await goldenChart();
    const d9Input = buildD9ChartInput(chart);
    const expD9 = fixture.expected.navamsaD9;

    expect(d9Input.lagnaSign, "D9 Ascendant sign").toBe(expD9.ascendantSign);
    for (const [graha, expectedSign] of Object.entries(expD9.planetSigns) as [Graha, string][]) {
      expect(d9Input.planets[graha]?.sign, `${graha} D9 sign`).toBe(expectedSign);
    }
  });

  it("carries the planet's real (D1) retrograde flag through unchanged", async () => {
    const chart = await goldenChart();
    const d9Input = buildD9ChartInput(chart);
    for (const graha of Object.keys(chart.planets) as Graha[]) {
      expect(d9Input.planets[graha]?.retrograde).toBe(chart.planets[graha].retrograde);
    }
  });

  it("feeds directly into renderSouthIndianChartSVG without changes, per its own decoupled-input design", async () => {
    const chart = await goldenChart();
    const d9Input = buildD9ChartInput(chart);
    const svg = renderSouthIndianChartSVG(d9Input, { size: 400, centerText: "D9\nNavamsa" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("ASC");
    expect(svg).toContain("Navamsa");
  });
});
