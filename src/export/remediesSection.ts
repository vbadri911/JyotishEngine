/**
 * Section 8 (Remedies & Executive Summary), Full Blueprint's last previously-
 * unbuilt section (BACKLOG.md/DECISIONS.md, 2026-08-02 design gate). Same
 * format-agnostic-content split as natalChartSection.ts/personalitySection.ts.
 *
 * Executive Summary: interpretation.md's own literal description ("the 2-3
 * strongest findings... current dasha period in one sentence"), never built
 * when P5 chose "one sentence per domain" instead for the six domain
 * sections (essenceDocument.ts's own module doc). Selection is over
 * already-computed `Finding` data -- zero new interpretive content, zero new
 * sourcing -- ranked category-first, `Finding.strength` only as the tiebreak
 * within a category (`selectTopFindings()`/`byCategoryThenStrength()`; see
 * their own doc comments for why a strength-only sort was tried first and
 * replaced, 2026-08-04). The two period-fact findings (`currentDashaFinding()`,
 * the Tier 1 remedy) are excluded from this ranking entirely: they are
 * always tagged domain ["timing"] only, and are structurally a different
 * kind of fact (always-current, not a graded chart-strength claim) -- the
 * SAME reasoning DECISIONS.md's Timing-architecture entry already gives for
 * why Timing isn't evaluative the way the other five domains are. The
 * current-dasha sentence is then added back separately, per interpretation.md's
 * own two-part description. Reuses `dedupeBySharedFact()` (render.ts) so the
 * top-3 selection doesn't surface two findings restating the same underlying
 * placement, the same problem that logic already solved for domain sections.
 *
 * Remedies (Tier 1): `detectDashaRemedy()`'s own output, computed fresh from
 * `asOfISO` here -- NOT read from the aggregated `findings` array, which was
 * baked in at whatever instant `computeChart()`'s own internal call happened
 * to use. This is deliberately the same fix already applied to
 * `renderTimingSection()` after a real bug (DECISIONS.md, 2026-07-30): a
 * section takes an explicit `asOfISO` precisely so it can't silently
 * disagree with itself when rendered for a specific point in time.
 * `detectDashaRemedy()` correctly returns [] most of the time (any period
 * where the Antardasha lord isn't afflicted per BPHS's own text) -- silence
 * is reported here as a genuine, informative absence (SKILL.md's
 * "classification states" principle: "report notable absences explicitly...
 * often reassuring"), not a placeholder or an error.
 */
import type { ChartData, Finding } from "../types.js";
import type { DashaComputationResult } from "../engine/dasha.js";
import { currentDashaFinding } from "../findings/index.js";
import { detectDashaRemedy } from "../rules/dashaRemedies.js";
import { dedupeBySharedFact } from "../narrative/render.js";
import { findingCategoryRank } from "../util/findingCategory.js";

const TOP_FINDINGS_CAP = 3;

function selectVariant(options: string[], seed: string): string {
  if (options.length === 0) throw new Error("Unreachable: template variant array is empty");
  if (options.length === 1) return options[0]!;
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = (hash * 33) ^ seed.charCodeAt(i);
  return options[(hash >>> 0) % options.length]!;
}

/** Ranks the WHOLE deduped candidate pool for Executive Summary -- category
 *  first (via the same `findingCategoryRank()` `dedupeBySharedFact()` uses
 *  for its own within-cluster tie-breaking, `util/findingCategory.ts`),
 *  `Finding.strength` only as the tiebreak within a category. Not the same
 *  comparator as dedup's own (that one only matters within one cluster and
 *  also breaks final ties by original position); this one ranks across the
 *  entire pool, so a genuine strength tie across categories is not expected
 *  to matter here the way a same-category tie would.
 *
 *  Fixed 2026-08-04, real finding, not a hypothetical: a strength-only sort
 *  let this chart's real body-part findings (Sun/Saturn exalted, strength
 *  0.9 -- calibrated for Health's own single-domain tier classification,
 *  never for competing against yoga classifications across domains) crowd
 *  out this chart's actual standout facts -- 5 Raja Yoga combinations and
 *  Gajakesari, all real EXACT classifications, all legitimately outranked
 *  on the raw number alone. Category-first ranking is the same judgment
 *  call `dedupeBySharedFact()` already makes for within-cluster collisions
 *  ("a yoga classification says strictly more than a bare dignity/body-part
 *  restatement of the same or a related fact"), generalized to the whole
 *  candidate pool instead of just tie-breaking inside one cluster. */
function byCategoryThenStrength(a: Finding, b: Finding): number {
  return findingCategoryRank(a) - findingCategoryRank(b) || b.strength - a.strength;
}

/** The top 2-3 chart-wide findings, regardless of domain -- excludes the two
 *  "timing"-only period-fact findings (current dasha, Tier 1 remedy), which
 *  are not graded chart-strength claims and are handled separately. Deduped
 *  first so a planet's dignity and its house-lord finding don't both occupy
 *  a slot for the same underlying fact, then ranked category-first (see
 *  `byCategoryThenStrength()`). */
export function selectTopFindings(findings: Finding[], cap: number = TOP_FINDINGS_CAP): Finding[] {
  const evaluative = findings.filter((f) => f.domain.some((d) => d !== "timing"));
  const deduped = dedupeBySharedFact(evaluative);
  return [...deduped].sort(byCategoryThenStrength).slice(0, cap);
}

export interface RemediesTemplate {
  section: "remedies";
  summaryIntro: string[];
  remedyIntro: string[];
  noRemedyNote: string[];
  closingNote: string[];
}

export interface RemediesSectionContent {
  title: string;
  executiveSummaryHeading: string;
  summaryIntroText: string;
  topFindings: string[];
  currentDashaSentence: string | null;
  remedyHeading: string;
  remedyIntroText: string;
  remedyText: string | null;
  remedyCitation: string | null;
  noRemedyText: string;
  closingText: string;
}

export function buildRemediesSectionContent(
  chart: ChartData,
  findings: Finding[],
  dasha: DashaComputationResult,
  template: RemediesTemplate,
  asOfISO?: string
): RemediesSectionContent {
  const seed = chart.ascendant.sign;

  const topFindings = selectTopFindings(findings).map((f) => f.statement);
  const current = currentDashaFinding(dasha, asOfISO);

  const remedyFindings = detectDashaRemedy(chart, dasha, asOfISO);
  const remedy = remedyFindings[0] ?? null;

  return {
    title: "Remedies & Executive Summary",
    executiveSummaryHeading: "Executive Summary",
    summaryIntroText: selectVariant(template.summaryIntro, seed),
    topFindings,
    currentDashaSentence: current?.statement ?? null,
    remedyHeading: "Remedies",
    remedyIntroText: selectVariant(template.remedyIntro, seed),
    remedyText: remedy?.statement ?? null,
    remedyCitation: remedy?.citation ?? null,
    noRemedyText: selectVariant(template.noRemedyNote, seed),
    closingText: selectVariant(template.closingNote, seed),
  };
}
