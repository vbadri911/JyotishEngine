/**
 * Natal chart decoded (Full Blueprint, interpretation.md "Full-depth document
 * structure" item 1) -- structural/enumerative, not evaluative, the same
 * architectural category as Timing (`timing.ts`): every planet and every
 * house gets exactly one note here regardless of dignity strength or
 * domain-relevance, so this deliberately does NOT go through Finding /
 * render.ts's polarity-tier machinery -- Natal chart decoded isn't one of
 * interpretation.md's 6 domains, and forcing it through the domain-tier
 * classifier would silently drop the 5 planets and 3 houses that table
 * doesn't name (Moon/Mars/Mercury/Rahu/Ketu; houses 3/4/12), which is exactly
 * wrong for a section whose whole point is completeness.
 *
 * Reuses dignityFindings()/houseLordFindings()'s underlying primitives
 * (dignityPredicate, ordinal) but without their domain-relevance filter --
 * per the Full Blueprint design gate (DECISIONS.md, 2026-07-30): extending to
 * all 9 planets/12 houses isn't inventing an unstated karaka mapping (the
 * risk SKILL.md's "Common errors" warns about), since dignity and house-lord
 * placement are general structural facts constants.md already covers for
 * every planet/house -- only which *domain* a finding is tagged with was ever
 * scoped down to 4 planets/9 houses, and this section isn't domain-tagged.
 */
import type { ChartData, Graha } from "../types.js";
import { ordinal } from "../util/ordinal.js";
import { dignityPredicate } from "../util/dignityPredicate.js";

export interface PlanetNote {
  graha: Graha;
  statement: string;
}

export interface HouseNote {
  house: number;
  statement: string;
}

const PLANET_ORDER: Graha[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

/**
 * One note per planet, all 9, regardless of dignity strength -- unlike
 * `dignityFindings()`'s deliberate "notable dignities only" scoping (own/
 * exalted/moolatrikona/debilitated), this section is enumerative by design.
 */
export function allPlanetNotes(chart: ChartData): PlanetNote[] {
  const lagnaLord = chart.houseLords[1]?.lord;
  return PLANET_ORDER.map((graha) => {
    const p = chart.planets[graha];
    const lagnaLordClause = graha === lagnaLord ? ", and is the Lagna lord" : "";
    const retrogradeClause = p.retrograde ? ", retrograde" : "";
    const combustClause = p.combust ? ", combust" : "";
    return {
      graha,
      statement: `${graha} is ${dignityPredicate(p.dignity)} in ${p.sign}, in the ${ordinal(
        p.house
      )} house${lagnaLordClause}${retrogradeClause}${combustClause}.`,
    };
  });
}

/**
 * One note per house, all 12 -- unlike `houseLordFindings()`'s domain-scoped
 * 9-house table (3rd/4th/12th excluded there as "not primary drivers" for any
 * of the 6 domains), this section covers every house.
 */
export function allHouseNotes(chart: ChartData): HouseNote[] {
  const notes: HouseNote[] = [];
  for (let house = 1; house <= 12; house++) {
    const { lord, placedInHouse } = chart.houseLords[house]!;
    const lordPlanet = chart.planets[lord];
    const ownHouse = placedInHouse === house;
    notes.push({
      house,
      statement: `${ordinal(house)} lord ${lord} is placed in ${lordPlanet.sign}, in the ${ordinal(
        placedInHouse
      )} house${ownHouse ? " -- its own house" : ""}, and is ${dignityPredicate(lordPlanet.dignity)}.`,
    });
  }
  return notes;
}
