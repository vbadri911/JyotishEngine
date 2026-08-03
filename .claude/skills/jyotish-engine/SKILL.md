---
name: jyotish-engine
description: Authoritative reference for Vedic astrology (Jyotish) chart computation and interpretation — sidereal positions, ayanamsa choices, planetary dignity, combustion orbs, graha drishti (aspects), nakshatras, divisional charts (varga), Vimshottari dasha math, and yoga/dosha detection with cancellation rules. Use this skill whenever the work involves a birth chart, kundli, horoscope, rasi or navamsa chart, dasha or antardasha timing, nakshatra, lagna/ascendant, planetary strength or dignity, yogas (Raja, Gajakesari, Malavya, Pancha Mahapurusha etc.) or doshas (Mangal, Kala Sarpa, Kemadruma, Sade Sati) — and also whenever building software that computes or interprets Vedic charts, writing interpretation templates, or validating an ephemeris implementation. Consult this even for seemingly simple chart questions, because the constant tables (exaltation degrees, combustion orbs, dasha year-counts) and the yoga cancellation rules are easy to misremember and errors propagate silently through every downstream claim.
---

# Jyotish Engine

Reference and working rules for computing and interpreting Vedic (sidereal) birth charts.

Two things this skill exists to prevent: silently wrong constants (an exaltation degree or dasha
year-count misremembered by one unit corrupts every claim downstream), and the most common failure
in astrology software — reporting a yoga as present when its classical condition is not actually
met, or reporting one as afflicting when a standard cancellation applies.

## Non-negotiable interpretive principles

These govern any output produced with this skill.

1. **Evidence or silence.** Never emit an interpretive claim without a specific chart fact behind
   it. If the chart doesn't support a statement, say nothing rather than filling the gap.
2. **Precision decays honestly.** Near-term timing may combine dasha and transit. Far-term is
   dasha-only. Beyond roughly age 90, or beyond ~15 years for transit-level claims, suppress rather
   than guess. Never produce per-calendar-year detail when the underlying dasha period spans several
   years — the astrology genuinely does not distinguish them.
3. **Length follows data.** A domain with few findings gets a short section that says so. Never pad.
4. **Classify, don't flatten.** Every yoga/dosha detection carries one of four states — see
   "Classification states" below. Rendering them identically is a correctness bug, not a style choice.
5. **Never trade on fear.** No death timing, no predicting marriage failure, no manufactured
   affliction followed by a remedy. Sensitive domains (health, children, marriage) carry a redirect
   to a qualified professional.
6. **Disclose settings.** Every output states the ayanamsa and node type used. Results are not
   comparable across settings.
7. **Defer appropriately.** This skill supports careful analysis; it does not replace a qualified
   human practitioner for decisions that carry real weight, and outputs should say so.

## Default settings

| Setting | Default | Note |
|---|---|---|
| Zodiac | Sidereal | Non-negotiable for Jyotish |
| Ayanamsa | **Lahiri (Chitrapaksha)** | Indian civil standard since the 1955 Calendar Reform Committee |
| Node type | **Mean** | What classical texts assume and most Indian software uses |
| House system | **Whole Sign** (Rasi = Bhava) | Standard South Indian practice |
| Chart format | South Indian (fixed signs) | North Indian is fixed-house, diamond layout |

Change these only on explicit instruction. When validating against an existing report, **match that
report's settings first** — otherwise every comparison shows differences that look like bugs but are
school mismatches.

## Reference files

Read the relevant file rather than working from memory. Each is dense with exact constants.

| File | Contents | Read when |
|---|---|---|
| `references/constants.md` | Signs, exaltation/debilitation degrees, moolatrikona, own signs, planetary friendships, combustion orbs, aspect rules, house significations, karakas | Any chart computation or dignity assessment |
| `references/nakshatras.md` | All 27 nakshatras with lords, deities, spans, padas, and the pada→navamsa mapping | Nakshatra work, dasha initialisation, Navamsa |
| `references/dasha.md` | Vimshottari year-counts, balance-at-birth derivation, proportional subdivision, worked example | Any dasha/antardasha/pratyantardasha computation |
| `references/varga.md` | Divisional chart construction, D9 rule in full, general varga function | Navamsa or any divisional chart |
| `references/yogas.md` | Yoga and dosha definitions with exact conditions and cancellation rules | Any yoga/dosha detection |
| `references/interpretation.md` | House-by-house and planet-by-planet interpretive frames, domain mapping, output structure | Writing readings or interpretation templates |
| `references/chart-layout.md` | South Indian chart's fixed 4×4 grid layout, sign positions, Lagna/house-number/retrograde display conventions | Any chart-drawing code (SVG, PDF) |
| `references/personality.md` | Lagna-sign temperament (element + modality + lord), v1-scoped; why Phaladeepika Ch. 9 was investigated and not used directly | Any Personality-section work (Full Blueprint) |

