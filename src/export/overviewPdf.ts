/**
 * Overview-depth PDF export (P6), via `pdfmake`. See essencePdf.ts's module
 * doc for the library choice, the `@types/pdfmake` default-import fix, and
 * the local/URL access-policy lockdown -- all shared, unchanged reasoning.
 */
import pdfmake from "pdfmake";
import type { Content, ContentTable } from "pdfmake/interfaces.js";
import type { OverviewDocumentContent } from "./overviewDocument.js";
import type { PlanetRow } from "./chartTables.js";

const HELVETICA_FONT_FAMILY = {
  Helvetica: { normal: "Helvetica", bold: "Helvetica-Bold", italics: "Helvetica-Oblique", bolditalics: "Helvetica-BoldOblique" },
};
const ALLOWED_LOCAL_FONT_NAMES = new Set(Object.values(HELVETICA_FONT_FAMILY.Helvetica));

let accessPoliciesLocked = false;
function lockAccessPoliciesOnce(): void {
  if (accessPoliciesLocked) return;
  pdfmake.setLocalAccessPolicy((path) => ALLOWED_LOCAL_FONT_NAMES.has(path));
  pdfmake.setUrlAccessPolicy(() => false);
  accessPoliciesLocked = true;
}

function planetRowLine(row: PlanetRow): (string | { text: string; italics?: boolean })[] {
  const flags = [row.retrograde ? "R" : null, row.combust ? "Combust" : null].filter(Boolean).join(", ");
  return [
    row.graha,
    row.sign,
    row.degreeInSign.toFixed(2) + "°",
    `${row.nakshatraName} (${row.pada})`,
    String(row.house),
    row.dignity,
    flags || "-",
  ];
}

function planetTable(rows: PlanetRow[]): ContentTable {
  return {
    table: {
      headerRows: 1,
      widths: ["auto", "auto", "auto", "auto", "auto", "auto", "*"],
      body: [
        ["Graha", "Sign", "Deg", "Nakshatra (Pada)", "House", "Dignity", "Notes"].map((h) => ({ text: h, bold: true })),
        ...rows.map(planetRowLine),
      ],
    },
    fontSize: 9,
    margin: [0, 0, 0, 12],
  };
}

function yogaTable(rows: OverviewDocumentContent["yogaRows"]): ContentTable {
  return {
    table: {
      headerRows: 1,
      widths: ["auto", "*"],
      body: [
        ["Classification", "Finding"].map((h) => ({ text: h, bold: true })),
        ...rows.map((r) => [r.classification, r.statement]),
      ],
    },
    fontSize: 9,
    margin: [0, 0, 0, 12],
  };
}

export async function exportOverviewPdf(content: OverviewDocumentContent): Promise<Buffer> {
  lockAccessPoliciesOnce();
  pdfmake.addFonts(HELVETICA_FONT_FAMILY);

  const docContent: Content[] = [
    { text: content.title, style: "title" },
    { text: "Natal Chart (D1)", style: "sectionHeading" },
    { svg: content.chartSvg, width: 260 },
    { text: content.ascendantLine, margin: [0, 4, 0, 12] },
    { text: "Planetary Positions", style: "sectionHeading" },
    planetTable(content.planetRows),
    { text: "Yogas & Doshas", style: "sectionHeading" },
    yogaTable(content.yogaRows),
    { text: "Domain Summaries", style: "sectionHeading" },
    ...content.domainSections.flatMap((section) => [
      { text: section.label, style: "domainLabel" },
      { text: section.text, margin: [0, 0, 0, 10] as [number, number, number, number] },
    ]),
    { text: content.settingsDisclosure, style: "disclosure" },
  ];

  const pdfDoc = pdfmake.createPdf({
    defaultStyle: { font: "Helvetica", fontSize: 11 },
    content: docContent,
    styles: {
      title: { fontSize: 18, bold: true, margin: [0, 0, 0, 16] },
      sectionHeading: { fontSize: 14, bold: true, margin: [0, 12, 0, 6] },
      domainLabel: { fontSize: 12, bold: true, margin: [0, 6, 0, 2] },
      disclosure: { fontSize: 8, color: "#666666", margin: [0, 16, 0, 0] },
    },
  });

  return pdfDoc.getBuffer();
}
