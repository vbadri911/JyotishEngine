/**
 * Tier 1 Remedies: a dasha-period remedy, chart-conditional on the currently
 * running Antardasha lord's own placement -- not a flat Mahadasha x Antardasha
 * lookup. See DECISIONS.md (2026-08-03 entries) for the full research trail:
 * BPHS Vol. 2 (R. Santhanam translation), Ch. 52-60, one chapter per Mahadasha
 * lord, each walking all 9 Antardashas. Every row follows the same real
 * structure -- verses describing good effects when the Antardasha lord is
 * well-placed carry NO remedy; a separate set of verses describing evil
 * effects when the lord is afflicted is what a remedy explicitly and only
 * attaches to ("remedial measures to obtain relief from the ABOVE evil
 * effects"). Showing a remedy regardless of this chart's own placement would
 * manufacture an affliction BPHS's own text doesn't describe for that
 * placement -- a real principle 1/5 violation, not a simplification (see the
 * rejected Option A/C in DECISIONS.md).
 *
 * Five atomic condition types, verified uniform across 5 stress-test chapters
 * before generalizing to all 9 Mahadashas: Sun, Moon, Rahu, Saturn first (a
 * benefic luminary, a shadow planet, a naturally malefic planet), then
 * Jupiter checked separately and specifically before the remaining four
 * (Mars/Mercury/Ketu/Venus) because it's the one classical benefic none of
 * the first four were -- confirmed the same vocabulary holds there too, no
 * new condition type, no fewer evil-effects clauses just for being a
 * benefic's own chapter. Every row's trigger is an OR of one or more of
 * these; DASHA_REMEDY_ROWS (dashaRemedyData.ts) encodes each row's specific
 * combination, faithful to that row's actual verse text, not a uniform
 * formula applied blindly.
 */
import { DateTime } from "luxon";
import type { ChartData, EvidenceRef, Finding, Graha } from "../types.js";
import { houseOf, aspectedHouses } from "../engine/houses.js";
import { findActivePeriod, type DashaComputationResult } from "../engine/dasha.js";
import { DASHA_REMEDY_ROWS } from "./dashaRemedyData.js";

export type RemedyTrigger =
  | { type: "debilitated" }
  | { type: "combust" }
  | { type: "enemySign" }
  /** Antardasha lord's house counted from the Ascendant (whole-sign, already `planets.X.house`). */
  | { type: "houseFromAscendant"; houses: number[] }
  /** Antardasha lord's house counted from the MAHADASHA lord's own sign, not Lagna --
   *  the one atomic fact this engine had no prior call site for; houseOf() is already
   *  sign-generic, so this needed no new primitive, just this new consumer. */
  | { type: "houseFromMahadashaLord"; houses: number[] }
  /** The Antardasha lord itself rules the 2nd or 7th house from Lagna (maraka).
   *  Never true for Rahu/Ketu -- houseLords never names a node as a sign lord,
   *  which matches classical convention, not a gap needing a special case. */
  | { type: "marakaLord" }
  /** Generalizes marakaLord to arbitrary house numbers (a few rows name a
   *  non-maraka lordship, e.g. Mars-in-Saturn's "lord of the 7th or the 8th"). */
  | { type: "lordOfHouses"; houses: number[] }
  /** The Antardasha lord is physically PLACED in one of these houses from the
   *  Ascendant. Distinct from marakaLord: used for Rahu/Ketu's "be in the 2nd
   *  or 7th" (the nodes cannot "lord" a sign, so the verse's own maraka-style
   *  language must mean occupancy, not rulership) and a few rows that state
   *  occupancy outright (e.g. Mars-in-Saturn's "if Mars be in the 2nd"). */
  | { type: "occupiesHouseFromAscendant"; houses: number[] }
  /** Antardasha lord is conjunct (same house) or aspected by any of the named grahas.
   *  Covers both a specific named planet ("aspected by Saturn") and a generic
   *  "associated with malefics" (pass NATURAL_MALEFICS). */
  | { type: "aspectedByOrConjunctWith"; grahas: Graha[] }
  /** Antardasha lord is conjunct or aspected by whichever graha(s) currently
   *  lord the given houses in THIS chart (e.g. "associated with the lords of
   *  the 2nd or 7th") -- the target grahas are chart-dependent, computed at
   *  evaluation time, not a fixed list. */
  | { type: "aspectedByOrConjunctWithHouseLords"; houses: number[] };

