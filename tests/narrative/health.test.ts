import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { dignityFindings, houseLordFindings, combustionFindings } from "../../src/findings/index.js";
import { detectAllCoreYogas } from "../../src/rules/yogas.js";
import { renderDomainSection, type DomainTemplate } from "../../src/narrative/render.js";
import { buildWeakHealthChart, buildIllnessOnlyHealthChart, buildLongevityOnlyHealthChart } from "./fixtures.js";
import healthTemplateJson from "../../templates/en/health.json" with { type: "json" };

const template = healthTemplateJson as DomainTemplate;

async function goldenFindings() {
  const { findings } = await computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
  return findings;
}

function findingsFor(chart: ReturnType<typeof buildWeakHealthChart>) {
  return [...dignityFindings(chart), ...houseLordFindings(chart), ...combustionFindings(chart), ...detectAllCoreYogas(chart)];
}

function weakHealthFindings() {
  return findingsFor(buildWeakHealthChart());
}

/**
 * UPDATE 2026-08-01, per Piece A (DECISIONS.md): the claim below ("Health
 * structurally caps at 3 findings") was true through P5, but is no longer --
 * bodyPartFindings() and houseAfflictionFindings() (findings/index.ts) both
 * add real, additional Health-tagged findings this fixture/golden-chart set
 * predates. `weakHealthFindings()` below still uses ONLY
 * dignityFindings()/houseLordFindings()/combustionFindings()/
 * detectAllCoreYogas() deliberately -- it is a fixture for testing
 * render.ts's OWN mechanism (tiering, capping, dedup) in isolation, not a
 * claim that a real chart's Health section is still capped at 3. The golden
 * chart's own real Health section (below) now legitimately exceeds 3 -- see
 * the new tests confirming this directly, not assuming the old comment still
 * held.
 *
 * Original note, retained for the fixture-specific claim that's still true:
 * dignityFindings() only tags health for the Lagna lord, and
 * houseLordFindings() only tags health for houses 1/6/8. The Lagna lord IS by
 * definition the 1st house's lord, so the Lagna-lord dignity finding and the
 * 1st-lord house-lord finding always dedupe into one -- `weakHealthFindings()`
 * (using only the four pre-Piece-A generators) is still capped at exactly 3
 * for that reason, which is what the fixture-based tests below verify.
 */

describe("renderDomainSection: golden chart Health (real 'strong' tier -- Lagna-lord Sun + 6th-lord Saturn, both exalted)", () => {
  it("overview cites the Lagna-lord Sun and the 6th-lord Saturn", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("health", findings, "overview", template);
    expect(section.text).toContain("Sun is exalted in Aries, in the 9th house, and is also the Lagna lord.");
    expect(section.text).toContain("6th lord Saturn is placed in Libra, in the 3rd house, and is exalted.");
    expect(section.text).not.toContain("1st lord Sun");
  });

  it("full depth adds the 8th-lord Jupiter as additional (neutral) context, beyond overview", async () => {
    const findings = await goldenFindings();
    const overview = renderDomainSection("health", findings, "overview", template);
    const full = renderDomainSection("health", findings, "full", template);
    expect(full.text.startsWith(overview.text)).toBe(true);
    expect(full.text).toContain("Additional context from this chart:");
    expect(full.text).toContain("8th lord Jupiter is placed in Scorpio, in the 4th house, and is in a friendly sign.");
  });

  it("no closing note -- no challenging content exists in this chart's Health findings", async () => {
    const findings = await goldenFindings();
    const full = renderDomainSection("health", findings, "full", template);
    expect(full.text).not.toContain(template.closingNote[0]);
  });

  it("essence depth contains no house numbers or jargon", async () => {
    const findings = await goldenFindings();
    const section = renderDomainSection("health", findings, "essence", template);
    expect(section.text).not.toMatch(/house\s*\d/i);
    expect(template.essence.strong).toContain(section.text);
  });

  it("Piece A: full depth now also cites real body-part associations (Sun, Saturn, Venus, Mars), not just dignity/house-lord findings", async () => {
    const findings = await goldenFindings();
    const full = renderDomainSection("health", findings, "full", template);
    expect(full.text).toContain("classically associated with bones and eyes"); // Sun, exalted
    expect(full.text).toContain("classically associated with bones, joints, and chronic conditions"); // Saturn, exalted
    expect(full.text).toContain("classically associated with the kidneys"); // Venus, own sign
    expect(full.text).toContain("classically associated with blood"); // Mars, own sign
  });

  it("Piece A: no 6th/8th-house occupancy/aspect affliction finding for this chart -- confirmed real absence, not an oversight", async () => {
    // Saturn(house 3), Mars(house 9), Rahu(house 11), Ketu(house 5): none of
    // the four natural malefics occupies or aspects house 6 or 8 in this
    // chart's real positions (checked directly against aspects.json's real
    // offsets, tests/findings.test.ts's houseAfflictionFindings suite proves
    // the mechanism itself works on a chart where it should fire).
    const findings = await goldenFindings();
    const full = renderDomainSection("health", findings, "full", template);
    expect(full.text).not.toContain("house is afflicted");
  });
});

