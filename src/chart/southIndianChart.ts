/**
 * South Indian chart SVG rendering (P6). Pure function of already-computed
 * chart facts -- no ephemeris dependency, generates a deterministic SVG
 * string. See `.claude/skills/jyotish-engine/references/chart-layout.md` for
 * the grid layout itself and its citation trail -- this is a genuinely
 * different kind of constant than the ones elsewhere in this project
 * (exaltation degrees, dasha years): a fixed, universal geometric convention,
 * not a school-dependent rule, but not documented anywhere in this skill's
 * existing reference files either, so it was verified against four
 * independent open-source implementations before being relied on here
 * (see DECISIONS.md).
 *
 * Deliberately decoupled from `ChartData` -- takes only a Lagna sign and a
 * planet-to-sign map, not the full chart -- so the SAME renderer works for
 * D9 (Navamsa) or any other varga later without changes, once that chart's
 * own sign placements are computed (not done yet; D1 is P6's only scope for
 * now, per BACKLOG.md).
 */
import type { ChartData, Graha, SignName } from "../types.js";
import { houseOf } from "../engine/houses.js";

/**
 * Row-major 4x4 grid; null marks the unused center block. Verified against
 * four independent implementations (stellium, go-vedic-astro-charts, a
 * SolidJS Vedic chart component, a React Native tutorial) -- see
 * chart-layout.md. Signs are FIXED here regardless of Lagna; only the house
 * numbers and the "ASC" marker move.
 */
const GRID_SIGNS: readonly (SignName | null)[] = [
  "Pisces", "Aries", "Taurus", "Gemini",
  "Aquarius", null, null, "Cancer",
  "Capricorn", null, null, "Leo",
  "Sagittarius", "Scorpio", "Libra", "Virgo",
];

const SIGN_ABBREVIATION: Record<SignName, string> = {
  Aries: "Ari", Taurus: "Tau", Gemini: "Gem", Cancer: "Can", Leo: "Leo", Virgo: "Vir",
  Libra: "Lib", Scorpio: "Sco", Sagittarius: "Sag", Capricorn: "Cap", Aquarius: "Aqu", Pisces: "Pis",
};

const PLANET_ABBREVIATION: Record<Graha, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};

export interface SouthIndianChartPlanet {
  sign: SignName;
  retrograde?: boolean;
}

export interface SouthIndianChartInput {
  lagnaSign: SignName;
  planets: Partial<Record<Graha, SouthIndianChartPlanet>>;
}

export interface SouthIndianChartOptions {
  /** Overall SVG width/height in pixels (square). Default 400. */
  size?: number;
  /** Optional short text shown in the unused center block (e.g. a chart title). */
  centerText?: string;
  /** Show each cell's whole-sign house number (relative to lagnaSign). Default true. */
  showHouseNumbers?: boolean;
}

/**
 * D1 (Rasi) sign-placement assembly for renderSouthIndianChartSVG() --
 * the D9 equivalent of navamsaChart.ts's buildD9ChartInput(), extracted
 * from natalChartSection.ts's own (previously inline, duplicated) mapping
 * so both callers share one implementation. Pure extraction: same fields,
 * same source (chart.ascendant.sign, chart.planets[graha].{sign,retrograde}).
 */
export function buildD1ChartInput(chart: ChartData): SouthIndianChartInput {
  const planets: SouthIndianChartInput["planets"] = {};
  for (const graha of Object.keys(chart.planets) as Graha[]) {
    const p = chart.planets[graha];
    planets[graha] = { sign: p.sign, retrograde: p.retrograde };
  }
  return { lagnaSign: chart.ascendant.sign, planets };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function planetsInSign(input: SouthIndianChartInput, sign: SignName): Array<{ graha: Graha; retrograde: boolean }> {
  const result: Array<{ graha: Graha; retrograde: boolean }> = [];
  for (const graha of Object.keys(input.planets) as Graha[]) {
    const p = input.planets[graha];
    if (p && p.sign === sign) result.push({ graha, retrograde: p.retrograde ?? false });
  }
  return result;
}

/**
 * Renders a South Indian Rasi chart as a self-contained SVG string.
 * Deterministic: identical input always produces identical output
 * (requirements-spec.md §2), since layout, sign positions, and text content
 * are all pure functions of the input -- no randomness, no wall-clock reads.
 */
export function renderSouthIndianChartSVG(input: SouthIndianChartInput, options: SouthIndianChartOptions = {}): string {
  const size = options.size ?? 400;
  const showHouseNumbers = options.showHouseNumbers ?? true;
  const cell = size / 4;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" font-family="sans-serif">`
  );
  parts.push(`<rect x="0" y="0" width="${size}" height="${size}" fill="white" stroke="black" stroke-width="2"/>`);

  // Center block (rows 1-2, cols 1-2): one unused 2x2 area, optional label.
  const centerX = cell;
  const centerY = cell;
  parts.push(`<rect x="${centerX}" y="${centerY}" width="${cell * 2}" height="${cell * 2}" fill="none" stroke="black" stroke-width="1"/>`);
  if (options.centerText) {
    const lines = options.centerText.split("\n");
    const lineHeight = 14;
    const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
    for (const [i, line] of lines.entries()) {
      parts.push(
        `<text x="${size / 2}" y="${startY + i * lineHeight}" font-size="12" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`
      );
    }
  }

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const sign = GRID_SIGNS[row * 4 + col];
      if (!sign) continue; // center block, already drawn above

      const x = col * cell;
      const y = row * cell;
      const isLagna = sign === input.lagnaSign;

      parts.push(
        `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="black" stroke-width="${isLagna ? 2 : 1}"/>`
      );

      // Sign abbreviation, top-left of the cell.
      parts.push(
        `<text x="${x + 4}" y="${y + 12}" font-size="10" fill="#666">${SIGN_ABBREVIATION[sign]}</text>`
      );

      if (showHouseNumbers) {
        const house = houseOf(input.lagnaSign, sign);
        parts.push(
          `<text x="${x + cell - 4}" y="${y + 12}" font-size="10" fill="#666" text-anchor="end">H${house}</text>`
        );
      }

      if (isLagna) {
        parts.push(
          `<text x="${x + cell / 2}" y="${y + cell - 6}" font-size="10" fill="#b45309" text-anchor="middle" font-weight="bold">ASC</text>`
        );
      }

      const occupants = planetsInSign(input, sign);
      const lineHeight = 14;
      const startY = y + cell / 2 - ((occupants.length - 1) * lineHeight) / 2 + 4;
      occupants.forEach((p, i) => {
        const label = PLANET_ABBREVIATION[p.graha] + (p.retrograde ? " (R)" : "");
        parts.push(
          `<text x="${x + cell / 2}" y="${startY + i * lineHeight}" font-size="13" font-weight="bold" text-anchor="middle">${label}</text>`
        );
      });
    }
  }

  parts.push("</svg>");
  return parts.join("");
}
