# Constants Reference

## Signs (Rashis)

| # | Sign | Sanskrit | Element | Modality | Lord |
|---|---|---|---|---|---|
| 1 | Aries | Mesha | Fire | Movable (Chara) | Mars |
| 2 | Taurus | Vrishabha | Earth | Fixed (Sthira) | Venus |
| 3 | Gemini | Mithuna | Air | Dual (Dwiswabhava) | Mercury |
| 4 | Cancer | Karka | Water | Movable | Moon |
| 5 | Leo | Simha | Fire | Fixed | Sun |
| 6 | Virgo | Kanya | Earth | Dual | Mercury |
| 7 | Libra | Tula | Air | Movable | Venus |
| 8 | Scorpio | Vrischika | Water | Fixed | Mars |
| 9 | Sagittarius | Dhanu | Fire | Dual | Jupiter |
| 10 | Capricorn | Makara | Earth | Movable | Saturn |
| 11 | Aquarius | Kumbha | Air | Fixed | Saturn |
| 12 | Pisces | Meena | Water | Dual | Jupiter |

Modality matters directly for Navamsa construction (see `varga.md`) and for Musala/similar
all-fixed-sign yogas.

## Planetary dignity

### Exaltation (Uchcha) and Debilitation (Neecha)

Debilitation is always the sign opposite the exaltation sign, at the same degree.

| Graha | Exaltation sign & exact degree | Debilitation sign & exact degree |
|---|---|---|
| Sun | Aries 10° | Libra 10° |
| Moon | Taurus 3° | Scorpio 3° |
| Mars | Capricorn 28° | Cancer 28° |
| Mercury | Virgo 15° | Pisces 15° |
| Jupiter | Cancer 5° | Capricorn 5° |
| Venus | Pisces 27° | Virgo 27° |
| Saturn | Libra 20° | Aries 20° |
| Rahu | Taurus (commonly cited) or Gemini (school-dependent) — treat as configurable, not fixed | Opposite of whichever is used |
| Ketu | Scorpio (commonly cited) or Sagittarius (school-dependent) — treat as configurable | Opposite of whichever is used |

**Implementation note:** store the *distance from the exact exaltation/debilitation degree*, not
just a boolean. A planet at or very near its exact degree is a materially stronger statement
("deep exaltation") than one merely within the sign. Rahu/Ketu exaltation is genuinely disputed
across traditions — do not present either option as settled fact; disclose which convention is
in use.

### Moolatrikona

A dignity between own-sign and exaltation — strong, but one notch below exaltation.

**Verified against the primary text** (Brihat Parashara Hora Shastra, Ch. 3, v51–54, R. Santhanam
translation) rather than secondary summaries, after an earlier draft of this table carried two
off-by-one errors (Moon at 4° instead of 3°, Mercury at 16° instead of 15°) that several
secondary sources online also repeat. The primary text's own wording:

- Moon: "after the first 3 degrees of exaltation portion in Taurus, for the Moon the rest is her
  moolatrikona" — zone is 3°–30°, not 4°–30°.
- Mercury: "in Virgo the first 15 degrees are exaltation zone, the next 5 degrees moolatrikona
  and the last 10 degrees own house" — moolatrikona is 15°–20°, not 16°–20°.

| Graha | Moolatrikona sign & degree range |
|---|---|
| Sun | Leo 0°–20° |
| Moon | Taurus 3°–30° |
| Mars | Aries 0°–12° |
| Mercury | Virgo 15°–20° |
| Jupiter | Sagittarius 0°–10° |
| Venus | Libra 0°–15° |
| Saturn | Aquarius 0°–20° |

Outside these ranges but still in the sign the planet owns, it is simply "own sign," one dignity
level below moolatrikona.

**Implementation-critical point, also found only by checking the primary text carefully:** for
Sun, Mars, Jupiter, Venus, and Saturn, the exaltation sign is entirely different from their
own/moolatrikona sign, so the classical convention treats the *whole* exaltation sign as "exalted"
dignity (the exact degree only sharpens graded strength, not the category). But Taurus is
*simultaneously* Moon's exaltation zone and moolatrikona zone, and Virgo is *simultaneously*
Mercury's exaltation, moolatrikona, AND own-sign zone. For these two planets only, "exalted" must
be bounded to the narrow zone above (0°–3° and 0°–15° respectively) — checking only the sign,
without the degree, will wrongly classify a planet at, say, 20° Virgo as "exalted" when it is
actually in Mercury's own-sign zone. This is a real bug class to guard against, not a hypothetical
one — it was caught exactly this way during implementation.

### Own signs (Swakshetra)

| Graha | Own sign(s) |
|---|---|
| Sun | Leo |
| Moon | Cancer |
| Mars | Aries, Scorpio |
| Mercury | Gemini, Virgo |
| Jupiter | Sagittarius, Pisces |
| Venus | Taurus, Libra |
| Saturn | Capricorn, Aquarius |

