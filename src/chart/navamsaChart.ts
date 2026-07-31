/**
 * D9 (Navamsa) sign-placement assembly for `renderSouthIndianChartSVG()`.
 * The renderer is deliberately decoupled from `ChartData` (see
 * southIndianChart.ts) so it works unchanged for any varga once that varga's
 * own sign placements exist -- this was the one missing piece for D9,
 * already scoped as small and bounded in BACKLOG.md.
 */
import type { ChartData, Graha } from "../types.js";
import { navamsaSign } from "../engine/varga.js";
import type { SouthIndianChartInput } from "./southIndianChart.js";

export function buildD9ChartInput(chart: ChartData): SouthIndianChartInput {
  const planets: SouthIndianChartInput["planets"] = {};
  for (const graha of Object.keys(chart.planets) as Graha[]) {
    const p = chart.planets[graha];
    planets[graha] = { sign: navamsaSign(p.sign, p.degreeInSign), retrograde: p.retrograde };
  }
  return {
    lagnaSign: navamsaSign(chart.ascendant.sign, chart.ascendant.degreeInSign),
    planets,
  };
}