export interface DashaRemedyRow {
  mahadashaLord: Graha;
  antardashaLord: Graha;
  /** OR'd together -- ANY one true triggers the remedy, matching BPHS's own "if X or Y" verses. */
  triggers: RemedyTrigger[];
  /** The remedy itself, as given in the verse -- Japa/Dana/Poojan, never a gemstone. */
  remedyText: string;
  /** Chapter + verse range in R. Santhanam's BPHS Vol. 2 translation. */
  citation: string;
}

interface TriggerCheck {
  matched: boolean;
  evidence: EvidenceRef[];
}

function evaluateTrigger(
  chart: ChartData,
  mahadashaLord: Graha,
  antardashaLord: Graha,
  trigger: RemedyTrigger
): TriggerCheck {
  const adPlanet = chart.planets[antardashaLord];
  const path = (field: string) => `planets.${antardashaLord}.${field}`;

  switch (trigger.type) {
    case "debilitated":
      return adPlanet.dignity === "debilitated"
        ? { matched: true, evidence: [{ path: path("dignity"), value: adPlanet.dignity }] }
        : { matched: false, evidence: [] };

    case "combust":
      return adPlanet.combust
        ? { matched: true, evidence: [{ path: path("combust"), value: true }] }
        : { matched: false, evidence: [] };

    case "enemySign":
      return adPlanet.dignity === "enemy"
        ? { matched: true, evidence: [{ path: path("dignity"), value: adPlanet.dignity }] }
        : { matched: false, evidence: [] };

    case "houseFromAscendant":
      return trigger.houses.includes(adPlanet.house)
        ? { matched: true, evidence: [{ path: path("house"), value: adPlanet.house }] }
        : { matched: false, evidence: [] };

    case "houseFromMahadashaLord": {
      const mdSign = chart.planets[mahadashaLord].sign;
      const houseFromMD = houseOf(mdSign, adPlanet.sign);
      return trigger.houses.includes(houseFromMD)
        ? {
            matched: true,
            evidence: [
              { path: path("sign"), value: adPlanet.sign },
              { path: `planets.${mahadashaLord}.sign`, value: mdSign },
            ],
          }
        : { matched: false, evidence: [] };
    }

    case "marakaLord":
    case "lordOfHouses": {
      const houses = trigger.type === "marakaLord" ? [2, 7] : trigger.houses;
      const ruledHouse = houses.find((h) => chart.houseLords[h]?.lord === antardashaLord);
      return ruledHouse !== undefined
        ? { matched: true, evidence: [{ path: `houseLords.${ruledHouse}.lord`, value: antardashaLord }] }
        : { matched: false, evidence: [] };
    }

    case "occupiesHouseFromAscendant":
      return trigger.houses.includes(adPlanet.house)
        ? { matched: true, evidence: [{ path: path("house"), value: adPlanet.house }] }
        : { matched: false, evidence: [] };

    case "aspectedByOrConjunctWith":
      return checkAspectOrConjunction(chart, antardashaLord, trigger.grahas);

    case "aspectedByOrConjunctWithHouseLords": {
      const targets = trigger.houses
        .map((h) => chart.houseLords[h]?.lord)
        .filter((g): g is Graha => g !== undefined && g !== antardashaLord);
      return checkAspectOrConjunction(chart, antardashaLord, targets);
    }
  }
}

