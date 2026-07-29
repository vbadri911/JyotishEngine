# Vimshottari Dasha Reference

The dominant timing system in Jyotish. A 120-year cycle divided among 9 grahas, each ruling a fixed
number of years in a fixed order, repeating indefinitely (the "120 years" is one full cycle; a
second cycle would in principle continue past age 120, though interpretation beyond roughly age 90
should be heavily hedged per the confidence principles in SKILL.md).

## Mahadasha lord sequence and year-counts

**Verified against the primary text.** BPHS Ch. 46, v. 15 (R. Santhanam translation, Vol. 2):
"The periods of Dasas of the Sun, the Moon, Mars, Rahu, Jupiter, Saturn, Mercury, Ketu and Venus
are 6, 10, 7, 18, 16, 19, 17, 7 and 20 in that order" — summing to 120, matching the total cited
in v. 13-14: "in Kaliyuga the natural life span of a human being is generally taken as 120 years."
The text's own listing starts its description from Sun rather than Ketu; this is the same fixed
cyclic order, just rotated to a different starting point for exposition — Sun→Moon→Mars→Rahu→
Jupiter→Saturn→Mercury→Ketu→Venus→(back to Sun) is identical to Ketu→Venus→Sun→Moon→Mars→Rahu→
Jupiter→Saturn→Mercury→(back to Ketu) once you rotate it.

Two things came free with this check, worth recording: the same chapter's own nakshatra-to-lord
table (used for identifying which dasha is running at birth) was cross-checked against every
entry in `nakshatras.md` and matched throughout — e.g. its "Krittika, Uttaraphalguni, and
Uttarashada → Sun" grouping matches this project's independently-sourced nakshatra table exactly,
as did every other grouping. And the balance-at-birth method described there — "multiply the Dasa
period of the planet concerned by the period of stay expired... divide by the total period of stay"
— is the same proportional approach already implemented below, not a different convention that
happens to agree.

Fixed order, always starting the cycle from Ketu:

| Lord | Years |
|---|---|
| Ketu | 7 |
| Venus | 20 |
| Sun | 6 |
| Moon | 10 |
| Mars | 7 |
| Rahu | 18 |
| Jupiter | 16 |
| Saturn | 19 |
| Mercury | 17 |
| **Total** | **120** |

This is the same order as the repeating nakshatra-lord cycle in `nakshatras.md` — that is not
incidental, it's how the system is constructed: whichever nakshatra the Moon occupies at birth
determines the *starting* Mahadasha lord, and the sequence proceeds in this fixed order from there.

## Step 1 — determine the Mahadasha lord and balance at birth

1. Find the Moon's exact sidereal longitude and which nakshatra it occupies (`nakshatras.md`).
2. That nakshatra's lord is the Mahadasha running **at birth**.
3. Compute the **fraction of that nakshatra already traversed** by the Moon:
   `fraction_elapsed = (moon_longitude − nakshatra_start_longitude) / 13°20'`
4. The **balance remaining** at birth = `(1 − fraction_elapsed) × that lord's total years`.
5. This balance is how much of the first Mahadasha remains to run from the birth date forward.
   Everything before birth in that Mahadasha is not part of the person's timeline.

**This single calculation is the most error-prone step in the whole system** — an error in Moon
longitude of even a few arcminutes shifts the balance by days, which compounds through every
subsequent boundary for the rest of the person's life. Compute it from the precise longitude, never
from a rounded nakshatra-degree table.

### Worked example (real, previously validated against a third-party report)

Moon at 19°16' Leo, sidereal (Lahiri). Leo begins at 120° (0° Aries = 0°); Leo spans 120°–150°.
Moon's absolute longitude = 120° + 19°16' = 139°16'.

Purva Phalguni spans 133°20'–146°40' (see `nakshatras.md`), lord Venus (20 years).

`fraction_elapsed = (139.267° − 133.333°) / 13.333° ≈ 0.445`
`balance = (1 − 0.445) × 20 years ≈ 11.11 years ≈ 11 years, 1 month`

