/**
 * Converts already-computed chart facts (dignity, house-lord placement,
 * combustion, current dasha period) into Finding objects -- the aggregation
 * layer between raw chart facts and any future narrative rendering (Phase 5,
 * not built yet). Domain mapping and the Finding shape itself follow
 * .claude/skills/jyotish-engine/references/interpretation.md exactly;
 * consult that file before changing anything here, not memory.
 *
 * Scope note: only facts this reference file explicitly domain-maps are
 * turned into standalone findings here. The table's "Primary planets/
 * factors" column only names Sun, Saturn, Jupiter, Venus, and "Lagna lord"
 * (dynamic per chart) -- Moon, Mars, Mercury, Rahu, Ketu aren't tied to a
 * specific domain there. Rather than invent a classical karaka mapping not
 * present in the reference doc (the exact failure mode SKILL.md's own
 * "Common errors" section warns about), those five planets' dignity/
 * combustion still surface via houseLordFindings() whenever they happen to
 * rule one of the nine domain-relevant houses in a given chart -- just not
 * as an unconditional standalone finding.
 */
import { DateTime } from "luxon";
import type { ChartData, Domain, Finding, Graha, Polarity } from "../types.js";
import type { DashaComputationResult } from "../engine/dasha.js";
import { findActivePeriod } from "../engine/dasha.js";
import { aspectedHouses } from "../engine/houses.js";
import { detectDashaRemedy } from "../rules/dashaRemedies.js";
import { ordinal } from "../util/ordinal.js";
import { dignityPredicate } from "../util/dignityPredicate.js";
import { formatUtcDate } from "../util/formatUtcDate.js";
import { GRAHA_DOMAINS, GRAHA_BODY_PARTS, NATURAL_MALEFICS } from "./domainMapping.js";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

const NOTABLE_DIGNITIES = new Set(["exalted", "own", "moolatrikona", "debilitated"]);
export const DIGNITY_STRENGTH: Record<string, number> = {
  exalted: 0.9,
  own: 0.75,
  moolatrikona: 0.7,
  debilitated: 0.8, // a strong signal, just a challenging one -- strength is magnitude, not favorability
};
export const DIGNITY_POLARITY: Record<string, Polarity> = {
  exalted: "supportive",
  own: "supportive",
  moolatrikona: "supportive",
  debilitated: "challenging",
};

/**
 * Standalone dignity findings for Sun/Saturn/Jupiter/Venus (see module doc
 * for why only these four) plus the Lagna lord specifically -- interpretation.md
 * names "Lagna lord's dignity" under Health AND "Lagna lord's placement" under
 * Purpose (two separate table rows, same planet), and its own worked example
 * is explicit that both apply at once: "an exalted Lagna-lord Sun in the 9th
 * feeds both Career and Purpose" -- which is this exact golden chart. Only
 * dignities strong enough to be individually meaningful --
 * exalted/own/moolatrikona/debilitated. Friend/neutral/enemy are real but
 * weak signals, better left to compound (house-lord) findings than reported
 * as standalone noise -- "length follows data," not exhaustive.
 */
export function dignityFindings(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  const lagnaLord = chart.houseLords[1]?.lord;

  for (const planet of Object.values(chart.planets)) {
    if (!NOTABLE_DIGNITIES.has(planet.dignity)) continue;

    const domains = new Set<Domain>(GRAHA_DOMAINS[planet.graha] ?? []);
    if (planet.graha === lagnaLord) {
      domains.add("health");
      domains.add("purpose");
    }
    if (domains.size === 0) continue; // not one of the table's explicitly mapped planets, and not the Lagna lord

    findings.push({
      id: nextId("dignity"),
      domain: [...domains],
      statement: `${planet.graha} is ${dignityPredicate(planet.dignity)} in ${planet.sign}, in the ${ordinal(
        planet.house
      )} house${planet.graha === lagnaLord ? ", and is also the Lagna lord" : ""}.`,
      evidence: [
        { path: `planets.${planet.graha}.dignity`, value: planet.dignity },
        { path: `planets.${planet.graha}.sign`, value: planet.sign },
        { path: `planets.${planet.graha}.house`, value: planet.house },
      ],
      strength: DIGNITY_STRENGTH[planet.dignity] ?? 0.5,
      polarity: DIGNITY_POLARITY[planet.dignity] ?? "neutral",
    });
  }
  return findings;
}

// interpretation.md domain-mapping table, "Primary houses" column, houses with an
// explicit domain (3, 4, 12 aren't primary drivers there and are left out deliberately).
const HOUSE_DOMAINS: Partial<Record<number, Domain[]>> = {
  1: ["health", "career"], // vitality; self-presentation
  2: ["wealth"],
  5: ["relationships"], // children
  6: ["health", "career"], // illness; competition
  7: ["relationships"],
  8: ["health"], // longevity/chronic
  9: ["purpose"],
  10: ["career"],
  11: ["wealth"],
};

/**
 * "{N}th lord ({graha}) in {sign}, house {placedInHouse}" for every
 * domain-mapped house -- this is interpretation.md's own literal example
 * finding ("10th lord in own sign in the 10th house").
 */