function checkAspectOrConjunction(chart: ChartData, antardashaLord: Graha, targets: Graha[]): TriggerCheck {
  const adHouse = chart.planets[antardashaLord].house;
  for (const target of targets) {
    if (target === antardashaLord) continue;
    const targetPlanet = chart.planets[target];
    if (targetPlanet.house === adHouse) {
      return { matched: true, evidence: [{ path: `planets.${target}.house`, value: targetPlanet.house }] };
    }
    if (aspectedHouses(target, targetPlanet.house).includes(adHouse)) {
      return { matched: true, evidence: [{ path: `planets.${target}.house`, value: targetPlanet.house }] };
    }
  }
  return { matched: false, evidence: [] };
}

/**
 * Checks a row's triggers against this chart's real Antardasha-lord facts.
 * Returns every matched trigger's evidence (not just the first) -- a chart
 * can genuinely satisfy more than one of BPHS's own OR'd conditions at once,
 * and all of them are real corroborating evidence, the same pattern
 * houseAfflictionFindings() already uses for multi-cause affliction.
 */
export function checkRemedyCondition(chart: ChartData, row: DashaRemedyRow): { matched: boolean; evidence: EvidenceRef[] } {
  const evidence: EvidenceRef[] = [];
  let matched = false;
  for (const trigger of row.triggers) {
    const result = evaluateTrigger(chart, row.mahadashaLord, row.antardashaLord, trigger);
    if (result.matched) {
      matched = true;
      evidence.push(...result.evidence);
    }
  }
  return { matched, evidence };
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/**
 * The Tier 1 dasha-period remedy Finding for whatever Antardasha is active
 * `asOfISO` (defaults to real current time -- a "what applies right now"
 * fact, same reasoning as currentDashaFinding() in findings/index.ts).
 *
 * Returns [] in two genuinely different cases, both correct silence, not a
 * bug -- SKILL.md principle 1 (evidence or silence): (1) this Mahadasha
 * hasn't been transcribed into DASHA_REMEDY_ROWS yet (Mars/Jupiter/Mercury/
 * Ketu/Venus, not built this session), or (2) the row exists but this
 * chart's own Antardasha-lord facts don't match the affliction condition
 * BPHS's text actually ties the remedy to -- i.e. this specific placement is
 * one the source describes as favorable, which per the design-gate decision
 * (DECISIONS.md, 2026-08-03) must never be papered over with a remedy anyway.
 *
 * Statement is deliberately framed as "a traditional supportive practice
 * for this period" and never states WHY it applies (affliction, maraka
 * lordship, aspect by a malefic, etc.) -- that reasoning lives in `evidence`
 * for provenance/audit, not in the reader-facing text. This is the same
 * split bodyPartFindings()/houseAfflictionFindings() already use to keep a
 * disclosed implementation choice out of reader-facing prose, applied here
 * to satisfy the blocking framing condition on Mahamrityunjaya Japa and any
 * other remedy text (DECISIONS.md, 2026-08-02): never imply the period
 * itself is dangerous, however subtly.
 */
export function detectDashaRemedy(
  chart: ChartData,
  dasha: DashaComputationResult,
  asOfISO: string = DateTime.now().toISO()!
): Finding[] {
  const antardasha = findActivePeriod(dasha.mahadashas, asOfISO, "antardasha");
  const mahadasha = antardasha?.parent;
  if (!antardasha || !mahadasha) return [];

  const row = DASHA_REMEDY_ROWS.find(
    (r) => r.mahadashaLord === mahadasha.lord && r.antardashaLord === antardasha.lord
  );
  if (!row) return [];

  const { matched, evidence } = checkRemedyCondition(chart, row);
  if (!matched) return [];

  return [
    {
      id: nextId("dasha-remedy"),
      domain: ["timing"],
      statement: `A traditional supportive practice associated with the current Antardasha of ${row.antardashaLord} within the Mahadasha of ${row.mahadashaLord} is ${row.remedyText}.`,
      evidence,
      citation: row.citation,
      strength: 1.0, // a fact about which classical remedy applies, not a graded judgment -- same reasoning as currentDashaFinding()
      polarity: "neutral",
      appliesToPeriods: [`${antardasha.level}-${antardasha.lord}-${antardasha.start}`],
    },
  ];
}
