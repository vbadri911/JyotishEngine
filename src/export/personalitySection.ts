/**
 * Personality section content assembly (Full Blueprint only). Same split as
 * `natalChartSection.ts` between structured content and a future format-
 * specific renderer -- see that module's doc for why Full Blueprint's own
 * PDF/DOCX pipeline isn't built yet.
 */
import type { ChartData } from "../types.js";
import { lagnaTemperamentNote, lagnaLordNote } from "../narrative/personality.js";

function selectVariant(options: string[], seed: string): string {
  if (options.length === 0) throw new Error("Unreachable: template variant array is empty");
  if (options.length === 1) return options[0]!;
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = (hash * 33) ^ seed.charCodeAt(i);
  return options[(hash >>> 0) % options.length]!;
}

export interface PersonalityTemplate {
  section: "personality";
  intro: string[];
  closingNote: string[];
}

export interface PersonalitySectionContent {
  title: string;
  introText: string;
  lagnaTemperamentText: string;
  lagnaLordText: string;
  closingText: string;
}

export function buildPersonalitySectionContent(chart: ChartData, template: PersonalityTemplate): PersonalitySectionContent {
  const seed = chart.ascendant.sign;
  return {
    title: "Personality",
    introText: selectVariant(template.intro, seed),
    lagnaTemperamentText: lagnaTemperamentNote(chart).statement,
    lagnaLordText: lagnaLordNote(chart).statement,
    closingText: selectVariant(template.closingNote, seed),
  };
}
