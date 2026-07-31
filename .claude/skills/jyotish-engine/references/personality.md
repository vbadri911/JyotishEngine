# Personality Reference (Lagna-sign temperament — v1 scope only)

Reference for the Full Blueprint's "Personality" section (interpretation.md, "Full-depth document
structure" item 2). **Scope note, confirmed in the Full Blueprint design gate
(DECISIONS.md, 2026-07-30): this file covers Lagna-sign temperament only** — the narrower v1 the
user confirmed over building interpretation.md's full literal ask in one pass. Moon-sign/
Moon-nakshatra temperament and decision-making/communication style (which needs its own
Mercury-specific sourcing) are explicitly deferred; do not extend this file to cover them without
a separate sourcing pass, matching how this section was scoped down before any code, not after.

## Why this needed new reference material at all

Checked every existing reference file (`constants.md`, `nakshatras.md`, `yogas.md`,
`interpretation.md`) before writing anything here — none contains temperament, personality,
decision-making, or communication content for any sign, planet, or nakshatra. Unlike every other
domain this project has built (Career, Wealth, Health, Relationships, Purpose, Timing), Personality
had no existing factual substrate to reuse. This file is that substrate, built the same way
`chart-layout.md` was: primary/citable sourcing checked directly, not reconstructed from memory or
a secondary "looks-plausible" summary, and a written citation trail so the reasoning survives past
this session.

## Investigated and deliberately NOT used: Phaladeepika Ch. 9

Searched for a classical text specifically describing native temperament by Lagna sign (this
project's own primary BPHS text, both volumes — same two archive.org URLs SKILL.md's own "Primary
source reference" section cites — was checked first and confirmed to have no such chapter: BPHS
Ch. 4 describes each *sign's* archetypal qualities, not the *native's* temperament). Found
**Phaladeepika (Mantreswara), Chapter 9, "Effect of Mesha and other signs happening to be the
Lagna"** — a real classical source, with a verse dedicated to each of the twelve signs as Lagna.

**Exact source checked (2026-07-30), for the same reason SKILL.md gives exact archive.org URLs for
BPHS rather than "a translation exists somewhere":**
`https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621581.html`
— "Effect of Mesha and other signs happening to be the Lagna [Chapter 9]", part of *Phaladeepika by
Mantreswara (text and translation)*, hosted on wisdomlib.org (Sanskrit verses + English
translation, sloka-by-sloka). Located via a general web search for a Lagna-temperament chapter
after BPHS came up empty; wisdomlib.org's own site does not surface a named translator/edition on
this page, so none is claimed here — cite the URL and chapter, not an unconfirmed translator credit.
The chapter's own contents page confirms one sloka per sign, in zodiacal order (Mesha through
Meena), matching what was fetched and read below.

**Read in full before deciding whether to use it, not assumed usable because it exists.** Real
finding: the chapter is predominantly **physiognomy** (body shape, eye color, limb proportions —
"round eyes, weak-kneed," "plumpy thighs and a big face," "reddish eyes, large chin"), not
temperament, and several verses contain archaic, moralizing, or gendered content unsuitable for
direct reader-facing use without a much deeper editorial pass than this v1 warrants — e.g. Aries
"will speak falsehoods," Aquarius "will secretly commit sinful deeds... will be clever in hitting
or killing others," Cancer "will be henpecked." Presenting these to a reader as their computed
"personality" would violate SKILL.md principle 5 ("Never trade on fear") and principle 1 (using
evidence honestly, not sensationally) — this is exactly the failure mode those principles exist to
prevent, not a hypothetical risk.

**Decision: do not use Phaladeepika Ch. 9's verse content directly.** It remains useful as
corroborating evidence that native-temperament-by-Lagna is a classically attested concept (not an
invented one), and a few fragments do cross-validate the element-based approach below (Leo:
"arrogant and powerful... angry at trifles" matches Fire's classical quick-to-anger association;
Virgo: "truthful and will speak kindly" matches Earth's classical steady/measured association) —
cited here for that corroboration, not quoted into any reader-facing template.

## What IS used: element + modality + Lagna lord, all already-verified data

Rather than import a second, less suitable classical source, this file derives Lagna-sign
temperament entirely from data this project has **already sourced and verified**:
`constants.md`'s Signs table (Element, Modality — from BPHS Ch. 4, already checked) and Karakas
table (already checked). This is lower-risk than a fresh external text specifically because
nothing new is being trusted — only recombined for a new purpose. Pancha Mahabhuta (the
five-element cosmology Vedic astrology's own sign-element assignments derive from) and the
Chara/Sthira/Dwiswabhava (movable/fixed/dual) modality system are foundational, cross-school Vedic
astrological theory, not one author's specific claim — the same category of "fixed universal
convention" `chart-layout.md`'s grid layout was, as distinct from a school-dependent rule like
ayanamsa choice or a dosha's cancellation conditions.

### Element temperament

| Element | Sanskrit | Signs | Temperament |
|---|---|---|---|
| Fire | Agni | Aries, Leo, Sagittarius | Energetic, direct, quick to act and quick to react |
| Earth | Prithvi | Taurus, Virgo, Capricorn | Practical, steady, grounded in tangible reality |
| Air | Vayu | Gemini, Libra, Aquarius | Intellectual, sociable, oriented toward ideas and exchange |
| Water | Jala | Cancer, Scorpio, Pisces | Emotionally attuned, intuitive, responsive to mood and atmosphere |

### Modality temperament

| Modality | Sanskrit | Signs | Temperament |
|---|---|---|---|
| Movable | Chara | Aries, Cancer, Libra, Capricorn | Initiating — comfortable starting things and prompting change |
| Fixed | Sthira | Taurus, Leo, Scorpio, Aquarius | Persistent — comfortable sustaining effort and holding a position |
| Dual | Dwiswabhava | Gemini, Virgo, Sagittarius, Pisces | Adaptable — comfortable adjusting to shifting circumstances |

### Construction rule (how a real sentence is built, not a per-sign lookup)

A Lagna-sign temperament note is composed from three already-verified facts, transparently, not
from twelve hand-written paragraphs:

1. The Lagna sign's **element** temperament (table above).
2. The Lagna sign's **modality** temperament (table above).
3. The Lagna **lord**'s primary karaka signification (`constants.md`'s Karakas table) as a
   one-clause illustration of what that ruling planet emphasizes — not a second temperament claim,
   just naming the classical ruler.

Example (not a stored string — computed): Leo Lagna → Fire ("energetic, direct...") + Fixed
("persistent...") + lord Sun ("soul, authority, vitality") → "A Leo Lagna gives an energetic,
direct temperament, expressed with persistence once committed to something; its lord, the Sun,
points toward an underlying focus on authority and vitality."

This mirrors `dignityFindings()`'s own construction pattern (compose a sentence from named,
already-verified fields; never hand-author a fact) and keeps every claim traceable to a specific
row in an already-checked table — evidence or silence, per SKILL.md principle 1, applied to a new
domain the same way it's applied everywhere else in this project.

## Lagna-lord dignity

No new sourcing needed — reuses the existing dignity engine and `dignityPredicate()` exactly as
`dignityFindings()` already does for the Lagna lord, just presented as a personality-strength/
blind-spot signal rather than tagged into the career/health/purpose domains. An exalted or
own-sign Lagna lord reads as a strength; a debilitated Lagna lord reads as an honest blind spot —
`interpretation.md`'s literal ask ("strengths and honest blind spots... each tied to a specific
placement"), using the same "Handling convergence" citation pattern already used elsewhere in this
project rather than a new synthesis mechanism.
