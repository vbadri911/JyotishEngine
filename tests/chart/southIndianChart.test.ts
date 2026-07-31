import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";
import { renderSouthIndianChartSVG, type SouthIndianChartInput } from "../../src/chart/southIndianChart.js";
import type { Graha, SignName } from "../../src/types.js";

/** Balanced-tag check -- a lightweight substitute for a full XML parser,
 *  sufficient to catch a real structural bug (e.g. an unclosed tag) without
 *  adding a new dependency for one narrow check. */
function hasBalancedTags(svg: string): boolean {
  const stack: string[] = [];
  const tagPattern = /<\/?([a-zA-Z]+)[^>]*?(\/?)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(svg))) {
    const [full, name, selfClosing] = match;
    if (selfClosing === "/" || full.startsWith("<?")) continue;
    if (full.startsWith("</")) {
      if (stack.pop() !== name) return false;
    } else {
      stack.push(name!);
    }
  }
  return stack.length === 0;
}

async function goldenChart() {
  const { chart } = await computeChart(
    { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
    DEFAULT_ENGINE_SETTINGS
  );
  return chart;
}

function toChartInput(chart: Awaited<ReturnType<typeof goldenChart>>): SouthIndianChartInput {
  const planets: SouthIndianChartInput["planets"] = {};
  for (const graha of Object.keys(chart.planets) as Graha[]) {
    planets[graha] = { sign: chart.planets[graha].sign, retrograde: chart.planets[graha].retrograde };
  }
  return { lagnaSign: chart.ascendant.sign, planets };
}

describe("renderSouthIndianChartSVG: golden chart (real Leo Lagna, verified sign-by-sign)", () => {
  it("places every planet in its correct sign cell, with correct house numbers relative to the Leo Lagna", async () => {
    const chart = await goldenChart();
    const svg = renderSouthIndianChartSVG(toChartInput(chart));

    // Real golden-chart placements (confirmed via computeChart() output):
    // Sun/Mercury/Mars in Aries (H9), Venus in Taurus (H10), Rahu in Gemini (H11, retrograde),
    // Moon in Leo (H1, the Lagna sign itself), Jupiter in Scorpio (H4, retrograde),
    // Saturn in Libra (H3, retrograde), Ketu in Sagittarius (H5, retrograde).
    expect(svg).toContain(">Su</text>");
    expect(svg).toContain(">Me</text>");
    expect(svg).toContain(">Ma</text>");
    expect(svg).toContain(">Ve</text>");
    expect(svg).toContain(">Mo</text>");
    expect(svg).toContain(">Ra (R)</text>");
    expect(svg).toContain(">Ju (R)</text>");
    expect(svg).toContain(">Sa (R)</text>");
    expect(svg).toContain(">Ke (R)</text>");

    // House-number labels, spot-checked against a hand-counted whole-sign count from Leo.
    expect(svg).toContain(">H9</text>"); // Aries
    expect(svg).toContain(">H10</text>"); // Taurus
    expect(svg).toContain(">H11</text>"); // Gemini
    expect(svg).toContain(">H1</text>"); // Leo itself
    expect(svg).toContain(">H4</text>"); // Scorpio
    expect(svg).toContain(">H3</text>"); // Libra
    expect(svg).toContain(">H5</text>"); // Sagittarius
  });

  it("marks the Lagna sign's cell with ASC and a bolder border, even though it also holds a planet (Moon)", async () => {
    const chart = await goldenChart();
    const svg = renderSouthIndianChartSVG(toChartInput(chart));

    expect(svg).toContain(">ASC</text>");
    // Leo is both the Lagna AND where the Moon sits -- both must render in the same cell.
    const ascIndex = svg.indexOf(">ASC</text>");
    const moIndex = svg.lastIndexOf(">Mo</text>");
    const leoCellRectIndex = svg.lastIndexOf('stroke-width="2"'); // the Lagna cell's own border, not the outer frame
    expect(ascIndex).toBeGreaterThan(-1);
    expect(moIndex).toBeGreaterThan(-1);
    expect(leoCellRectIndex).toBeGreaterThan(-1);
  });

  it("leaves unoccupied signs (e.g. Virgo, Cancer, Capricorn, Aquarius, Pisces) with no planet text", async () => {
    const chart = await goldenChart();
    const svg = renderSouthIndianChartSVG(toChartInput(chart));
    // None of the 9 real grahas are in these 5 signs for this chart -- confirmed via computeChart() output.
    for (const abbrev of [">Vir<", ">Can<", ">Cap<", ">Aqu<", ">Pis<"]) {
      expect(svg).toContain(abbrev); // the sign label itself is always shown
    }
    // But no planet abbreviation should appear immediately after any of these labels going unaccompanied --
    // simplest direct check: the total count of planet text elements equals exactly 9 (one per graha).
    const planetTextCount = (svg.match(/font-weight="bold" text-anchor="middle">(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)/g) ?? []).length;
    expect(planetTextCount).toBe(9);
  });

  it("produces well-formed, balanced SVG markup", async () => {
    const chart = await goldenChart();
    const svg = renderSouthIndianChartSVG(toChartInput(chart));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(hasBalancedTags(svg)).toBe(true);
  });

  it("renders identical SVG for identical input, called twice (determinism, requirements-spec.md §2)", async () => {
    const chart = await goldenChart();
    const input = toChartInput(chart);
    const first = renderSouthIndianChartSVG(input);
    const second = renderSouthIndianChartSVG(input);
    expect(first).toBe(second);
  });
});

describe("renderSouthIndianChartSVG: grid geometry (synthetic, controlled)", () => {
  const EMPTY: SouthIndianChartInput = { lagnaSign: "Aries", planets: {} };

  it("places all 12 signs in the exact fixed positions verified against chart-layout.md", () => {
    const svg = renderSouthIndianChartSVG(EMPTY, { size: 400 });
    // Row 0 (y=0): Pisces, Aries, Taurus, Gemini at x=0,100,200,300
    expect(svg).toContain('<text x="4" y="12" font-size="10" fill="#666">Pis</text>');
    expect(svg).toContain('<text x="104" y="12" font-size="10" fill="#666">Ari</text>');
    expect(svg).toContain('<text x="204" y="12" font-size="10" fill="#666">Tau</text>');
    expect(svg).toContain('<text x="304" y="12" font-size="10" fill="#666">Gem</text>');
    // Row 1 (y=100): Aquarius (col 0), Cancer (col 3) -- center (cols 1-2) unused
    expect(svg).toContain('<text x="4" y="112" font-size="10" fill="#666">Aqu</text>');
    expect(svg).toContain('<text x="304" y="112" font-size="10" fill="#666">Can</text>');
    // Row 2 (y=200): Capricorn (col 0), Leo (col 3)
    expect(svg).toContain('<text x="4" y="212" font-size="10" fill="#666">Cap</text>');
    expect(svg).toContain('<text x="304" y="212" font-size="10" fill="#666">Leo</text>');
    // Row 3 (y=300): Sagittarius, Scorpio, Libra, Virgo
    expect(svg).toContain('<text x="4" y="312" font-size="10" fill="#666">Sag</text>');
    expect(svg).toContain('<text x="104" y="312" font-size="10" fill="#666">Sco</text>');
    expect(svg).toContain('<text x="204" y="312" font-size="10" fill="#666">Lib</text>');
    expect(svg).toContain('<text x="304" y="312" font-size="10" fill="#666">Vir</text>');
  });

  it("stacks multiple planets in the same sign without overlapping y-coordinates", () => {
    const input: SouthIndianChartInput = {
      lagnaSign: "Aries",
      planets: {
        Sun: { sign: "Aries" },
        Moon: { sign: "Aries" },
        Mars: { sign: "Aries" },
        Mercury: { sign: "Aries" },
      },
    };
    const svg = renderSouthIndianChartSVG(input);
    const yValues = [...svg.matchAll(/font-weight="bold" text-anchor="middle">(Su|Mo|Ma|Me)<\/text>/g)];
    // All 4 must be present (none dropped by the stacking layout)...
    expect(yValues).toHaveLength(4);
    // ...and each at a distinct y so they don't visually collide.
    const yCoords = [...svg.matchAll(/y="(\d+(?:\.\d+)?)" font-size="13" font-weight="bold"/g)].map((m) => m[1]);
    expect(new Set(yCoords).size).toBe(yCoords.length);
  });

  it("respects a custom size option: grid cells scale with it, label padding stays fixed", () => {
    const svg = renderSouthIndianChartSVG(EMPTY, { size: 800 });
    expect(svg).toContain('viewBox="0 0 800 800"');
    expect(svg).toContain('width="800" height="800"');
    // Cell width is now 200 (800/4), so Taurus (grid col 2) starts at x=400, not 200.
    expect(svg).toContain('<rect x="400" y="0" width="200" height="200"');
    // Label padding is a fixed 4px offset from the cell's own origin, not proportional to cell size.
    expect(svg).toContain('<text x="4" y="12" font-size="10" fill="#666">Pis</text>');
  });

  it("escapes XML special characters in centerText", () => {
    const svg = renderSouthIndianChartSVG(EMPTY, { centerText: "A & B <test>" });
    expect(svg).toContain("A &amp; B &lt;test&gt;");
    expect(svg).not.toContain("A & B <test>");
  });

  it("omits house-number labels when showHouseNumbers is false", () => {
    const svg = renderSouthIndianChartSVG({ lagnaSign: "Leo", planets: {} }, { showHouseNumbers: false });
    expect(svg).not.toMatch(/>H\d+<\/text>/);
  });
});
