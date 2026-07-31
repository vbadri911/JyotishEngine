/**
 * Domain-section narrative rendering (P5), scoped for now to the current
 * finding set (P3's simplified yoga/dosha coverage) -- see BACKLOG.md. Only
 * `templates/en/career.json` is populated; this renderer is domain-agnostic
 * so templating the remaining five domains is adding JSON, not code.
 *
 * Core design choice: this module never regenerates or paraphrases a fact.
 * Every fact-bearing sentence in the output is `Finding.statement`, quoted
 * verbatim -- already precise, already tested, already evidence-traceable via
 * `Finding.evidence`. This module's only job is to select, group, and frame
 * findings (which ones, in what order, with what lead-in), never to invent
 * new claims about the chart. That's what makes "evidence or silence"
 * (SKILL.md principle 1) true by construction here, not by discipline alone.
 *
 * Templates hold ONLY framing language (lead-ins, tier summaries, the
 * closing non-fatalism note) -- never chart facts. Matches
 * requirements-spec.md §7's "rules and prose are both data" architecture.
 *
 * Two fixes made after the first Career review (see DECISIONS.md,
 * 2026-07-29 entries, for the full reasoning):
 *   - Semantic de-duplication: multiple DIFFERENT Finding objects (different
 *     ids, different generators -- a dignity finding, a house-lord finding,
 *     a yoga finding) can describe the SAME underlying fact (e.g. "Saturn is
 *     exalted, house 3" said three ways). `dedupeBySharedFact` collapses
 *     each such cluster into one representative BEFORE anything is quoted,
 *     picking the most informative member -- never inventing new text, just
 *     choosing which real sentence to show.
 *   - Depth is additive, not restated: `full`'s CORE content (intro +
 *     quoted supportive/challenging blocks) is `overview`'s own core content
 *     verbatim, plus a continuation citing only findings NOT already quoted
 *     in it. The closing non-fatalism note (when present) is deliberately
 *     NOT part of that shared prefix -- it's appended once, at the true end
 *     of whichever depth is being rendered, rather than sitting mid-sentence
 *     in `full` where a literal `overview`-as-prefix would put it. Full
 *     never recomputes an independent, larger citation from
 *     scratch, so it structurally cannot repeat what overview already said.
 */
import type { Domain, Finding, NarrativeSection, OutputDepth } from "../types.js";

export type DomainTier = "strong" | "mixed" | "challenging" | "thin";

/**
 * An additional closing-note clause that only fires when a QUOTED finding
 * (one that actually appears in this render's text) matches one of
 * `triggerPatterns` -- tested against the finding's `id` and every
 * `evidence[].path`. Exists specifically so a topic-scoped caveat (e.g.
 * Relationships' children-specific framing) is never appended to a render
 * that never surfaced that topic -- see DECISIONS.md, "closing note was
 * unconditional boilerplate" fix.
 */
export interface ConditionalClosingNote {
  triggerPatterns: string[];
  text: string[];
}

export interface DomainTemplate {
  domain: Domain;
  essence: Record<DomainTier, string[]>;
  overviewIntro: Record<DomainTier, string[]>;
  convergenceSupportive: string[];
  convergenceChallenging: string[];
  singleSupportive: string[];
  singleChallenging: string[];
  moreSupportive: string[];
  oneMoreSupportive: string[];
  moreChallenging: string[];
  oneMoreChallenging: string[];
  additionalContext: string[];
  /** General, topic-agnostic non-fatalism framing -- fires whenever any
   *  challenging finding is quoted in this render, regardless of topic. */
  closingNote: string[];
  /** Optional, domain-specific topic-scoped additions -- e.g. Relationships'
   *  partnership/children caveats. Each fires independently, only when a
   *  QUOTED finding actually matches its trigger patterns. */
  conditionalClosingNotes?: ConditionalClosingNote[];
}

/** Overview quotes only the strongest few per polarity group -- "one
 *  paragraph per domain" (interpretation.md) means selective, not exhaustive. */
const OVERVIEW_QUOTE_CAP = 3;