describe("renderDomainSection: hand-built weak Health fixture (real debilitated Lagna-lord Moon, 6th-lord Jupiter, 8th-lord Saturn)", () => {
  it("full depth renders the 'challenging' tier and cites all three real findings exactly once each", () => {
    const section = renderDomainSection("health", weakHealthFindings(), "full", template);

    expect(section.text).toContain("Health carries real friction in this chart");
    expect(section.text).toContain("Moon is debilitated in Scorpio, in the 5th house, and is also the Lagna lord.");
    expect(section.text).toContain("6th lord Jupiter is placed in Capricorn, in the 7th house, and is debilitated.");
    expect(section.text).toContain("8th lord Saturn is placed in Aries, in the 10th house, and is debilitated.");
    // Moon's debilitation is real via BOTH a standalone dignity finding and the
    // 1st-lord house-lord finding -- must surface once, via the richer Lagna-lord framing.
    expect(section.text).not.toContain("1st lord Moon");
  });

  it("full's text is identical to overview's -- all 3 challenging findings fit within the cap, structurally nothing left to add", () => {
    const findings = weakHealthFindings();
    const overview = renderDomainSection("health", findings, "overview", template);
    const full = renderDomainSection("health", findings, "full", template);

    expect(full.text).toBe(overview.text);
    expect(overview.sourceFindingIds).toHaveLength(3);
    expect(full.sourceFindingIds).toHaveLength(3);
    expect(full.text).not.toContain("Beyond that");
    expect(full.text).not.toContain("One more placement");
    expect(full.text).not.toContain("Additional context");
  });

  it("sensitivity guardrails (SKILL.md principle 5, interpretation.md's Health/Longevity rules): no diagnosis, illness-timing, or lifespan/death language", () => {
    const section = renderDomainSection("health", weakHealthFindings(), "full", template);

    const forbidden = [
      "death", "die", "dying", "fatal", "terminal", "lifespan", "life expectancy",
      "cure", "diagnose", "diagnosed",
    ];
    for (const word of forbidden) {
      expect(section.text.toLowerCase()).not.toContain(word);
    }
    expect(section.text).toContain(
      "not a diagnosis, and not a prediction of any specific illness or its timing. A real concern is a conversation for a qualified doctor, not this chart."
    );
    expect(section.text).toContain("never as a prediction of longevity");
  });

  it("does not use alarming/fatalistic language anywhere in the template framing", () => {
    const allTemplateText = JSON.stringify(template).toLowerCase();
    const forbidden = [
      "doom", "curse", "disaster", "catastroph", "death", "die", "fatal", "terminal",
      "lifespan", "life expectancy", "danger", "fear", "tragic", "ruin", "unavoidable",
    ];
    for (const word of forbidden) {
      expect(allTemplateText).not.toContain(word);
    }
  });

  it("essence depth uses the challenging-tier plain-language phrase, no house numbers, no alarming framing", () => {
    const section = renderDomainSection("health", weakHealthFindings(), "essence", template);
    expect(section.text).toBe(
      "Health is an area this chart marks as calling for a bit more attention and care, not a source of easy, automatic strength."
    );
    expect(section.text).not.toMatch(/house\s*\d/i);
  });
});

