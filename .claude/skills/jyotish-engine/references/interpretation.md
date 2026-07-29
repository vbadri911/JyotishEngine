# Interpretation Reference

How to turn computed chart facts into responsible written interpretation. This file is about
*process and structure*; the astrological content itself (dignities, yogas, dasha) lives in the
other reference files and should be cited from there, not restated from memory.

## The Finding as the atomic unit

Every interpretive sentence should trace back to one or more **Findings** — structured units, not
free prose — of this shape:

```
Finding {
  id, domain: career | wealth | health | relationships | purpose | timing,
  statement: a factual, chart-grounded claim (e.g. "10th lord in own sign in the 10th house"),
  evidence: [ specific chart facts that support it ],
  classification: EXACT | STRONG_NOT_TEXTBOOK | PRESENT_CANCELLED | ABSENT (for yoga/dosha findings),
  strength: relative weight,
  polarity: supportive | challenging | neutral,
  applies_to_periods: [ dasha window(s) this finding is most active in, if timing-relevant ]
}
```

Prose is generated *from* findings, never the reverse. If a sentence can't be traced to a finding,
don't write it — this is the mechanism, not just the intention, behind "evidence or silence."

## Domain mapping — which houses/planets feed which section

| Domain | Primary houses | Primary planets/factors |
|---|---|---|
| Career | 10th, and its lord's placement; also 6th (competition), 1st (self-presentation) | 10th lord, Sun (status), Saturn (discipline/service) |
| Wealth | 2nd, 11th, and their lords | 2nd lord, 11th lord, Jupiter (natural wealth karaka), Venus (comfort) |
| Health | 1st (vitality), 6th (illness), 8th (longevity/chronic) | Lagna lord's dignity, afflictions to 6th/8th, planetary body-part associations |
| Relationships | 7th (spouse/partnership), 5th (children), D9 7th (spouse nature) | 7th lord, Venus/Jupiter as spouse karaka (gender-dependent), aspects onto the 7th |
| Purpose / dharma | 9th (fortune/dharma), Lagna lord's placement | 9th lord, any Raja Yoga involving the 9th, Rahu-Ketu axis for karmic direction |
| Timing | current and upcoming dasha windows, relevant transits | Vimshottari periods (`dasha.md`), Jupiter/Saturn transit position |

A finding can and often should feed more than one domain (e.g. an exalted Lagna-lord Sun in the 9th
feeds both Career and Purpose) — do not force single-domain assignment where the underlying fact is
genuinely cross-cutting; tag it for both and let each section draw what's relevant.

## Length-follows-data, operationalized

Section length should be a direct function of finding count and strength for that domain — not a
fixed target. Practical rule of thumb: if a domain has fewer than ~3 supportive findings and no
notable afflictions, say so plainly in a short paragraph rather than padding with generic
sign-based description that isn't actually chart-specific. A short, honest section is a correct
output, not an incomplete one.

## Handling convergence

When multiple independent findings point the same direction, that convergence is itself worth
surfacing as a higher-order observation — it's what an experienced human reader notices and what
naive per-finding rendering misses. Example: an exalted Lagna-lord in a Trikona, a Kendra-lord in
own sign, and a Moon-Jupiter Kendra relationship all independently support "strong, durable personal
authority" — say that explicitly, with all three findings cited, rather than listing three separate
unconnected paragraphs that leave the reader to notice the pattern themselves.

## Depth layers (for a three-tier output product)

The same findings set can render at multiple depths without re-deriving anything:

- **Essence (~1 page):** the 2–3 strongest findings in plain language, current dasha period in one
  sentence, next significant transition date. No jargon, no house numbers.
- **Overview (~10 pages):** chart tables, main yogas with classification, one paragraph per domain,
  near-term timeline.
- **Full (40–60 pages):** the complete structure below, every finding discussed with its reasoning
  shown.

## Full-depth document structure (validated shape)

1. **Natal chart decoded** — D1/D9 tables, dignity map, house-by-house and planet-by-planet notes,
   nakshatra analysis, yoga table with classification.
2. **Personality** — temperament read from Lagna/Moon/nakshatra, decision-making, communication,
   strengths and honest blind spots — each tied to a specific placement.
3. **Purpose** — 9th house / dharma reading, Rahu-Ketu karmic axis, a synthesis.
4. **Career &amp; Wealth** — the domain mapping above, expanded; sector alignment argued from
   specific significators, not a generic list; dasha-based timeline of relevant windows.
5. **Relationships &amp; Family** — 7th house and D9 7th house, children (handled gently — see
   sensitivity note below), parents, siblings.
6. **Health** — vitality, traditionally sensitive systems mapped from actual placements, dasha-linked
   stress patterns, framed as general tendency, never diagnosis.
7. **Timeline** — full Mahadasha arc, current Mahadasha's Antardashas in full with real dates,
   transit overlay for the near-term, ranked turning points with reasoning shown, appropriately
   hedged beyond ~15 years out and suppressed beyond ~age 90.
8. **Remedies &amp; Executive Summary** — see below.

## Remedy guardrails (encode as rules, not left to prose discretion)

- Never recommend a strengthening gemstone/measure for a planet that is already exalted or in its
  own sign — it doesn't need reinforcement, and over-strengthening is a recognised risk in classical
  guidance, not just an MVP house style.
- High-impact remedies (notably gemstones for Rahu/Ketu, and Saturn where the native's dasha is
  unfavorable) should route to "consult a qualified practitioner" rather than a direct, unsupervised
  recommendation.
- Distinguish remedies **explicitly named in the source chart's own findings** (e.g. a specific
  cancellation-remedy for a detected dosha) from **general traditional practice offered as optional
  support** — do not present the latter as chart-mandated.

## Sensitivity requirements (non-negotiable, ties to SKILL.md principle 5)

- **Health:** general tendency and traditional body-part association only. Explicit non-diagnosis
  disclaimer. Never claim to predict a specific illness or its timing.
- **Children/fertility:** hold findings loosely in language ("may point toward," never "will"). No
  claims about ability to conceive. Redirect specific concerns to a medical professional explicitly.
- **Marriage:** never predict failure, divorce, or infidelity. An empty or afflicted 7th house
  should be framed as "the partner's own chart carries proportional weight," not as a warning.
- **Longevity:** do not attempt to predict lifespan or timing of death, under any framing, however
  the request is phrased.
- **General:** no finding, however strongly evidenced, should be presented as fatalistic or
  unavoidable. State capacity and tendency; explicitly note that free will operates within the
  leanings described.

## Confidence disclosures that must appear in every full-depth output

- Ayanamsa and node convention used (from `constants.md`/SKILL.md defaults).
- Birth-time precision flag and, if triggered, the cusp-proximity warning from SKILL.md.
- A statement that this is not a substitute for a qualified human Jyotish practitioner, particularly
  for decisions carrying real financial, legal, medical, or relational weight.