### Planetary friendships (Naisargika Maitri)

Used to determine friend/neutral/enemy dignity when a planet is in a sign it neither owns nor is
exalted/debilitated in. This is the *natural* (permanent) relationship; classical texts also compute
a *temporal* relationship from house position and combine the two into five-fold (Panchadha Maitri)
dignity — implement natural friendship first; temporal is a refinement, not a blocker for MVP.

| Graha | Friends | Neutral | Enemies |
|---|---|---|---|
| Sun | Moon, Mars, Jupiter | Mercury | Venus, Saturn |
| Moon | Sun, Mercury | Mars, Jupiter, Venus, Saturn | — |
| Mars | Sun, Moon, Jupiter | Venus, Saturn | Mercury |
| Mercury | Sun, Venus | Mars, Jupiter, Saturn | Moon |
| Jupiter | Sun, Moon, Mars | Saturn | Mercury, Venus |
| Venus | Mercury, Saturn | Mars, Jupiter | Sun, Moon |
| Saturn | Mercury, Venus | Jupiter | Sun, Moon, Mars |

Note the asymmetry (e.g. Sun considers Mercury neutral, Mercury considers Sun a friend) — this is
correct and expected; friendship in this system is not always mutual.

## Combustion (Astangata)

A planet too close to the Sun loses independent expression. Orbs are **school-dependent — treat as
config, not hardcoded** — but commonly cited values:

| Graha | Orb (direct) | Orb (retrograde) |
|---|---|---|
| Moon | 12° | — |
| Mars | 17° | — |
| Mercury | 14° | 12° |
| Jupiter | 11° | — |
| Venus | 10° | 8° |
| Saturn | 15° | — |

The Sun itself is never combust. Some texts give Moon a much tighter orb (as low as 12° only near
new moon) — reconfirm against whichever source the validation harness targets.

## Graha Drishti (planetary aspects)

Distinct from Western astrology's degree-based aspects — Jyotish aspects are **whole-house**, cast
forward from a planet's own house.

| Graha | Aspects (in addition to universal 7th) |
|---|---|
| All planets | 7th house from their own position (universal) |
| Mars | + 4th and 8th |
| Jupiter | + 5th and 9th |
| Saturn | + 3rd and 10th |
| Rahu/Ketu | School-dependent — some traditions give them the same special aspects as their functional significators; others give no special aspects. Default: off (universal 7th only) unless configured on. |

Aspects are cast onto **houses**, and by extension onto any planet occupying that house. A planet's
own house is never counted as one of its aspected houses.

## Houses (Bhava) — core significations

| House | Core significations |
|---|---|
| 1st | Self, body, personality, overall vitality |
| 2nd | Wealth, family, speech, food, accumulated resources |
| 3rd | Courage, effort, siblings, short journeys, communication |
| 4th | Home, mother, property, vehicles, emotional foundation |
| 5th | Intelligence, children, speculation, creativity, mantra, purva punya (past-life merit) |
| 6th | Debt, disease, service, competition, litigation, daily obstacles |
| 7th | Marriage, partnership (including business), the "other" |
| 8th | Transformation, longevity, hidden matters, sudden events, in-laws |
| 9th | Fortune, father, dharma, higher learning, long journeys, guru |
| 10th | Career, status, public life, action (karma) |
| 11th | Gains, income, networks, elder siblings, fulfillment of desire |
| 12th | Loss, expenditure, foreign lands, isolation, moksha (liberation) |

Kendras (angular houses): 1, 4, 7, 10 — the strongest houses for yoga formation.
Trikonas (trine houses): 1, 5, 9 — houses of fortune and dharma.
Dusthanas (difficult houses): 6, 8, 12.
Upachaya (houses that improve with time/effort): 3, 6, 10, 11.

## Karakas (significators) — the most commonly used set

| Graha | Significations (Naisargika Karakatva) |
|---|---|
| Sun | Soul, father, authority, government, bones, eyes, vitality |
| Moon | Mind, mother, emotions, the public, fluids |
| Mars | Courage, siblings (esp. younger), land/property, blood, conflict |
| Mercury | Intelligence, communication, commerce, nervous system, skin |
| Jupiter | Wisdom, children, wealth, guru, husband (in a female chart), liver, fat |
| Venus | Spouse (in a male chart), comfort, luxury, art, romance, kidneys |
| Saturn | Longevity, sorrow, service, discipline, bones, joints, chronic illness |
| Rahu | Obsession, foreign, unconventional gain, sudden rise |
| Ketu | Detachment, spirituality, past-life mastery, loss, moksha |

Note the male/female chart distinction for Venus and Jupiter as spouse-karaka — do not default to
one gender's convention silently; ask or configure.

Chara Karakas (the "mutable" significator system used in some jaimini-style analysis, ranked by
degree within sign, highest to lowest — Atmakaraka, Amatyakaraka, etc.) are a separate, more
advanced system. Not required for MVP; flag as a v1 addition if pursued.
