import { describe, it, expect } from "vitest";
import { buildICalendar, type CalendarEvent } from "../../src/export/ics.js";

const BASE_EVENT: CalendarEvent = {
  uid: "test-1@jyotish-engine.local",
  startISO: "1983-04-23T10:00:00.000Z",
  endISO: "1994-05-22T09:00:00.000Z",
  summary: "Venus Mahadasha",
};

describe("buildICalendar", () => {
  it("produces a well-formed VCALENDAR/VEVENT structure with CRLF line endings", () => {
    const ics = buildICalendar([BASE_EVENT], { generatedAtISO: "2026-01-01T00:00:00.000Z" });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("BEGIN:VEVENT\r\n");
    expect(ics).toContain("END:VEVENT\r\n");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/); // every \n must be preceded by \r
  });

  it("converts a non-UTC ISO instant to correct UTC 'Z' DTSTART/DTEND", () => {
    // 1983-04-23T10:00:00Z with a +05:30 offset embedded should still normalize to the same UTC instant
    const ics = buildICalendar([
      { ...BASE_EVENT, startISO: "1983-04-23T15:30:00.000+05:30" },
    ]);
    expect(ics).toContain("DTSTART:19830423T100000Z");
  });

  it("escapes commas, semicolons, backslashes, and embedded newlines in text fields", () => {
    const ics = buildICalendar([
      {
        ...BASE_EVENT,
        summary: "Rahu, Jupiter; back\\slash",
        description: "line one\nline two",
      },
    ]);
    expect(ics).toContain("SUMMARY:Rahu\\, Jupiter\\; back\\\\slash");
    expect(ics).toContain("DESCRIPTION:line one\\nline two");
  });

  it("folds lines longer than 75 octets, with continuation lines starting with a single space", () => {
    const longSummary = "A".repeat(120);
    const ics = buildICalendar([{ ...BASE_EVENT, summary: longSummary }]);
    const lines = ics.split("\r\n");
    const summaryLineIdx = lines.findIndex((l) => l.startsWith("SUMMARY:"));
    expect(summaryLineIdx).toBeGreaterThan(-1);
    // the physical line immediately after should be a continuation (starts with a space)
    expect(lines[summaryLineIdx + 1]?.startsWith(" ")).toBe(true);
    // no single physical line (as bytes) should exceed 75 octets
    for (const line of lines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("does not fold short lines", () => {
    const ics = buildICalendar([BASE_EVENT]);
    const lines = ics.split("\r\n");
    const summaryLineIdx = lines.findIndex((l) => l.startsWith("SUMMARY:"));
    expect(lines[summaryLineIdx + 1]?.startsWith(" ")).toBe(false);
  });

  it("includes X-WR-CALNAME and X-WR-CALDESC when provided", () => {
    const ics = buildICalendar([BASE_EVENT], { calendarName: "My Calendar", calendarDescription: "A description" });
    expect(ics).toContain("X-WR-CALNAME:My Calendar");
    expect(ics).toContain("X-WR-CALDESC:A description");
  });

  it("omits X-WR-CALNAME/X-WR-CALDESC when not provided", () => {
    const ics = buildICalendar([BASE_EVENT]);
    expect(ics).not.toContain("X-WR-CALNAME");
    expect(ics).not.toContain("X-WR-CALDESC");
  });

  it("uses the same DTSTAMP (generatedAtISO) for every event, not real 'now', when provided", () => {
    const ics = buildICalendar(
      [BASE_EVENT, { ...BASE_EVENT, uid: "test-2@jyotish-engine.local" }],
      { generatedAtISO: "2026-01-01T00:00:00.000Z" }
    );
    const dtstamps = [...ics.matchAll(/DTSTAMP:(\S+)/g)].map((m) => m[1]);
    expect(dtstamps).toHaveLength(2);
    expect(dtstamps[0]).toBe(dtstamps[1]);
    expect(dtstamps[0]).toBe("20260101T000000Z");
  });

  it("produces zero VEVENTs for an empty event list but still a valid (empty) calendar", () => {
    const ics = buildICalendar([]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});