/** djb2 -- deterministic, not cryptographic. Used only to pick among
 *  equally-valid phrasing variants so re-rendering the SAME chart always
 *  produces the SAME text (requirements-spec.md §2), while different charts'
 *  differing findings naturally land on different variants. */
function hashString(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  return hash >>> 0;
}

function selectVariant(options: string[], seed: string): string {
  if (options.length === 0) throw new Error("Unreachable: template variant array is empty");
  if (options.length === 1) return options[0]!;
  return options[hashString(seed) % options.length]!;
}

/**
 * Extends interpretation.md's one explicit rule (fewer than ~3 supportive
 * findings and no affliction -> say so plainly) into a full 4-way split.
 * Driven entirely by polarity of SUBSTANTIVE (strength > 0), DEDUPED
 * findings -- ABSENT/zero-strength findings never influence tier.
 */
function classifyTier(supportive: Finding[], challenging: Finding[]): DomainTier {
  if (supportive.length === 0 && challenging.length === 0) return "thin";
  if (challenging.length === 0) return "strong";
  if (supportive.length === 0) return "challenging";
  return "mixed";
}

/** Findings that share a `planets.{X}.dignity` evidence entry describe the
 *  same underlying fact -- a dignity finding, a house-lord finding, and a
 *  yoga finding can all be "about" the same planet's exaltation/debilitation.
 *  Narrower than "any shared evidence" (which risks over-merging genuinely
 *  distinct facts) -- this is specifically the fact pattern that produced
 *  real, observed duplication ("Saturn exalted" stated three ways). */
function dignityEvidenceKey(finding: Finding): string | null {
  const entry = finding.evidence.find((e) => /^planets\.\w+\.dignity$/.test(e.path));
  return entry ? `${entry.path}=${JSON.stringify(entry.value)}` : null;
}

/**
 * Within a cluster of findings about the same underlying fact, ranks which
 * one is most worth keeping as the sole quoted representative (lower wins):
 *   0. A yoga/dosha finding (`classification` set) -- strictly more
 *      informative than a bare dignity restatement, since it also says
 *      whether the classical condition (and any cancellation) actually holds.
 *   1. A dignity finding that flags Lagna-lord status -- distinctive,
 *      high-value content ("also the Lagna lord") a house-lord finding's
 *      generic "{N}th lord" framing can't express (interpretation.md's own
 *      convergence example names this specifically).
 *   2. A house-lord finding -- names the specific domain-relevant role
 *      (e.g. "10th lord"), generically more useful in a domain section than
 *      a bare dignity restatement.
 *   3. Anything else (plain dignity, combustion, ...).
 * Ties broken by strength, then by original position, for determinism.
 */
function richnessRank(f: Finding): number {
  if (f.classification !== undefined) return 0;
  if (f.statement.includes("Lagna lord")) return 1;
  if (f.id.startsWith("house-lord-")) return 2;
  return 3;
}

/** Extracts the governed house number from a house-lord finding's own
 *  `houseLords.N.lord` evidence entry (null for any other finding type). Two
 *  house-lord findings sharing a planet+dignity key are NOT the same
 *  underlying fact unless they're also for the SAME governed house -- one
 *  planet legitimately ruling two different domain-relevant houses (e.g.
 *  Mercury as both 2nd and 11th lord for a Leo Lagna -- Gemini/Virgo are the
 *  same "twin-sign" pattern as Mars/Venus/Jupiter/Saturn) is two independent
 *  facts, not one fact stated twice. See dedupeBySharedFact's own doc. */
function governedHouseNumber(f: Finding): number | null {
  const entry = f.evidence.find((e) => /^houseLords\.\d+\.lord$/.test(e.path));
  return entry ? Number(entry.path.split(".")[1]) : null;
}

/** Exported for direct testing of the priority chain (tests/narrative/render.test.ts)
 *  -- real charts have produced 2- and 3-way collisions incidentally, but the full
 *  4-rank ordering deserves an explicit, controlled test, not just incidental coverage. */