export function houseLordFindings(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  for (const [houseStr, domains] of Object.entries(HOUSE_DOMAINS)) {
    const house = Number(houseStr);
    const { lord, placedInHouse } = chart.houseLords[house]!;
    const lordPlanet = chart.planets[lord];
    const ownHouse = placedInHouse === house;

    findings.push({
      id: nextId(`house-lord-${house}`),
      domain: domains!,
      statement: `${ordinal(house)} lord ${lord} is placed in ${lordPlanet.sign}, in the ${ordinal(placedInHouse)} house${
        ownHouse ? " -- its own house" : ""
      }, and is ${dignityPredicate(lordPlanet.dignity)}.`,
      evidence: [
        { path: `houseLords.${house}.lord`, value: lord },
        { path: `houseLords.${house}.placedInHouse`, value: placedInHouse },
        { path: `planets.${lord}.dignity`, value: lordPlanet.dignity },
      ],
      strength: (DIGNITY_STRENGTH[lordPlanet.dignity] ?? 0.5) + (ownHouse ? 0.1 : 0),
      polarity: DIGNITY_POLARITY[lordPlanet.dignity] ?? "neutral",
    });
  }
  return findings;
}

/** One finding per combust graha (Sun is never combust -- see dignity.ts's assessCombustion). */
export function combustionFindings(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  for (const planet of Object.values(chart.planets)) {
    if (!planet.combust) continue;
    const domains = GRAHA_DOMAINS[planet.graha] ?? (["purpose"] as Domain[]); // see module doc: loose fallback for planets interpretation.md doesn't explicitly domain-map
    findings.push({
      id: nextId("combustion"),
      domain: domains,
      statement: `${planet.graha} is combust, ${planet.distanceFromSunDegrees.toFixed(2)} degrees from the Sun -- its significations are weakened while this close to the Sun.`,
      evidence: [
        { path: `planets.${planet.graha}.combust`, value: true },
        { path: `planets.${planet.graha}.distanceFromSunDegrees`, value: planet.distanceFromSunDegrees },
      ],
      strength: 0.6,
      polarity: "challenging",
    });
  }
  return findings;
}

/**
 * Health's third named factor, "planetary body-part associations"
 * (interpretation.md) -- BACKLOG.md flagged this gap: the mapping already
 * existed in constants.md's Karakas table, just never turned into a
 * Finding. One finding per graha with BOTH a notable dignity (same
 * NOTABLE_DIGNITIES set dignityFindings() uses) AND a body-part entry
 * (GRAHA_BODY_PARTS) -- Rahu/Ketu excluded, no entry exists for them.
 * Interpretation.md's own non-diagnosis sensitivity requirement is carried
 * by Health's existing unconditional closing note (templates/en/health.json),
 * not repeated inside this statement -- the same lesson the Mangal Dosha
 * "see references/yogas.md" leak already taught (DECISIONS.md): a caveat
 * meant for the interpretation LAYER does not belong inside a reader-facing
 * Finding.statement itself.
 *
 * Statement is deliberately TWO independent sentences, not one fused
 * clause, per a real fluency issue caught 2026-08-01: an earlier version
 * read "Sun is exalted in Aries -- classically associated with bones and
 * eyes," which implies the exaltation is WHY Sun is associated with bones
 * and eyes. It isn't -- the karaka association is a permanent fact of the
 * graha, true regardless of dignity; only the TENDENCY (resilience vs.
 * needing attention) is placement-dependent. Sentence 1 states the
 * permanent fact alone; sentence 2 states the dignity and explicitly
 * attributes the tendency (not the association itself) to it.
 */
export function bodyPartFindings(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  for (const planet of Object.values(chart.planets)) {
    if (!NOTABLE_DIGNITIES.has(planet.dignity)) continue;
    const bodyPart = GRAHA_BODY_PARTS[planet.graha];
    if (!bodyPart) continue;

    const polarity = DIGNITY_POLARITY[planet.dignity] ?? "neutral";
    const tendencyClause =
      polarity === "supportive" ? "suggesting general resilience in this area" : "suggesting this may be an area worth general attention";

    findings.push({
      id: nextId("body-part"),
      domain: ["health"],
      statement: `${planet.graha} is classically associated with ${bodyPart}. ${planet.graha} is ${dignityPredicate(planet.dignity)} in ${planet.sign}, ${tendencyClause}.`,
      evidence: [
        { path: `planets.${planet.graha}.dignity`, value: planet.dignity },
        { path: `planets.${planet.graha}.sign`, value: planet.sign },
      ],
      strength: DIGNITY_STRENGTH[planet.dignity] ?? 0.5,
      polarity,
    });
  }
  return findings;
}

const HOUSE_AFFLICTION_TARGETS: { house: number; domain: Domain; idPrefix: string; framing: string }[] = [
  { house: 6, domain: "health", idPrefix: "house-affliction-6", framing: "this chart's patterns around daily obstacles, service, and competition" },
  { house: 8, domain: "health", idPrefix: "house-affliction-8", framing: "this chart's patterns around transformation and resilience" },
  { house: 7, domain: "relationships", idPrefix: "house-affliction-7", framing: "this chart's partnership dynamics" },
];

