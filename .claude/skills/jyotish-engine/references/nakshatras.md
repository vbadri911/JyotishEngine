# Nakshatras Reference

27 nakshatras (lunar mansions) of 13°20' each, spanning the 360° zodiac. Each nakshatra has 4 padas
(quarters) of 3°20' each — and each pada corresponds to exactly one Navamsa sign (see `varga.md`).

The nakshatra sequence also fixes the **Vimshottari dasha lord sequence** — see `dasha.md`. The nine
dasha lords repeat three times across the 27 nakshatras in fixed order starting from Ketu.

## Full table

Span is given as degrees within the zodiac (0° = 0° Aries).

| # | Nakshatra | Span (start°–end°) | Lord | Deity |
|---|---|---|---|---|
| 1 | Ashwini | 0°00'–13°20' | Ketu | Ashwini Kumaras |
| 2 | Bharani | 13°20'–26°40' | Venus | Yama |
| 3 | Krittika | 26°40'–40°00' | Sun | Agni |
| 4 | Rohini | 40°00'–53°20' | Moon | Brahma/Prajapati |
| 5 | Mrigashira | 53°20'–66°40' | Mars | Soma |
| 6 | Ardra | 66°40'–80°00' | Rahu | Rudra |
| 7 | Punarvasu | 80°00'–93°20' | Jupiter | Aditi |
| 8 | Pushya | 93°20'–106°40' | Saturn | Brihaspati |
| 9 | Ashlesha | 106°40'–120°00' | Mercury | Nagas |
| 10 | Magha | 120°00'–133°20' | Ketu | Pitrs |
| 11 | Purva Phalguni | 133°20'–146°40' | Venus | Bhaga |
| 12 | Uttara Phalguni | 146°40'–160°00' | Sun | Aryaman |
| 13 | Hasta | 160°00'–173°20' | Moon | Savitar |
| 14 | Chitra | 173°20'–186°40' | Mars | Tvashtar/Vishwakarma |
| 15 | Swati | 186°40'–200°00' | Rahu | Vayu |
| 16 | Vishakha | 200°00'–213°20' | Jupiter | Indra-Agni |
| 17 | Anuradha | 213°20'–226°40' | Saturn | Mitra |
| 18 | Jyeshtha | 226°40'–240°00' | Mercury | Indra |
| 19 | Moola | 240°00'–253°20' | Ketu | Nirriti |
| 20 | Purva Ashadha | 253°20'–266°40' | Venus | Apas |
| 21 | Uttara Ashadha | 266°40'–280°00' | Sun | Vishwadevas |
| 22 | Shravana | 280°00'–293°20' | Moon | Vishnu |
| 23 | Dhanishta | 293°20'–306°40' | Mars | Vasus |
| 24 | Shatabhisha | 306°40'–320°00' | Rahu | Varuna |
| 25 | Purva Bhadrapada | 320°00'–333°20' | Jupiter | Aja Ekapada |
| 26 | Uttara Bhadrapada | 333°20'–346°40' | Saturn | Ahir Budhnya |
| 27 | Revati | 346°40'–360°00' | Mercury | Pushan |

## Padas and Navamsa mapping

Each nakshatra's 4 padas map to 4 consecutive signs starting from a fixed point determined by the
nakshatra's own starting sign and modality. The general rule (detailed fully in `varga.md`):

- Pada 1 of each nakshatra falls in the Navamsa sign that begins the D9 count appropriate to the
  Rasi the nakshatra starts in.
- Practically: compute degree-within-nakshatra, divide by 3°20' to get the pada (1–4), then apply
  the general Navamsa rule to the planet's Rasi position — the pada number is a byproduct of that
  calculation, not a separate lookup table. Do not hardcode a pada→sign table; derive it, or errors
  in a hardcoded table will silently disagree with the D9 chart.

## Implementation notes

- Nakshatra lord cycles Ketu → Venus → Sun → Moon → Mars → Rahu → Jupiter → Saturn → Mercury,
  repeating three times across 27 nakshatras. This is the same sequence and order used for
  Vimshottari dasha — not a coincidence, it's how the dasha system is defined.
  See `dasha.md` for why this determines the first Mahadasha at birth.
  - Correction to the ordering as commonly mis-stated: the repeating 9-lord cycle is
    **Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury** — verify against the dasha
    year-count table in `dasha.md` rather than re-deriving from memory each time.
- Store nakshatra and pada as derived, computed fields — never as user input or hardcoded lookup —
  since they follow deterministically from sidereal longitude.
- Ashlesha's deity is sometimes given as "Sarpas" (serpents) interchangeably with "Nagas" — same
  concept, different transliteration; not a discrepancy to worry about.
