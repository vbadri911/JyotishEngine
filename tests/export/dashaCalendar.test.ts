import { describe, it, expect } from "vitest";
import { computeMahadashaSequence, type DashaComputationResult } from "../../src/engine/dasha.js";
import { dashaCalendarEvents, exportDashaICalendar } from "../../src/export/dashaCalendar.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";

// Same reference chart as tests/dasha.test.ts: Moon at 19.267 deg Leo.
const REFERENCE_MOON_LONGITUDE = 139.267;
const dasha = computeMahadashaSequence("1983-04-23T10:00:00.000Z", REFERENCE_MOON_LONGITUDE);

describe("dashaCalendarEvents", () => {
  it("produces 9 Mahadasha + 81 Antardasha events regardless of 'now'", () => {
    const events = dashaCalendarEvents(dasha, { nowISO: "1900-01-01T00:00:00.000Z" }); // outside the cycle
    const mdCount = events.filter((e) => e.uid.startsWith("mahadasha-")).length;
    const adCount = events.filter((e) => e.uid.startsWith("antardasha-")).length;
    expect(mdCount).toBe(9);
    expect(adCount).toBe(81);
  });

  it("adds Pratyantardasha events for the current Mahadasha + next two when 'now' falls inside the cycle", () => {
    // 2020-01-01 falls within the Rahu Mahadasha (2017-2035) per this chart's known sequence.
    const events = dashaCalendarEvents(dasha, { nowISO: "2020-01-01T00:00:00.000Z" });
    const pdCount = events.filter((e) => e.uid.startsWith("pratyantardasha-")).length;
    expect(pdCount).toBe(3 * 9 * 9); // 3 Mahadashas (Rahu, Jupiter, Saturn) x 9 Antardashas x 9 Pratyantardashas
  });

  it("omits Pratyantardasha events entirely when 'now' falls outside the computed cycle", () => {
    const before = dashaCalendarEvents(dasha, { nowISO: "1900-01-01T00:00:00.000Z" });
    const after = dashaCalendarEvents(dasha, { nowISO: "2200-01-01T00:00:00.000Z" });
    expect(before.filter((e) => e.uid.startsWith("pratyantardasha-"))).toHaveLength(0);
    expect(after.filter((e) => e.uid.startsWith("pratyantardasha-"))).toHaveLength(0);
  });

  it("description shows UTC-normalized, deterministic timestamps -- not the raw stored ISO string (which carries the running environment's local offset)", () => {
    const events = dashaCalendarEvents(dasha);
    const venus = events.find((e) => e.uid.startsWith("mahadasha-Venus-"))!;
    // period.start itself carries whatever local offset the environment that ran
    // computeMahadashaSequence() happened to use (e.g. "-07:00", "+05:30", ...) --
    // the description must NOT contain that raw string, only the normalized form.
    expect(venus.description).not.toContain(venus.startISO);
    expect(venus.description).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC/);
  });

  it("formats summaries with the full nested lineage at each level", () => {
    const events = dashaCalendarEvents(dasha, { nowISO: "2020-01-01T00:00:00.000Z" });
    expect(events.find((e) => e.uid.startsWith("mahadasha-") && e.summary === "Venus Mahadasha")).toBeDefined();
    const ad = events.find((e) => e.uid.startsWith("antardasha-") && e.summary.includes("(Rahu Mahadasha)"));
    expect(ad).toBeDefined();
    expect(ad!.summary).toMatch(/^\w+ Antardasha \(Rahu Mahadasha\)$/);
    const pd = events.find((e) => e.uid.startsWith("pratyantardasha-") && e.summary.includes("Rahu Mahadasha"));
    expect(pd).toBeDefined();
    expect(pd!.summary).toMatch(/^\w+ Pratyantardasha \(\w+ Antardasha \/ Rahu Mahadasha\)$/);
  });

  it("gives every event a distinct UID", () => {
    const events = dashaCalendarEvents(dasha, { nowISO: "2020-01-01T00:00:00.000Z" });
    const uids = new Set(events.map((e) => e.uid));
    expect(uids.size).toBe(events.length);
  });
});

describe("UID is UTC-normalized, not dependent on the generating machine's local timezone", () => {
  // Regression test for a real bug: UID used to interpolate period.start raw, which
  // carries whatever offset Luxon's toISO() picked at computation time (the running
  // environment's local zone, not a chart property) -- so the same chart, regenerated
  // on a different machine, produced different UIDs for logically identical periods,
  // breaking calendar apps' de-duplication on re-import. See DECISIONS.md.
  function buildFakeDasha(startISO: string, endISO: string): DashaComputationResult {
    return {
      birthBalance: { lord: "Venus", balanceYears: 11.08 },
      mahadashas: [{ lord: "Venus", level: "mahadasha", start: startISO, end: endISO }],
    };
  }

  it("produces an identical UID for the same absolute instant expressed with three different ISO offsets", () => {
    // All three strings below denote the exact same instant -- simulating three
    // machines in three different timezones computing the identical chart.
    const asUTC = "1974-05-22T00:42:41.000Z";
    const asMinus7 = "1974-05-21T17:42:41.000-07:00";
    const asPlus530 = "1974-05-22T06:12:41.000+05:30";
    const end = "1994-05-22T00:42:41.000Z";

    const uidFor = (startISO: string) =>
      dashaCalendarEvents(buildFakeDasha(startISO, end), { nowISO: "1900-01-01T00:00:00.000Z" }).find((e) =>
        e.uid.startsWith("mahadasha-")
      )!.uid;

    const uidUTC = uidFor(asUTC);
    expect(uidFor(asMinus7)).toBe(uidUTC);
    expect(uidFor(asPlus530)).toBe(uidUTC);
  });

  it("no event's UID contains a raw non-Z timezone offset -- only the compact UTC form", () => {
    const events = dashaCalendarEvents(dasha, { nowISO: "2020-01-01T00:00:00.000Z" });
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.uid, event.uid).not.toMatch(/[+-]\d{2}:?\d{2}@/); // e.g. "-07:00@" or "+0530@"
      expect(event.uid, event.uid).toMatch(/\d{8}T\d{6}Z@jyotish-engine\.local$/);
    }
  });
});

describe("exportDashaICalendar", () => {
  it("produces a complete .ics file with the settings disclosure and correct VEVENT count", () => {
    const ics = exportDashaICalendar(dasha, DEFAULT_ENGINE_SETTINGS, {
      nowISO: "1900-01-01T00:00:00.000Z", // no Pratyantardasha depth -- keep the count small and exact
      generatedAtISO: "2026-01-01T00:00:00.000Z",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("lahiri ayanamsa");
    expect(ics).toContain("mean node");

    const veventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(veventCount).toBe(9 + 81);
  });
});