describe("renderDomainSection: closing-note clauses are topic-conditional (illness/6th house vs. longevity/8th house), not unconditional boilerplate", () => {
  const ILLNESS_CLAUSE =
    "Where a placement touches the 6th house specifically, treat it as a general tendency linked to traditional body-system associations -- not a diagnosis, and not a prediction of any specific illness or its timing. A real concern is a conversation for a qualified doctor, not this chart.";
  const LONGEVITY_CLAUSE =
    "Where a placement touches the 8th house specifically, it is read here only as a general tendency toward resilience or chronic strain -- never as a prediction of longevity. Any real concern about a chronic condition belongs with a qualified medical professional, not an astrological reading.";

  it("illness-only fixture, overview: illness clause fires, longevity clause does NOT -- the neutral 8th-lord finding isn't quoted yet", () => {
    const section = renderDomainSection("health", findingsFor(buildIllnessOnlyHealthChart()), "overview", template);
    expect(section.text).toContain(ILLNESS_CLAUSE);
    expect(section.text).not.toContain(LONGEVITY_CLAUSE);
  });

  it("longevity-only fixture, overview: longevity clause fires, illness clause does NOT -- the neutral 6th-lord finding isn't quoted yet", () => {
    const section = renderDomainSection("health", findingsFor(buildLongevityOnlyHealthChart()), "overview", template);
    expect(section.text).toContain(LONGEVITY_CLAUSE);
    expect(section.text).not.toContain(ILLNESS_CLAUSE);
  });

  it("illness-only, overview vs. full: overview cites only the challenging 6th-lord finding; the neutral 8th-lord finding (still present, just not challenging) only surfaces as full's additional context, and does NOT retroactively trigger the longevity clause since it's a genuinely different chart, not a depth artifact", () => {
    const findings = findingsFor(buildIllnessOnlyHealthChart());
    const overview = renderDomainSection("health", findings, "overview", template);
    const full = renderDomainSection("health", findings, "full", template);
    expect(overview.text).toContain(ILLNESS_CLAUSE);
    expect(overview.text).not.toContain(LONGEVITY_CLAUSE);
    expect(full.text).toContain("Additional context from this chart:");
    expect(full.text).toContain("8th lord Saturn is placed in Aries, in the 10th house, and is in a neutral sign.");
    expect(full.text).toContain(LONGEVITY_CLAUSE);
  });

  it("the full weak fixture's real content earns both clauses (both topics genuinely present)", () => {
    const section = renderDomainSection("health", weakHealthFindings(), "overview", template);
    expect(section.text).toContain(ILLNESS_CLAUSE);
    expect(section.text).toContain(LONGEVITY_CLAUSE);
  });

  /**
   * Isolates vitality-only challenging content (Lagna-lord Moon debilitated,
   * 6th/8th lords both neutral) -- neither topic-specific clause should fire
   * at overview, since neither the 6th- nor 8th-house content is challenging
   * OR yet quoted. Confirms the general closing note is not itself gated on
   * a specific topic, only on "some challenging finding exists somewhere in
   * this domain" -- matching interpretation.md's domain-wide (not
   * house-specific) non-diagnosis requirement for Health as a whole.
   */
  function vitalityOnlyFindings() {
    const chart = buildWeakHealthChart();
    const isolated = {
      ...chart,
      planets: {
        ...chart.planets,
        Jupiter: { ...chart.planets.Jupiter, dignity: "neutral" as const },
        Saturn: { ...chart.planets.Saturn, dignity: "neutral" as const },
      },
    };
    return findingsFor(isolated);
  }

  it("vitality-only, overview: general note fires alone, neither topic-specific clause fires yet", () => {
    const section = renderDomainSection("health", vitalityOnlyFindings(), "overview", template);
    expect(section.text).toContain(template.closingNote[0]);
    expect(section.text).not.toContain(ILLNESS_CLAUSE);
    expect(section.text).not.toContain(LONGEVITY_CLAUSE);
    expect(section.text).toContain("Moon is debilitated in Scorpio, in the 5th house, and is also the Lagna lord.");
  });

  it("vitality-only, full: both topic-specific clauses fire once the (neutral) 6th/8th-lord findings surface as additional context", () => {
    const section = renderDomainSection("health", vitalityOnlyFindings(), "full", template);
    expect(section.text).toContain(ILLNESS_CLAUSE);
    expect(section.text).toContain(LONGEVITY_CLAUSE);
    expect(section.text).toContain("Additional context from this chart:");
  });
});

describe("renderDomainSection: thin Health (no findings at all)", () => {
  it("says so plainly and briefly, at every depth", () => {
    const essence = renderDomainSection("health", [], "essence", template);
    const overview = renderDomainSection("health", [], "overview", template);
    const full = renderDomainSection("health", [], "full", template);

    expect(essence.text).toBe("No single placement dominates the health picture in this chart.");
    expect(overview.text).toContain("Health does not carry a strong signature in this chart");
    expect(full.text).toBe(overview.text);
    expect(essence.sourceFindingIds).toEqual([]);
  });
});

describe("renderDomainSection: Health evidence or silence (mechanical proof)", () => {
  it("full-depth output is composed ENTIRELY of template framing + real finding statements", () => {
    const findings = weakHealthFindings();
    const section = renderDomainSection("health", findings, "full", template);

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
    for (const f of findings.filter((f) => f.domain.includes("health"))) remainder = remainder.split(f.statement).join("");

    expect(remainder.trim()).toBe("");
  });
});
