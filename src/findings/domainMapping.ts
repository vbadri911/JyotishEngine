import type { Domain, Graha } from "../types.js";

/**
 * .claude/skills/jyotish-engine/references/interpretation.md's domain-mapping
 * table, "Primary planets/factors" column -- only the planets explicitly
 * named there, independent of what they happen to lord in a given chart.
 * Shared between src/findings/index.ts (standalone dignity findings) and
 * src/rules/yogas.ts (Mahapurusha yoga findings), since both are
 * fundamentally the same question -- "which domain does this graha's
 * strength serve" -- and using two different mappings for the same graha
 * across the two files would be an unprincipled inconsistency.
 *
 * Deliberately does NOT cover Moon, Mars, Mercury, Rahu, Ketu: the table
 * doesn't name them as a primary factor for any of the six domains, and
 * inventing a classical karaka mapping it doesn't state is the exact
 * failure mode SKILL.md's own "Common errors" section warns against. A
 * finding about one of these five planets can still surface in a domain
 * section through OTHER channels that don't require this table entry --
 * house-lord findings (when the planet happens to lord a domain-relevant
 * house) chief among them -- just not as an unconditional standalone tag.
 */
export const GRAHA_DOMAINS: Partial<Record<Graha, Domain[]>> = {
  Sun: ["career"],
  Saturn: ["career"],
  Jupiter: ["wealth", "relationships"],
  Venus: ["wealth", "relationships"],
};
