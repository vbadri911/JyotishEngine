/**
 * Tier 1 dasha-period remedy rows, verse-verified against BPHS Vol. 2
 * (R. Santhanam translation), Ch. 52-60 -- see DECISIONS.md (2026-08-03) for
 * the chapter-location correction (real location, not the earlier guessed
 * Ch. 46-53) and the condition-pattern research trail. All 9 Mahadasha
 * chapters now covered (Sun=52, Moon=53, Mars=54, Rahu=55, Jupiter=56,
 * Saturn=57, Mercury=58, Ketu=59, Venus=60), added in two passes: Sun/Moon/
 * Rahu/Saturn first (the original 4-chapter stress test -- a benefic
 * luminary, a shadow planet, a naturally malefic planet), then Jupiter read
 * separately and specifically BEFORE the remaining 4 because it's the one
 * classical benefic none of the first 4 chapters were -- confirmed the same
 * five-atomic-fact vocabulary holds there too (no new condition type, no
 * fewer evil-effects clauses just because the Mahadasha lord is a benefic),
 * before generalizing to Mars/Mercury/Ketu/Venus.
 *
 * Each row's `triggers` are transcribed from the ACTUAL verse text preceding
 * that Antardasha's remedy sentence -- not a uniform formula applied
 * blindly. Where a row's evil-effects clause elides its reference point
 * (relying on the immediately preceding clause's frame) or states something
 * unusual (a non-standard maraka pair, a node's "be in" language standing in
 * for lordship it structurally cannot hold), that's flagged inline, not
 * silently normalized.
 *
 * Every chapter's raw OCR text was checked for page-order scrambling before
 * transcription (Ch. 52 was genuinely scrambled, per DECISIONS.md; none of
 * Ch. 53/54/55/56/57/58/59/60 were, confirmed by sorting each chapter's own
 * page-number markers and checking the result was already monotonic, not
 * assumed clean just because Ch. 52 was the only one caught the first time).
 *
 * FOUR real, deliberate omissions -- not every triggered affliction in BPHS
 * has a prescribed remedy, and this table only ships what the verse itself
 * gives, never a backfilled guess:
 * - Mars-in-Moon (Ch. 53, v.9-12): evil effects described, no remedy verse
 *   follows at all -- the text moves straight to the next Antardasha.
 * - Moon-in-Venus (Ch. 60, v.21-29): identical pattern -- evil effects
 *   described (debilitated/combust/6-8-12th), no remedy verse follows; the
 *   text moves straight to Mars-in-Venus.
 * - Ketu-in-Mars (Ch. 54, v.52-54): also no remedy verse -- BUT R. Santhanam's
 *   own translator "Notes:" here goes further and offers his own speculative
 *   guess ("Perhaps recitation of Vishnu Sahasranam and giving a goat in
 *   charity will give relief") -- explicitly marked as his own suggestion,
 *   not Parashara's text. Excluded for the same reason a "Notes:" aside was
 *   never treated as verse content anywhere else in this table.
 * - Mars-in-Venus (Ch. 60, v.30-35): identical translator-speculation
 *   pattern -- "Though remedial measure is not mentioned, we believe that
 *   giving a bull in charity will enable the native to obtain relief" --
 *   again the translator's own guess, explicitly flagged as such, not
 *   Parashara's verse. Caught specifically by treating every chapter's
 *   "Notes:" asides with the same suspicion as the four originally-verified
 *   chapters, not just the ones already known to contain one.
 */
import type { DashaRemedyRow } from "./dashaRemedies.js";
import { NATURAL_MALEFICS } from "../findings/domainMapping.js";

const MALEFICS = [...NATURAL_MALEFICS];

