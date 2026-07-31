/**
 * Essence-depth DOCX export (P6), via `docx` (dolanmiu/docx). TypeScript-
 * first with its own shipped types (unlike `pdfmake` -- see essencePdf.ts's
 * module doc for that mismatch), works identically in Node and the browser.
 * See DECISIONS.md for the library evaluation and validation trail.
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { EssenceDocumentContent } from "./essenceDocument.js";

export async function exportEssenceDocx(content: EssenceDocumentContent): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: content.title, heading: HeadingLevel.TITLE }),
          ...content.sections.flatMap((section) => [
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
