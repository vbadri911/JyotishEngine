import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { buildPersonalitySectionContent, type PersonalityTemplate } from "../../src/export/personalitySection.js";
import personalityTemplateJson from "../../templates/en/personality.json" with { type: "json" };

const template = personalityTemplateJson as PersonalityTemplate;

async function goldenChart() {
  return computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
}

describe("buildPersonalitySectionContent: real golden chart", () => {
  it("assembles the intro, Lagna temperament, Lagna-lord note, and closing text", async () => {
    const { chart } = await goldenChart();
    const content = buildPersonalitySectionContent(chart, template);

    expect(content.title).toBe("Personality");
    expect(content.introText.length).toBeGreaterThan(0);
    expect(content.lagnaTemperamentText).toContain("Leo Lagna");
    expect(content.lagnaLordText).toContain("Sun");
    expect(content.closingText.length).toBeGreaterThan(0);
  });

  it("is deterministic: identical input produces byte-identical content, called twice", async () => {
    const { chart } = await goldenChart();
    const first = buildPersonalitySectionContent(chart, template);
    const second = buildPersonalitySectionContent(chart, template);
    expect(first).toEqual(second);
  });
});
