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

/**
 * constants.md's Karakas table, body-part column only -- interpretation.md
 * names "planetary body-part associations" as Health's third factor
 * (BACKLOG.md), and this data was already written down there, just never
 * turned into a Finding. Rahu/Ketu deliberately absent: constants.md's table
 * gives them no body-part entry, and inventing one would repeat the exact
 * failure mode GRAHA_DOMAINS's own doc already warns against.
 */
export const GRAHA_BODY_PARTS: Partial<Record<Graha, string>> = {
  Sun: "bones and eyes",
  Moon: "bodily fluids",
  Mars: "blood",
  Mercury: "the nervous system and skin",
  Jupiter: "the liver and fat metabolism",
  Venus: "the kidneys",
  Saturn: "bones, joints, and chronic conditions",
};

/**
 * Natural malefics (Papa Graha) used for Health's 6th/8th and Relationships'
 * 7th occupancy/aspect affliction findings -- see constants.md's new
 * "Natural malefics and benefics" section (2026-08-01) for the full
 * classical picture and why Sun/Mercury/Moon are deliberately excluded here
 * (Sun: disputed status, not asserted either way; Mercury/Moon: genuinely
 * conditional on factors this project doesn't compute for this purpose, a
 * stronger reason than mere disagreement). This is a disclosed
 * implementation choice, not settled classical fact -- surfaced in the
 * affliction findings' own statement text, the same way Mangal Dosha's
 * Lagna-based reference point is disclosed rather than assumed universal.
 */
export const NATURAL_MALEFICS: ReadonlySet<Graha> = new Set(["Saturn", "Mars", "Rahu", "Ketu"]);
