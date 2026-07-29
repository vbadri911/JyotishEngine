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

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

const NOTABLE_DIGNITIES = new Set(["exalted", "own", "moolatrikona", "debilitated"]);
const DIGNITY_STRENGTH: Record<string, number> = {
  exalted: 0.9,
  own: 0.75,
  moolatrikona: 0.7,
  debilitated: 0.8, // a strong signal, just a challenging one -- strength is magnitude, not favorability
};
const DIGNITY_POLARITY: Record<string, Polarity> = {
  exalted: "supportive",
  own: "supportive",
  moolatrikona: "supportive",
  debilitated: "challenging",
};

// interpretation.md domain-mapping table, "Primary planets/factors" column -- only the
// planets explicitly named there, independent of what they happen to lord in a given chart.
const GRAHA_DOMAINS: Partial<Record<Graha, Domain[]>> = {
  Sun: ["career"],
  Saturn: ["career"],
  Jupiter: ["wealth", "relationships"],
  Venus: ["wealth", "relationships"],
};

/**
 * Standalone dignity findings for Sun/Saturn/Jupiter/Venus (see module doc
 * for why only these four) plus the Lagna lord specifically (interpretation.md
 * names "Lagna lord's dignity" as a Health factor, independent of house).
 * Only dignities strong enough to be individually meaningful --
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
    if (planet.graha === lagnaLord) domains.add("health");
    if (domains.size === 0) continue; // not one of the table's explicitly mapped planets, and not the Lagna lord

    findings.push({
      id: nextId("dignity"),
      domain: [...domains],
      statement: `${planet.graha} is ${planet.dignity} in ${planet.sign} (house ${planet.house})${
        planet.graha === lagnaLord ? ", and is the Lagna lord" : ""
      }.`,
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

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

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
      statement: `${ordinal(house)} lord (${lord}) is placed in ${lordPlanet.sign} in the ${ordinal(placedInHouse)} house${
        ownHouse ? " -- its own house" : ""
      }, dignity ${lordPlanet.dignity}.`,
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
      statement: `${planet.graha} is combust, ${planet.distanceFromSunDegrees.toFixed(2)} deg from the Sun -- its significations are weakened while combust.`,
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

  return {
    id: nextId("current-dasha"),
    domain: ["timing"],
    statement: `Currently running: ${path} (Mahadasha / Antardasha / Pratyantardasha), ${active.start} to ${active.end}.`,
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
    ...(current ? [current] : []),
  ];
}