This matches a real validated case: birth 23 April 1983, dasha balance reported as **11 years, 1
month, 1 day** of Venus Mahadasha remaining at birth. Use this as a regression test case for any
implementation — if the engine doesn't reproduce ~11y 1m from these inputs, the longitude or
nakshatra-boundary math has a bug.

## Step 2 — lay out the full Mahadasha sequence

From the birth balance, subsequent Mahadashas run their full year-count each, in the fixed sequence,
indefinitely. Example continued (birth 23 April 1983, Venus balance 11y 1m 1d, so Venus MD **started**
25 May 1974 and the full sequence is):

| Mahadasha | Start | End |
|---|---|---|
| Venus | 25 May 1974 | 25 May 1994 |
| Sun | 25 May 1994 | 24 May 2000 |
| Moon | 24 May 2000 | 25 May 2010 |
| Mars | 25 May 2010 | 25 May 2017 |
| Rahu | 25 May 2017 | 25 May 2035 |
| Jupiter | 25 May 2035 | 25 May 2051 |
| Saturn | 25 May 2051 | 25 May 2070 |
| Mercury | 25 May 2070 | 25 May 2087 |
| Ketu | 25 May 2087 | 25 May 2094 |

Note the sequence from Venus onward follows the fixed order (Venus→Sun→Moon→Mars→Rahu→Jupiter→
Saturn→Mercury→Ketu→[Venus again, next cycle]) — i.e. continue around the fixed 9-lord cycle
starting wherever the birth nakshatra placed you.

## Step 3 — Antardashas (sub-periods) and beyond

Each Mahadasha subdivides into 9 Antardashas, one per graha, **starting with the Mahadasha's own
lord** and then proceeding through the same fixed 9-lord sequence starting from that lord.

Antardasha duration is strictly proportional:

`antardasha_years = (antardasha_lord_years / 120) × mahadasha_lord_years`

Example: within a Rahu Mahadasha (18 years), the Jupiter Antardasha =
`(16/120) × 18 = 2.4 years`.

**Critical correctness requirement:** compute each Antardasha's start/end as an exact fraction of
the *parent's actual elapsed timespan* (from the Mahadasha's true start instant, not a rounded
calendar date), and chain them consecutively so they sum exactly to the parent's duration. Do not
compute each sub-period independently from nominal year-lengths (e.g. not all years are the same
length when leap years are involved, and small roundings compound badly over a 120-year table if
each level is rounded independently rather than carried forward as exact fractions).

**Pratyantardasha** (sub-sub-period) subdivides an Antardasha the same way, using the same
proportional formula and the same starting-lord rule (start from the Antardasha's own lord, then
proceed through the fixed sequence). Compute to this depth for at least the current and next two
Mahadashas; deeper computation (Sookshma, Prana) exists in classical texts but is rarely needed and
is a reasonable v1 deferral.

### Antardasha starting-lord rule, explicitly

Within any Mahadasha (or Antardasha, one level down), the sub-period sequence **starts with that
period's own lord**, then continues through the fixed 9-lord order:

`Ketu → Venus → Sun → Moon → Mars → Rahu → Jupiter → Saturn → Mercury → (repeat)`

wrapping around to wherever comes after the starting lord. Example: Rahu Mahadasha's Antardashas run
Rahu, Jupiter, Saturn, Mercury, Ketu, Venus, Sun, Moon, Mars — i.e. starting at Rahu and continuing
in fixed sequence, wrapping past Mercury back to Ketu.

## Reporting requirements

- Store every Mahadasha/Antardasha/Pratyantardasha boundary as an exact timestamp, not just a date —
  downstream alerting and "current period" lookups depend on exact instants.
- Always disclose which node convention (mean/true) and ayanamsa were used, since the Moon's exact
  longitude — and therefore the entire dasha table — shifts with ayanamsa choice.
- When reporting "current period," give the full nested path (e.g. "Rahu Mahadasha → Venus
  Antardasha → Saturn Pratyantardasha") with its start/end dates, not just the Mahadasha.
- Never fabricate a boundary date. If asked for a period beyond what has been computed, compute it
  properly rather than estimating.
