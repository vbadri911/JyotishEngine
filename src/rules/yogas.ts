/**
 * Yoga/dosha detection. Operates on already-computed ChartData -- does not
 * touch the ephemeris directly, so these are fully unit-testable right now
 * against a hand-constructed mock ChartData (see tests/), independent of
 * whether the WASM ephemeris integration exists yet.
 *
 * Every detector returns a Finding with an explicit classification. See
 * .claude/skills/jyotish-engine/references/yogas.md for the full reasoning
 * behind each condition and cancellation -- this file implements that
 * document; it does not restate the reasoning inline beyond brief comments.
 */
import type { ChartData, Finding, Graha, YogaClassification } from "../types.js";
import { ordinal } from "../util/ordinal.js";
import { dignityPredicate } from "../util/dignityPredicate.js";
import { GRAHA_DOMAINS } from "../findings/domainMapping.js";
import signsData from "../../data/signs.json" with { type: "json" };

const KENDRAS = [1, 4, 7, 10];
const TRIKONAS = [1, 5, 9];

let findingCounter = 0;
function nextId(prefix: string): string {
  findingCounter += 1;
  return `${prefix}-${findingCounter}`;
}

// ---------------------------------------------------------------------------
// Pancha Mahapurusha Yogas
// ---------------------------------------------------------------------------

const MAHAPURUSHA_YOGAS: Array<{ name: string; graha: Graha }> = [
  { name: "Ruchaka", graha: "Mars" },
  { name: "Bhadra", graha: "Mercury" },
  { name: "Hamsa", graha: "Jupiter" },
  { name: "Malavya", graha: "Venus" },
  { name: "Sasa", graha: "Saturn" },
];

/**
 * A Mahapurusha yoga requires BOTH: dignity is exalted or own-sign, AND the
 * planet occupies a Kendra (1/4/7/10) from the Lagna. Meeting the dignity
 * condition alone without the Kendra condition is a real, strong placement
 * -- but is NOT the named yoga. This is the single most common
 * false-positive in astrology software; do not skip the Kendra check.
 *
 * Domain tagging: previously all five shared a single blanket
 * `["purpose", "career"]` tag regardless of which graha or theme was
 * actually involved -- a scaffold-era shortcut never revisited until real
 * rendered prose exposed it (Malavya, fundamentally about Venus, reading as
 * Purpose-domain evidence with no real connection to dharma/9th-house
 * themes). Fixed by reusing GRAHA_DOMAINS -- the SAME table
 * findings/index.ts already uses for that graha's own standalone dignity
 * finding, since a Mahapurusha yoga is fundamentally more evidence about
 * that same graha's strength, and tagging it differently from the graha's
 * own dignity finding would be an unprincipled inconsistency. This means
 * Ruchaka (Mars) and Bhadra (Mercury) now carry NO domain tag: neither
 * planet is named in interpretation.md's "Primary planets/factors" column
 * for any domain, and inventing one is the exact failure mode SKILL.md's
 * "Common errors" section warns against -- consistent with
 * findings/index.ts's own established restraint for these same two planets.
 * Attempted to check BPHS Ch. 75 itself (which SKILL.md cites as verified
 * for the qualifying CONDITION) for each yoga's described life-results,
 * which might have justified a broader mapping -- not reachable via
 * available tooling (the archive.org text is too large to fetch the actual
 * chapter content, and web search surfaced only the same condition table
 * already in yogas.md, not results text) -- so this stays a reasoned
 * judgment from already-verified tables, not a primary-source quote, and is
 * flagged as such. Ruchaka/Bhadra's strength still surfaces via
 * houseLordFindings() whenever Mars/Mercury happen to lord a domain-relevant
 * house in a given chart -- not lost, just not an unconditional yoga-level tag.
 */
