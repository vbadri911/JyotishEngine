/**
 * Full Blueprint content assembly (P6) -- pulls together interpretation.md's
 * "Full-depth document structure" sections 1-7 (Natal chart decoded,
 * Personality, Purpose, Career & Wealth, Relationships & Family, Health,
 * Timeline), the same format-agnostic-content-then-format-specific-render
 * split as `essenceDocument.ts`/`overviewDocument.ts`. Section 8 (Remedies &
 * Executive Summary) has zero content anywhere in this codebase -- per
 * explicit instruction, this module marks it clearly as not yet available
 * rather than omitting it silently or inventing placeholder content.
 *
 * Sections 1-2 (`buildNatalChartSectionContent()`, `buildPersonalitySectionContent()`)
 * already have their own dedicated content assemblers, built in the previous
 * session -- reused here unchanged. Sections 3-7 previously had no assembler
 * at all: `renderDomainSection()`/`renderTimingSection()` at `full` depth
 * existed and were tested, but nothing pulled them into one Full Blueprint
 * object (BACKLOG.md's "sections 3-7 assembly gap"). This module is that
 * assembler.
 *
 * interpretation.md's own section structure groups two of the six existing
 * domains under one heading each ("Career & Wealth", "Relationships &
 * Family") rather than the flat six-domain list Essence/Overview use --
 * matched here via `FullBlueprintSection.paragraphs` (one entry per domain
 * actually covered under that heading). "Relationships & Family" has only
 * ONE paragraph (Relationships) -- there is no separate Family content
 * anywhere in this codebase (BACKLOG.md's own "Health's and Relationships'
 * domain-mapping table" gap: parents/siblings aren't covered by any
 * finding-generator yet) -- the heading uses interpretation.md's literal
 * title, but nothing here claims Family coverage that doesn't exist.
 */
import type { ChartData, Finding } from "../types.js";
import type { DashaComputationResult } from "../engine/dasha.js";
import { renderDomainSection } from "../narrative/render.js";
import { renderTimingSection } from "../narrative/timing.js";
import { buildNatalChartSectionContent, type NatalChartTemplate, type NatalChartSectionContent } from "./natalChartSection.js";
import { buildPersonalitySectionContent, type PersonalityTemplate, type PersonalitySectionContent } from "./personalitySection.js";
import { formatSettingsDisclosure } from "./settingsDisclosure.js";
import { type SixDomainTemplates } from "./templates.js";

export interface FullBlueprintParagraph {
  label: string;
  text: string;
}

export interface FullBlueprintSection {
  heading: string;
  paragraphs: FullBlueprintParagraph[];
}

export interface FullDocumentContent {
  title: string;
  natal: NatalChartSectionContent;
  personality: PersonalitySectionContent;
  purpose: FullBlueprintSection;
  careerAndWealth: FullBlueprintSection;
  relationshipsAndFamily: FullBlueprintSection;
  health: FullBlueprintSection;
  timeline: FullBlueprintSection;
  /** Section 8 (Remedies & Executive Summary) -- zero content anywhere in
   *  this codebase as of this build. Marked explicitly, not omitted. */
  remedies: { heading: string; notice: string };
  settingsDisclosure: string;
}

export function buildFullDocumentContent(
  chart: ChartData,
  findings: Finding[],
  dasha: DashaComputationResult,
  templates: SixDomainTemplates,
  natalTemplate: NatalChartTemplate,
  personalityTemplate: PersonalityTemplate,
  asOfISO?: string
): FullDocumentContent {
  const natal = buildNatalChartSectionContent(chart, findings, natalTemplate);
  const personality = buildPersonalitySectionContent(chart, personalityTemplate);

  const purpose: FullBlueprintSection = {
    heading: "Purpose",
    paragraphs: [{ label: "Purpose", text: renderDomainSection("purpose", findings, "full", templates.purpose).text }],
  };

  const careerAndWealth: FullBlueprintSection = {
    heading: "Career & Wealth",
    paragraphs: [
      { label: "Career", text: renderDomainSection("career", findings, "full", templates.career).text },
      { label: "Wealth", text: renderDomainSection("wealth", findings, "full", templates.wealth).text },
    ],
  };

  const relationshipsAndFamily: FullBlueprintSection = {
    heading: "Relationships & Family",
    paragraphs: [
      { label: "Relationships", text: renderDomainSection("relationships", findings, "full", templates.relationships).text },
    ],
  };

  const health: FullBlueprintSection = {
    heading: "Health",
    paragraphs: [{ label: "Health", text: renderDomainSection("health", findings, "full", templates.health).text }],
  };

  const timeline: FullBlueprintSection = {
    heading: "Timeline",
    paragraphs: [
      { label: "Timeline", text: renderTimingSection(dasha, chart.input.date, "full", templates.timing, asOfISO).text },
    ],
  };

  return {
    title: "Full Blueprint",
    natal,
    personality,
    purpose,
    careerAndWealth,
    relationshipsAndFamily,
    health,
    timeline,
    remedies: {
      heading: "Remedies & Executive Summary",
      notice:
        "This section is not yet available in this build. Remedies requires its own primary-source-verified reference material (none exists yet in this project -- see BACKLOG.md), and interpretation.md does not further describe what an Executive Summary should contain beyond naming it. Both remain open scoping work, not an oversight.",
    },
    settingsDisclosure: formatSettingsDisclosure(chart.settings),
  };
}
