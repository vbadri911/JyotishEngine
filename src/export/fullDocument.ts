/**
 * Full Blueprint content assembly (P6) -- pulls together interpretation.md's
 * full "Full-depth document structure", all 8 sections (Natal chart decoded,
 * Personality, Purpose, Career & Wealth, Relationships & Family, Health,
 * Timeline, Remedies & Executive Summary), the same
 * format-agnostic-content-then-format-specific-render split as
 * `essenceDocument.ts`/`overviewDocument.ts`.
 *
 * Sections 1-2 (`buildNatalChartSectionContent()`, `buildPersonalitySectionContent()`)
 * already have their own dedicated content assemblers, built in an earlier
 * session -- reused here unchanged. Sections 3-7 previously had no assembler
 * at all: `renderDomainSection()`/`renderTimingSection()` at `full` depth
 * existed and were tested, but nothing pulled them into one Full Blueprint
 * object (BACKLOG.md's "sections 3-7 assembly gap"). Section 8
 * (`buildRemediesSectionContent()`, remediesSection.ts) was the last
 * previously-unbuilt section -- see that module's own doc for the Executive
 * Summary selection logic and the Tier 1 Remedies wiring (`asOfISO`-
 * conditional, computed fresh here, not read from the aggregated `findings`
 * array baked in at `computeChart()`'s own internal "now").
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
import { buildRemediesSectionContent, type RemediesTemplate, type RemediesSectionContent } from "./remediesSection.js";
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
  /** Section 8 (Remedies & Executive Summary) -- real content, not a placeholder. */
  remedies: RemediesSectionContent;
  settingsDisclosure: string;
}

export function buildFullDocumentContent(
  chart: ChartData,
  findings: Finding[],
  dasha: DashaComputationResult,
  templates: SixDomainTemplates,
  natalTemplate: NatalChartTemplate,
  personalityTemplate: PersonalityTemplate,
  remediesTemplate: RemediesTemplate,
  asOfISO?: string
): FullDocumentContent {
  const natal = buildNatalChartSectionContent(chart, findings, natalTemplate);
  const personality = buildPersonalitySectionContent(chart, personalityTemplate);
  const remedies = buildRemediesSectionContent(chart, findings, dasha, remediesTemplate, asOfISO);

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
    remedies,
    settingsDisclosure: formatSettingsDisclosure(chart.settings),
  };
}
