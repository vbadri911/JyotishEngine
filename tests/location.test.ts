import { describe, it, expect } from "vitest";
import { resolveLocation } from "../src/engine/location.js";

describe("resolveLocation", () => {
  it("resolves a modern Indian birth to standard IST, no caveat", async () => {
    const location = await resolveLocation({
      date: "1983-04-23",
      time: "15:30",
      placeText: "Chennai, Tamil Nadu, India",
      precision: "exact_from_record",
    });
    expect(location).not.toBeNull();
    expect(location!.utcOffsetMinutesAtBirth).toBe(330);
    expect(location!.historicalTimezoneCaveat).toBeUndefined();
  });

  it("resolves a pre-1906 Bombay birth to Bombay's own documented local time, with a caveat", async () => {
    const location = await resolveLocation({
      date: "1890-03-12",
      time: "14:30",
      placeText: "Mumbai, Maharashtra, India",
      precision: "approximate",
    });
    expect(location).not.toBeNull();
    // Bombay's own geonameId is known here, so the documented exact figure applies (+4:51:00),
    // not the generic per-longitude estimate -- see timezone.ts / DECISIONS.md.
    expect(location!.utcOffsetMinutesAtBirth).toBe(4 * 60 + 51);
    expect(location!.utcOffsetMinutesAtBirth).not.toBe(330); // must NOT be today's IST
    expect(location!.historicalTimezoneCaveat).toBeDefined();
    expect(location!.historicalTimezoneCaveat).toContain("1955-01-01");
  });

  it("resolves a 1930s Bombay birth (post-1906, pre-1955) to Bombay's own local time, not national IST", async () => {
    const location = await resolveLocation({
      date: "1935-07-04",
      time: "10:00",
      placeText: "Mumbai, Maharashtra, India",
      precision: "approximate",
    });
    expect(location).not.toBeNull();
    expect(location!.utcOffsetMinutesAtBirth).toBe(4 * 60 + 51);
    expect(location!.historicalTimezoneCaveat).toContain("Bombay");
  });

  it("resolves a pre-1906 birth in a non-Bombay/Calcutta Indian city to generic longitude LMT", async () => {
    const location = await resolveLocation({
      date: "1890-03-12",
      time: "14:30",
      placeText: "Chennai, Tamil Nadu, India",
      precision: "approximate",
    });
    expect(location).not.toBeNull();
    expect(location!.utcOffsetMinutesAtBirth).not.toBe(330);
    expect(location!.historicalTimezoneCaveat).toContain("1906-01-01");
  });

  it("returns null for a place that doesn't geocode", async () => {
    expect(await resolveLocation({
      date: "2000-01-01",
      time: "12:00",
      placeText: "Nonexistentville, Nowhere",
      precision: "unknown",
    })).toBeNull();
  });
});