## Workflow for a full chart analysis

1. **Validate inputs.** Date, time, place, and a birth-time precision flag
   (`exact_from_record` / `approximate` / `unknown`). Resolve the timezone offset **in force on the
   birth date**, not today's rules — India's civil/railway time unified to a single national
   standard (IST, UTC+5:30) on **1906-01-01**, not 1955 (1955 is when the Calendar Reform Committee
   standardized the Lahiri ayanamsa — a different fact, see "Default settings" above — not when the
   timezone changed). Before 1906, cities like Bombay and Calcutta kept their own local civil time
   even after railways adopted a national standard in 1870, so date arithmetic needs true local mean
   time before that date, not a single historical offset. See the host project's DECISIONS.md for the
   primary-source research trail (IANA tzdata, itself citing period sources).
2. **Compute positions.** Sidereal longitudes, sign, degree-in-sign, nakshatra + pada, retrograde,
   house (whole sign from Lagna).
3. **Run the confidence check** — see below. Do this *before* interpreting, because its results
   change what may be claimed.
4. **Assess dignity** for each graha (`references/constants.md`).
5. **Compute D9** and any other required varga (`references/varga.md`).
6. **Compute Vimshottari dasha** from the Moon's exact nakshatra longitude (`references/dasha.md`).
7. **Detect yogas and doshas** with classification and cancellations (`references/yogas.md`).
8. **Interpret** (`references/interpretation.md`), respecting the principles above.

## Confidence check (run before interpreting)

This step is what separates careful analysis from confident-sounding guesswork. The Ascendant
advances roughly 1° every 4 minutes, so small birth-time errors have large consequences.

| Condition | Required behaviour |
|---|---|
| Ascendant within 3° of a sign boundary | Warn prominently. State how the two candidate readings differ. Recommend birth-time rectification. |
| Birth time `approximate` or `unknown` | Suppress Ascendant- and house-dependent claims. Fall back to Moon-sign analysis, which is far more robust to time error. |
| Any graha within 1° of a sign boundary | Soften every finding depending on that placement. |
| Moon within ~1° of a nakshatra boundary | Warn — the entire dasha timeline shifts with it. |
| Birth time given as a round number (:00, :30) | Treat as likely approximate unless the user confirms it came from a record. |

## Classification states

Every yoga/dosha detection returns exactly one:

- **EXACT** — all classical conditions met. Example: Malavya Yoga with Venus in own sign in a Kendra.
- **STRONG_NOT_TEXTBOOK** — the dignity is real but the classical condition isn't met. Example: Mars
  in own sign in the 9th. Ruchaka Yoga requires a Kendra; the 9th is a Trikona. Say the placement is
  strong *and* say it isn't technically Ruchaka.
- **PRESENT_CANCELLED** — condition met but a standard cancellation applies. Example: Kemadruma with
  the Moon in a Kendra from Lagna. Render as "present but classically cancelled — not a concern."
- **ABSENT** — not detected. **Report notable absences explicitly** (no Mangal Dosha, no Kala Sarpa).
  This is informative and often reassuring, and most software omits it.

## Primary source reference (for future verification)

Every citation of the form "BPHS Ch.X vY" in this skill's reference files was checked against the
actual primary text below, not reconstructed from memory or secondary summaries — two real bugs
(the Moon and Mercury exaltation-zone boundaries in `constants.md`) were found exactly this way.
When adding or verifying a new fact, fetch the relevant chapter directly rather than trusting a
secondary source, even a reputable-looking one; several secondary sources repeat the same
off-by-one errors this project already caught.

