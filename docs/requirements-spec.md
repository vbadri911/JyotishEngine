# Life Blueprint — Requirements & Technical Specification (v0.2)

**Open Source, Client-Side, No Backend**

An open, auditable Jyotish engine and report generator. Three inputs — date, time, and
place of birth — produce a complete, evidence-traced life analysis at three depths, in
multiple languages, computed entirely on the user's own device.

> **What changed from v0.1:** the "serve people" requirements (open source, minimal-LLM
> narrative, layered output, regional languages, free tools, zero data retention) are
> not four separate features — together they eliminate the backend entirely, and with
> it every recurring cost, every privacy liability, and every reason the project could
> quietly die when someone stops paying a hosting bill.

Confirmed decisions: open source · template-driven narrative, minimal LLM · layered
output · regional languages in MVP · free no-signup tools · client-side computation
with zero data retention.

---

## 1. The Architectural Consequence

Four requirements were selected where three were offered. They turn out to be
mutually reinforcing, not additive:

| Requirement | What it forces | What that enables |
|---|---|---|
| Client-side, zero retention | Engine must run in the browser | Nothing to leak, nothing to breach, no privacy policy to trust |
| Template-driven narrative | No LLM API call at generation time | Narrative can also run client-side; zero per-report cost |
| Regional languages | Text must be data, not generated prose | Translation becomes a JSON file, not a re-derivation |
| Free no-signup tools | No auth, no accounts, no database | Static hosting; entry point costs nothing to serve |

**The result is a fully static, offline-capable web application with no server
component at all.** Hosting is free tier indefinitely. Running cost is approximately
zero. It works without a network connection once loaded. It cannot leak birth data
because it never receives any. And because it is open source, the claim "your data
never leaves your device" is verifiable by inspection rather than a promise.

This is also the most durable answer to sustainability. A project with no recurring
cost does not need revenue to survive, and cannot be captured by the need for it.

**BYOK addendum (added after initial v0.2):** an optional bring-your-own-key LLM
polish layer is permitted, strictly downstream of the rules engine — it may rephrase
findings the engine has already established, never originate a claim. If findings are
missing for a domain, the correct behavior is silence, not asking the model to fill
the gap. Default runtime model for this layer should be the cheapest adequate one
(reasoning is not required for constrained rephrasing); users may override. The app
must remain fully functional with no key supplied at all — BYOK is additive polish,
never a dependency.

---

## 2. Guiding Principles

- **Evidence or silence.** No statement renders unless the rules engine supplied a
  chart fact supporting it.
- **Precision decays honestly.** Near-term combines dasha and transit; far-term is
  dasha-only; beyond a configurable age horizon, output is suppressed rather than
  guessed.
- **Length follows data.** Sparse chart material produces a short section that says so.
- **Classify, don't flatten.** Exact, strong-but-not-textbook, present-but-cancelled,
  and absent are four distinct states and must render differently.
- **Never trade on fear.** No death timing, no marriage-failure predictions, no
  manufactured affliction followed by a remedy. Enforced in the content layer, not
  left to good intentions.
- **Auditable by construction.** Open source, deterministic output, disclosed
  settings. Anyone can verify the math, and identical inputs always produce identical
  output.

---

## 3. Stack

Client-side execution requires the engine to run in the browser, so the
implementation language is TypeScript rather than the Python originally proposed in
v0.1. Swiss Ephemeris WASM builds exist with arc-second accuracy over 1800–2400 CE.

| Layer | Choice | Note |
|---|---|---|
| Ephemeris | Swiss Ephemeris compiled to WASM | Evaluate available packages against golden charts before committing. Built-in Moshier ephemeris works offline; full Swiss Ephemeris files optional for JPL-grade precision. |
| Language | TypeScript | Type safety matters when a sign-index off-by-one silently corrupts every downstream claim. |
| Geocoding | Bundled offline dataset | No API, no key, no rate limit, works offline. |
| Timezone | IANA tzdata, resolved for the birth date | Must resolve the offset in force *on the birth date* — pre-1906 India used city-specific local time (see §5); Bombay and Calcutta kept their own civil clocks past national unification, until 1955 and 1948 respectively. |
| Rules & templates | Declarative JSON/YAML | Rules and prose are both data. Editable without touching code. |
| Rendering | SVG charts; client-side PDF/DOCX generation | Both generate in-browser. No server round trip. |
| Hosting | Static (free-tier) | PWA manifest for offline and installable use. |
| Licence | GPL-3.0-or-later, or AGPL-3.0-only if any bundled dependency requires it | **Verify the actual upstream license of any bundled Swiss Ephemeris binding directly against Astrodienst's current terms, not the binding's own self-description** — a real discrepancy was found during implementation where a candidate package mislabeled AGPL-licensed code as GPL v2. |

