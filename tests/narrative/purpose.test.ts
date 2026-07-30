import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { renderDomainSection, type DomainTemplate } from "../../src/narrative/render.js";
import purposeTemplateJson from "../../templates/en/purpose.json" with { type: "json" };

const template = purposeTemplateJson as DomainTemplate;

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

describe("renderDomainSection: golden chart Purpose (real 'mixed' tier -- 3 supportive, 1 challenging after dedup)", () => {
  // Domain tags were audited and corrected (see DECISIONS.md): Ruchaka and Sasa
  // no longer tag Purpose at all -- Mars and Saturn aren't named Purpose karakas
  // in interpretation.md, and the earlier blanket ["purpose","career"] tag on
  // every Mahapurusha yoga was a scaffold-era shortcut. Malavya moved to
  // wealth+relationships entirely. Purpose now correctly rests on Gajakesari
  // (Jupiter as dharma/wisdom karaka -- confirmed correct, not retagged), the
  // Lagna-lord Sun, the 9th-lord Mars, and Mars's combustion -- a smaller but
  // more accurate set than before.
  it("full depth quotes each underlying fact exactly once", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("purpose", findings, "full", template);

    // Mars' own-sign 9th-house placement is real via the 9th-lord house-lord
    // finding (Ruchaka itself no longer tags Purpose, so there's no longer a
    // second source for this fact within Purpose specifically).
    expect(countOccurrences(section.text, "Mars is")).toBe(2); // 9th-lord placement + combustion -- two DIFFERENT facts about Mars
    expect(section.text).toContain(
      "9th lord Mars is placed in Aries, in the 9th house -- its own house, and is in its own sign."
    );
    expect(section.text).not.toContain("Ruchaka");
    expect(section.text).not.toContain("Malavya");
  });

  it("renders the 'mixed' tier, citing the supportive convergence and the single challenging finding", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("purpose", findings, "overview", template);
    expect(section.text).toContain("Purpose shows real clarity here, alongside a real point of friction worth naming.");
    expect(section.text).toContain("Sun is exalted in Aries, in the 9th house, and is also the Lagna lord.");
    expect(section.text).toContain("Gajakesari Yoga: Jupiter is 4 signs from the Moon -- a Kendra relationship.");
    expect(section.text).toContain(
      "9th lord Mars is placed in Aries, in the 9th house -- its own house, and is in its own sign."
    );
    // Only 1 challenging finding exists -- the SINGLE, not convergence, framing must fire.
    expect(section.text).toContain("One placement here is worth naming directly:");
    expect(section.text).toContain(
      "Mars is combust, 10.43 degrees from the Sun -- its significations are weakened while this close to the Sun."
    );
  });

  it("full's text is identical to overview's -- all 3 supportive + 1 challenging fit within the cap, nothing left to add", async () => {
    const findings = await goldenFindings();
    const overview = renderDomainSection("purpose", findings, "overview", template);
    const full = renderDomainSection("purpose", findings, "full", template);

    expect(full.text).toBe(overview.text);
    // The closing note (challenging content is present) must appear exactly once.
    expect(countOccurrences(full.text, template.closingNote[0]!)).toBe(1);
    expect(full.text.endsWith(template.closingNote[0]!)).toBe(true);

    expect(overview.sourceFindingIds).toHaveLength(4); // 3 supportive + 1 challenging
    expect(full.sourceFindingIds).toHaveLength(4);
  });

  it("essence depth contains no house numbers or jargon", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("purpose", findings, "essence", template);
    expect(section.text).not.toMatch(/house\s*\d/i);
    expect(section.text).toBe(
      "Purpose here combines real clarity with a point of friction worth naming -- a strong underlying direction that still asks for some navigation."
    );
  });

  it("does not use alarming/fatalistic language anywhere in the template framing", () => {
    const allTemplateText = JSON.stringify(template).toLowerCase();
    const forbidden = ["doom", "curse", "disaster", "catastroph", "death", "danger", "fear", "tragic", "ruin", "unavoidable"];
    for (const word of forbidden) {
      expect(allTemplateText).not.toContain(word);
    }
  });
});

describe("renderDomainSection: Purpose evidence or silence (mechanical proof)", () => {
  it("full-depth output is composed ENTIRELY of template framing + real finding statements", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("purpose", findings, "full", template);

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
    const purposeFindings = findings.filter((f) => f.domain.includes("purpose"));
    for (const f of purposeFindings) remainder = remainder.split(f.statement).join("");

    expect(remainder.trim()).toBe("");
  });
});
