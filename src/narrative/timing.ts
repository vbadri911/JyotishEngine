/**
 * Timing ("Timeline") section rendering (P5) -- deliberately NOT built on
 * renderDomainSection()/DomainTemplate. Confirmed before writing anything
 * (see DECISIONS.md, 2026-07-30 "Timing scoping" entry): the other five
 * domains' architecture classifies a set of discrete, evaluative Findings by
 * polarity (supportive/challenging) into a strong/mixed/challenging/thin
 * tier. Timing's real content is neither -- only ONE Finding currently tags
 * "timing" (`currentDashaFinding()`, always polarity "neutral" by design,
 * since a dasha lord isn't inherently good or bad), so the polarity-tier
 * classifier would ALWAYS resolve to "thin" and silently discard the one
 * real fact available. interpretation.md's own document structure agrees
 * this is different: the full-depth section is named "Timeline," not paired
 * with the other five as "one paragraph per domain," and is described as
 * chronological/ranked (full Mahadasha arc, current Mahadasha's Antardashas
 * in full, transit overlay, ranked turning points) -- not evaluative.
 *
 * Scope of this v1 (explicitly decided, not the full "Timeline" build):
 *   - Essence: current period in plain language (no Mahadasha/Antardasha
 *     jargon, matching the "no jargon" rule every other domain's essence
 *     tier already follows) + the next significant transition date, per
 *     interpretation.md's literal ask.
 *   - Overview: "near-term timeline" -- the current Mahadasha's remaining
 *     Antardashas, in order, with real dates.
 *   - Full: the full Mahadasha arc (birth through the ~age-90 cutoff,
 *     principle 2) plus the current Mahadasha's COMPLETE Antardasha
 *     breakdown, matching interpretation.md's literal "current Mahadasha's
 *     Antardashas in full with real dates."
 * Explicitly NOT built here (logged in BACKLOG.md as separately-scoped
 * follow-up, matching how P7 itself was split into P7a/P7b with a design
 * gate): transit overlay (Jupiter/Saturn ingresses aren't even wired into
 * computeChart()'s output yet), and "ranked turning points with reasoning
 * shown" (cross-referencing a dasha lord's own dignity/strength from the
 * OTHER five domains' findings against the fact that their period is
 * upcoming -- a real, new synthesis step nothing in this codebase does yet).
 *
 * Departs from render.ts's "quote Finding.statement verbatim" rule for one
 * necessary reason: NOTHING here is quoted from a Finding object at all --
 * every sentence, including the "currently running" summary, is built
 * directly from real, already-computed `DashaPeriod` data (lord name, exact
 * start/end instants) -- equally evidence-grounded, just not wrapped in a
 * Finding object (a real, separate gap, logged in BACKLOG.md, distinct from
 * Health/Relationships' aspect-finding gap). The JSON template
 * (`templates/en/timing.json`) therefore holds ONLY framing language, same
 * as every other domain's template -- every date and lord name is injected
 * from real dasha data, never invented.
 *
 * Real bug found and fixed (see DECISIONS.md): an earlier version quoted
 * `currentDashaFinding()`'s pre-computed Finding.statement for this summary
 * sentence, sourced from a `Finding[]` parameter -- but that Finding is
 * baked in at whatever `asOfISO` the CALLER's `computeChart()` happened to
 * use internally (real wall-clock "now" by default), completely independent
 * of the `asOfISO` THIS function receives for everything else it computes
 * (`currentAD`, the antardasha list). Passing an explicit `asOfISO` other
 * than real "now" -- exactly what deterministic document generation does --
 * could silently produce a "Currently running: X" sentence for a DIFFERENT
 * period than the one the surrounding timeline marks "(current)". Fixed by
 * deriving the summary fresh from `dasha`+`asOfISO` via `findActivePeriod()`
 * (the same primitive `currentDashaFinding()` itself uses), removing the
 * `Finding[]` parameter entirely -- nothing else in this module ever needed
 * it, and the fix eliminates the hidden consistency requirement between two
 * independently-computed instants rather than just documenting it.
 */
