import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { computeChart, julianDayUTToUtcISO } from "../src/index.js";
import { DEFAULT_ENGINE_SETTINGS } from "../src/types.js";

/**
 * Confirms (not assumes) that the birth instant fed into computeMahadashaSequence()
 * is derived from the correctly-resolved UTC offset -- via julianDayUT, not by
 * re-parsing input.date/input.time as a naive local string -- for exactly the
 * historical-offset edge cases DECISIONS.md documents (pre-1906 LMT, Bombay/Calcutta
 * extended local time). A wrong answer here would silently corrupt dasha boundaries
 * for those cases specifically, without affecting modern-date charts at all.
 *
 * NOTE: dasha.mahadashas[0].start is NOT the birth instant -- it's the birth
 * Mahadasha's own TRUE start, back-dated from birth by its already-elapsed portion
 * (see dasha.ts). So these tests check the birth instant itself, via
 * julianDayUTToUtcISO(chart.julianDayUT) -- the exact value computeChart() passes
 * into computeMahadashaSequence() -- not any one Mahadasha boundary.
 */
describe("computeChart() dasha wiring is timezone-safe", () => {
  it("julianDayUTToUtcISO(chart.julianDayUT), converted back via the resolved UTC offset, reproduces the golden chart's exact local clock time", async () => {
    const { chart } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );

    expect(chart.location.utcOffsetMinutesAtBirth).toBe(330); // sanity: modern IST

    const birthInstantUTC = DateTime.fromISO(julianDayUTToUtcISO(chart.julianDayUT), { zone: "utc" });
    const reconstitutedLocal = birthInstantUTC.plus({ minutes: chart.location.utcOffsetMinutesAtBirth });

    expect(reconstitutedLocal.toFormat("yyyy-MM-dd")).toBe("1983-04-23");
    expect(reconstitutedLocal.toFormat("HH:mm")).toBe("15:30");
  });

  it("uses Bombay's corrected local-time offset (not naive IST) for a 1930 Bombay birth's julianDayUT", async () => {
    const { chart } = await computeChart(
      { date: "1930-06-15", time: "09:00", placeText: "Mumbai, Maharashtra, India", precision: "approximate" },
      DEFAULT_ENGINE_SETTINGS
    );

    // This is exactly the case DECISIONS.md flags: 1930 is after the 1906 national
    // IST unification but before Bombay's 1955 cutover, so the correct offset here is
    // Bombay's own +4:51:00, not national IST (+5:30) and not a naive system-local guess.
    expect(chart.location.utcOffsetMinutesAtBirth).toBe(4 * 60 + 51);
    expect(chart.location.utcOffsetMinutesAtBirth).not.toBe(330);
    expect(chart.location.historicalTimezoneCaveat).toContain("Bombay");

    const birthInstantUTC = DateTime.fromISO(julianDayUTToUtcISO(chart.julianDayUT), { zone: "utc" });
    const reconstitutedLocal = birthInstantUTC.plus({ minutes: chart.location.utcOffsetMinutesAtBirth });

    // If julianDayUT had been built from a naive IST assumption instead of the corrected
    // Bombay offset, this reconstruction would be off by 39 minutes and this would fail.
    expect(reconstitutedLocal.toFormat("yyyy-MM-dd")).toBe("1930-06-15");
    expect(reconstitutedLocal.toFormat("HH:mm")).toBe("09:00");
  });

  it("the birth Mahadasha's TRUE start (dasha.mahadashas[0].start) is back-dated before birth, not anchored at it", async () => {
    // Documents the back-dating fix in dasha.ts explicitly, so nothing downstream
    // mistakes mahadashas[0].start for the birth instant again.
    const { chart, dasha } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );
    const birthInstantUTC = DateTime.fromISO(julianDayUTToUtcISO(chart.julianDayUT), { zone: "utc" });
    const mahadashaStart = DateTime.fromISO(dasha.mahadashas[0]!.start, { zone: "utc" });

    expect(mahadashaStart < birthInstantUTC).toBe(true);
    const expectedElapsedYears = 20 - dasha.birthBalance.balanceYears; // Venus's total dasha length is 20 years
    expect(birthInstantUTC.diff(mahadashaStart, "years").years).toBeCloseTo(expectedElapsedYears, 1);
  });
});
