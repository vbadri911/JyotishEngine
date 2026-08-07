/**
 * How informative a Finding's own TYPE is, independent of its `strength`
 * number -- a yoga/dosha classification says strictly more about a placement
 * than a bare dignity restatement of the same fact (it also says whether the
 * classical condition, and any cancellation, actually holds); a house-lord
 * finding names a specific domain-relevant role a plain dignity/body-part
 * finding doesn't. Lower rank = more informative.
 *
 * Shared between two real consumers of the exact same judgment call, in two
 * different scopes -- extracted here specifically so they can't silently
 * drift apart, per explicit instruction (2026-08-04):
 *   - `narrative/render.ts`'s `richnessRank()`: ranks WITHIN a cluster of
 *     findings that share the same underlying dignity evidence, to pick one
 *     representative to quote -- `Finding.strength` only breaks ties within
 *     the same category. Unchanged behavior; this file is a pure extraction,
 *     not a rewrite (see DECISIONS.md for the verification this didn't
 *     silently change any existing dedup collision's winner).
 *   - `export/remediesSection.ts`'s Executive Summary ranking: ranks ACROSS
 *     the WHOLE candidate pool (not just within a dedup cluster) -- the same
 *     category-first, strength-second ordering, applied at a different
 *     scope. Built after real golden-chart output showed the previous
 *     strength-only ranking let body-part findings (calibrated for Health's
 *     own single-domain tier classification, not for competing against yoga
 *     classifications across domains) crowd out this chart's actual
 *     standout facts (5 Raja Yoga combinations, Gajakesari) out of a
 *     document's own headline summary.
 */
import type { Finding } from "../types.js";

export function findingCategoryRank(f: Finding): number {
  if (f.classification !== undefined) return 0;
  if (f.statement.includes("Lagna lord")) return 1;
  if (f.id.startsWith("house-lord-")) return 2;
  return 3;
}