export function detectMahapurushaYogas(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  for (const { name, graha } of MAHAPURUSHA_YOGAS) {
    const planet = chart.planets[graha];
    const dignified = planet.dignity === "exalted" || planet.dignity === "own";
    const inKendra = KENDRAS.includes(planet.house);

    let classification: YogaClassification;
    let statement: string;
    if (dignified && inKendra) {
      classification = "EXACT";
      statement = `${name} Yoga: ${graha} is ${dignityPredicate(planet.dignity)} in the ${ordinal(
        planet.house
      )} house, which is a Kendra.`;
    } else if (dignified && !inKendra) {
      classification = "STRONG_NOT_TEXTBOOK";
      statement = `${graha} is ${dignityPredicate(planet.dignity)} in the ${ordinal(
        planet.house
      )} house -- a strong placement, but not ${name} Yoga, since the ${ordinal(planet.house)} house is not a Kendra.`;
    } else {
      classification = "ABSENT";
      statement = `${name} Yoga: not present. ${graha} is ${dignityPredicate(planet.dignity)} in the ${ordinal(
        planet.house
      )} house.`;
    }

    findings.push({
      id: nextId(`yoga-${name.toLowerCase()}`),
      domain: GRAHA_DOMAINS[graha] ?? [],
      statement,
      evidence: [
        { path: `planets.${graha}.dignity`, value: planet.dignity },
        { path: `planets.${graha}.house`, value: planet.house },
      ],
      classification,
      strength: classification === "EXACT" ? 0.9 : classification === "STRONG_NOT_TEXTBOOK" ? 0.6 : 0,
      polarity: classification === "ABSENT" ? "neutral" : "supportive",
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Gajakesari Yoga
// ---------------------------------------------------------------------------

/**
 * Kendra-from-Moon check: is Jupiter 1st, 4th, 7th, or 10th sign away from
 * the Moon (inclusive)? Domain: checked against the same audit that retagged
 * the Mahapurusha yogas above, and left as ["purpose"] -- confirmed, not
 * assumed. Jupiter is interpretation.md's named wealth karaka too
 * (GRAHA_DOMAINS[Jupiter] includes "wealth"), but Gajakesari isn't a bare
 * "Jupiter is dignified" fact the way a Mahapurusha yoga is -- it's
 * specifically Jupiter's ANGULAR RELATIONSHIP TO THE MOON, classically the
 * archetypal fame/wisdom/good-fortune yoga (Jupiter as dharma/wisdom
 * karaka), not a wealth-comfort signature the way Malavya (Venus) is. Kept
 * distinct from the GRAHA_DOMAINS-reuse rule applied to the Mahapurusha
 * yogas for that reason.
 */
export function detectGajakesariYoga(chart: ChartData): Finding {
  const moon = chart.planets.Moon;
  const jupiter = chart.planets.Jupiter;

  // House-of-Jupiter-counted-from-Moon's-sign, using the same whole-sign
  // counting convention as houses.ts, but anchored to the Moon rather than
  // the Lagna.
  const SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  const moonIdx = SIGN_ORDER.indexOf(moon.sign);
  const jupIdx = SIGN_ORDER.indexOf(jupiter.sign);
  const offsetFromMoon = ((jupIdx - moonIdx + 12) % 12) + 1; // 1-12

  const isKendraFromMoon = KENDRAS.includes(offsetFromMoon);
  const notAfflicted = jupiter.dignity !== "debilitated" && !jupiter.combust;

  const classification: YogaClassification = isKendraFromMoon ? "EXACT" : "ABSENT";
  return {
    id: nextId("yoga-gajakesari"),
    domain: ["purpose"],
    statement: isKendraFromMoon
      ? `Gajakesari Yoga: Jupiter is ${offsetFromMoon} signs from the Moon -- a Kendra relationship${
          notAfflicted ? "" : ", though Jupiter is weakened here (debilitated or combust), which moderates the yoga's strength"
        }.`
      : `Gajakesari Yoga: not present. Jupiter is ${offsetFromMoon} signs from the Moon, not a Kendra position.`,
    evidence: [
      { path: "planets.Moon.sign", value: moon.sign },
      { path: "planets.Jupiter.sign", value: jupiter.sign },
    ],
    classification,
    strength: isKendraFromMoon ? (notAfflicted ? 0.85 : 0.6) : 0,
    polarity: classification === "EXACT" ? "supportive" : "neutral",
  };
}

// ---------------------------------------------------------------------------
// Kemadruma Yoga (with cancellation checks -- do not report without them)
// ---------------------------------------------------------------------------

/**
 * Domain: previously tagged ["relationships", "wealth"] -- also a
 * scaffold-era guess, revisited on the same audit as the Mahapurusha tags
 * above. yogas.md itself frames this dosha only as "struggle/isolation," and
 * the Moon (its subject graha) isn't named in interpretation.md's "Primary
 * planets/factors" column for ANY of the six domains -- not wealth
 * (Jupiter/Venus only), not relationships (Venus/Jupiter only). "Isolation"
 * reads as general social/emotional, not marriage/partnership specifically
 * (this project's actual Relationships scope: 7th house spouse/partnership,
 * 5th house children) -- tagging it "relationships" risked a future
 * template synthesizing a marriage-specific claim this finding's own
 * statement never makes, a real evidence-or-silence gap. Left untagged
 * (domain: []) rather than force-fit either original guess -- same
 * treatment as Ruchaka/Bhadra above, for the same reason.
 */
export function detectKemadrumaYoga(chart: ChartData): Finding {
  const moon = chart.planets.Moon;
  const SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  const moonIdx = SIGN_ORDER.indexOf(moon.sign);
  const secondFromMoonSign = SIGN_ORDER[(moonIdx + 1) % 12];
  const twelfthFromMoonSign = SIGN_ORDER[(moonIdx + 11) % 12];

  const occupants = (Object.values(chart.planets) as typeof chart.planets.Sun[]).filter(
    (p) => p.graha !== "Moon" && p.graha !== "Rahu" && p.graha !== "Ketu" && p.graha !== "Sun"
  );
  const secondOccupied = occupants.some((p) => p.sign === secondFromMoonSign);
  const twelfthOccupied = occupants.some((p) => p.sign === twelfthFromMoonSign);
  const conditionMet = !secondOccupied && !twelfthOccupied;

  // Cancellation: Moon in a Kendra (1/4/7/10) from the LAGNA.
  const moonInKendraFromLagna = KENDRAS.includes(moon.house);

  let classification: YogaClassification;
  let statement: string;
  if (!conditionMet) {
    classification = "ABSENT";
    statement = "Kemadruma Yoga: condition not met -- at least one planet occupies the 2nd or 12th house from the Moon.";
  } else if (moonInKendraFromLagna) {
    classification = "PRESENT_CANCELLED";
    statement = `Kemadruma Yoga: technically present (2nd and 12th from Moon are empty), but cancelled -- the Moon is in a Kendra (house ${moon.house}) from the Lagna. Not a concern.`;
  } else {
    // yogas.md lists a second cancellation this detector doesn't check: the Moon
    // conjunct/aspected by a benefic (Jupiter/Mercury/Venus). Not implemented --
    // some EXACT classifications here may be cancelled under a tradition that
    // also honors that cancellation. Real, known limitation; not the reader's
    // problem to solve, so it stays a code comment, not part of the statement
    // (a sentence telling the READER to "go check benefic aspects" isn't
    // something they can act on, and was cut for exactly that reason -- see
    // DECISIONS.md).
    classification = "EXACT";
    statement = "Kemadruma Yoga: present, and the standard Moon-in-Kendra cancellation does not apply here.";
  }

  return {
    id: nextId("yoga-kemadruma"),
    domain: [],
    statement,
    evidence: [
      { path: "planets.Moon.house", value: moon.house },
      { path: "planets.Moon.sign", value: moon.sign },
    ],
    classification,
    strength: classification === "EXACT" ? 0.5 : 0,
    polarity: classification === "EXACT" ? "challenging" : "neutral",
  };
}

// ---------------------------------------------------------------------------
// Mangal Dosha / Kuja Dosha
// ---------------------------------------------------------------------------

const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

/**
 * Lagna-based check only (the most universally cited reference point).
 * Moon-based and Venus-based checks are additional, tradition-dependent
 * variants -- see references/yogas.md. Flagged clearly as Lagna-only here
 * rather than silently presenting it as the complete picture.
 *
 * Domain: checked against the same audit that retagged the Mahapurusha
 * yogas and Kemadruma above, and left as ["relationships"] -- confirmed,
 * not assumed. Unlike those, this one needs no inference chain: Mangal /
 * Kuja Dosha is one of the most specifically and near-universally cited
 * Jyotish concepts for marriage-compatibility checking, distinct from a
 * general Mars-strength or Mars-affliction claim.
 */
export function detectMangalDosha(chart: ChartData): Finding {
  const mars = chart.planets.Mars;
  const inDoshaHouse = MANGAL_DOSHA_HOUSES.includes(mars.house);

  const marsOwnOrExalted = mars.dignity === "own" || mars.dignity === "exalted";

  let classification: YogaClassification;
  let statement: string;
  if (!inDoshaHouse) {
    classification = "ABSENT";
    statement = `Mangal Dosha (Lagna-based) is absent here -- Mars is in the ${ordinal(
      mars.house
    )} house, not one of the dosha-triggering houses (1, 2, 4, 7, 8, 12).`;
  } else if (marsOwnOrExalted) {
    classification = "PRESENT_CANCELLED";
    statement = `Mangal Dosha (Lagna-based) is technically triggered, with Mars in the ${ordinal(
      mars.house
    )} house, but a standard exemption applies -- Mars is ${mars.dignity} there.`;
  } else {
    classification = "EXACT";
    statement = `Mangal Dosha (Lagna-based) is present: Mars is in the ${ordinal(
      mars.house
    )} house from the Lagna. Different astrological traditions apply somewhat different rules for which placements are considered exempt from this dosha.`;
  }

  return {
    id: nextId("dosha-mangal"),
    domain: ["relationships"],
    statement,
    evidence: [
      { path: "planets.Mars.house", value: mars.house },
      { path: "planets.Mars.dignity", value: mars.dignity },
    ],
    classification,
    citation: "Lagna-based reckoning; regional traditions vary on exemptions",
    strength: classification === "EXACT" ? 0.6 : 0,
    polarity: classification === "EXACT" ? "challenging" : "neutral",
  };
}

// ---------------------------------------------------------------------------
// Nabhasa Yogas (BPHS Ch. 35) -- sign/house-distribution patterns across all
// seven classical grahas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn --
// Rahu/Ketu excluded, same convention Kemadruma's occupancy check and
// yogas.md's own Musala description already use).
//
// archive.org's Santhanam-translation text SKILL.md cites for BPHS
// truncates before reaching Ch. 35 in this project's own fetch tooling (past
// Ch. 4) -- a real, checked, tooling limitation, not assumed. A second real
// source was used instead: sanskritdocuments.org's English translation of
// Ch. 34-45 (https://sanskritdocuments.org/doc_z_misc_sociology_astrology/
// horaashaastraEng34-45.html), fetched directly, quoted with verse numbers
// (vv.7-9), not from a secondary summary. Cross-checked, not blindly
// trusted: its Sakata condition (v.9, "all grahas in Lagna and Yuvati
// Bhava") independently matches what was already found for yogas.md's own
// Shakata-collision fix (BPHS Ch. 35 names an unrelated Sakata, a
// sign-pattern yoga) -- the same chapter, the same yoga, confirmed from two
// separate fetches, giving real confidence in this source's fidelity before
// relying on the rest of it.
//
// Deliberately a SUBSET of Ch. 35's ~32 named Nabhasa yogas, not
// exhaustive: Mala/Bhujanga(Sarpa) Yoga (v.8, "3 Kendras occupied by
// benefics/malefics") is EXCLUDED -- the fetched verse text itself leaves
// genuinely ambiguous whether every occupant must be benefic/malefic or
// merely that one is present, confirmed by asking the source directly to
// clarify and receiving "the text ... does not explicitly state" in
// response. yogas.md's own principle for exactly this situation ("when in
// doubt, do not report... rather than over-report," Musala's caution)
// applies -- this is a real acknowledged source ambiguity, not invented
// caution. Revisit only with a cleaner primary-source quote.
// ---------------------------------------------------------------------------

const CLASSICAL_GRAHAS: Graha[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const SIGN_MODALITY: Record<string, string> = Object.fromEntries(signsData.signs.map((s) => [s.name, s.modality]));
const NABHASA_CITATION = "BPHS Ch. 35 (Nabhasa Yogas), sanskritdocuments.org English translation";

function classicalGrahaHouses(chart: ChartData): Record<Graha, number> {
  return Object.fromEntries(CLASSICAL_GRAHAS.map((g) => [g, chart.planets[g].house])) as Record<Graha, number>;
}

/** Rajju/Musala/Nala: all seven classical grahas share a single sign modality. */
function nabhasaModalityYoga(chart: ChartData, name: string, modality: "movable" | "fixed" | "dual", idPrefix: string): Finding {
  const met = CLASSICAL_GRAHAS.every((g) => SIGN_MODALITY[chart.planets[g].sign] === modality);
  return {
    id: nextId(idPrefix),
    domain: [],
    statement: met
      ? `${name} Yoga: all seven classical grahas (excluding Rahu/Ketu) occupy ${modality} signs.`
      : `${name} Yoga: not present. The seven classical grahas are not all in ${modality} signs.`,
    evidence: CLASSICAL_GRAHAS.map((g) => ({ path: `planets.${g}.sign`, value: chart.planets[g].sign })),
    classification: met ? "EXACT" : "ABSENT",
    citation: NABHASA_CITATION,
    strength: met ? 0.7 : 0,
    polarity: "neutral",
  };
}

/** v.7: "All the grahas in movable rashis cause Rajju Yog." Classical
 *  results are explicitly mixed (fond of wandering, charming, earns abroad
 *  -- but also cruel/mischievous per the same source) -- polarity left
 *  neutral rather than invented as purely positive or negative. */
export function detectRajjuYoga(chart: ChartData): Finding {
  return nabhasaModalityYoga(chart, "Rajju", "movable", "yoga-rajju");
}

/** v.7: "All the grahas in fixed rashis cause Musala Yog." yogas.md already
 *  documents this as "commonly over-reported" -- the strict all-seven check
 *  here is exactly the discipline that entry calls for. */
export function detectMusalaYoga(chart: ChartData): Finding {
  return nabhasaModalityYoga(chart, "Musala", "fixed", "yoga-musala");
}

/** v.7: "All the grahas in dual rashis cause Nala Yog." No confirmed
 *  classical life-results were found in the fetched source for this one
 *  specifically -- polarity left neutral rather than invented. */
export function detectNalaYoga(chart: ChartData): Finding {
  return nabhasaModalityYoga(chart, "Nala", "dual", "yoga-nala");
}

/** v.9: "If all the grahas occupy two successive Kendras, Gada Yog is
 *  formed." Checked against all four successive Kendra pairs (1+4, 4+7,
 *  7+10, 10+1) -- disjoint from Vihaga's specific 4th+10th pair below (4 and
 *  10 are opposite, not successive, in the 1-4-7-10 cycle). */
export function detectGadaYoga(chart: ChartData): Finding {
  const houses = classicalGrahaHouses(chart);
  const successivePairs: [number, number][] = [[1, 4], [4, 7], [7, 10], [10, 1]];
  const matched = successivePairs.find(([a, b]) => CLASSICAL_GRAHAS.every((g) => houses[g] === a || houses[g] === b));

  return {
    id: nextId("yoga-gada"),
    domain: [],
    statement: matched
      ? `Gada Yoga: all seven classical grahas (excluding Rahu/Ketu) are confined to the ${ordinal(matched[0])} and ${ordinal(matched[1])} houses, two successive Kendras.`
      : "Gada Yoga: not present. The seven classical grahas are not confined to two successive Kendra houses.",
    evidence: CLASSICAL_GRAHAS.map((g) => ({ path: `planets.${g}.house`, value: houses[g] })),
    classification: matched ? "EXACT" : "ABSENT",
    citation: NABHASA_CITATION,
    strength: matched ? 0.7 : 0,
    polarity: "neutral",
  };
}

/** v.9: "If all confine to Bandhu [4th] and Karm [10th] Bhava, then Vihag
 *  Yog occurs." A specific pair, not "any two successive Kendras" -- 4th
 *  and 10th are opposite each other in the Kendra cycle, so this is disjoint
 *  from every Gada Yoga pairing above, not a special case of it. */
export function detectVihagaYoga(chart: ChartData): Finding {
  const houses = classicalGrahaHouses(chart);
  const met = CLASSICAL_GRAHAS.every((g) => houses[g] === 4 || houses[g] === 10);

  return {
    id: nextId("yoga-vihaga"),
    domain: [],
    statement: met
      ? "Vihaga Yoga: all seven classical grahas (excluding Rahu/Ketu) are confined to the 4th and 10th houses."
      : "Vihaga Yoga: not present. The seven classical grahas are not confined to the 4th and 10th houses.",
    evidence: CLASSICAL_GRAHAS.map((g) => ({ path: `planets.${g}.house`, value: houses[g] })),
    classification: met ? "EXACT" : "ABSENT",
    citation: NABHASA_CITATION,
    strength: met ? 0.7 : 0,
    polarity: "neutral",
  };
}

// ---------------------------------------------------------------------------
// Raja Yoga (BPHS Ch. 39, vv.1-7 -- sanskritdocuments.org's translation,
// same source and fetch-limitation note as the Nabhasa yogas above)
// ---------------------------------------------------------------------------

/**
 * Ch. 39's own opening verses (vv.3-5) state TWO parallel methods together:
 * a Jaimini-style Atmakaraka/Putrakaraka (Chara Karaka) method, and a
 * rashi-lordship method ("the natal Lagna's lord and Putra's [5th] lord").
 * Only the rashi-lordship method is implemented here -- Chara Karakas
 * aren't computed anywhere in this project yet (SKILL.md's own "not yet
 * done" table, Ch. 32-33, "a v1 addition"), so the Jaimini method is out of
 * scope, not silently approximated.
 *
 * yogas.md's own three simplified sub-forms, each implemented directly:
 *   1. A Kendra-house lord and a Trikona-house lord occupying the same
 *      house together (conjunction).
 *   2. A Kendra-house lord and Trikona-house lord in mutual Kendra
 *      positions from each other (opposite houses -- the universal 7th-
 *      house aspect is symmetric for any pair exactly 7 houses/6 apart,
 *      unlike the special aspects, so this stays unambiguous without
 *      needing aspectedHouses()'s asymmetric special-offset cases).
 *   3. The Lagna lord specifically -- uniquely both Kendra (1st) AND
 *      Trikona (1st) lord at once -- placed in a notably dignified
 *      position. Ch. 39 v.13 (implied) supports this reading directly for
 *      Lagna; NOT generalized to other houses that happen to share a lord
 *      between one Kendra and one Trikona (e.g. 4th/9th sharing a lord for
 *      some Lagna) -- that coincidence has no independent classical
 *      significance the way Lagna's structural dual role does, and
 *      inventing it would be an unstated generalization.
 * A broad, well-populated category by BPHS's own framing -- reports which
 * SPECIFIC combination was found (yogas.md's own caution against a single
 * "the Raja Yoga" verdict), one Finding per qualifying planet pair, deduped
 * by planet identity (not by which house pairing discovered it) so the
 * same two grahas are never reported twice via two different Kendra/Trikona
 * house routes.
 */
export function detectRajaYoga(chart: ChartData): Finding[] {
  const findings: Finding[] = [];
  const seenPairs = new Set<string>();

  for (const kendraHouse of KENDRAS) {
    for (const trikonaHouse of TRIKONAS) {
      if (kendraHouse === trikonaHouse) continue; // Lagna's dual role, handled separately below
      const kendraLord = chart.houseLords[kendraHouse]!.lord;
      const trikonaLord = chart.houseLords[trikonaHouse]!.lord;
      if (kendraLord === trikonaLord) continue; // one planet coincidentally owning both -- not Lagna's structural case, not generalized

      const pairKey = [kendraLord, trikonaLord].sort().join("+");
      if (seenPairs.has(pairKey)) continue;

      const kendraLordPlanet = chart.planets[kendraLord];
      const trikonaLordPlanet = chart.planets[trikonaLord];
      const conjunct = kendraLordPlanet.house === trikonaLordPlanet.house;
      const mutualKendra = Math.abs(kendraLordPlanet.house - trikonaLordPlanet.house) === 6;
      if (!conjunct && !mutualKendra) continue;

      seenPairs.add(pairKey);
      findings.push({
        id: nextId("yoga-raja"),
        domain: ["career"],
        statement: conjunct
          ? `Raja Yoga: ${ordinal(kendraHouse)} lord ${kendraLord} and ${ordinal(trikonaHouse)} lord ${trikonaLord} occupy the same (${ordinal(kendraLordPlanet.house)}) house together.`
          : `Raja Yoga: ${ordinal(kendraHouse)} lord ${kendraLord} and ${ordinal(trikonaHouse)} lord ${trikonaLord} are in mutual Kendra positions from each other, in the ${ordinal(kendraLordPlanet.house)} and ${ordinal(trikonaLordPlanet.house)} houses.`,
        evidence: [
          { path: `houseLords.${kendraHouse}.lord`, value: kendraLord },
          { path: `houseLords.${trikonaHouse}.lord`, value: trikonaLord },
          { path: `planets.${kendraLord}.house`, value: kendraLordPlanet.house },
          { path: `planets.${trikonaLord}.house`, value: trikonaLordPlanet.house },
        ],
        classification: "EXACT",
        citation: "BPHS Ch. 39 (Raja Yoga), rashi-lordship method only -- Jaimini/Chara Karaka method not implemented",
        strength: 0.8,
        polarity: "supportive",
      });
    }
  }

  const lagnaLord = chart.houseLords[1]!.lord;
  const lagnaLordPlanet = chart.planets[lagnaLord];
  if (["exalted", "own", "moolatrikona"].includes(lagnaLordPlanet.dignity)) {
    findings.push({
      id: nextId("yoga-raja"),
      domain: ["career"],
      statement: `Raja Yoga: the Lagna lord ${lagnaLord} -- simultaneously Kendra and Trikona lord -- is ${dignityPredicate(lagnaLordPlanet.dignity)} in ${lagnaLordPlanet.sign}.`,
      evidence: [
        { path: "houseLords.1.lord", value: lagnaLord },
        { path: `planets.${lagnaLord}.dignity`, value: lagnaLordPlanet.dignity },
      ],
      classification: "EXACT",
      citation: "BPHS Ch. 39 (Raja Yoga), rashi-lordship method only -- Jaimini/Chara Karaka method not implemented",
      strength: 0.85,
      polarity: "supportive",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: nextId("yoga-raja"),
      domain: [],
      statement: "Raja Yoga: not present. No Kendra-lord/Trikona-lord conjunction, mutual-Kendra aspect, or dignified dual Lagna-lord combination was found in this chart.",
      evidence: [],
      classification: "ABSENT",
      citation: "BPHS Ch. 39 (Raja Yoga), rashi-lordship method only -- Jaimini/Chara Karaka method not implemented",
      strength: 0,
      polarity: "neutral",
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Aggregate entry point
// ---------------------------------------------------------------------------

export function detectAllCoreYogas(chart: ChartData): Finding[] {
  return [
    ...detectMahapurushaYogas(chart),
    detectGajakesariYoga(chart),
    detectKemadrumaYoga(chart),
    detectMangalDosha(chart),
    detectRajjuYoga(chart),
    detectMusalaYoga(chart),
    detectNalaYoga(chart),
    detectGadaYoga(chart),
    detectVihagaYoga(chart),
    ...detectRajaYoga(chart),
  ];
}
