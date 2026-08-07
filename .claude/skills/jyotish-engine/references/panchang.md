# Panchang Reference (Tithi, Vara, Karana, Yoga, Nakshatra)

The five-limbed (*pancha-anga*) Hindu calendrical almanac for a given date/time/place. Unlike
every other reference file in this directory, the primary source here is **Surya Siddhanta**
(Burgess's 1860 scholarly translation), not BPHS or Phaladeepika -- BPHS is a horoscopy/
interpretation treatise (dasha, yogas, doshas, remedies); Panchang is calendrical/astronomical
computation, classically the domain of a *siddhanta* text. First time this project has needed a
source outside BPHS/Phaladeepika for a subject-matter reason, not a citation-quality one. See
DECISIONS.md, 2026-08-07, for the full research trail.

Source: `https://archive.org/download/SuryaSiddhantaTranslation/surya_siddhanta_english_djvu.txt`
(the `download/` path -- `stream/` returns the BookReader HTML wrapper, not raw text).

Data tables (name lists) live in `config/panchang.json`, same split as `dasha.md`/`dasha-years.json`
and `nakshatras.md`/`nakshatras.json`: this file has the derivation and citations, the JSON has the
values code actually loads.

## Tithi (Ch. II, v.66)

`tithi = floor(((Moon_longitude - Sun_longitude) mod 360) / 12) + 1`, range 1-30. The verse's own
"portion" is 12 degrees (720 minutes of arc).

- **Shukla Paksha** (waxing): tithis 1-15. Tithi 15 = **Purnima** ("the moment of opposition" --
  full Moon, Sun and Moon 180 deg apart), stated explicitly in the verse's own commentary.
- **Krishna Paksha** (waning): tithis 16-30. Tithi 30 = **Amavasya** ("the conjunction of the two
  planets" -- new Moon, Sun and Moon at the same longitude), also stated explicitly.
- Both longitudes are **sidereal** (nirayana, ayanamsa-subtracted) -- Panchang in the Jyotish
  tradition uses the same sidereal convention as the rest of this engine, not tropical.
- The 15 tithi names (Pratipada, Dwitiya, ... Chaturdashi, Purnima/Amavasya) are the standard
  Sanskrit numeral-based nomenclature, universally used in every panchang -- **not verse text
  quoted from Ch. II itself**, which gives only the numeric/paksha scheme. Do not mistake this
  standard convention for primary-source-verified wording, same distinction this project already
  draws for translator "Notes:" vs. verse text elsewhere (see `dashaRemedyData.ts`'s own module doc).

## Karana (Ch. II, v.67-69)

Half a tithi (6 degrees of `(Moon - Sun) mod 360`), 60 per synodic month:
`karana = floor(((Moon_longitude - Sun_longitude) mod 360) / 6) + 1`, range 1-60.

11 named karanas, of two kinds:

- **4 fixed (*dhruva*)**, occurring once per cycle each: **Kimstughna** is karana #1 (the very
  first half-tithi of the cycle, i.e. the first half of Shukla Pratipada). **Sakuni**, **Naga**,
  **Chatushpada** are karanas #58-60 (the end of the cycle -- the verse's own wording: "counted
  from the latter half of the fourteenth day of the dark half-month").
- **7 movable (*chara*)**: Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti -- repeat 8 times
  each, filling karanas #2-57 (7 x 8 = 56, plus the 4 fixed = 60; confirmed arithmetically).

**Cross-validated against the text's own worked numerical example**, not just a reconstruction of
the naming order: Burgess computes karana #15 for a sample date and states it is named Vishti.
Reconstructing the sequence (Kimstughna=1, then the movable cycle from 2: Bava, Balava, Kaulava,
Taitila, Gara, Vanija, Vishti=8, Bava=9, ... Vishti=15) lands on Vishti exactly at position 15,
confirming the reconstruction against the primary source's own arithmetic.

Vishti is also popularly known as **Bhadra** in North Indian tradition -- same karana, different
regional name (this project's own golden-chart fixture reports it as "Vishti / Bhadra").

## Yoga (Ch. II, v.65) -- the Nakshatra-yoga

`yoga = floor(((Sun_longitude + Moon_longitude) mod 360) / 13.3333) + 1`, range 1-27. Same 13°20'
(800') nakshatra-span constant this project already uses (`nakshatras.md`, `data/nakshatras.json`).

**A real, worth-flagging distinct concept**: this is a different classical thing from this
project's already-implemented Raja/Gajakesari-type yogas (`src/rules/yogas.ts`) -- same English
word (Sanskrit *yoga*, "combination/union"), unrelated meaning. Do not conflate the two when
extending either module.

Full 27-name list transcribed directly from the verse's own commentary: Vishkambha, Priti,
Ayushmanta, Saubhagya, Shobhana, Atiganda, Sukarman, Dhriti, Shula, Ganda, Vriddhi, Dhruva,
Vyaghata, Harshana, Vajra, Siddhi, Vyatipata, Variyas, Parigha, Shiva, Siddha, Sadhya, Shubha,
Shukla, Brahma, Indra, Vaidhriti. OCR-noisy in the raw archive.org scan -- spellings cross-checked
against the standard modern list before relying on them.

## Nakshatra (Ch. II, v.64)

Same 13°20' Moon-longitude division this project already implements
(`src/engine/dasha.ts`'s `nakshatraPositionFromLongitude()`) -- Panchang's nakshatra/pada column is
not new work, just a new consumer of an already-verified computation. `src/engine/panchang.ts`
reuses that function directly rather than re-deriving it.

## Vara (Ch. I, v.36 commentary + v.51-52) -- sunrise-to-sunrise civil day

A real, worth-implementing-correctly subtlety, not a trivial day-of-week lookup. The
Surya-Siddhanta's own text states its astronomical calculations use a midnight-to-midnight day,
but explicitly distinguishes this from civil/practical use: **"for the practical uses of life, the
Hindus count it from sunrise to sunrise."** Panchang -- a practical almanac, not an astronomical
ephemeris -- uses the sunrise-to-sunrise convention.

**Consequence**: a birth before local sunrise takes the PRECEDING calendar date's own weekday (and,
by the same logic, the preceding date's tithi/karana/yoga/nakshatra context -- though those are
already handled correctly by using the exact birth instant's Sun/Moon longitudes directly, since
they're continuous quantities; only Vara needs an explicit civil-day-boundary check because a
weekday is a discrete label attached to a calendar date, not something derivable from longitude
alone).

7-day cycle: Ravivara/Sunday(Sun) -> Somavara/Monday(Moon) -> Mangalavara/Tuesday(Mars) ->
Budhavara/Wednesday(Mercury) -> Guruvara/Thursday(Jupiter) -> Shukravara/Friday(Venus) ->
Shanivara/Saturday(Saturn).

### Sunrise computation -- a real gap this reference closes

`@swisseph/browser` (this project's ephemeris library, see `ephemeris.md`... no such file yet,
see `ephemeris.ts`'s own module doc) does **not** expose a rise/transit/set function -- confirmed
by reading its full public API (`calculatePosition`, `calculateHouses`, `julianDay`,
`getAyanamsa`, nothing else). Sunrise/sunset is computed independently in `panchang.ts` using the
standard low-precision solar position algorithm (Jean Meeus, *Astronomical Algorithms*, 2nd ed.,
Ch. 25 "Solar Coordinates", the same formula NOAA's ESRL Global Monitoring Division Solar
Calculator uses and documents) -- geometric mean longitude/anomaly, equation of center, apparent
longitude and obliquity correction, declination, and equation of time, all as a pure function of
Julian Day (no ayanamsa involved -- sunrise is a real-sky/tropical event, unrelated to the sidereal
convention used for tithi/karana/yoga/nakshatra above). Standard sunrise hour-angle formula:

```
H0 = arccos( (cos(90.8333 deg) / (cos(lat) * cos(dec))) - tan(lat) * tan(dec) )
```

(90.8333 deg = 90 deg + 34' atmospheric refraction + 16' solar semi-diameter, the conventional
sunrise/sunset altitude, not the geometric horizon.)

**Empirically validated against a real reference value**, not just internal consistency: the
golden chart's own raw Prokerala source
(`tests/golden-charts/sources/reference-chart-1983-prokerala-raw.md`) states the real sunrise for
Chennai on 1983-04-23 as **05:55 AM IST**. `tests/panchang.test.ts` checks the computed value
against this within a stated tolerance (a few minutes -- this is a low-precision algorithm by
design, per Meeus's own characterization of it, not the multi-arcsecond-precision approach a
dedicated rise/set solver would use; sufficient for a civil-day weekday boundary check, where being
off by a few minutes only matters for the rare birth landing within that window of actual sunrise).

## Sequencing note

Panchang's core computation (`tithiFor`, `karanaFor`, `panchangYogaFor`, `varaFor`,
`computePanchang`) is a pure function over already-available chart data (Sun/Moon sidereal
longitude, birth instant, location) plus the new self-contained sunrise primitive above -- same
shape as every other computation in `src/engine/`. It does not structurally depend on which UI
framework, if any, ends up wrapping it as a free tool.