**Brihat Parashara Hora Shastra, R. Santhanam translation, full text:**
- Volume 1 (Ch. 1–45): `https://archive.org/stream/BPHSEnglish/BPHS%20-%201%20RSanthanam_djvu.txt`
- Volume 2 (Ch. 46–97): `https://archive.org/stream/BPHSEnglish/BPHS%20-%202%20RSanthanam_djvu.txt`

Chapters already checked against this project: Ch. 3 (dignities, moolatrikona, combustion basis,
natural friendships), Ch. 4 (signs, Navamsa and other varga construction), Ch. 46 (Vimshottari
dasha years and sequence), Ch. 75 (Pancha Mahapurusha yoga names).

**Not everything in this skill is BPHS-sourced, and treating it as such is itself a risk this
project has already been caught by once (see `references/yogas.md`'s Shakata Yoga entry,
DECISIONS.md 2026-08-01): BPHS names its OWN "Sakata" (a different, Nabhasa/sign-pattern yoga,
Ch. 35) that is unrelated to, and must not be conflated with, this project's actual Shakata Yoga,
which is real but sourced from a different classical text entirely.** When a fact isn't in BPHS,
check whether it belongs to **Phaladeepika (Mantreswara)** before assuming it's uncitable —
already the correct primary source for this project's Lagna-sign temperament content
(`references/personality.md`) and its Shakata Yoga condition (`references/yogas.md`), both fetched
from wisdomlib.org's Sanskrit + English text-and-translation (`https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/`,
chapter-numbered sub-pages) — check that source directly by chapter/sloka the same way BPHS is
checked here, not from a secondary summary, before trusting any new Phaladeepika-attributed claim.

Chapters relevant to work **not yet done** — check here first rather than re-deriving from
secondary sources when these become active work:

| Topic | Chapter(s) | Relevant to |
|---|---|---|
| Shadbala (six-fold planetary strength) | 27–28 | Deferred numerical-strength feature (v1) |
| Ashtakavarga | 66–73 | Deferred numerical-strength feature (v1) |
| Remaining divisional charts (D2–D60) | 6–7 | Deferred vargas beyond D1/D9 (v1) |
| Nabhasa yogas | 35 | Not yet in `yogas.md`'s core rule set |
| Raja yoga combinations generally | 39–41 | `yogas.md`'s Raja Yoga entry is a simplified subset |
| Longevity calculation | 43 | Explicitly out of scope per SKILL.md principle 5 — do not implement without revisiting that constraint first |
| Karakas / Atmakaraka (Jaimini-style) | 32–33 | Noted as a v1 addition in `constants.md` |
| Other dasha systems (Ashtottari, Kalachakra, etc.) | 46 (same chapter as Vimshottari) | Out of scope — Vimshottari is the only system this project implements |

## Common errors to avoid

- Treating exaltation as uniformly sign-wide. For 5 of 7 planets it correctly is (their exaltation
  sign never overlaps their own/moolatrikona sign). But **Moon (Taurus) and Mercury (Virgo) are
  real exceptions, verified against the primary BPHS text**: their exaltation is explicitly bounded
  to a narrow zone (0°–3° and 0°–15° respectively) because the same sign also hosts
  moolatrikona/own-sign. Checking sign-only for these two will wrongly tag a planet in its own-sign
  or moolatrikona zone as "exalted." This is not a hypothetical — it was an actual bug in this
  project's first implementation, caught only by re-checking the primary text degree by degree.
  See `references/constants.md`'s Moolatrikona section for the exact citation and fix.
- Forgetting that **combustion orbs differ per planet** and change when retrograde.
- Applying only the 7th-house aspect. Mars, Jupiter and Saturn have additional special aspects.
- Computing dasha sub-periods from nominal year-lengths instead of proportionally subdividing the
  parent's exact start and end instants. Rounding compounds visibly across 120 years.
- Naming a Pancha Mahapurusha yoga without checking the **Kendra** requirement.
- Reporting Kemadruma without checking its cancellations.
- Recommending a strengthening gemstone for an already-exalted or own-sign planet. Strong planets
  don't need reinforcement, and over-strengthening is a recognised risk.
- Assuming the user's stated birth time is exact when it's a round number.
