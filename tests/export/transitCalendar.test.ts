import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { utcISOToJulianDayUT } from "../../src/engine/ephemeris.js";
import { transitCalendarEvents, exportTransitICalendar } from "../../src/export/transitCalendar.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";

// Fixed search start (real ephemeris, not synthetic) -- same start instant used during
// P7b's real-anchor validation (see DECISIONS.md), so the expected sequence below is
// already independently confirmed there: Jupiter Taurus->Gemini (2025-05-14), then a
// preview Gemini->Cancer (2025-10-18), then retrograde back Cancer->Gemini (2025-12-05);
// Saturn Aquarius->Pisces (2025-03-29), then (much later) Pisces->Aries (2027-06-02),
// then retrograde back Aries->Pisces (2027-10-20).
const FROM_JULIAN_DAY_UT = utcISOToJulianDayUT(DateTime.fromISO("2025-01-01T00:00:00Z").toISO()!);

describe("transitCalendarEvents (real ephemeris)", () => {
  it("produces 3 Jupiter + 3 Saturn events by default", async () => {
    const events = await transitCalendarEvents(DEFAULT_ENGINE_SETTINGS, {
      fromJulianDayUT: FROM_JULIAN_DAY_UT,
    });
    expect(events.filter((e) => e.uid.startsWith("ingress-Jupiter-"))).toHaveLength(3);
    expect(events.filter((e) => e.uid.startsWith("ingress-Saturn-"))).toHaveLength(3);
  });

  it("respects ingressesPerGraha", async () => {
    const events = await transitCalendarEvents(DEFAULT_ENGINE_SETTINGS, {
      fromJulianDayUT: FROM_JULIAN_DAY_UT,
      ingressesPerGraha: 1,
    });
    expect(events).toHaveLength(2);
  });

  it("matches the known real-ephemeris sequence for the first Jupiter and Saturn events", async () => {
    const events = await transitCalendarEvents(DEFAULT_ENGINE_SETTINGS, {
      fromJulianDayUT: FROM_JULIAN_DAY_UT,
      ingressesPerGraha: 1,
    });
    const jupiter = events.find((e) => e.uid.startsWith("ingress-Jupiter-"))!;
    expect(jupiter.summary).toBe("Jupiter enters Gemini");
    expect(jupiter.uid).toBe("ingress-Jupiter-2025-05-14@jyotish-engine.local");

    const saturn = events.find((e) => e.uid.startsWith("ingress-Saturn-"))!;
    expect(saturn.summary).toBe("Saturn enters Pisces");
    expect(saturn.uid).toBe("ingress-Saturn-2025-03-29@jyotish-engine.local");
  });

  it("represents each ingress as a full UTC calendar day (00:00 to next-day 00:00)", async () => {
    const events = await transitCalendarEvents(DEFAULT_ENGINE_SETTINGS, {
      fromJulianDayUT: FROM_JULIAN_DAY_UT,
      ingressesPerGraha: 1,
    });
    for (const event of events) {
      const start = DateTime.fromISO(event.startISO).toUTC();
      const end = DateTime.fromISO(event.endISO).toUTC();
      expect(start.toFormat("HH:mm:ss")).toBe("00:00:00");
      expect(end.diff(start, "hours").hours).toBe(24);
    }
  });

  it("gives every event a distinct UID", async () => {
    const events = await transitCalendarEvents(DEFAULT_ENGINE_SETTINGS, {
      fromJulianDayUT: FROM_JULIAN_DAY_UT,
    });
    const uids = new Set(events.map((e) => e.uid));
    expect(uids.size).toBe(events.length);
  });
});

describe("exportTransitICalendar", () => {
  it("produces a complete, well-formed .ics file with the ayanamsa disclosure", async () => {
    const ics = await exportTransitICalendar(DEFAULT_ENGINE_SETTINGS, {
      fromJulianDayUT: FROM_JULIAN_DAY_UT,
      generatedAtISO: "2026-01-01T00:00:00.000Z",
    });

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("lahiri ayanamsa");
    // Node type is irrelevant to Jupiter/Saturn -- must not be disclosed here (it would
    // be noise, not a settings disclosure, since it doesn't affect this output at all).
    expect(ics).not.toMatch(/mean node|true node/);

    const beginCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    const endCount = (ics.match(/END:VEVENT/g) ?? []).length;
    expect(beginCount).toBe(endCount);
    expect(beginCount).toBe(6); // 3 Jupiter + 3 Saturn, default depth

    const uids = [...ics.matchAll(/UID:(\S+)/g)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(uids.length);
  });
});
