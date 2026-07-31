import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { renderTimingSection, type TimingTemplate } from "../../src/narrative/timing.js";
import timingTemplateJson from "../../templates/en/timing.json" with { type: "json" };

const template = timingTemplateJson as TimingTemplate;

/**
 * Fixed instant partway through the golden chart's Saturn Antardasha (within
 * the Rahu Mahadasha) -- deliberately NOT the start of a period, so overview's
 * "remaining Antardashas" (from now forward) is genuinely SHORTER than full's
 * "Antardashas in full" (the whole Mahadasha, past included) -- a real,
 * non-trivial case to distinguish the two, unlike an asOf right at a
 * Mahadasha's own start where they'd coincide.
 */
const ASOF = "2023-01-01T00:00:00.000Z";
const OUT_OF_CYCLE_ASOF = "2200-01-01T00:00:00.000Z";

async function goldenDasha() {
  const { dasha } = await computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
  return dasha;
}

describe("renderTimingSection: golden chart, fixed instant within the Rahu Mahadasha's Saturn Antardasha", () => {
  it("essence: plain-language current period + next transition, in one combined sentence, no jargon", async () => {
    const dasha = await goldenDasha();
    const section = renderTimingSection(dasha, "1983-04-23", "essence", template, ASOF);

    expect(section.text).toBe(
      "You're currently in a Rahu-driven cycle, within its Saturn phase, which gives way to a Mercury phase on 3 May 2025."
    );
    expect(section.text).not.toMatch(/Mahadasha|Antardasha|Pratyantardasha/);
    expect(section.text).not.toMatch(/\d{4}-\d{2}-\d{2}/); // no raw ISO dates
  });

  it("overview: the current-period summary is computed fresh for THIS asOfISO (not a stale Finding from some other instant), then lists ONLY the Antardashas remaining from now forward", async () => {
    const dasha = await goldenDasha();
    const section = renderTimingSection(dasha, "1983-04-23", "overview", template, ASOF);

    expect(section.text).toContain(
      "Currently running: Rahu -> Saturn -> Mercury (Mahadasha / Antardasha / Pratyantardasha), 9 December 2022 to 5 May 2023."
    );
    expect(section.text).toContain("Saturn Antardasha: 27 June 2022 to 3 May 2025 (current).");
    expect(section.text).toContain("Mars Antardasha: 3 May 2034 to 22 May 2035.");
    // Rahu and Jupiter Antardashas already ENDED before asOf -- must not appear in the "remaining" list.
    expect(section.text).not.toContain("Rahu Antardasha:");
    expect(section.text).not.toContain("Jupiter Antardasha:");
    // Nothing here is Finding-derived (see timing.ts's module doc) -- honestly empty, not a stale/borrowed id.
    expect(section.sourceFindingIds).toEqual([]);
  });

  it("full: full Mahadasha arc (age-90 cutoff applied, with its own disclosure) PLUS the current Mahadasha's COMPLETE Antardasha list, including already-past ones", async () => {
    const dasha = await goldenDasha();
    const section = renderTimingSection(dasha, "1983-04-23", "full", template, ASOF);

    expect(section.text).toContain("The full Mahadasha arc for this chart:");
    expect(section.text).toContain("Venus Mahadasha: 22 May 1974 to 22 May 1994.");
    expect(section.text).toContain("Rahu Mahadasha: 21 May 2017 to 22 May 2035 (current).");
    expect(section.text).toContain("Mercury Mahadasha: 22 May 2070 to 22 May 2087.");
    // Ketu Mahadasha (the 9th) would start ~2087, well past age 90 (birth 1983) -- must be suppressed, with disclosure.
    expect(section.text).not.toContain("Ketu Mahadasha:");
    expect(section.text).toContain("Periods beyond roughly age 90 are not shown here.");

    expect(section.text).toContain("The current Mahadasha's Antardashas in full:");
    // Unlike overview, full's Antardasha list includes ALREADY-PAST ones (Rahu, Jupiter) -- the "in full" ask.
    expect(section.text).toContain("Rahu Antardasha: 21 May 2017 to 1 February 2020.");
    expect(section.text).toContain("Jupiter Antardasha: 1 February 2020 to 27 June 2022.");
    expect(section.text).toContain("Saturn Antardasha: 27 June 2022 to 3 May 2025 (current).");

    expect(section.text).toContain(
      "Dasha periods describe general life-chapter themes, not fixed events -- how a period unfolds depends on the choices made within it, the same as any other placement in this chart."
    );
  });

  it("no raw ISO timestamps or local-offset artifacts leak into ANY depth's text", async () => {
    const dasha = await goldenDasha();
    for (const depth of ["essence", "overview", "full"] as const) {
      const section = renderTimingSection(dasha, "1983-04-23", depth, template, ASOF);
      expect(section.text).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
      expect(section.text).not.toMatch(/[+-]\d{2}:\d{2}\b/);
    }
  });

  it("renders identical text for identical input, called twice (determinism)", async () => {
    const dasha = await goldenDasha();
    const first = renderTimingSection(dasha, "1983-04-23", "full", template, ASOF);
    const second = renderTimingSection(dasha, "1983-04-23", "full", template, ASOF);
    expect(first.text).toBe(second.text);
  });

  it("a DIFFERENT explicit asOfISO produces a genuinely different, internally consistent summary -- the exact bug class this design avoids", async () => {
    // Real bug found and fixed (DECISIONS.md): an earlier version quoted a
    // Finding computed at whatever "now" computeChart() happened to use,
    // independent of this function's OWN asOfISO -- so two different
    // explicit asOfISO values could silently produce the SAME "currently
    // running" sentence while the antardasha list below it correctly
    // changed. Proves that no longer happens: a materially different
    // instant (well into the NEXT Antardasha) must change the summary too.
    const dasha = await goldenDasha();
    const later = renderTimingSection(dasha, "1983-04-23", "overview", template, "2026-01-01T00:00:00.000Z");
    expect(later.text).toContain("Currently running: Rahu -> Mercury ->");
    expect(later.text).not.toContain("Currently running: Rahu -> Saturn ->");
    expect(later.text).toContain("Mercury Antardasha:");
    expect(later.text).toContain("(current)");
  });
});

describe("renderTimingSection: instant outside the computed 120-year dasha cycle", () => {
  it("falls back cleanly at every depth instead of crashing or fabricating a period", async () => {
    const dasha = await goldenDasha();

    const essence = renderTimingSection(dasha, "1983-04-23", "essence", template, OUT_OF_CYCLE_ASOF);
    const overview = renderTimingSection(dasha, "1983-04-23", "overview", template, OUT_OF_CYCLE_ASOF);
    const full = renderTimingSection(dasha, "1983-04-23", "full", template, OUT_OF_CYCLE_ASOF);

    expect(essence.text).toBe("This chart's computed dasha cycle does not cover the current date.");
    expect(overview.text).toBe("This chart's computed dasha cycle does not cover the current date, so no near-term timeline is available.");
    expect(full.text).toBe(overview.text);
    expect(essence.sourceFindingIds).toEqual([]);
  });
});

describe("renderTimingSection: does not use alarming/fatalistic language anywhere in the template framing", () => {
  it("sweeps the template for forbidden words", () => {
    const allTemplateText = JSON.stringify(template).toLowerCase();
    const forbidden = ["doom", "curse", "disaster", "catastroph", "death", "die", "fatal", "danger", "fear", "tragic", "ruin", "unavoidable"];
    for (const word of forbidden) {
      expect(allTemplateText).not.toContain(word);
    }
  });
});
