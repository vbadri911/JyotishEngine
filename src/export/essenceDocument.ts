/**
 * Shared content assembly for exported documents (P6). Deliberately format-
 * agnostic -- produces plain structured data, not PDF or DOCX objects
 * directly -- so `essencePdf.ts` and `essenceDocx.ts` both consume the SAME
 * assembled content rather than each re-deriving it, mirroring how P7a's
 * `ics.ts` builder is shared by both the dasha and transit calendars.
 *
 * Scope (Essence depth only, per the confirmed v1 -- see BACKLOG.md/
 * DECISIONS.md): concatenates each of the six domains' own essence-tier text
 * (already built, tested, and validated in P5) rather than a fresh
 * cross-domain "3 strongest findings" selection -- interpretation.md's
 * Essence description ("the 2-3 strongest findings... current dasha period
 * in one sentence") describes the whole-document essence output loosely; P5
 * already extended this into one essence sentence per domain (a deliberate,
 * already-logged departure -- see DECISIONS.md, "Domain tier system"), and
 * this module reuses that existing, validated behavior rather than
 * re-litigating a P5 architectural decision while building P6.
 */
import type { ChartData, Finding } from "../types.js";
import type { DashaComputationResult } from "../engine/dasha.js";
import { renderDomainSection } from "../narrative/render.js";
import { renderTimingSection } from "../narrative/timing.js";
import { formatSettingsDisclosure } from "./settingsDisclosure.js";
import { DOMAIN_LABELS, type SixDomainTemplates } from "./templates.js";

export interface EssenceSection {
  label: string;
  text: string;
}

export interface EssenceDocumentContent {
  title: string;
  sections: EssenceSection[];
  /** SKILL.md principle 6 ("Disclose settings") is universal, not scoped to
   *  full-depth output the way interpretation.md's fuller disclosure list is
   *  -- every output states ayanamsa and node type. */
  settingsDisclosure: string;
}

export function buildEssenceDocumentContent(
  chart: ChartData,
  findings: Finding[],
  dasha: DashaComputationResult,
  templates: SixDomainTemplates,
  asOfISO?: string
): EssenceDocumentContent {
  const sections: EssenceSection[] = (Object.keys(DOMAIN_LABELS) as Array<keyof typeof DOMAIN_LABELS>).map((domain) => ({
    label: DOMAIN_LABELS[domain],
    text: renderDomainSection(domain, findings, "essence", templates[domain]).text,
  }));

  sections.push({
    label: "Timing",
    text: renderTimingSection(dasha, chart.input.date, "essence", templates.timing, asOfISO).text,
  });

  return {
    title: "Essence",
    sections,
    settingsDisclosure: formatSettingsDisclosure(chart.settings),
  };
}
