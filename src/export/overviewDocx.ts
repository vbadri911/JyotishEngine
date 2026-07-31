/**
 * Overview-depth DOCX export (P6), via `docx`. See essenceDocx.ts's module
 * doc for the library choice.
 *
 * Real architectural decision made here, resolving the "still open" item
 * from the PDF/DOCX validation (BACKLOG.md): `docx`'s SVG image type
 * requires a raster `fallback` (confirmed via its own type definitions, and
 * the real defect that placeholder fallback caused, both logged in
 * DECISIONS.md) -- but the library capable of producing that rasterization
 * in this Node test environment (`@resvg/resvg-js`) is a native Node addon
 * and CANNOT run in a browser at all, while this project computes entirely
 * client-side. Resolution: this function takes the rasterized PNG as a
 * parameter (`chartFallbackPng`), not something it computes internally --
 * the SAME pattern already used elsewhere in this codebase for
 * environment-specific concerns (e.g. `findNextSignCrossing()`'s injected
 * longitude callback in transit.ts). The caller supplies the PNG via
 * whichever mechanism fits its own environment: `@resvg/resvg-js` in Node
 * tests/tooling (see tests/export/overviewDocument.test.ts), the browser's
 * own Canvas API in the real client-side product. This keeps the export
 * module itself portable to both, rather than silently only working in one.
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType } from "docx";
import type { OverviewDocumentContent } from "./overviewDocument.js";
import type { PlanetRow } from "./chartTables.js";

const CHART_SIZE_PX = 400;

function cell(text: string, opts: { bold?: boolean } = {}): TableCell {
  const run = opts.bold ? new TextRun({ text, bold: true }) : new TextRun(text);
  return new TableCell({
    children: [new Paragraph({ children: [run] })],
    width: { size: 100, type: WidthType.AUTO },
  });
}

function planetTable(rows: PlanetRow[]): Table {
  const header = new TableRow({
    children: ["Graha", "Sign", "Deg", "Nakshatra (Pada)", "House", "Dignity", "Notes"].map((h) => cell(h, { bold: true })),
  });
  const body = rows.map((row) => {
    const flags = [row.retrograde ? "R" : null, row.combust ? "Combust" : null].filter(Boolean).join(", ") || "-";
    return new TableRow({
      children: [
        cell(row.graha),
        cell(row.sign),
        cell(`${row.degreeInSign.toFixed(2)}°`),
        cell(`${row.nakshatraName} (${row.pada})`),
        cell(String(row.house)),
        cell(row.dignity),
        cell(flags),
      ],
    });
  });
  return new Table({ rows: [header, ...body], width: { size: 100, type: WidthType.PERCENTAGE } });
}

function yogaTable(rows: OverviewDocumentContent["yogaRows"]): Table {
  const header = new TableRow({ children: [cell("Classification", { bold: true }), cell("Finding", { bold: true })] });
  const body = rows.map((r) => new TableRow({ children: [cell(r.classification), cell(r.statement)] }));
  return new Table({ rows: [header, ...body], width: { size: 100, type: WidthType.PERCENTAGE } });
}

export async function exportOverviewDocx(content: OverviewDocumentContent, chartFallbackPng: Buffer): Promise<Buffer> {
  const chartImage = new ImageRun({
    type: "svg",
    data: Buffer.from(content.chartSvg, "utf-8"),
    fallback: { type: "png", data: chartFallbackPng, transformation: { width: CHART_SIZE_PX, height: CHART_SIZE_PX } },
    transformation: { width: CHART_SIZE_PX, height: CHART_SIZE_PX },
  } as ConstructorParameters<typeof ImageRun>[0]);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: content.title, heading: HeadingLevel.TITLE }),
          new Paragraph({ text: "Natal Chart (D1)", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [chartImage] }),
          new Paragraph({ children: [new TextRun(content.ascendantLine)] }),
          new Paragraph({ text: "Planetary Positions", heading: HeadingLevel.HEADING_1 }),
          planetTable(content.planetRows),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Yogas & Doshas", heading: HeadingLevel.HEADING_1 }),
          yogaTable(content.yogaRows),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Domain Summaries", heading: HeadingLevel.HEADING_1 }),
          ...content.domainSections.flatMap((section) => [
            new Paragraph({ text: section.label, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun(section.text)] }),
          ]),
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