export function dedupeBySharedFact(findings: Finding[]): Finding[] {
  const order = new Map(findings.map((f, i) => [f, i]));
  const clusters = new Map<string, Finding[]>();
  const standalone: Finding[] = [];

  for (const f of findings) {
    const key = dignityEvidenceKey(f);
    if (!key) {
      standalone.push(f);
      continue;
    }
    const cluster = clusters.get(key) ?? [];
    cluster.push(f);
    clusters.set(key, cluster);
  }

  const representatives: Finding[] = [...standalone];
  for (const cluster of clusters.values()) {
    const sorted = [...cluster].sort(
      (a, b) => richnessRank(a) - richnessRank(b) || b.strength - a.strength || order.get(a)! - order.get(b)!
    );
    const winner = sorted[0]!;

    // A yoga or Lagna-lord-flagged dignity finding (rank 0/1) legitimately
    // outranks and absorbs ANY house-lord finding for the same planet -- it
    // says strictly more about the same underlying placement (the Sasa/Career
    // and Malavya/Wealth precedents this project already relies on). But when
    // the would-be winner is ITSELF a house-lord finding, there's no richer
    // narrative justifying dropping a SIBLING house-lord finding for a
    // DIFFERENT governed house -- keep every house-lord finding whose
    // governed house differs from the others', instead of collapsing to
    // whichever was generated first.
    if (richnessRank(winner) === 2) {
      const houseLordMembers = cluster.filter((f) => richnessRank(f) === 2);
      const governedHouses = new Set(houseLordMembers.map(governedHouseNumber));
      if (governedHouses.size > 1) {
        representatives.push(...houseLordMembers);
        continue;
      }
    }

    representatives.push(winner);
  }

  return representatives.sort((a, b) => order.get(a)! - order.get(b)!);
}

function byStrengthDesc(a: Finding, b: Finding): number {
  return b.strength - a.strength;
}

function findingMatchesPatterns(finding: Finding, patterns: RegExp[]): boolean {
  if (patterns.some((p) => p.test(finding.id))) return true;
  return finding.evidence.some((e) => patterns.some((p) => p.test(e.path)));
}

/**
 * Builds the closing note against the findings ACTUALLY QUOTED so far in
 * this render (not the full domain data) -- a topic-scoped clause (e.g.
 * Relationships' children caveat) must never fire unless a quoted finding
 * genuinely touches that topic, or it raises a subject the rendered text
 * itself never surfaced. The general clause still only needs SOME quoted
 * challenging finding to exist, regardless of topic.
 */
function buildClosingNote(template: DomainTemplate, quotedFindings: Finding[], seed: string): string | null {
  if (!quotedFindings.some((f) => f.polarity === "challenging")) return null;

  const parts = [selectVariant(template.closingNote, seed)];
  for (const conditional of template.conditionalClosingNotes ?? []) {
    const patterns = conditional.triggerPatterns.map((p) => new RegExp(p, "i"));
    if (quotedFindings.some((f) => findingMatchesPatterns(f, patterns))) {
      parts.push(selectVariant(conditional.text, `${seed}:${conditional.triggerPatterns.join(",")}`));
    }
  }
  return parts.join(" ");
}

