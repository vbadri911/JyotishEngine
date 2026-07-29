import { describe, it, expect } from "vitest";
import { computeChart } from "../../src/index.js";
import { exportDashaICalendar } from "../../src/export/dashaCalendar.js";
import { DEFAULT_ENGINE_SETTINGS } from "../../src/types.js";

describe("P7a: .ics export through the real computeChart() pipeline (golden chart)", () => {
  it("produces a well-formed calendar from real (not synthetic) dasha output", async () => {
    const { dasha } = await computeChart(
      { date: "1983-04-23", time: "15:30", placeText: "Chennai, Tamil Nadu, India", precision: "exact_from_record" },
      DEFAULT_ENGINE_SETTINGS
    );

    const ics = exportDashaICalendar(dasha, DEFAULT_ENGINE_SETTINGS, {
      nowISO: "2026-07-29T00:00:00.000Z", // "today" per this session -- falls inside the computed cycle
      generatedAtISO: "2026-07-29T00:00:00.000Z",
    });

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe((ics.match(/END:VEVENT/g) ?? []).length);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(9 + 81 + 3 * 9 * 9);

    // Every UID must be unique -- calendar apps key on this for de-duplication on re-import.
    const uids = [...ics.matchAll(/UID:(\S+)/g)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(uids.length);

    // The birth Mahadasha (Venus) must appear, using its true back-dated start
    // (see DECISIONS.md's true-start dasha fix) -- not the birth instant.
    const venusMD = ics.match(/UID:mahadasha-Venus-([^\r\n]+)@jyotish-engine\.local/);
    expect(venusMD).not.toBeNull();
    expect(venusMD![1]!.startsWith("1974")).toBe(true); // true start, not 1983 (birth)
  });
});
