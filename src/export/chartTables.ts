/**
 * Chart-table assembly shared across every export depth that tabulates
 * already-computed chart facts (Overview, and now Natal chart decoded at
 * Full depth) -- extracted from `overviewDocument.ts` once a second consumer
 * needed the identical planetary-positions/yoga-classification tables,
 * matching this project's existing pattern (`templates.ts`/
 * `settingsDisclosure.ts` were split out of `essenceDocument.ts` the same way
 * when `overviewDocument.ts` became a second consumer).
 */
import type { ChartData, Dignity, Finding, Graha, SignName } from "../types.js";
import nakshatrasData from "../../data/nakshatras.json" with { type: "json" };

const NAKSHATRA_NAME_BY_NUM: Record<number, string> = Object.fromEntries(
  nakshatrasData.list.map((n) => [n.num, n.name])
);

export interface PlanetRow {
  graha: Graha;
  sign: SignName;
  degreeInSign: number;
  nakshatraName: string;
  pada: number;
  house: number;
  dignity: Dignity;
  retrograde: boolean;
  combust: boolean;
}

export interface YogaRow {
  statement: string;
  classification: NonNullable<Finding["classification"]>;
}

export function buildPlanetRows(chart: ChartData): PlanetRow[] {
  return (Object.keys(chart.planets) as Graha[]).map((graha) => {
    const p = chart.planets[graha];
    return {
      graha,
      sign: p.sign,
      degreeInSign: p.degreeInSign,
      nakshatraName: NAKSHATRA_NAME_BY_NUM[p.nakshatra] ?? `#${p.nakshatra}`,
      pada: p.pada,
      house: p.house,
      dignity: p.dignity,
      retrograde: p.retrograde,
      combust: p.combust,
    };
  });
}

/** Every yoga/dosha Finding, identified by carrying a classification at all
 *  -- deliberately not filtered by domain tag (a Finding with no domain tag,
 *  e.g. Ruchaka/Bhadra/Kemadruma per the domain-tag audit, is still a real
 *  yoga classification worth reporting here) or by polarity (ABSENT
 *  classifications are informative, per SKILL.md, not padding). */
export function buildYogaRows(findings: Finding[]): YogaRow[] {
  return findings
    .filter((f): f is Finding & { classification: NonNullable<Finding["classification"]> } => f.classification !== undefined)
    .map((f) => ({ statement: f.statement, classification: f.classification }));
}