---

## 4. Chart Engine

Fully deterministic. Unit-tested to the arc-minute. Everything downstream inherits
its errors.

| Parameter | MVP setting | Note |
|---|---|---|
| Zodiac / Ayanamsa | Sidereal, Lahiri (Chitrapaksha) | Indian civil standard. Configurable — Raman and KP shift positions by ~1°. |
| House system | Whole Sign (Rasi = Bhava) | Standard South Indian practice. |
| Nodes | Mean (default), True configurable | Schools differ; disclose which was used in every output. |
| Divisional charts | D1 and D9 | Implement Navamsa as one case of a general varga function so the rest of the shodasavarga is later configuration, not new code. |

### Derived values

- Per planet: sidereal longitude, sign, degree, nakshatra and pada, house, retrograde,
  combustion, dignity.
- **Dignity:** exalted / debilitated / moolatrikona / own / friend / neutral / enemy.
  Verified against the primary BPHS text (R. Santhanam translation) — exact
  exaltation degrees, moolatrikona zone boundaries (including two real off-by-one
  errors found and fixed during implementation for Moon and Mercury specifically,
  where the exaltation sign coincides with a moolatrikona/own-sign zone), and natural
  friendships all confirmed against source rather than secondary summaries.
- **Combustion orbs** (config, not code — sources disagree): Moon 12°, Mars 17°,
  Mercury 14° / 12° retrograde, Jupiter 11°, Venus 10° / 8° retrograde, Saturn 15°.
- **Graha drishti:** all planets aspect the 7th; Mars also 4th and 8th; Jupiter 5th
  and 9th; Saturn 3rd and 10th. Rahu/Ketu aspects vary by school — config flag,
  default off.
- **House lordships** and each lord's placement — the most-used derived fact in the
  system.
- **Vimshottari dasha** to Pratyantardasha depth across the full 120-year cycle,
  computed from the Moon's exact nakshatra longitude. Year-counts and sequence
  verified against BPHS Ch. 46, v. 15 directly. Sub-periods must subdivide the
  parent's exact start and end instants, not nominal year lengths — rounding
  compounds visibly over 120 years. **The first (birth) Mahadasha's true start must be
  anchored at its actual retroactive start date (birth minus elapsed balance),
  running its full nominal duration — not anchored at the birth instant itself
  running only the remaining balance.** The two approaches happen to produce
  identical *subsequent* Mahadasha boundaries, which can mask the bug in testing, but
  the birth Mahadasha's own Antardasha proportions are silently wrong under the
  latter approach since they fraction against the wrong parent span. Every boundary
  stored as a timestamp.

### Yoga and dosha classification

| State | Meaning | Reference-chart example |
|---|---|---|
| EXACT | All classical conditions met | Malavya Yoga — Venus own-sign in the 10th, a Kendra |
| STRONG_NOT_TEXTBOOK | Dignity real, classical condition unmet | Mars own-sign in the 9th; Ruchaka needs a Kendra, the 9th is a Trikona |
| PRESENT_CANCELLED | Condition met, cancellation also met | Kemadruma — cancelled by Moon in a Kendra. Render as "not a concern." |
| ABSENT | Not detected | Mangal Dosha, Kala Sarpa — report absence explicitly; it is informative and reassuring |

MVP rule coverage: five Pancha Mahapurusha yogas (names and planet mapping verified
against BPHS Ch. 75), Gajakesari, Kemadruma with cancellations, Mangal Dosha with
standard exemptions. Deferred pending primary-source verification before
implementation: general Raja Yoga combinations (BPHS Ch. 39–41), Nabhasa yogas
(Ch. 35), Kala Sarpa, Shakata, Sade Sati. Each rule carries a citation field naming
its classical source, so school disagreements are auditable.

---

## 5. Historical Timezone Resolution

Not a throwaway detail. Verified findings, not assumptions:

- India's civil/railway time unified nationally to IST (+5:30) on **1906-01-01**, not
  1955 as an earlier draft of this project's reference material incorrectly stated.
  1955 is a real date in this history, but for a different fact entirely — the
  Calendar Reform Committee's adoption of the Lahiri ayanamsa. The two were
  conflated in an early draft and corrected once checked against IANA tzdata's
  primary citations.
- Before 1906, compute true local mean time from the birth location's own longitude
  rather than trusting a single zone's bundled pre-1906 history, which is specific to
  one city's railway-time convention and does not generalize.