import { DateTime } from "luxon";
import type { DashaComputationResult } from "../engine/dasha.js";
import { computeAntardashas, findActivePeriod } from "../engine/dasha.js";
import type { DashaPeriod, NarrativeSection, OutputDepth } from "../types.js";
import { formatUtcDate } from "../util/formatUtcDate.js";

/** Principle 2 ("precision decays honestly"): suppress rather than guess
 *  beyond roughly age 90 -- applied as a hard cutoff on how far forward the
 *  full Mahadasha arc reaches. Periods that START before the cutoff are
 *  shown in full even if they extend slightly past it (the reader is
 *  already living through a chapter that started before 90); no NEW chapter
 *  starting after 90 is surfaced. */
const MAX_AGE_YEARS = 90;

export interface TimingTemplate {
  domain: "timing";
  essenceNoActivePeriod: string[];
  overviewIntro: string[];
  overviewNoActivePeriod: string[];
  fullMahadashaArcIntro: string[];
  fullAntardashaIntro: string[];
  ageSuppressedNote: string[];
  closingNote: string[];
}

function hashString(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) hash = (hash * 33) ^ s.charCodeAt(i);
  return hash >>> 0;
}

function selectVariant(options: string[], seed: string): string {
  if (options.length === 0) throw new Error("Unreachable: template variant array is empty");
  if (options.length === 1) return options[0]!;
  return options[hashString(seed) % options.length]!;
}

function ageAtYears(birthDateISO: string, instantISO: string): number {
  return DateTime.fromISO(instantISO).diff(DateTime.fromISO(birthDateISO), "years").years;
}

const LEVEL_LABEL: Record<DashaPeriod["level"], string> = {
  mahadasha: "Mahadasha",
  antardasha: "Antardasha",
  pratyantardasha: "Pratyantardasha",
};

function periodSentence(period: DashaPeriod, isCurrent: boolean): string {
  return `${period.lord} ${LEVEL_LABEL[period.level]}: ${formatUtcDate(period.start)} to ${formatUtcDate(period.end)}${
    isCurrent ? " (current)" : ""
  }.`;
}

/**
 * The next period boundary "one level up" from the currently active
 * Antardasha -- the next Antardasha within the same Mahadasha, or (if the
 * current one is the Mahadasha's last) the first Antardasha of the next
 * Mahadasha. Pratyantardasha-level changes (weeks to months) are too fine
 * a grain for a "significant" transition at essence depth.
 */
function nextSignificantTransition(dasha: DashaComputationResult, asOfISO: string): DashaPeriod | null {
  const currentAD = findActivePeriod(dasha.mahadashas, asOfISO, "antardasha");
  if (!currentAD || !currentAD.parent) return null;

  const antardashas = computeAntardashas(currentAD.parent);
  const idx = antardashas.findIndex((a) => a.start === currentAD.start && a.lord === currentAD.lord);
  if (idx >= 0 && idx < antardashas.length - 1) return antardashas[idx + 1]!;

  const mdIdx = dasha.mahadashas.findIndex((m) => m.start === currentAD.parent!.start);
  const nextMD = dasha.mahadashas[mdIdx + 1];
  return nextMD ? (computeAntardashas(nextMD)[0] ?? null) : null;
}

/**
 * The full Mahadasha -> Antardasha -> Pratyantardasha "currently running"
 * summary, computed fresh for the given instant -- same nested-path format
 * `currentDashaFinding()` produces (dasha.md's own reporting requirement:
 * give the full path, not just the Mahadasha), but derived directly here so
 * it can never drift out of sync with this module's OWN `asOfISO`.
 */
