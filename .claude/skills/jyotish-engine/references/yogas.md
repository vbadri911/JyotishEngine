# Yogas &amp; Doshas Reference

Each entry gives the exact classical condition, so the engine can return one of the four
classification states defined in SKILL.md (EXACT / STRONG_NOT_TEXTBOOK / PRESENT_CANCELLED / ABSENT)
rather than a flat "present/absent" that erases the distinctions that actually matter.

**General rule for the engine:** encode the condition fields separately from the interpretive text,
and encode cancellations as their own testable conditions — never as prose caveats bolted onto a
detector that doesn't actually check them.

## Pancha Mahapurusha Yogas (the five "great person" yogas)

All five share the same shape of condition: **the named graha must be in its own sign OR exalted,
AND must occupy a Kendra (1st, 4th, 7th, or 10th house) from the Lagna.** Both conditions are
required. A planet meeting the dignity condition but not in a Kendra is a strong placement and
should be reported as such (STRONG_NOT_TEXTBOOK) — but is not, technically, the named yoga.

**Verified against the primary text.** BPHS Ch. 75 is titled "Characteristic Features of
Panchamahapurushas" and its own contents summary confirms this exact name-to-planet mapping:
"Ruchaka, Bhadra, Hamsa, Malavya and Sasa caused by Mars, Mercury, Jupiter, Venus and Saturn
respectively." The own-sign and exaltation-sign qualifying conditions below follow directly from
the dignity data already confirmed in `constants.md`.

| Yoga | Graha | Qualifying signs (own or exalted) |
|---|---|---|
| Ruchaka | Mars | Aries, Scorpio (own) or Capricorn (exalted) |
| Bhadra | Mercury | Gemini, Virgo (own) or Virgo (exalted — same sign, different degree range) |
| Hamsa | Jupiter | Sagittarius, Pisces (own) or Cancer (exalted) |
| Malavya | Venus | Taurus, Libra (own) or Pisces (exalted) |
| Sasa | Saturn | Capricorn, Aquarius (own) or Libra (exalted) |

**Common error to check for explicitly:** a planet in own-sign-or-exaltation but in a Trikona (5th
or 9th) or any other non-Kendra house does *not* qualify, no matter how dignified. This is the single
most common false-positive in astrology software — verify the house before naming the yoga.

## Raja Yoga (status/authority combinations)

Not a single fixed configuration but a family of them. The most common and reliable form to detect:
**a Kendra lord (1st/4th/7th/10th) in conjunction with, or in mutual aspect/exchange with, a Trikona
lord (1st/5th/9th)**. The 1st lord counts as both a Kendra and Trikona lord simultaneously, which is
part of why Lagna-lord combinations are especially potent.

Simplified detectable sub-forms for MVP:
- Two or more planets that are lords of a Kendra and a Trikona (respectively) occupying the same
  house together.
- A Kendra lord and Trikona lord in mutual Kendra positions from each other (aspect relationship).
- A single planet that is simultaneously a Kendra lord and Trikona lord (only possible for the
  Lagna, since 1st is both) placed in a dignified position.

This is a broad, well-populated category — do not over-claim precision on "the" Raja Yoga; state
which specific combination was found and which two houses' lords are involved.

## Gajakesari Yoga