- **Bombay and Calcutta kept their own official local civil time well past the 1906
  national unification** — Bombay Time (UTC+4:51) continued until 1955, Calcutta Time
  (UTC+5:53:20) until 1948. A birth in either city between 1906 and its own cutover
  must use the city's own local time, not national IST — the difference (39 minutes
  for Bombay, 23m20s for Calcutta) is large enough to move an Ascendant. This must be
  keyed off the specific city actually geocoded, not applied to all of India.
- A given Node/browser environment's bundled ICU timezone data may not carry
  `Asia/Bombay` or `Asia/Madras` as distinct zones — verify what's actually available
  in the target runtime rather than assuming.

---

## 6. Confidence Layer — Including the Cusp Problem

The Ascendant advances about 1° every four minutes, so a ten-minute error in a birth
time recorded as a round number can change the Lagna and invalidate the entire
reading. No mainstream app warns about this; here it is a first-class feature.

| Condition | Behaviour |
|---|---|
| Ascendant within 3° of a sign boundary | Prominent warning; show how the two candidate readings differ; recommend rectification |
| Birth time flagged *approximate* or *unknown* | Suppress Ascendant- and house-dependent claims; fall back to Moon-sign analysis, which is far more robust to time error |
| Any planet within 1° of a sign boundary | Soften every finding depending on that placement |
| Moon near a nakshatra boundary | Warn — the whole dasha timeline shifts with it |
| Period beyond configured age horizon | Suppress and state why, rather than forecast |

A required input enum — `exact_from_record` / `approximate` / `unknown` — drives all
of the above and propagates into the rendered document's disclaimers.

---

## 7. Narrative Layer — Templates, Not Generation

Findings are structured, language-neutral interpretive units emitted by the rules
engine. Templates render them into prose. Because the text is data, translation and
depth-switching are both rendering concerns rather than re-derivations.

```
Finding {
  id, domain: career|wealth|health|relationships|purpose|timing,
  rule: "lord_in_own_house", subject: Venus, house: 10,
  evidence: [venus.sign=Taurus, venus.house=10, house10.lord=Venus],
  strength, polarity, classification, appliesToPeriods
}

templates/en/career.json  ->  "lord_in_own_house": {
  brief:  "Career is a genuine strength in your chart.",
  medium: "{subject} rules your {house}th house and sits there in its own sign ...",
  full:   [ several variants, selected deterministically by finding id ]
}
```

### Honest tradeoff

Template prose will not match hand-written prose. Mitigations, in order of value:
write several phrasings per finding and select deterministically so output varies
without becoming random; compose at the paragraph level rather than stitching
sentence fragments; offer optional LLM polish only where a user supplies their own
API key, strictly constrained to rephrasing supplied findings and never adding facts.
The default path stays free, offline, and reproducible.

**Statement text is itself a testable surface, not just structure.** A finding-shape
test (checking `domain`/`classification`/`strength`) can pass cleanly while the
rendered statement contains a live phrasing bug (a malformed ordinal, an ambiguous
separator reused for both static label and dynamic data). Any finding-producing
module needs at least one test asserting on literal rendered text, not only on
structural fields.

### Regional languages

Each language is a template directory. English first, then Tamil, Hindi, and Telugu.
Astrological register in these languages carries specific traditional vocabulary, and
machine translation will produce text that is technically correct and tonally wrong.
Budget for native-speaker review by someone familiar with Jyotish terminology.

---

## 8. Layered Output

| Layer | Length | Audience & content |
|---|---|---|
| Essence | 1 page | Plain language, no jargon. Strongest three findings, current dasha in a sentence, next significant transition date. |
| Overview | ~10 pages | Chart tables, main yogas with classification, domain summaries, near-term timeline. |
| Full Blueprint | 40–60 pages | Natal, Career & Wealth, Relationships, Health, Timeline, Remedies & Summary. |

One engine, one findings set, three renderings. Depth is opt-in rather than imposed.

**Free tools (entry point, no signup):** kundli calculator with South Indian chart,
Panchang for any date, dasha timeline viewer, and the cusp/birth-time confidence
checker — genuinely useful on its own and offered by no mainstream competitor found
during research.

---

## 9. Living Document — Without a Server

Dasha alerts do not require a backend. Since every boundary is already a computed
timestamp, emit every Antardasha/Pratyantardasha transition plus Jupiter/Saturn
ingresses as **`.ics` calendar events** the user imports once into Google
Calendar, Apple Calendar, or Outlook — all support `.ics` natively. Their own
calendar handles reminders, on any device, forever, with no server and no account.

