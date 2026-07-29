# Divisional Charts (Varga) Reference

Vargas re-divide each 30° sign into N equal parts to examine a specific life theme in finer
resolution than the main D1 chart. The D1 (Rasi) is the whole-sign chart; every other varga is
derived from it.

## Why this matters, briefly

Each varga answers a different question: D9 refines marriage/dharma/general strength, D10 refines
career, D7 refines children, and so on (the full shodasavarga, or 16-fold division, exists in
classical texts). MVP implements **D1 and D9 only**; the general function below should make adding
the rest a configuration exercise rather than new code.

## General varga construction (the pattern all divisional charts follow)

For an N-fold division:

1. Each 30° sign divides into N equal parts of `30/N` degrees each.
2. Determine which of the N parts the planet's degree-within-sign falls into (part 1, 2, ... N).
3. Determine the **starting sign** for that planet's Rasi sign — this is the rule that differs
   between varga types (see D9 below for the worked rule).
4. Count forward from the starting sign by (part number − 1) signs to get the varga sign.

The starting-sign rule is the part that must not be guessed — it is specific to each varga and
documented in classical texts (Brihat Parashara Hora Shastra, primarily). Do not assume a pattern
from one varga generalizes to another without checking.

## D9 — Navamsa (the one MVP must get exactly right)

Divides each sign into 9 parts of 3°20' each.

### The starting-sign rule for D9

Determined by the **modality** (see `constants.md`) of the planet's Rasi sign:

| Rasi modality | Navamsa count starts from |
|---|---|
| Movable (Chara) — Aries, Cancer, Libra, Capricorn | The sign itself |
| Fixed (Sthira) — Taurus, Leo, Scorpio, Aquarius | The 9th sign from itself |
| Dual (Dwiswabhava) — Gemini, Virgo, Sagittarius, Pisces | The 5th sign from itself |

Then count forward (part_number − 1) signs from that starting sign to reach the planet's Navamsa
sign.

### Worked example (real, previously validated)

Venus at 18°01' Taurus. Taurus is a **fixed** sign, so the Navamsa count starts from the 9th sign
from Taurus. Counting Taurus=1, the 9th sign from Taurus is Capricorn... **but the classical rule
counts starting signs by modality group, not a literal "9th house" count** — the standard convention
actually used and verified against real software output is:

- Movable signs → Navamsa 1 starts in the same sign.
- Fixed signs → Navamsa 1 starts in the **9th sign counting the fixed sign itself as 1**, which for
  the fixed signs (Taurus, Leo, Scorpio, Aquarius) always lands on **Capricorn, Aries, Cancer, Libra**
  respectively.
- Dual signs → Navamsa 1 starts in the **5th sign counting the dual sign itself as 1**, which for the
  dual signs (Gemini, Virgo, Sagittarius, Pisces) always lands on **Libra, Capricorn, Aries, Cancer**
  respectively.

Degree-within-sign 18°01' ÷ 3°20' → falls in the 6th navamsa part (parts span 0–3°20, 3°20–6°40,
6°40–10°00, 10°00–13°20, 13°20–16°40, 16°40–20°00 → 18°01' is in part 6).

Starting sign for Taurus (fixed) = Capricorn. Count forward 5 signs from Capricorn (part 6 − 1 = 5
steps): Capricorn→Aquarius→Pisces→Aries→Taurus→**Gemini**.

Result: Venus's D9 sign = Gemini. This matches a real validated Navamsa chart. **Use this as a
regression test**: Venus at 18°01' Taurus (D1) → Gemini (D9).

### Quick reference — fixed starting-sign table (precomputed, safe to use directly)

| Rasi sign | Modality | Navamsa part 1 starts in |
|---|---|---|
| Aries | Movable | Aries |
| Taurus | Fixed | Capricorn |
| Gemini | Dual | Libra |
| Cancer | Movable | Cancer |
| Leo | Fixed | Aries |
| Virgo | Dual | Capricorn |
| Libra | Movable | Libra |
| Scorpio | Fixed | Cancer |
| Sagittarius | Dual | Aries |
| Capricorn | Movable | Capricorn |
| Aquarius | Fixed | Libra |
| Pisces | Dual | Cancer |

This table plus "degree-within-sign ÷ 3°20', then count forward that many signs from the start" is
the complete D9 algorithm. Implement it as `navamsa_sign(rasi_sign, degree_in_sign)` and reuse the
same shape of function (different divisor, different starting-sign table) for any later varga.

## D9 interpretation notes

- The D9 Lagna (Ascendant's own Navamsa placement) is read as a refinement of the D1 Lagna —
  classical texts treat it as revealing the "deeper" or more mature promise of the birth chart,
  particularly for marriage and dharma.
- A planet's dignity can differ between D1 and D9 (e.g., own-sign in D1 but debilitated in D9, or
  vice versa) — this is meaningful, not an error, and is classically read as a planet whose surface
  strength and deeper strength disagree.
- The 7th house of the D9 (counted from the D9 Lagna, not the D1 Lagna) is the primary reference for
  spouse-nature analysis.

## Deferred vargas (not required for MVP, listed for later reference)

D2 (Hora — wealth), D3 (Drekkana — siblings), D4 (Chaturthamsa — property/fortune), D7 (Saptamsa —
children), D10 (Dasamsa — career), D12 (Dwadasamsa — parents), D16, D20, D24, D27, D30, D40, D45,
D60 — together forming the Shodasavarga (16-fold division). Each has its own starting-sign rule from
BPHS; do not improvise one from the D9 pattern.