export function renderDomainSection(
  domain: Domain,
  allFindings: Finding[],
  depth: OutputDepth,
  template: DomainTemplate
): NarrativeSection {
  const domainFindings = allFindings.filter((f) => f.domain.includes(domain));
  const substantive = domainFindings.filter((f) => f.strength > 0);

  const supportiveAll = dedupeBySharedFact(substantive.filter((f) => f.polarity === "supportive")).sort(byStrengthDesc);
  const challengingAll = dedupeBySharedFact(substantive.filter((f) => f.polarity === "challenging")).sort(byStrengthDesc);
  const neutralAll = dedupeBySharedFact(substantive.filter((f) => f.polarity === "neutral")).sort(byStrengthDesc);

  const tier = classifyTier(supportiveAll, challengingAll);
  // Seed ties deterministic variant selection to this chart's ACTUAL (deduped)
  // findings, not the domain name alone -- two charts landing on the same
  // tier don't necessarily read identically.
  const seed = [...supportiveAll, ...challengingAll, ...neutralAll].map((f) => f.id).sort().join("|") || domain;

  if (depth === "essence") {
    return {
      domain,
      depth,
      language: "en",
      sourceFindingIds: [...supportiveAll, ...challengingAll, ...neutralAll].map((f) => f.id),
      text: selectVariant(template.essence[tier], seed),
    };
  }

  if (tier === "thin") {
    return {
      domain,
      depth,
      language: "en",
      sourceFindingIds: [],
      text: selectVariant(template.overviewIntro.thin, seed),
    };
  }

  const usedIds = new Set<string>();
  const quotedFindings: Finding[] = [];
  function quoteBlock(lead: string[], findings: Finding[]): string {
    for (const f of findings) {
      usedIds.add(f.id);
      quotedFindings.push(f);
    }
    const leadSentence = selectVariant(lead, `${seed}:${findings.map((f) => f.id).join(",")}`);
    return `${leadSentence} ${findings.map((f) => f.statement).join(" ")}`;
  }

  const supportiveShown = supportiveAll.slice(0, OVERVIEW_QUOTE_CAP);
  const challengingShown = challengingAll.slice(0, OVERVIEW_QUOTE_CAP);

  const overviewParts: string[] = [selectVariant(template.overviewIntro[tier], seed)];
  if (supportiveShown.length >= 2) overviewParts.push(quoteBlock(template.convergenceSupportive, supportiveShown));
  else if (supportiveShown.length === 1) overviewParts.push(quoteBlock(template.singleSupportive, supportiveShown));
  if (challengingShown.length >= 2) overviewParts.push(quoteBlock(template.convergenceChallenging, challengingShown));
  else if (challengingShown.length === 1) overviewParts.push(quoteBlock(template.singleChallenging, challengingShown));

  // Built from whatever's ACTUALLY quoted so far (not the full domain data) --
  // a topic-scoped clause must never fire on a topic this render never
  // surfaced. See buildClosingNote's own doc for why.
  const overviewClosingNote = buildClosingNote(template, quotedFindings, seed);

  if (depth === "overview") {
    return {
      domain,
      depth,
      language: "en",
      sourceFindingIds: [...usedIds],
      text: [...overviewParts, overviewClosingNote].filter((x): x is string => x !== null).join(" "),
    };
  }

  // full: overview's CORE content (overviewParts, not its closing note --
  // see module doc) verbatim, plus a continuation citing only findings not
  // already quoted above, with the closing note appended once at the true
  // end -- never an independent, larger restatement from scratch.
  const remainingSupportive = supportiveAll.filter((f) => !usedIds.has(f.id));
  const remainingChallenging = challengingAll.filter((f) => !usedIds.has(f.id));
  const remainingNeutral = neutralAll.filter((f) => !usedIds.has(f.id));

  const continuationParts: string[] = [];
  if (remainingSupportive.length >= 2) continuationParts.push(quoteBlock(template.moreSupportive, remainingSupportive));
  else if (remainingSupportive.length === 1)
    continuationParts.push(quoteBlock(template.oneMoreSupportive, remainingSupportive));
  if (remainingChallenging.length >= 2) continuationParts.push(quoteBlock(template.moreChallenging, remainingChallenging));
  else if (remainingChallenging.length === 1)
    continuationParts.push(quoteBlock(template.oneMoreChallenging, remainingChallenging));
  if (remainingNeutral.length > 0) continuationParts.push(quoteBlock(template.additionalContext, remainingNeutral));

  // Recomputed against the FULL quoted set (overview's + the continuation's)
  // -- a topic surfaced only in the continuation (e.g. capped out of
  // overview) must still be able to trigger its own clause here.
  const fullClosingNote = buildClosingNote(template, quotedFindings, seed);

  return {
    domain,
    depth,
    language: "en",
    sourceFindingIds: [...usedIds],
    text: [...overviewParts, ...continuationParts, fullClosingNote].filter((x): x is string => x !== null).join(" "),
  };
}
