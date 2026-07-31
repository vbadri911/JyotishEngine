/**
 * Essence-depth PDF export (P6), via `pdfmake` -- chosen over `jsPDF` for its
 * automatic pagination from a declarative document definition (needed since
 * output length varies from 1 page at Essence to 40-60 at Full Blueprint;
 * `jsPDF` requires manually measuring text and deciding page breaks). See
 * DECISIONS.md for the full library evaluation and the two isolated
 * validation tests (essence-only text, SVG-chart-only) this module's real
 * usage is based on.
 *
 * `pdfmake`'s package has no shipped types; `@types/pdfmake` models its
 * top-level API as named ES exports, which do NOT exist at runtime for this
 * CommonJS package (confirmed directly: `import { createPdf } from "pdfmake"`
 * throws `SyntaxError: Named export 'createPdf' not found` under Node ESM).
 * The working import is the default-import form Node's own error message
 * suggests (`import pdfmake from "pdfmake"`), which type-checks correctly
 * here because `esModuleInterop` (tsconfig.json) synthesizes a default
 * export from `@types/pdfmake`'s named declarations -- verified against the
 * real runtime shape, not assumed from the types file alone.
 *
 * Local access is restricted to exactly the standard-14 font names this
 * module actually uses. Real bug found and fixed while writing this: an
 * earlier version denied ALL local access (`() => false`), on the wrong
 * assumption that standard fonts need no file-path resolution at all --
 * pdfmake funnels every font lookup through the SAME access-policy check
 * internally, standard names included, so that blanket denial broke the
 * export entirely (`Access to local file denied: Helvetica-Bold`), caught by
 * the test suite rather than left in reliance on the warning going away.
 * Matches this project's own "no data leaves the device" posture without
 * breaking the one thing this module actually needs.
 */
import pdfmake from "pdfmake";
import type { EssenceDocumentContent } from "./essenceDocument.js";

const HELVETICA_FONT_FAMILY = {
  Helvetica: { normal: "Helvetica", bold: "Helvetica-Bold", italics: "Helvetica-Oblique", bolditalics: "Helvetica-BoldOblique" },
};
const ALLOWED_LOCAL_FONT_NAMES = new Set(Object.values(HELVETICA_FONT_FAMILY.Helvetica));

let accessPoliciesLocked = false;
function lockAccessPoliciesOnce(): void {
  if (accessPoliciesLocked) return;
  pdfmake.setLocalAccessPolicy((path) => ALLOWED_LOCAL_FONT_NAMES.has(path));
  pdfmake.setUrlAccessPolicy(() => false); // this module never fetches external resources
  accessPoliciesLocked = true;
}

export async function exportEssencePdf(content: EssenceDocumentContent): Promise<Buffer> {
  lockAccessPoliciesOnce();
  pdfmake.addFonts(HELVETICA_FONT_FAMILY);

  const pdfDoc = pdfmake.createPdf({
    defaultStyle: { font: "Helvetica", fontSize: 11 },
    content: [
      { text: content.title, style: "title" },
      ...content.sections.flatMap((section) => [
        { text: section.label, style: "domainLabel" },
        { text: section.text, margin: [0, 0, 0, 10] as [number, number, number, number] },
      ]),
      { text: content.settingsDisclosure, style: "disclosure" },
    ],
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 16] },
      domainLabel: { fontSize: 12, bold: true, margin: [0, 6, 0, 2] },
      disclosure: { fontSize: 8, color: "#666666", margin: [0, 16, 0, 0] },
    },
  });

  return pdfDoc.getBuffer();
}
