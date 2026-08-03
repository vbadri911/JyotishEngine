/**
 * Full Blueprint PDF export (P6), via `pdfmake`. See essencePdf.ts's module
 * doc for the library choice, the default-import fix, and the access-policy
 * lockdown -- all shared, unchanged reasoning.
 *
 * First real, measured Full Blueprint output -- interpretation.md/
 * requirements-spec.md estimate 40-60 pages, but that number was never
 * validated against real content (Overview's own spec estimate, "~10 pages,"
 * turned out to be a 2-page real document once built -- DECISIONS.md,
 * 2026-07-30). This module does not target a page count; it renders the
 * real content sections 1-7 assemble, plus section 8's explicit
 * not-yet-available notice, and the real page count is measured afterward
 * from the actual generated PDF (see tests/export/fullDocument.test.ts and
 * DECISIONS.md for the measured result).
 */
import pdfmake from "pdfmake";
import type { Content, ContentTable } from "pdfmake/interfaces.js";
import type { FullDocumentContent, FullBlueprintSection } from "./fullDocument.js";
import type { PlanetRow } from "./chartTables.js";
import type { PlanetNote, HouseNote } from "../narrative/natal.js";

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
  return [row.graha, row.sign, row.degreeInSign.toFixed(2) + "°", `${row.nakshatraName} (${row.pada})`, String(row.house), row.dignity, flags || "-"];
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

function yogaTable(rows: FullDocumentContent["natal"]["yogaRows"]): ContentTable {
  return {
    table: { headerRows: 1, widths: ["auto", "*"], body: [["Classification", "Finding"].map((h) => ({ text: h, bold: true })), ...rows.map((r) => [r.classification, r.statement])] },
    fontSize: 9,
    margin: [0, 0, 0, 12],
  };
}

function noteList(notes: (PlanetNote | HouseNote)[]): Content {
  return { ul: notes.map((n) => n.statement), fontSize: 10, margin: [0, 0, 0, 12] };
}

function blueprintSection(section: FullBlueprintSection): Content[] {
  return [
    { text: section.heading, style: "sectionHeading" },
    ...section.paragraphs.flatMap((p) => [
      { text: p.label, style: "domainLabel" },
      { text: p.text, margin: [0, 0, 0, 10] as [number, number, number, number] },
    ]),
  ];
}

export async function exportFullPdf(content: FullDocumentContent): Promise<Buffer> {
  lockAccessPoliciesOnce();
  pdfmake.addFonts(HELVETICA_FONT_FAMILY);

  const { natal, personality } = content;

  const docContent: Content[] = [
    { text: content.title, style: "title" },

    { text: natal.title, style: "sectionHeading" },
    { text: natal.introChartTablesText, margin: [0, 0, 0, 8] as [number, number, number, number] },
    { text: "Rasi Chart (D1)", style: "domainLabel" },
    { svg: natal.chartSvgD1, width: 220 },
    { text: natal.ascendantLine, margin: [0, 4, 0, 12] as [number, number, number, number] },
    { text: "Planetary Positions", style: "domainLabel" },
    planetTable(natal.planetRows),
    { text: natal.introD9Text, margin: [0, 0, 0, 8] as [number, number, number, number] },
    { text: "Navamsa Chart (D9)", style: "domainLabel" },
    { svg: natal.chartSvgD9, width: 220 },
    { text: natal.d9AscendantLine, margin: [0, 4, 0, 12] as [number, number, number, number] },
    { text: natal.introPlanetNotesText, margin: [0, 0, 0, 4] as [number, number, number, number] },
    noteList(natal.planetNotes),
    { text: natal.introHouseNotesText, margin: [0, 0, 0, 4] as [number, number, number, number] },
    noteList(natal.houseNotes),
    { text: natal.introYogaTableText, margin: [0, 0, 0, 4] as [number, number, number, number] },
    yogaTable(natal.yogaRows),
    { text: natal.closingText, italics: true, margin: [0, 0, 0, 12] as [number, number, number, number] },

    { text: personality.title, style: "sectionHeading" },
    { text: personality.introText, margin: [0, 0, 0, 8] as [number, number, number, number] },
    { text: personality.lagnaTemperamentText, margin: [0, 0, 0, 6] as [number, number, number, number] },
    { text: personality.lagnaLordText, margin: [0, 0, 0, 8] as [number, number, number, number] },
    { text: personality.closingText, italics: true, margin: [0, 0, 0, 12] as [number, number, number, number] },

    ...blueprintSection(content.purpose),
    ...blueprintSection(content.careerAndWealth),
    ...blueprintSection(content.relationshipsAndFamily),
    ...blueprintSection(content.health),
    ...blueprintSection(content.timeline),

    { text: content.remedies.heading, style: "sectionHeading" },
    { text: content.remedies.notice, italics: true, color: "#666666", margin: [0, 0, 0, 12] as [number, number, number, number] },

    { text: content.settingsDisclosure, style: "disclosure" },
  ];

  const pdfDoc = pdfmake.createPdf({
    defaultStyle: { font: "Helvetica", fontSize: 11 },
    content: docContent,
    styles: {
      title: { fontSize: 20, bold: true, margin: [0, 0, 0, 16] },
      sectionHeading: { fontSize: 15, bold: true, margin: [0, 16, 0, 6] },
      domainLabel: { fontSize: 12, bold: true, margin: [0, 6, 0, 2] },
      disclosure: { fontSize: 8, color: "#666666", margin: [0, 16, 0, 0] },
    },
  });

  return pdfDoc.getBuffer();
}
