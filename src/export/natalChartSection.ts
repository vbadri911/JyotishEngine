/**
 * Natal chart decoded (Full Blueprint only -- interpretation.md's "Full-depth
 * document structure" item 1: "D1/D9 tables, dignity map, house-by-house and
 * planet-by-planet notes, nakshatra analysis, yoga table with
 * classification"). Format-agnostic content assembly, same split as
 * `essenceDocument.ts`/`overviewDocument.ts` between assembling structured
 * content and format-specific rendering (a future `fullPdf.ts`/`fullDocx.ts`
 * -- Full Blueprint's own document/pagination pipeline isn't built yet, see
 * BACKLOG.md; this module produces the one section's content so that build
 * doesn't also have to re-derive Natal chart decoded's own content from
 * scratch).
 *
 * Maps each element of interpretation.md's description onto what this
 * session's Full Blueprint design gate (DECISIONS.md, 2026-07-30) scoped:
 *   - "D1/D9 tables" + "nakshatra analysis": the same planetary-positions
 *     table Overview already uses (`chartTables.ts`'s `PlanetRow`, which
 *     already carries nakshatra name + pada per planet) plus the D1 and D9
 *     chart SVGs (`southIndianChart.ts`, `navamsaChart.ts`) -- table-only for
 *     nakshatra, no new interpretive prose, per the confirmed scope.
 *   - "House-by-house and planet-by-planet notes": `narrative/natal.ts`'s
 *     `allPlanetNotes()`/`allHouseNotes()` -- all 9 planets, all 12 houses,
 *     deliberately broader than the domain-scoped `dignityFindings()`/
 *     `houseLordFindings()` (see that module's own doc for why this is safe).
 *   - "Yoga table with classification": the same `buildYogaRows()` Overview
 *     already uses -- every yoga/dosha Finding with a classification,
 *     including ABSENT, unfiltered by domain tag.
 */
import type { ChartData, Finding } from "../types.js";
import { renderSouthIndianChartSVG, buildD1ChartInput } from "../chart/southIndianChart.js";
import { buildD9ChartInput } from "../chart/navamsaChart.js";
import { allPlanetNotes, allHouseNotes, type PlanetNote, type HouseNote } from "../narrative/natal.js";
import { buildPlanetRows, buildYogaRows, type PlanetRow, type YogaRow } from "./chartTables.js";
import { formatSettingsDisclosure } from "./settingsDisclosure.js";

function selectVariant(options: string[], seed: string): string {
  if (options.length === 0) throw new Error("Unreachable: template variant array is empty");
  if (options.length === 1) return options[0]!;
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = (hash * 33) ^ seed.charCodeAt(i);
  return options[(hash >>> 0) % options.length]!;
}

export interface NatalChartTemplate {
  section: "natal";
  introChartTables: string[];
  introD9: string[];
  introPlanetNotes: string[];
  introHouseNotes: string[];
  introYogaTable: string[];
  closingNote: string[];
}

export interface NatalChartSectionContent {
  title: string;
  introChartTablesText: string;
  chartSvgD1: string;
  ascendantLine: string;
  planetRows: PlanetRow[];
  introD9Text: string;
  chartSvgD9: string;
  d9AscendantLine: string;
  introPlanetNotesText: string;
  planetNotes: PlanetNote[];
  introHouseNotesText: string;
  houseNotes: HouseNote[];
  introYogaTableText: string;
  yogaRows: YogaRow[];
  closingText: string;
  settingsDisclosure: string;
}

export function buildNatalChartSectionContent(
  chart: ChartData,
  findings: Finding[],
  template: NatalChartTemplate
): NatalChartSectionContent {
  const seed = chart.ascendant.sign;

  const chartSvgD1 = renderSouthIndianChartSVG(buildD1ChartInput(chart), { size: 400, centerText: "D1\nRasi" });

  const d9Input = buildD9ChartInput(chart);
  const chartSvgD9 = renderSouthIndianChartSVG(d9Input, { size: 400, centerText: "D9\nNavamsa" });

  return {
    title: "Natal chart decoded",
    introChartTablesText: selectVariant(template.introChartTables, seed),
    chartSvgD1,
    ascendantLine: `Ascendant: ${chart.ascendant.sign} ${chart.ascendant.degreeInSign.toFixed(2)}°`,
    planetRows: buildPlanetRows(chart),
    introD9Text: selectVariant(template.introD9, seed),
    chartSvgD9,
    d9AscendantLine: `D9 Ascendant: ${d9Input.lagnaSign}`,
    introPlanetNotesText: selectVariant(template.introPlanetNotes, seed),
    planetNotes: allPlanetNotes(chart),
    introHouseNotesText: selectVariant(template.introHouseNotes, seed),
    houseNotes: allHouseNotes(chart),
    introYogaTableText: selectVariant(template.introYogaTable, seed),
    yogaRows: buildYogaRows(findings),
    closingText: selectVariant(template.closingNote, seed),
    settingsDisclosure: formatSettingsDisclosure(chart.settings),
  };
}