A live *subscribed* feed that auto-updates would require a server; download-and-import
is the correct tradeoff given the no-backend architecture, and is a fair one since
regeneration is instant and free.

- PWA notifications as an optional local supplement.
- Saved chart state kept in browser local storage — on-device, never transmitted.
- "Versioning" is simply re-running the engine; optionally export a diff against a
  previously saved report.

---

## 10. Validation

Validate against open sources — published classical example charts, and any fully
documented reference chart with known-correct expected values — rather than any
third-party API, so there is no dependency on a competitor's terms of service.

- 30–50 golden charts covering cusp Ascendants, polar and equatorial latitudes,
  pre-1906 Indian births (including Bombay/Calcutta-specific cases), DST-affected
  locations, near-midnight births, and leap days.
- Planetary longitudes agree within 1 arc-minute against independent references;
  dasha boundaries within 1 day — **and any discrepancy beyond tolerance must be
  investigated for cause, not resolved by adjusting either side to match.** A
  discrepancy may reveal a real bug, or may reveal that the hand-derived reference
  value itself carries noise (this occurred during implementation: a fixture's
  hand-computed longitudes were consistently the less precise side once compared
  against real ephemeris output).
- Investigate every yoga-detection or dignity disagreement against the primary
  source rather than tuning to match — several real errors were found and fixed this
  way during implementation (a fixture's Jupiter dignity and Mercury combustion flag
  were both wrong, not the engine).
- Harness runs in CI. Open source means the tests are public, which is itself part of
  the trust claim.

---

## 11. Phasing

| Phase | Deliverable |
|---|---|
| P1 | Ephemeris integration, positions, houses, dignities, nakshatras, D1/D9, golden-chart harness green |
| P2 | Vimshottari dasha to Pratyantardasha depth, validated, wired into the chart pipeline |
| P3 | Rules engine: yogas and doshas with classification and cancellations |
| P4 | Findings model, confidence layer, cusp warnings — dignity/house-lord/combustion/dasha facts converted to structured Findings, not just yoga detections |
| P5 | English template library across all three output depths |
| P6 | South Indian SVG chart, PDF/DOCX export, free-tools views |
| P7 | **Living document**: `.ics` export of every dasha/Antardasha/Pratyantardasha transition plus Jupiter/Saturn ingresses; versioned regeneration with diffs |
| P8 | Tamil / Hindi / Telugu template sets with native-speaker review |

P5 is the largest single writing effort and the one most worth not rushing — the
template library *is* the product's voice. P8 cannot meaningfully start before P5
exists in English.

### Deferred to v1 (explicitly out of MVP scope)

North Indian and Bengali chart formats; remaining shodasavarga; Shadbala and
Ashtakavarga (BPHS Ch. 27–28, 66–73); birth-time rectification wizard;
conversational chat over the chart; practitioner review/annotation export;
compatibility and synastry; multi-chart family view; other dasha systems
(Ashtottari, Kalachakra, etc. — Vimshottari is the only system this project
implements); Jaimini-style karakas/Atmakaraka (BPHS Ch. 32–33); longevity
calculation (explicitly out of scope per the "never trade on fear" principle — do
not implement without revisiting that constraint first).

---

## 12. Risks & Open Items

| Item | Assessment |
|---|---|
| Ephemeris binding license | **Verify the actual upstream license directly against the source's own current terms before trusting any binding's self-description.** A real case was found where a candidate package's bundled LICENSE file mislabeled AGPL-licensed upstream code as GPL v2. |
| Template prose quality | The real quality risk. Mitigations in §7. Accept that output reads slightly more mechanically than hand-written prose; the honesty and the price are the compensating trade. |
| Translation quality | Cannot be solved by code. Requires native speakers with Jyotish familiarity. |
| Ethical exposure | Health, marriage and children content can distress people. §2 guardrails are requirements. Every sensitive section carries a redirect to a qualified professional. |
| Scope creep | The engine can support endlessly more features. Ship the phase list in order before adding anything not already listed. |
| Fixture/reference drift | Hand-derived test fixtures built before a primary-source verification pass may themselves contain errors (found in practice: dignity, combustion flags). Any fixture should be explicitly re-swept against verified constants after any correction to those constants, not assumed current. |

---

*This document reflects the architecture as agreed and refined through implementation.
Where implementation surfaced a correction to an assumption made here, that correction
is recorded above rather than silently incorporated — check `DECISIONS.md` for the
full, dated history of each one.*
