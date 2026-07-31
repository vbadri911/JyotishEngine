/**
 * Personality (Full Blueprint, interpretation.md "Full-depth document
 * structure" item 2) -- v1 scope only, per the Full Blueprint design gate
 * (DECISIONS.md, 2026-07-30): Lagna-sign temperament (element + modality +
 * Lagna lord) plus Lagna-lord dignity as a strength/blind-spot signal.
 * Moon-nakshatra temperament and decision-making/communication style
 * (Mercury-specific) are explicitly deferred -- see
 * `references/personality.md` for the full scope note and why.
 *
 * Same architectural category as Timing and Natal chart decoded:
 * Personality isn't one of interpretation.md's 6 domains, so this
 * deliberately does NOT go through Finding/render.ts's polarity-tier
 * machinery. Every sentence is composed directly from already-verified
 * fields (element/modality/lord per sign from `data/signs.json`, dignity per
 * planet from the existing dignity engine) -- never a hand-written per-sign
 * paragraph. `references/personality.md` documents why: a real classical
 * source (Phaladeepika Ch. 9) was found and read in full for this, then
 * deliberately NOT used, because it turned out to be physiognomy-heavy with
 * content unsuitable for direct reader-facing use (SKILL.md principle 5,
 * "Never trade on fear"). `LORD_EMPHASIS` below compresses constants.md's
 * already-verified Karakas table to one temperament-relevant clause per
 * graha -- every word traces to that table; where a graha's table entry
 * offers a fear-coded option alongside a safer one (Rahu: "obsession" vs.
 * "unconventional"), the safer literal word is used, same principle applied
 * to this module's own output as to the Phaladeepika text it rejected.
 */
import type { ChartData, Graha, SignName } from "../types.js";
import { dignityPredicate } from "../util/dignityPredicate.js";
import { DIGNITY_POLARITY } from "../findings/index.js";
import signsData from "../../data/signs.json" with { type: "json" };

interface SignRow {
  index: number;
  name: string;
  element: string;
  modality: string;
  lord: string;
}
const SIGN_ROWS: Record<SignName, SignRow> = Object.fromEntries(
  signsData.signs.map((s) => [s.name, s])
) as Record<SignName, SignRow>;

const ELEMENT_TEMPERAMENT: Record<string, string> = {
  Fire: "an energetic, direct temperament, quick to act and quick to react",
  Earth: "a practical, steady temperament, grounded in tangible reality",
  Air: "an intellectual, sociable temperament, oriented toward ideas and exchange",
  Water: "an emotionally attuned, intuitive temperament, responsive to mood and atmosphere",
};

const MODALITY_TEMPERAMENT: Record<string, string> = {
  movable: "expressed by initiating -- comfortable starting things and prompting change",
  fixed: "expressed with persistence -- comfortable sustaining effort once committed",
  dual: "expressed adaptably -- comfortable adjusting to shifting circumstances",
};

const LORD_EMPHASIS: Record<Graha, string> = {
  Sun: "authority and vitality",
  Moon: "mind and emotion",
  Mars: "courage",
  Mercury: "intelligence and communication",
  Jupiter: "wisdom",
  Venus: "comfort and harmony",
  Saturn: "discipline",
  Rahu: "the unconventional",
  Ketu: "detachment",
};

export interface LagnaTemperamentNote {
  statement: string;
}

export function lagnaTemperamentNote(chart: ChartData): LagnaTemperamentNote {
  const sign = SIGN_ROWS[chart.ascendant.sign];
  const element = ELEMENT_TEMPERAMENT[sign.element];
  const modality = MODALITY_TEMPERAMENT[sign.modality];
  const lord = sign.lord as Graha;
  const emphasis = LORD_EMPHASIS[lord];
  return {
    statement: `${chart.ascendant.sign} Lagna gives ${element}, ${modality}. Its lord, ${lord}, points toward an underlying focus on ${emphasis}.`,
  };
}

export interface LagnaLordNote {
  statement: string;
  /** supportive -> framed as a strength; challenging -> an honest blind spot;
   *  neutral -> neither emphasized, per DIGNITY_POLARITY's existing 3-way
   *  split (dignityFindings() already uses this same categorization). */
  polarity: "supportive" | "challenging" | "neutral";
}

export function lagnaLordNote(chart: ChartData): LagnaLordNote {
  const lagnaLord = chart.houseLords[1]!.lord;
  const p = chart.planets[lagnaLord];
  const polarity = DIGNITY_POLARITY[p.dignity] ?? "neutral";
  const framing =
    polarity === "supportive"
      ? "a genuine strength to draw on"
      : polarity === "challenging"
        ? "an honest blind spot worth deliberate attention, not something to assume takes care of itself"
        : "a placement of ordinary, unremarkable strength";
  return {
    statement: `The Lagna lord, ${lagnaLord}, is ${dignityPredicate(p.dignity)} in ${p.sign} -- ${framing}.`,
    polarity,
  };
}