**Condition:** Jupiter is in a Kendra position **counted from the Moon** (i.e., 1st, 4th, 7th, or
10th sign away from the Moon's sign, inclusive). This is a moon-to-Jupiter angular relationship, not
a Lagna-based one — do not confuse with a Kendra-from-Lagna check.

Some texts add a refinement (Jupiter should not be debilitated, combust, or in an enemy sign for the
yoga to give full results) — treat this as a strength modifier on top of the base condition, not a
pass/fail gate, unless the cancellation is severe (e.g. Jupiter debilitated and unaspected by any
benefic).

## Budha-Aditya Yoga

**Condition:** Sun and Mercury conjunct in the same house (any house). Classically associated with
sharp intelligence. Note Mercury is very likely to be combust in this configuration (Mercury's
combustion orb from the Sun, see `constants.md`, is smaller than the conjunction range typically
implied) — **always check and report combustion status alongside this yoga**, since a combust
Budha-Aditya still confers intelligence per tradition but with the caveat that Mercury's independent
expression is muted; both facts belong in the output.

## Kemadruma Yoga (dosha — struggle/isolation)

**Condition:** no planet (other planets besides the Moon itself; Sun, Rahu and Ketu are usually
excluded from counting as "occupying" for this purpose — check the specific text being followed,
but the majority convention excludes shadow points and the Sun) occupies either the 2nd or 12th
house **counted from the Moon**.

**Standard cancellations (any one is generally sufficient to cancel):**
- The Moon itself is in a Kendra (1st, 4th, 7th, or 10th) **from the Lagna**.
- The Moon is conjunct or aspected by a benefic (classically Jupiter, Mercury, Venus — Mercury and
  Venus's benefic status is itself context-dependent; Jupiter's aspect is the least disputed
  cancellation).
- Planets occupy a Kendra from the Moon even if not directly 2nd/12th from it (a milder, less
  universally cited cancellation — weight this lower than the two above).

**Engine requirement:** always check cancellations before reporting this dosha as active. Given how
commonly the Moon sits in a Kendra from the Lagna in an arbitrary chart, a large fraction of literal
Kemadruma detections will in fact be cancelled — report the cancellation explicitly and reassuringly
rather than only the raw detection.

## Mangal Dosha / Kuja Dosha

**Condition:** Mars occupies the 1st, 2nd, 4th, 7th, 8th, or 12th house **from the Lagna**. Some
traditions also check Mars from the Moon and/or from Venus as additional (not alternative) checks —
if implementing multiple reference points, report which reference point(s) triggered the detection,
since traditions disagree on whether all three should be checked or Lagna alone suffices.

**Standard exemptions/cancellations (this list varies more by regional tradition than most other
yogas — treat as configurable and cite the source):**
- Mars in its own sign (Aries, Scorpio) or exalted (Capricorn) in the dosha-triggering house.
- Mars in the 1st house of a chart where the Lagna is Aries or Scorpio (i.e., Mars owns the Lagna).
- Mars aspected by Jupiter (in some traditions) or conjunct certain benefics.
- Both partners in a matched pair having Mangal Dosha is traditionally considered a mutual
  cancellation for compatibility purposes specifically — not a natal cancellation of the dosha
  itself.
- Dosha is often considered to reduce or void after a certain age (commonly cited as 28) in some
  traditions — this is disputed and should not be asserted as settled.

Given the regional variation, **this is the single dosha where the output should most clearly state
"per [named tradition]'s criteria" rather than presenting a single universal verdict.**

## Kala Sarpa Dosha

**Condition:** all seven classical grahas (Sun through Saturn, excluding Rahu/Ketu themselves) fall
within the 180° arc on one side of the Rahu-Ketu axis — i.e., no graha crosses to the other side of
the node axis.

**Sub-types** are named by which house the axis falls in from the Lagna (Ananta, Kulika, Vasuki, etc.
— twelve named variants). Detecting the base condition is sufficient for MVP; naming the specific
sub-type is a refinement.

**Note on severity:** this dosha is popularly over-emphasized in commercial software and folk
astrology relative to its treatment in classical texts. Report it factually (present/absent, which
sub-type) without dramatizing — consistent with the "never trade on fear" principle in SKILL.md.

## Shakata Yoga

**Name collision, resolved 2026-08-01 (see DECISIONS.md) -- read this before implementing.** BPHS
Ch. 35 (Nabhasa yogas) also names a yoga called "Sakata," but it is a DIFFERENT condition from a
DIFFERENT primary source than the one described below: BPHS's Nabhasa Sakata is a sign-pattern
yoga (all seven classical grahas placed in the Lagna and the 7th house together), consistent with
the other Nabhasa yogas' geometric-pattern character (compare Musala, below). It is **not
implemented anywhere in this codebase** and is a separate, still-deferred item under Piece B's
"Nabhasa yogas" scope if that is ever built -- do not conflate it with the yoga described below,
and do not assume the citation below extends to it.

**Condition (this project's actual "Shakata Yoga," verified against its real primary source --
Phaladeepika by Mantreswara, Ch. 6 ("Yogas and their effects"), Sloka 14, via
`https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621578.html`,
2026-08-01):** Moon in the 6th, 8th, or 12th house counted **from Jupiter**. Traditionally
associated with fluctuating fortune -- success and failure alternating, not a fixed severe
affliction.

**Cancellation, corrected against the primary source (the previous version of this entry stated an
uncited "Jupiter strong and well-aspected" cancellation that does not match Phaladeepika's own
verse -- found and fixed while resolving the name collision, not carried forward uncritically):**
the Moon being in a Kendra (1st/4th/7th/10th) **from the Lagna** negates the yoga, per the verse's
own text ("if the Moon be in a Kendra house from the Lagna, there is no Sakata") -- the SAME
Moon-in-Kendra-from-Lagna mechanism Kemadruma Yoga's own primary cancellation already uses in this
project, not a new, separate cancellation rule to invent.

Sloka 14 also names a related positive counter-configuration (a Moon exalted/own-sign/in a
Jupiter-owned sign while still 6th/8th from Jupiter reportedly gives a favorable "Mukuta Yoga"
instead) -- noted for completeness, not in scope to implement unless asked.

## Veshi / Vasi / Ubhayachari Yoga

Concerns planets in the houses immediately adjacent to the Sun (2nd and 12th from the Sun, i.e., the
houses on either side):

- **Vasi Yoga:** a planet other than the Moon in the 12th from the Sun (immediately before it).
- **Veshi Yoga:** a planet other than the Moon in the 2nd from the Sun (immediately after it).
- **Ubhayachari Yoga:** both conditions met simultaneously (planets on both sides).

All three are mild, generally positive yogas relating to even temperament and articulate speech —
not major status/wealth indicators, and should not be over-weighted in a findings summary relative
to Raja/Mahapurusha yogas.

## Sade Sati

Not a yoga but a transit-based condition: **Saturn transiting the 12th, 1st, or 2nd sign from the
natal Moon sign** (a ~7.5 year period total, ~2.5 years per phase, recurring roughly every 30 years).
Requires current transit position, not just the natal chart — this is the one "yoga" in this list
that is time-dependent rather than fixed at birth, and must be recomputed against current Saturn
position rather than looked up once.

## Musala Yoga (flag for careful checking, commonly over-reported)

**Condition (as classically stated):** all seven classical grahas occupy fixed (Sthira) signs —
Taurus, Leo, Scorpio, Aquarius — with none in movable or dual signs. This is a strict, rarely-met
condition. **Verify all seven placements explicitly before reporting** — this yoga is frequently
reported by commercial software when only some planets are in fixed signs, which does not meet the
classical condition. When in doubt, do not report it rather than over-report.

## General engine behaviour for this whole file

- Every rule must declare its **cancellation checks** as first-class, testable conditions alongside
  its trigger condition — never as a caveat added only in prose.
- Every rule should carry a **citation field** naming the source tradition, since several of the
  entries above (Mangal Dosha exemptions, Rahu/Ketu aspects, Kala Sarpa severity) genuinely vary by
  school. Disagreement is not a bug to be silently resolved; it should be surfaced.
- **ABSENT is a first-class, reportable state** — explicitly stating "no Mangal Dosha detected" or
  "Kemadruma condition not met" is informative and should appear in output, not be silently omitted.
