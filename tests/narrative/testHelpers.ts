import type { DomainTemplate } from "../../src/narrative/render.js";

/**
 * Strips a trailing closing-note sentence (if present) from rendered text.
 * Needed because `full`'s core content is `overview`'s core content
 * verbatim, but the closing note itself is deliberately NOT part of that
 * shared prefix -- it's appended once at the true end of whichever depth is
 * being rendered, not preserved mid-sentence the way a literal
 * `full.text.startsWith(overview.text)` check would require. See
 * DECISIONS.md and render.ts's module doc.
 */
export function withoutTrailingClosingNote(text: string, template: DomainTemplate): string {
  for (const note of template.closingNote) {
    if (text.endsWith(note)) return text.slice(0, text.length - note.length).trim();
  }
  return text;
}
