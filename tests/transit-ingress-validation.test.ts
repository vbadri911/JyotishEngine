import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { utcISOToJulianDayUT, julianDayUTToUtcISO } from "../src/engine/ephemeris.js";
import { findUpcomingSignIngresses } from "../src/engine/transit.js";

/**
 * Validates the real-ephemeris search against sidereal (Lahiri) transit dates
 * gathered from multiple independent secondary sources -- not a primary ephemeris
 * rerun (see DECISIONS.md, "P7b validated against real sidereal anchors"). Anchors
 * are given in IST (+05:30, the natural frame for these sources) and converted to
 * UTC here via Luxon rather than by hand -- an early-morning IST instant can land
 * on the PREVIOUS UTC calendar day, which a hand conversion risks getting wrong
 * (this is exactly what happens for Saturn's first Aries ingress below).
 */

const SEARCH_START = utcISOToJulianDayUT(DateTime.fromISO("2025-01-01T00:00:00Z").toISO()!);
const SETTINGS = { ayanamsa: "lahiri" as const };

function hoursBetween(actualISO: string, expectedISO: string): number {
  const a = DateTime.fromISO(actualISO);
  const e = DateTime.fromISO(expectedISO);
  return Math.abs(a.diff(e, "hours").hours);
}

// Loose tolerance intentionally: empirically observed diffs against these anchors are
// all under 90 minutes (logged in DECISIONS.md), but these are secondhand sources, not
// a primary ephemeris rerun. The user's own stated standard is "investigate anything
// beyond a day or two" -- this assertion uses 24h, not the tighter figure actually
// observed, so the test isn't brittle to ordinary secondary-source noise.
const TOLERANCE_HOURS = 24;

describe("Jupiter sign ingresses vs. independently-sourced sidereal anchors", () => {
  it("matches the 2026 Cancer and Leo ingresses", async () => {
    const events = await findUpcomingSignIngresses("Jupiter", SEARCH_START, SETTINGS, 6);

    // index 1 (2025-10-18, not asserted here) is Jupiter's PREVIEW entry into Cancer --
    // it retrogrades back into Gemini shortly after (index 2). index 3 is the permanent,
    // post-retrograde entry the anchor actually describes -- confirmed by cross-checking
    // both against the real computed sequence, not assumed from position alone.
    const intoCancer = events[3]!;
    expect(intoCancer.fromSign).toBe("Gemini");
    expect(intoCancer.toSign).toBe("Cancer");
    const cancerAnchorUTC = DateTime.fromISO("2026-06-02T02:25:00+05:30").toUTC().toISO()!;
    expect(hoursBetween(julianDayUTToUtcISO(intoCancer.julianDayUT), cancerAnchorUTC)).toBeLessThan(
      TOLERANCE_HOURS
    );

    const intoLeo = events[4]!;
    expect(intoLeo.fromSign).toBe("Cancer");
    expect(intoLeo.toSign).toBe("Leo");
    // Sources gave a range (12:50-19:19 IST) rather than a single time; anchor on the midpoint.
    const leoAnchorUTC = DateTime.fromISO("2026-10-31T16:05:00+05:30").toUTC().toISO()!;
    expect(hoursBetween(julianDayUTToUtcISO(intoLeo.julianDayUT), leoAnchorUTC)).toBeLessThan(
      TOLERANCE_HOURS
    );
  }, 30000);
});

describe("Saturn sign ingresses vs. independently-sourced sidereal anchors", () => {
  it("matches the three-stage 2027-2028 Aries transit (first ingress, retrograde back to Pisces, permanent ingress)", async () => {
    const events = await findUpcomingSignIngresses("Saturn", SEARCH_START, SETTINGS, 4);

    // index 0 (2025-03-29 Aquarius -> Pisces, not asserted here) precedes all three anchors.
    const firstIntoAries = events[1]!;
    expect(firstIntoAries.fromSign).toBe("Pisces");
    expect(firstIntoAries.toSign).toBe("Aries");
    const firstAriesAnchorUTC = DateTime.fromISO("2027-06-03T06:23:00+05:30").toUTC().toISO()!;
    expect(
      hoursBetween(julianDayUTToUtcISO(firstIntoAries.julianDayUT), firstAriesAnchorUTC)
    ).toBeLessThan(TOLERANCE_HOURS);

    const backToPisces = events[2]!;
    expect(backToPisces.fromSign).toBe("Aries");
    expect(backToPisces.toSign).toBe("Pisces");
    const backToPiscesAnchorUTC = DateTime.fromISO("2027-10-20T06:05:00+05:30").toUTC().toISO()!;
    expect(
      hoursBetween(julianDayUTToUtcISO(backToPisces.julianDayUT), backToPiscesAnchorUTC)
    ).toBeLessThan(TOLERANCE_HOURS);

    const permanentIntoAries = events[3]!;
    expect(permanentIntoAries.fromSign).toBe("Pisces");
    expect(permanentIntoAries.toSign).toBe("Aries");
    const permanentAnchorUTC = DateTime.fromISO("2028-02-23T20:00:00+05:30").toUTC().toISO()!;
    expect(
      hoursBetween(julianDayUTToUtcISO(permanentIntoAries.julianDayUT), permanentAnchorUTC)
    ).toBeLessThan(TOLERANCE_HOURS);
  }, 30000);
});