/**
 * Health's second named factor, "afflictions to 6th/8th," and Relationships'
 * "aspects onto the 7th" (interpretation.md) -- previously only meant "the
 * house lord's own dignity" (houseLordFindings()), which covers neither
 * which planets OCCUPY nor which ASPECT those houses (BACKLOG.md). Reuses
 * aspectedHouses() (already implemented, already tested) -- no new
 * primitive needed, just a new consumer of one that already existed.
 *
 * "Affliction" here means occupancy or aspect by a natural malefic
 * (NATURAL_MALEFICS: Saturn, Mars, Rahu, Ketu) -- a disclosed implementation
 * choice, not asserted as settled classical fact; see constants.md's
 * "Natural malefics and benefics" section (2026-08-01) for why Sun/Mercury/
 * Moon are excluded. The disclosure lives there and in DECISIONS.md, not
 * inside this function's reader-facing statement text, for the same reason
 * bodyPartFindings() keeps the non-diagnosis caveat out of its own text.
 */
export function houseAfflictionFindings(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  for (const { house, domain, idPrefix, framing } of HOUSE_AFFLICTION_TARGETS) {
    const clauses: string[] = [];
    const evidence: Finding["evidence"] = [];

    for (const planet of Object.values(chart.planets)) {
      if (!NATURAL_MALEFICS.has(planet.graha)) continue;
      if (planet.house === house) {
        clauses.push(`${planet.graha} occupies it`);
        evidence.push({ path: `planets.${planet.graha}.house`, value: planet.house });
      } else if (aspectedHouses(planet.graha, planet.house).includes(house)) {
        clauses.push(`${planet.graha} aspects it from the ${ordinal(planet.house)} house`);
        evidence.push({ path: `planets.${planet.graha}.house`, value: planet.house });
      }
    }
    if (clauses.length === 0) continue;

    findings.push({
      id: nextId(idPrefix),
      domain: [domain],
      statement: `The ${ordinal(house)} house is afflicted: ${clauses.join(", and ")} -- relevant to ${framing}.`,
      evidence,
      strength: 0.55,
      polarity: "challenging",
    });
  }
  return findings;
}

/**
 * The currently-active dasha period (Mahadasha -> Antardasha -> Pratyantardasha),
 * as of `asOfISO` (defaults to real current time -- this is inherently a
 * "what's true right now" fact, not a property of the birth chart itself).
 * Returns null if `asOfISO` falls outside the computed 120-year cycle.
 */
export function currentDashaFinding(dasha: DashaComputationResult, asOfISO: string = DateTime.now().toISO()!): Finding | null {
  const active = findActivePeriod(dasha.mahadashas, asOfISO, "pratyantardasha");
  if (!active) return null;

  const antardasha = active.parent;
  const mahadasha = antardasha?.parent;
  const path = [mahadasha?.lord, antardasha?.lord, active.lord].filter(Boolean).join(" -> ");

  // Bug found while building the P5 Timing renderer, the first real consumer
  // of this statement's text (see DECISIONS.md): active.start/.end carry
  // whatever local offset the running environment happens to have (same
  // underlying Luxon behavior already fixed for .ics UID/DESCRIPTION), so
  // interpolating them raw here would leak a raw, environment-dependent
  // timestamp into reader-facing prose. formatUtcDate() normalizes first.
  return {
    id: nextId("current-dasha"),
    domain: ["timing"],
    statement: `Currently running: ${path} (Mahadasha / Antardasha / Pratyantardasha), ${formatUtcDate(active.start)} to ${formatUtcDate(active.end)}.`,
    evidence: [
      { path: "mahadasha.lord", value: mahadasha?.lord },
      { path: "antardasha.lord", value: antardasha?.lord },
      { path: "pratyantardasha.lord", value: active.lord },
    ],
    strength: 1.0, // a fact, not a judgment -- always "fully true" while active
    polarity: "neutral",
    appliesToPeriods: [`${active.level}-${active.lord}-${active.start}`],
  };
}

/**
 * Full aggregation: dignity + house-lord + combustion + current-dasha
 * findings, combined with the yoga/dosha findings callers already compute
 * separately via detectAllCoreYogas(). Kept as a separate function (not
 * merged into detectAllCoreYogas itself) so yoga detection stays testable
 * in isolation, as it already was before this file existed.
 */
export function aggregateFindings(
  chart: ChartData,
  dasha: DashaComputationResult,
  yogaFindings: Finding[],
  asOfISO?: string
): Finding[] {
  const current = currentDashaFinding(dasha, asOfISO);
  return [
    ...yogaFindings,
    ...dignityFindings(chart),
    ...houseLordFindings(chart),
    ...combustionFindings(chart),
    ...bodyPartFindings(chart),
    ...houseAfflictionFindings(chart),
    ...(current ? [current] : []),
    ...detectDashaRemedy(chart, dasha, asOfISO),
  ];
}
