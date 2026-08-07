/**
 * Full Blueprint DOCX export (P6), via `docx`. See overviewDocx.ts's module
 * doc for the SVG-fallback-PNG architecture (dependency-injected, not
 * computed internally -- `@resvg/resvg-js` can't run in a browser). This
 * module needs TWO fallback PNGs, not one -- Natal chart decoded embeds both
 * the D1 and D9 charts, unlike Overview's single D1 chart.
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType } from "docx";
import type { FullDocumentContent, FullBlueprintSection } from "./fullDocument.js";
import type { RemediesSectionContent } from "./remediesSection.js";
import type { PlanetRow } from "./chartTables.js";
import type { PlanetNote, HouseNote } from "../narrative/natal.js";

const CHART_SIZE_PX = 400;

function cell(text: string, opts: { bold?: boolean } = {}): TableCell {
  const run = opts.bold ? new TextRun({ text, bold: true }) : new TextRun(text);
  return new TableCell({ children: [new Paragraph({ children: [run] })], width: { size: 100, type: WidthType.AUTO } });
}

function planetTable(rows: PlanetRow[]): Table {
  const header = new TableRow({ children: ["Graha", "Sign", "Deg", "Nakshatra (Pada)", "House", "Dignity", "Notes"].map((h) => cell(h, { bold: true })) });
  const body = rows.map((row) => {
    const flags = [row.retrograde ? "R" : null, row.combust ? "Combust" : null].filter(Boolean).join(", ") || "-";
    return new TableRow({
      children: [cell(row.graha), cell(row.sign), cell(`${row.degreeInSign.toFixed(2)}°`), cell(`${row.nakshatraName} (${row.pada})`), cell(String(row.house)), cell(row.dignity), cell(flags)],
    });
  });
  return new Table({ rows: [header, ...body], width: { size: 100, type: WidthType.PERCENTAGE } });
}

function yogaTable(rows: FullDocumentContent["natal"]["yogaRows"]): Table {
  const header = new TableRow({ children: [cell("Classification", { bold: true }), cell("Finding", { bold: true })] });
  const body = rows.map((r) => new TableRow({ children: [cell(r.classification), cell(r.statement)] }));
  return new Table({ rows: [header, ...body], width: { size: 100, type: WidthType.PERCENTAGE } });
}

function noteParagraphs(notes: (PlanetNote | HouseNote)[]): Paragraph[] {
  return notes.map((n) => new Paragraph({ text: n.statement, bullet: { level: 0 } }));
}

function chartImage(svg: string, fallbackPng: Buffer): ImageRun {
  return new ImageRun({
    type: "svg",
    data: Buffer.from(svg, "utf-8"),
    fallback: { type: "png", data: fallbackPng, transformation: { width: CHART_SIZE_PX, height: CHART_SIZE_PX } },
    transformation: { width: CHART_SIZE_PX, height: CHART_SIZE_PX },
  } as ConstructorParameters<typeof ImageRun>[0]);
}

function blueprintSectionParagraphs(section: FullBlueprintSection): Paragraph[] {
  return [
    new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }),
    ...section.paragraphs.flatMap((p) => [
      new Paragraph({ text: p.label, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ children: [new TextRun(p.text)] }),
    ]),
  ];
}

function remediesSectionParagraphs(r: RemediesSectionContent): Paragraph[] {
  return [
    new Paragraph({ text: r.title, heading: HeadingLevel.HEADING_1 }),

    new Paragraph({ text: r.executiveSummaryHeading, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ children: [new TextRun(r.summaryIntroText)] }),
    ...r.topFindings.map((f) => new Paragraph({ text: f, bullet: { level: 0 } })),
    ...(r.currentDashaSentence ? [new Paragraph({ children: [new TextRun(r.currentDashaSentence)] })] : []),

    new Paragraph({ text: r.remedyHeading, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ children: [new TextRun(r.remedyIntroText)] }),
    r.remedyText
      ? new Paragraph({ children: [new TextRun([r.remedyText, r.remedyCitation ? ` (${r.remedyCitation})` : ""].join(""))] })
      : new Paragraph({ children: [new TextRun(r.noRemedyText)] }),

    new Paragraph({ children: [new TextRun({ text: r.closingText, italics: true })] }),
  ];
}

export async function exportFullDocx(content: FullDocumentContent, d1FallbackPng: Buffer, d9FallbackPng: Buffer): Promise<Buffer> {
  const { natal, personality } = content;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: content.title, heading: HeadingLevel.TITLE }),

          new Paragraph({ text: natal.title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun(natal.introChartTablesText)] }),
          new Paragraph({ text: "Rasi Chart (D1)", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [chartImage(natal.chartSvgD1, d1FallbackPng)] }),
          new Paragraph({ children: [new TextRun(natal.ascendantLine)] }),
          new Paragraph({ text: "Planetary Positions", heading: HeadingLevel.HEADING_2 }),
          planetTable(natal.planetRows),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun(natal.introD9Text)] }),
          new Paragraph({ text: "Navamsa Chart (D9)", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ children: [chartImage(natal.chartSvgD9, d9FallbackPng)] }),
          new Paragraph({ children: [new TextRun(natal.d9AscendantLine)] }),
          new Paragraph({ children: [new TextRun(natal.introPlanetNotesText)] }),
          ...noteParagraphs(natal.planetNotes),
          new Paragraph({ children: [new TextRun(natal.introHouseNotesText)] }),
          ...noteParagraphs(natal.houseNotes),
          new Paragraph({ children: [new TextRun(natal.introYogaTableText)] }),
          yogaTable(natal.yogaRows),
          new Paragraph({ children: [new TextRun({ text: natal.closingText, italics: true })] }),

          new Paragraph({ text: personality.title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun(personality.introText)] }),
          new Paragraph({ children: [new TextRun(personality.lagnaTemperamentText)] }),
          new Paragraph({ children: [new TextRun(personality.lagnaLordText)] }),
          new Paragraph({ children: [new TextRun({ text: personality.closingText, italics: true })] }),

          ...blueprintSectionParagraphs(content.purpose),
          ...blueprintSectionParagraphs(content.careerAndWealth),
          ...blueprintSectionParagraphs(content.relationshipsAndFamily),
          ...blueprintSectionParagraphs(content.health),
          ...blueprintSectionParagraphs(content.timeline),

          ...remediesSectionParagraphs(content.remedies),

          new Paragraph({
            children: [new TextRun({ text: content.settingsDisclosure, size: 16, color: "666666" })],
            spacing: { before: 300 },
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
