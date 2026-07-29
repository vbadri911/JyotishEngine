import { describe, it, expect } from "vitest";
import { resolveUtcOffset } from "../src/engine/timezone.js";

describe("resolveUtcOffset", () => {
  it("uses standard IST for a modern Indian birth (golden chart date)", () => {
    const result = resolveUtcOffset("Asia/Kolkata", "1983-04-23T15:30", 80.27847);
    expect(result.utcOffsetMinutes).toBe(330); // +5:30
    expect(result.historicalTimezoneCaveat).toBeUndefined();
  });

  it("computes true local mean time for a pre-1906 Bombay birth, not national IST", () => {
    // Bombay (Mumbai), longitude ~72.8777 -- historically known as "Bombay Time," +4:51
    const result = resolveUtcOffset("Asia/Kolkata", "1890-03-12T14:30", 72.8777);
    expect(result.utcOffsetMinutes).toBe(Math.round(72.8777 * 4)); // 292 min = +4:51:08
    expect(result.utcOffsetMinutes).not.toBe(330);
    expect(result.historicalTimezoneCaveat).toContain("1906-01-01");
  });

  it("computes true local mean time for a pre-1906 Calcutta birth, distinct from Bombay's", () => {
    const bombay = resolveUtcOffset("Asia/Kolkata", "1890-03-12T14:30", 72.8777);
    const calcutta = resolveUtcOffset("Asia/Kolkata", "1890-03-12T14:30", 88.3639);
    expect(calcutta.utcOffsetMinutes).not.toBe(bombay.utcOffsetMinutes);
    expect(calcutta.utcOffsetMinutes).toBe(Math.round(88.3639 * 4));
  });

  it("uses standard IST immediately after the 1906-01-01 unification", () => {
    const result = resolveUtcOffset("Asia/Kolkata", "1906-01-02T06:00", 72.8777);
    expect(result.utcOffsetMinutes).toBe(330);
    expect(result.historicalTimezoneCaveat).toBeUndefined();
  });

  it("uses standard IST the day before unification (still pre-1906 by date comparison)", () => {
    const result = resolveUtcOffset("Asia/Kolkata", "1905-12-31T23:59", 72.8777);
    expect(result.historicalTimezoneCaveat).toBeDefined();
  });

  it("reflects India's WWII 'war time' +1:00 windows via IANA tzdata (no special-casing needed)", () => {
    const beforeWarTime = resolveUtcOffset("Asia/Kolkata", "1941-09-30T12:00", 77.2);
    const duringWarTime1 = resolveUtcOffset("Asia/Kolkata", "1941-10-01T12:00", 77.2);
    const betweenWarTimes = resolveUtcOffset("Asia/Kolkata", "1942-06-01T12:00", 77.2);
    const duringWarTime2 = resolveUtcOffset("Asia/Kolkata", "1943-01-01T12:00", 77.2);
    const afterWarTime = resolveUtcOffset("Asia/Kolkata", "1945-10-15T12:00", 77.2);

    expect(beforeWarTime.utcOffsetMinutes).toBe(330);
    expect(duringWarTime1.utcOffsetMinutes).toBe(390); // +6:30
    expect(betweenWarTimes.utcOffsetMinutes).toBe(330);
    expect(duringWarTime2.utcOffsetMinutes).toBe(390);
    expect(afterWarTime.utcOffsetMinutes).toBe(330);
  });

  it("uses Bombay's own documented local time (not national IST) from 1906 through 1954", () => {
    // Mumbai geonameId 1275339 -- see DECISIONS.md for sourcing (Bombay Time, UTC+4:51, 1884-1955)
    const result = resolveUtcOffset("Asia/Kolkata", "1930-06-15T09:00", 72.88261, 1275339);
    expect(result.utcOffsetMinutes).toBe(4 * 60 + 51); // exactly +4:51:00
    expect(result.utcOffsetMinutes).not.toBe(330); // must NOT be national IST
    expect(result.historicalTimezoneCaveat).toContain("1955-01-01");
  });

  it("switches Bombay to national IST from 1955-01-01 onward", () => {
    const result = resolveUtcOffset("Asia/Kolkata", "1955-01-01T00:00", 72.88261, 1275339);
    expect(result.utcOffsetMinutes).toBe(330);
    expect(result.historicalTimezoneCaveat).toBeUndefined();
  });

  it("uses Calcutta's own documented local time (not national IST) from 1906 through 1947", () => {
    // Kolkata geonameId 1275004 -- Calcutta Time, UTC+5:53:20, 1884-1948
    const result = resolveUtcOffset("Asia/Kolkata", "1930-06-15T09:00", 88.36304, 1275004);
    expect(result.utcOffsetMinutes).toBeCloseTo(5 * 60 + 53 + 20 / 60, 5); // +5:53:20
    expect(result.utcOffsetMinutes).not.toBe(330);
    expect(result.historicalTimezoneCaveat).toContain("1948-01-01");
  });

  it("switches Calcutta to national IST from 1948-01-01 onward", () => {
    const result = resolveUtcOffset("Asia/Kolkata", "1948-01-01T00:00", 88.36304, 1275004);
    expect(result.utcOffsetMinutes).toBe(330);
    expect(result.historicalTimezoneCaveat).toBeUndefined();
  });

  it("prefers Bombay's documented fixed offset over the generic longitude estimate, even pre-1906", () => {
    const withCityId = resolveUtcOffset("Asia/Kolkata", "1890-03-12T14:30", 72.88261, 1275339);
    const withoutCityId = resolveUtcOffset("Asia/Kolkata", "1890-03-12T14:30", 72.88261);
    expect(withCityId.utcOffsetMinutes).toBe(291); // documented exact figure
    expect(withoutCityId.utcOffsetMinutes).not.toBe(291); // generic longitude*4 rounding differs slightly
  });

  it("ignores the Bombay/Calcutta exception for a different Indian city's geonameId", () => {
    // Chennai's geonameId, not Bombay's or Calcutta's -- should fall through to the generic rule
    const result = resolveUtcOffset("Asia/Kolkata", "1930-06-15T09:00", 80.27847, 1264527);
    expect(result.utcOffsetMinutes).toBe(330); // national IST, since 1930 is after 1906 unification
  });

  it("delegates to standard IANA zone data for non-Indian zones", () => {
    // New York, mid-summer (EDT, UTC-4) vs mid-winter (EST, UTC-5)
    const summer = resolveUtcOffset("America/New_York", "1990-07-01T12:00", -74.0);
    const winter = resolveUtcOffset("America/New_York", "1990-01-01T12:00", -74.0);
    expect(summer.utcOffsetMinutes).toBe(-240);
    expect(winter.utcOffsetMinutes).toBe(-300);
    expect(summer.historicalTimezoneCaveat).toBeUndefined();
  });
});
