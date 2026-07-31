/**
 * Overview-depth content assembly (P6) -- the first depth that embeds the
 * natal chart. Format-agnostic, mirrors `essenceDocument.ts`'s split between
 * content assembly and format-specific rendering (`overviewPdf.ts`/
 * `overviewDocx.ts`).
 *
 * Maps interpretation.md's Overview description ("chart tables, main yogas
 * with classification, domain summaries, near-term timeline") onto what
 * already exists, rather than inventing new narrative content:
 *   - "Chart tables": the South Indian D1 chart (`renderSouthIndianChartSVG`,
 *     already built) plus a planetary-positions table built directly from
 *     `ChartData.planets` -- no new computation, just tabulating already-
 *     computed facts.
 *   - "Main yogas with classification": every yoga/dosha Finding
 *     (`detectAllCoreYogas()`'s output, identified by having a
 *     `classification` at all -- not filtered by domain tag or polarity, so
 *     ABSENT classifications are included per SKILL.md's classification-
 *     states table ("Report notable absences explicitly... often
 *     reassuring"), not dropped as "nothing to say." Quotes each finding's
 *     own `.statement` verbatim, same evidence-or-silence discipline as
 *     every other narrative surface in this project -- never a fresh label.
 *   - "Domain summaries": the same six domains as Essence, at "overview"
 *     depth instead of "essence" (full paragraphs, not one-sentence
 *     summaries).
 *   - "Near-term timeline": Timing's own "overview" depth already IS this
 *     (the current Mahadasha's remaining Antardashas) -- no separate
 *     component needed beyond calling `renderTimingSection` at "overview".
 */
import type { ChartData, Finding, Graha, SignName } from "../types.js";
import type { DashaComputationResult } from "../engine/dasha.js";
import { renderDomainSection } from "../narrative/render.js";
import { renderTimingSection } from "../narrative/timing.js";
import { renderSouthIndianChartSVG } from "../chart/southIndianChart.js";
import { formatSettingsDisclosure } from "./settingsDisclosure.js";
import { DOMAIN_LABELS, type SixDomainTemplates } from "./templates.js";
import { buildPlanetRows, buildYogaRows, type PlanetRow, type YogaRow } from "./chartTables.js";

export interface DomainSection {
  label: string;
  text: string;
}

export interface OverviewDocumentContent {
  title: string;
  chartSvg: string;
  ascendantLine: string;
  planetRows: PlanetRow[];
  yogaRows: YogaRow[];
  domainSections: DomainSection[];
  settingsDisclosure: string;
}

export function buildOverviewDocumentContent(
  chart: ChartData,
  findings: Finding[],
  dasha: DashaComputationResult,
  templates: SixDomainTemplates,
  asOfISO?: string
): OverviewDocumentContent {
  const planets: Record<string, { sign: SignName; retrograde?: boolean }> = {};
  for (const graha of Object.keys(chart.planets) as Graha[]) {
    planets[graha] = { sign: chart.planets[graha].sign, retrograde: chart.planets[graha].retrograde };
  }
  const chartSvg = renderSouthIndianChartSVG({ lagnaSign: chart.ascendant.sign, planets }, { size: 400 });

  const domainSections: DomainSection[] = (Object.keys(DOMAIN_LABELS) as Array<keyof typeof DOMAIN_LABELS>).map((domain) => ({
    label: DOMAIN_LABELS[domain],
    text: renderDomainSection(domain, findings, "overview", templates[domain]).text,
  }));
  domainSections.push({
    label: "Timing",
    text: renderTimingSection(dasha, chart.input.date, "overview", templates.timing, asOfISO).text,
  });

  return {
    title: "Overview",
    chartSvg,
    ascendantLine: `Ascendant: ${chart.ascendant.sign} ${chart.ascendant.degreeInSign.toFixed(2)}°`,
    planetRows: buildPlanetRows(chart),
    yogaRows: buildYogaRows(findings),
    domainSections,
    settingsDisclosure: formatSettingsDisclosure(chart.settings),
  };
}