function currentPeriodSummary(dasha: DashaComputationResult, asOfISO: string): string | null {
  const activePD = findActivePeriod(dasha.mahadashas, asOfISO, "pratyantardasha");
  if (!activePD) return null;
  const antardasha = activePD.parent;
  const mahadasha = antardasha?.parent;
  const path = [mahadasha?.lord, antardasha?.lord, activePD.lord].filter(Boolean).join(" -> ");
  return `Currently running: ${path} (Mahadasha / Antardasha / Pratyantardasha), ${formatUtcDate(activePD.start)} to ${formatUtcDate(activePD.end)}.`;
}

export function renderTimingSection(
  dasha: DashaComputationResult,
  birthDateISO: string,
  depth: OutputDepth,
  template: TimingTemplate,
  asOfISO: string = DateTime.now().toISO()!
): NarrativeSection {
  const currentAD = findActivePeriod(dasha.mahadashas, asOfISO, "antardasha");
  const seed = currentAD ? `${currentAD.lord}|${currentAD.start}` : "timing";
  // Nothing in this module's output is Finding-derived (see module doc) --
  // sourceFindingIds is always empty, honestly reflecting that.
  const sourceFindingIds: string[] = [];

  if (depth === "essence") {
    if (!currentAD) {
      return { domain: "timing", depth, language: "en", sourceFindingIds: [], text: selectVariant(template.essenceNoActivePeriod, seed) };
    }
    const mahadashaLord = currentAD.parent!.lord;
    // next.start and currentAD.end are the SAME instant whenever `next` exists
    // (one period ends exactly where the next begins) -- stating both would
    // repeat the same date twice in one short sentence; say it once.
    const next = nextSignificantTransition(dasha, asOfISO);
    const sentence = next
      ? `You're currently in a ${mahadashaLord}-driven cycle, within its ${currentAD.lord} phase, which gives way to a ${next.lord} phase on ${formatUtcDate(next.start)}.`
      : `You're currently in a ${mahadashaLord}-driven cycle, within its ${currentAD.lord} phase, running through ${formatUtcDate(currentAD.end)}.`;
    return { domain: "timing", depth, language: "en", sourceFindingIds, text: sentence };
  }

  const currentPeriodText = currentPeriodSummary(dasha, asOfISO);
  if (!currentAD || !currentPeriodText) {
    return {
      domain: "timing",
      depth,
      language: "en",
      sourceFindingIds: [],
      text: selectVariant(template.overviewNoActivePeriod, seed),
    };
  }

  const currentMD = currentAD.parent!;
  const antardashasOfCurrentMD = computeAntardashas(currentMD);
  const remainingAntardashas = antardashasOfCurrentMD.filter((a) => DateTime.fromISO(a.end) > DateTime.fromISO(asOfISO));

  const overviewParts: string[] = [
    selectVariant(template.overviewIntro, seed),
    currentPeriodText,
    ...remainingAntardashas.map((a) => periodSentence(a, a.start === currentAD.start)),
  ];

  if (depth === "overview") {
    return { domain: "timing", depth, language: "en", sourceFindingIds, text: overviewParts.join(" ") };
  }

  // full: the full Mahadasha arc (age-90-cutoff, principle 2) plus the
  // current Mahadasha's COMPLETE Antardasha breakdown (not just remaining).
  const fullArc = dasha.mahadashas.filter((md) => ageAtYears(birthDateISO, md.start) < MAX_AGE_YEARS);
  const arcTruncated = fullArc.length < dasha.mahadashas.length;

  const fullParts: string[] = [
    selectVariant(template.overviewIntro, seed),
    currentPeriodText,
    selectVariant(template.fullMahadashaArcIntro, seed),
    ...fullArc.map((md) => periodSentence(md, md.start === currentMD.start)),
    ...(arcTruncated ? [selectVariant(template.ageSuppressedNote, seed)] : []),
    selectVariant(template.fullAntardashaIntro, seed),
    ...antardashasOfCurrentMD.map((a) => periodSentence(a, a.start === currentAD.start)),
    selectVariant(template.closingNote, seed),
  ];

  return { domain: "timing", depth, language: "en", sourceFindingIds, text: fullParts.join(" ") };
}