export const DASHA_REMEDY_ROWS: DashaRemedyRow[] = [
  // ---------------------------------------------------------------------
  // Sun Mahadasha -- BPHS Vol.2 Ch.52
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Sun",
    antardashaLord: "Sun",
    triggers: [{ type: "debilitated" }, { type: "marakaLord" }],
    remedyText: "Mrityunjaya Japa, or worship of the Sun through recitation of appropriate mantras and charity",
    citation: "BPHS Vol.2 (Santhanam) Ch.52 v.1-3, Antardasha of the Sun in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Moon",
    triggers: [{ type: "houseFromMahadashaLord", houses: [6, 8, 12] }, { type: "marakaLord" }],
    remedyText: "giving a white cow and a female buffalo in charity",
    citation: "BPHS Vol.2 Ch.52 v.13-14, Antardasha of the Moon in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Mars",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "debilitated" },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of the Vedas, Japa, and Vastrotsarga (ceremonial gifting of cloth)",
    citation: "BPHS Vol.2 Ch.52 v.19-22, Antardasha of Mars in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Rahu",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      // Rahu cannot "lord" a house (houseLords never names a node) -- the
      // verse's "if Rahu be in the 2nd or 7th" is occupancy, not maraka lordship.
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
      { type: "aspectedByOrConjunctWithHouseLords", houses: [2, 7] },
    ],
    remedyText: "worship of Goddess Durga, Japa, and giving a black cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.52 v.27-31, Antardasha of Rahu in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Jupiter",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
    ],
    remedyText: "giving gold and a tawny-coloured cow in charity, and worship of the Ishta devata (one's chosen deity)",
    citation: "BPHS Vol.2 Ch.52 v.37-39, Antardasha of Jupiter in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Saturn",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "debilitated" },
      { type: "marakaLord" },
    ],
    remedyText: "giving a black cow, a buffalo, and a goat in charity, and Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.52 v.43-47, Antardasha of Saturn in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Mercury",
    // The verse itself notes Mercury can never actually fall 6th/8th from the
    // Sun (max elongation) -- kept as literally stated, informational only.
    triggers: [{ type: "houseFromMahadashaLord", houses: [6, 8, 12] }, { type: "marakaLord" }],
    remedyText: "recitation of Vishnu Sahasranama, and giving grains and a silver idol in charity",
    citation: "BPHS Vol.2 Ch.52 v.54-57, Antardasha of Mercury in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Ketu",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "recitation of mantras to Goddess Durga (Shat Chandi Patha), and giving a goat in charity",
    citation: "BPHS Vol.2 Ch.52 v.60-64, Antardasha of Ketu in the Dasa of the Sun",
  },
  {
    mahadashaLord: "Sun",
    antardashaLord: "Venus",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
      { type: "aspectedByOrConjunctWithHouseLords", houses: [6, 8] },
    ],
    remedyText: "Mrityunjaya Japa, Rudra Japa, and giving a tawny cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.52 v.69-73, Antardasha of Venus in the Dasa of the Sun",
  },

  // ---------------------------------------------------------------------
  // Moon Mahadasha -- BPHS Vol.2 Ch.53
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Moon",
    antardashaLord: "Moon",
    triggers: [
      { type: "debilitated" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "marakaLord" },
      { type: "aspectedByOrConjunctWithHouseLords", houses: [8, 12] },
    ],
    remedyText: "giving a tawny-coloured cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.53 v.3-6, Antardasha of the Moon in the Dasa of the Moon",
  },
  // Mars-in-Moon (Ch.53 v.9-12) deliberately omitted: the verse describes
  // real evil effects with NO remedy sentence following -- see module doc.
  {
    mahadashaLord: "Moon",
    antardashaLord: "Rahu",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Rahu Japa, and giving a goat in charity",
    citation: "BPHS Vol.2 Ch.53 v.17-21, Antardasha of Rahu in the Dasa of the Moon",
  },
  {
    mahadashaLord: "Moon",
    antardashaLord: "Jupiter",
    triggers: [
      { type: "houseFromAscendant", houses: [6, 8] },
      { type: "combust" },
      { type: "debilitated" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Shiva Sahasranama Japa, and giving gold in charity",
    citation: "BPHS Vol.2 Ch.53 v.25-31, Antardasha of Jupiter in the Dasa of the Moon",
  },
  {
    mahadashaLord: "Moon",
    antardashaLord: "Saturn",
    triggers: [{ type: "houseFromAscendant", houses: [2, 6, 7, 8, 12] }, { type: "debilitated" }],
    remedyText: "Mrityunjaya Japa, and giving a black cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.53 v.35-38, Antardasha of Saturn in the Dasa of the Moon",
  },
  {
    mahadashaLord: "Moon",
    antardashaLord: "Mercury",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "debilitated" },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama, and giving a goat in charity",
    citation: "BPHS Vol.2 Ch.53 v.44-46, Antardasha of Mercury in the Dasa of the Moon",
  },
  {
    mahadashaLord: "Moon",
    antardashaLord: "Ketu",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.53 v.50-52, Antardasha of Ketu in the Dasa of the Moon",
  },
  {
    mahadashaLord: "Moon",
    antardashaLord: "Venus",
    triggers: [
      { type: "debilitated" },
      { type: "combust" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "Rudra Japa, and giving a white cow and silver in charity",
    citation: "BPHS Vol.2 Ch.53 v.57-64, Antardasha of Venus in the Dasa of the Moon",
  },
  {
    mahadashaLord: "Moon",
    antardashaLord: "Sun",
    triggers: [{ type: "houseFromMahadashaLord", houses: [8, 12] }, { type: "marakaLord" }],
    remedyText: "worship of Lord Shiva",
    citation: "BPHS Vol.2 Ch.53 v.68-70, Antardasha of the Sun in the Dasa of the Moon",
  },

  // ---------------------------------------------------------------------
  // Rahu Mahadasha -- BPHS Vol.2 Ch.55
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Rahu",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "worship of Rahu through recitation of his mantras, and charity of items connected with or ruled by Rahu",
    citation: "BPHS Vol.2 Ch.55 v.5-7, Antardasha of Rahu in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Jupiter",
    triggers: [
      { type: "debilitated" },
      { type: "combust" },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "enemySign" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "worship of Lord Shiva, specifically a gold idol",
    citation: "BPHS Vol.2 Ch.55 v.13-20, Antardasha of Jupiter in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Saturn",
    triggers: [
      { type: "debilitated" },
      { type: "enemySign" },
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "giving a black cow or she-buffalo in charity",
    citation: "BPHS Vol.2 Ch.55 v.25-29, Antardasha of Saturn in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Mercury",
    triggers: [
      // Reference point elided in the evil-effects clause itself; inherited
      // from the immediately preceding good-effects clause, which explicitly
      // reads "from the lord of the Dasa." Flagged for future re-verification,
      // not asserted with full confidence -- see module doc.
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: ["Saturn"] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama",
    citation: "BPHS Vol.2 Ch.55 v.36-39, Antardasha of Mercury in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Ketu",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "giving a goat in charity",
    citation: "BPHS Vol.2 Ch.55 v.43-45, Antardasha of Ketu in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Venus",
    triggers: [
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "debilitated" },
      { type: "enemySign" },
      { type: "aspectedByOrConjunctWith", grahas: ["Saturn", "Mars", "Rahu"] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "worship of Goddess Durga and Goddess Lakshmi",
    citation: "BPHS Vol.2 Ch.55 v.51-59, Antardasha of Venus in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Sun",
    triggers: [{ type: "debilitated" }, { type: "houseFromMahadashaLord", houses: [6, 8, 12] }, { type: "marakaLord" }],
    remedyText: "worship of the Sun",
    citation: "BPHS Vol.2 Ch.55 v.64-67, Antardasha of the Sun in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Moon",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      // Verse literally reads "lord of the 2nd or the 12th," not the standard
      // 2nd/7th maraka pair used everywhere else in this table -- possibly an
      // OCR/scan artifact in this edition, kept as literally stated rather
      // than silently normalized to 7th.
      { type: "lordOfHouses", houses: [2, 12] },
    ],
    remedyText: "giving a white cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.55 v.73-75, Antardasha of the Moon in the Dasa of Rahu",
  },
  {
    mahadashaLord: "Rahu",
    antardashaLord: "Mars",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "giving a cow or a bull in charity",
    citation: "BPHS Vol.2 Ch.55 v.80-83, Antardasha of Mars in the Dasa of Rahu",
  },

  // ---------------------------------------------------------------------
  // Saturn Mahadasha -- BPHS Vol.2 Ch.57
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Saturn",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "debilitated" },
      { type: "marakaLord" },
    ],
    remedyText: "Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.57 v.4-7, Antardasha of Saturn in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Mercury",
    triggers: [
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: ["Sun", "Mars", "Rahu"] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama, and giving grains in charity",
    citation: "BPHS Vol.2 Ch.57 v.12-15, Antardasha of Mercury in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Ketu",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "giving a goat in charity",
    citation: "BPHS Vol.2 Ch.57 v.20-23, Antardasha of Ketu in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Venus",
    triggers: [
      { type: "debilitated" },
      { type: "combust" },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "worship of Goddess Durga, performance of Durga Saptashati Patha, and giving a cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.57 v.28-36, Antardasha of Venus in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Sun",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "worship of the Sun",
    citation: "BPHS Vol.2 Ch.57 v.39-42, Antardasha of the Sun in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Moon",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "debilitated" },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "Havana (fire ritual), and giving jaggery, ghee, rice mixed with curd, and a cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.57 v.46-54, Antardasha of the Moon in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Mars",
    triggers: [
      { type: "debilitated" },
      { type: "combust" },
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "occupiesHouseFromAscendant", houses: [2] },
      { type: "lordOfHouses", houses: [7, 8] },
    ],
    remedyText: "Havana (fire ritual), and giving a bull in charity",
    citation: "BPHS Vol.2 Ch.57 v.58-62, Antardasha of Mars in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Rahu",
    // v.63-64's own "if Rahu not be in his house of exaltation or any other
    // auspicious position" is too broad/generic to encode as a crisp trigger
    // (it would fire almost unconditionally) -- deliberately not encoded;
    // only the specific v.69-70 condition immediately preceding the remedy
    // sentence is used, per this project's "when in doubt, don't overclaim" standard.
    triggers: [{ type: "aspectedByOrConjunctWithHouseLords", houses: [2, 7] }],
    remedyText: "Mrityunjaya Japa, and giving a goat in charity",
    citation: "BPHS Vol.2 Ch.57 v.69-70, Antardasha of Rahu in the Dasa of Saturn",
  },
  {
    mahadashaLord: "Saturn",
    antardashaLord: "Jupiter",
    triggers: [
      { type: "debilitated" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Shiva Sahasranama, and giving gold in charity",
    citation: "BPHS Vol.2 Ch.57 v.74-82, Antardasha of Jupiter in the Dasa of Saturn",
  },

  // ---------------------------------------------------------------------
  // Jupiter Mahadasha -- BPHS Vol.2 Ch.56 (the first classical-benefic
  // Mahadasha chapter read -- confirmed the trigger vocabulary before
  // Mars/Mercury/Ketu/Venus were transcribed)
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Jupiter",
    // "debilitated Navamsa" is also named in the verse as an evil-effects
    // trigger; not encoded -- this engine has no D9-dignity primitive, and
    // adding one for a single row would be new scope, not a gap in reading.
    triggers: [{ type: "debilitated" }, { type: "houseFromAscendant", houses: [6, 8, 12] }, { type: "marakaLord" }],
    remedyText: "recitation of Rudra Japa and Shiva Sahasranama",
    citation: "BPHS Vol.2 Ch.56 v.4-5, Antardasha of Jupiter in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Saturn",
    triggers: [
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "combust" },
      { type: "enemySign" },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama, and giving a black cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.56 v.12-19, Antardasha of Saturn in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Mercury",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: ["Mars"] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama",
    citation: "BPHS Vol.2 Ch.56 v.22-31, Antardasha of Mercury in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Ketu",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.56 v.33-38, Antardasha of Ketu in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Venus",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "debilitated" },
      { type: "aspectedByOrConjunctWith", grahas: ["Saturn", "Rahu"] },
      { type: "marakaLord" },
    ],
    remedyText: "giving a tawny-coloured cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.56 v.44-50, Antardasha of Venus in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Sun",
    triggers: [
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Aditya Hridaya Patha",
    citation: "BPHS Vol.2 Ch.56 v.54-57, Antardasha of the Sun in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Moon",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "Durga Saptashati Patha",
    citation: "BPHS Vol.2 Ch.56 v.61-64, Antardasha of the Moon in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Mars",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "debilitated" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "giving a bull in charity",
    citation: "BPHS Vol.2 Ch.56 v.69-71, Antardasha of Mars in the Dasa of Jupiter",
  },
  {
    mahadashaLord: "Jupiter",
    antardashaLord: "Rahu",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Mrityunjaya Japa, and giving a goat in charity",
    citation: "BPHS Vol.2 Ch.56 v.76-80, Antardasha of Rahu in the Dasa of Jupiter",
  },

  // ---------------------------------------------------------------------
  // Mars Mahadasha -- BPHS Vol.2 Ch.54
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Mars",
    antardashaLord: "Mars",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "Rudra Japa, and giving a red-coloured bull in charity",
    citation: "BPHS Vol.2 Ch.54 v.5-8, Antardasha of Mars in the Dasa of Mars",
  },
  {
    mahadashaLord: "Mars",
    antardashaLord: "Rahu",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Naga Puja (worship of the serpent deity), offering food to Brahmins, and Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.54 v.11-14, Antardasha of Rahu in the Dasa of Mars",
  },
  {
    mahadashaLord: "Mars",
    antardashaLord: "Jupiter",
    // Verse names the 5th house alongside 8th/12th as an affliction house
    // here -- unusual (5th is normally a trikona, a favorable house), kept
    // as literally stated rather than assumed a typo for a standard house.
    triggers: [
      { type: "houseFromAscendant", houses: [5, 8, 12] },
      { type: "debilitated" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "lordOfHouses", houses: [2] }, // only the 2nd is named here, not the usual 2nd/7th pair
    ],
    remedyText: "recitation of Shiva Sahasranama",
    citation: "BPHS Vol.2 Ch.54 v.20-22, Antardasha of Jupiter in the Dasa of Mars",
  },
  {
    mahadashaLord: "Mars",
    antardashaLord: "Saturn",
    // v.30-32's own claim that a kendra/trikona placement from the Dasa lord
    // is INAUSPICIOUS here (the reverse of every other row's pattern) is
    // flagged by the translator's own "Notes:" as a deliberate, sage-attributed
    // exception, not his own doubt -- but it inverts this engine's
    // houseFromMahadashaLord semantics in a way nothing else in this table
    // does, and the remedy sentence doesn't clearly re-attach to it. Left
    // unencoded rather than building a one-row special case.
    triggers: [
      { type: "debilitated" },
      { type: "enemySign" },
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "marakaLord" },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [8, 12] },
    ],
    remedyText: "Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.54 v.26-35, Antardasha of Saturn in the Dasa of Mars",
  },
  {
    mahadashaLord: "Mars",
    antardashaLord: "Mercury",
    triggers: [
      { type: "debilitated" },
      { type: "combust" },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: ["Mars"] }, // conjunct the Mahadasha lord itself, named specifically
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama, and giving a horse in charity",
    citation: "BPHS Vol.2 Ch.54 v.38-47, Antardasha of Mercury in the Dasa of Mars",
  },
  // Ketu-in-Mars (Ch.54 v.52-54) deliberately omitted: no remedy verse --
  // only R. Santhanam's own explicitly-flagged speculative guess. See module doc.
  {
    mahadashaLord: "Mars",
    antardashaLord: "Venus",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "giving a cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.54 v.61-63, Antardasha of Venus in the Dasa of Mars",
  },
  {
    mahadashaLord: "Mars",
    antardashaLord: "Sun",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "worship of the Sun",
    citation: "BPHS Vol.2 Ch.54 v.67-69, Antardasha of the Sun in the Dasa of Mars",
  },
  {
    mahadashaLord: "Mars",
    antardashaLord: "Moon",
    triggers: [
      { type: "debilitated" },
      { type: "enemySign" },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of mantras of Goddess Durga and Goddess Lakshmi",
    citation: "BPHS Vol.2 Ch.54 v.74-76, Antardasha of the Moon in the Dasa of Mars",
  },

  // ---------------------------------------------------------------------
  // Mercury Mahadasha -- BPHS Vol.2 Ch.58
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Mercury",
    triggers: [
      { type: "debilitated" },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama",
    citation: "BPHS Vol.2 Ch.58 v.1-5, Antardasha of Mercury in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Ketu",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "giving a goat in charity",
    citation: "BPHS Vol.2 Ch.58 v.9-12, Antardasha of Ketu in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Venus",
    triggers: [{ type: "houseFromMahadashaLord", houses: [6, 8, 12] }, { type: "marakaLord" }],
    remedyText: "recitation of mantras of Goddess Durga",
    citation: "BPHS Vol.2 Ch.58 v.16-19, Antardasha of Venus in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Sun",
    triggers: [
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: ["Saturn", "Mars", "Rahu"] },
      { type: "marakaLord" },
    ],
    remedyText: "worship of the Sun",
    citation: "BPHS Vol.2 Ch.58 v.23-25, Antardasha of the Sun in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Moon",
    triggers: [
      { type: "debilitated" },
      { type: "enemySign" },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of mantras of Goddess Durga, and giving clothes in charity",
    citation: "BPHS Vol.2 Ch.58 v.30-35, Antardasha of the Moon in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Mars",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "Mrityunjaya Japa, and giving a cow in charity",
    citation: "BPHS Vol.2 Ch.58 v.39-46, Antardasha of Mars in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Rahu",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      // Verse literally reads "2nd or the 6th," not the standard 2nd/7th
      // maraka pair -- kept as literally stated, same caution as Rahu-in-Rahu's
      // own non-standard pair elsewhere in this table.
      { type: "occupiesHouseFromAscendant", houses: [2, 6] },
    ],
    remedyText: "recitation of mantras of Goddess Durga and Goddess Lakshmi, and giving a tawny-coloured cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.58 v.54-55, Antardasha of Rahu in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Jupiter",
    triggers: [
      { type: "debilitated" },
      { type: "combust" },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: ["Saturn", "Mars"] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "lordOfHouses", houses: [2, 7] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "recitation of Shiva Sahasranama, and giving a cow and gold in charity",
    citation: "BPHS Vol.2 Ch.58 v.65-66, Antardasha of Jupiter in the Dasa of Mercury",
  },
  {
    mahadashaLord: "Mercury",
    antardashaLord: "Saturn",
    triggers: [{ type: "houseFromMahadashaLord", houses: [8, 12] }, { type: "marakaLord" }],
    remedyText: "Mrityunjaya Japa, and giving a black cow and female buffalo in charity",
    citation: "BPHS Vol.2 Ch.58 v.69-72, Antardasha of Saturn in the Dasa of Mercury",
  },

  // ---------------------------------------------------------------------
  // Ketu Mahadasha -- BPHS Vol.2 Ch.59
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Ketu",
    triggers: [
      { type: "debilitated" },
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "combust" },
      { type: "lordOfHouses", houses: [2, 7] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Durga Saptashati Japa and Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.59 v.5-6, Antardasha of Ketu in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Venus",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "houseFromAscendant", houses: [6, 8] },
      { type: "marakaLord" },
    ],
    remedyText: "Durga Patha, and giving a tawny-coloured cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.59 v.12-15, Antardasha of Venus in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Sun",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "giving a cow and gold in charity",
    citation: "BPHS Vol.2 Ch.59 v.22-24, Antardasha of the Sun in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Moon",
    triggers: [
      { type: "debilitated" },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "lordOfHouses", houses: [2, 7, 8] }, // 8th named alongside the usual maraka pair here
    ],
    remedyText: "recitation of mantras of the Moon, and giving in charity items connected with the Moon",
    citation: "BPHS Vol.2 Ch.59 v.34-36, Antardasha of the Moon in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Mars",
    triggers: [{ type: "houseFromMahadashaLord", houses: [2, 8, 12] }, { type: "marakaLord" }],
    remedyText: "giving a bull in charity",
    citation: "BPHS Vol.2 Ch.59 v.41-43, Antardasha of Mars in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Rahu",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Durga Saptashati Patha",
    citation: "BPHS Vol.2 Ch.59 v.48-50, Antardasha of Rahu in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Jupiter",
    triggers: [{ type: "debilitated" }, { type: "houseFromAscendant", houses: [6, 8, 12] }, { type: "marakaLord" }],
    remedyText: "Mrityunjaya Japa, recitation of Shiva Sahasranama",
    citation: "BPHS Vol.2 Ch.59 v.59-60, Antardasha of Jupiter in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Saturn",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "Havana with sesame seeds, and giving a black cow or female buffalo in charity",
    citation: "BPHS Vol.2 Ch.59 v.67-68, Antardasha of Saturn in the Dasa of Ketu",
  },
  {
    mahadashaLord: "Ketu",
    antardashaLord: "Mercury",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: ["Saturn", "Mars", "Rahu"] },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama",
    citation: "BPHS Vol.2 Ch.59 v.77-79, Antardasha of Mercury in the Dasa of Ketu",
  },

  // ---------------------------------------------------------------------
  // Venus Mahadasha -- BPHS Vol.2 Ch.60
  // ---------------------------------------------------------------------
  {
    mahadashaLord: "Venus",
    antardashaLord: "Venus",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "Durga Patha, and giving a cow in charity",
    citation: "BPHS Vol.2 Ch.60 v.9-11, Antardasha of Venus in the Dasa of Venus",
  },
  {
    mahadashaLord: "Venus",
    antardashaLord: "Sun",
    // v.12's own literal reading is flagged by the translator's own "Notes:"
    // as likely mis-worded (with a corrected alternate quoted from the
    // Chowkambha edition) -- not relied on; only the clean, unflagged v.16-20
    // clause is encoded.
    triggers: [
      { type: "houseFromAscendant", houses: [6, 8, 12] },
      { type: "debilitated" },
      { type: "enemySign" },
      { type: "marakaLord" },
    ],
    remedyText: "worship of the Sun",
    citation: "BPHS Vol.2 Ch.60 v.16-20, Antardasha of the Sun in the Dasa of Venus",
  },
  // Moon-in-Venus (Ch.60 v.21-29) deliberately omitted: evil effects
  // described (debilitated/combust/6-8-12th), but no remedy verse follows --
  // the text moves straight to Mars-in-Venus. A translator "Notes:" here
  // separately claims the standard maraka rule "naturally" extends to this
  // row too, even though the verse never states it -- an inference, not
  // verse text, and not itself a remedy either way; not acted on.
  // Mars-in-Venus (Ch.60 v.30-35) deliberately omitted: no remedy verse --
  // only R. Santhanam's own explicitly-flagged speculative guess. See module doc.
  {
    mahadashaLord: "Venus",
    antardashaLord: "Rahu",
    triggers: [
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "houseFromMahadashaLord", houses: [8, 12] },
      // Rahu cannot "lord" a house -- the verse's "lord of the 2nd or 7th"
      // language, applied to a node, means occupancy (same convention used
      // for every other Rahu/Ketu row in this table).
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.60 v.42-44, Antardasha of Rahu in the Dasa of Venus",
  },
  {
    mahadashaLord: "Venus",
    antardashaLord: "Jupiter",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "Mrityunjaya Japa",
    citation: "BPHS Vol.2 Ch.60 v.49-51, Antardasha of Jupiter in the Dasa of Venus",
  },
  {
    mahadashaLord: "Venus",
    antardashaLord: "Saturn",
    // 11th house named alongside 8th/12th as an affliction house here --
    // unusual (11th is normally an upachaya/gain house), kept as literally
    // stated, same treatment as Mars-in-Mars's own 5th-house anomaly.
    triggers: [
      { type: "debilitated" },
      { type: "houseFromAscendant", houses: [8, 11, 12] },
      { type: "houseFromMahadashaLord", houses: [8, 11, 12] },
      { type: "marakaLord" },
    ],
    remedyText: "Havana with sesame seeds, Mrityunjaya Japa, and Durga Saptashati Patha",
    citation: "BPHS Vol.2 Ch.60 v.58-59, Antardasha of Saturn in the Dasa of Venus",
  },
  {
    mahadashaLord: "Venus",
    antardashaLord: "Mercury",
    triggers: [
      { type: "houseFromMahadashaLord", houses: [6, 8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      { type: "marakaLord" },
    ],
    remedyText: "recitation of Vishnu Sahasranama",
    citation: "BPHS Vol.2 Ch.60 v.63-66, Antardasha of Mercury in the Dasa of Venus",
  },
  {
    mahadashaLord: "Venus",
    antardashaLord: "Ketu",
    triggers: [
      { type: "houseFromAscendant", houses: [8, 12] },
      { type: "aspectedByOrConjunctWith", grahas: MALEFICS },
      // Ketu cannot "lord" a house -- same node-occupancy convention as
      // Rahu-in-Venus above and every other Rahu/Ketu row in this table.
      { type: "occupiesHouseFromAscendant", houses: [2, 7] },
    ],
    remedyText: "Mrityunjaya Japa and giving a goat in charity -- remedial measures for appeasing Venus (the Mahadasha lord) will also prove beneficial",
    citation: "BPHS Vol.2 Ch.60 v.73-74, Antardasha of Ketu in the Dasa of Venus",
  },
];
