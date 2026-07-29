/**
 * Minimal RFC 5545 (iCalendar) VCALENDAR/VEVENT builder. Deliberately
 * generic -- knows nothing about dasha, findings, or any astrology --
 * so it's reusable for P7b (Jupiter/Saturn ingress events) later without
 * changes here. Only the subset of RFC 5545 this project actually needs:
 * one-off timed events with a UID, DTSTAMP, DTSTART/DTEND, SUMMARY, and
 * optional DESCRIPTION. No recurrence rules, no alarms, no timezone
 * components (everything is emitted as UTC "Z" time, valid and unambiguous
 * in every calendar app regardless of the app's own configured timezone).
 *
 * Browser-safe by construction: uses TextEncoder for UTF-8 byte-length
 * (needed for correct RFC 5545 line folding), not Node's Buffer -- this
 * project ships client-side.
 */
import { DateTime } from "luxon";

export interface CalendarEvent {
  /** Must be unique within the calendar. Not required to be globally unique
   *  across calendars/exports, but should be stable across re-exports of the
   *  same underlying fact so calendar apps recognize "the same event" rather
   *  than duplicating it on re-import. */
  uid: string;
  /** Any ISO 8601 instant (any offset/zone) -- normalized to UTC internally. */
  startISO: string;
  endISO: string;
  summary: string;
  description?: string;
}

const CRLF = "\r\n";
const FOLD_LIMIT_OCTETS = 75;

/** UTC "Z" datetime in RFC 5545's DATE-TIME form: YYYYMMDDTHHMMSSZ. */
function toICalDateTimeUTC(iso: string): string {
  return DateTime.fromISO(iso).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

/** Escapes TEXT values per RFC 5545 3.3.11: backslash, semicolon, comma, newline. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/**
 * Folds a single content line to RFC 5545's 75-octet limit (not 75
 * characters -- multi-byte UTF-8 characters must not be split across a
 * fold). Continuation lines start with a single space, itself counted
 * against that line's own 75-octet budget.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= FOLD_LIMIT_OCTETS) return line;

  const segments: string[] = [];
  let current = "";
  let currentOctets = 0;
  let budget = FOLD_LIMIT_OCTETS;

  for (const char of line) {
    const charOctets = encoder.encode(char).length;
    if (currentOctets + charOctets > budget) {
      segments.push(current);
      current = "";
      currentOctets = 0;
      budget = FOLD_LIMIT_OCTETS - 1; // continuation lines lose 1 octet to the leading space
    }
    current += char;
    currentOctets += charOctets;
  }
  if (current) segments.push(current);

  return segments.join(`${CRLF} `);
}

export interface BuildICalendarOptions {
  /** RFC 5545 requires PRODID -- a stable string identifying the producer, not a real URL. */
  prodId?: string;
  calendarName?: string;
  /** X-WR-CALDESC -- widely (if not universally) supported extension for a
   *  one-time calendar-level description. Used here for the settings
   *  disclosure (ayanamsa/node type) interpretation.md requires in every
   *  output, without repeating it in every one of ~300 event descriptions. */
  calendarDescription?: string;
  /** DTSTAMP for every event -- when this export was generated. Defaults to
   *  real current time; parameterized so exports stay reproducible in tests. */
  generatedAtISO?: string;
}

export function buildICalendar(events: CalendarEvent[], options: BuildICalendarOptions = {}): string {
  const prodId = options.prodId ?? "-//Jyotish Engine//Dasha Calendar//EN";
  const generatedAt = toICalDateTimeUTC(options.generatedAtISO ?? DateTime.now().toISO()!);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
  ];
  if (options.calendarName) {
    lines.push(`X-WR-CALNAME:${escapeText(options.calendarName)}`);
  }
  if (options.calendarDescription) {
    lines.push(`X-WR-CALDESC:${escapeText(options.calendarDescription)}`);
  }

  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${generatedAt}`);
    lines.push(`DTSTART:${toICalDateTimeUTC(event.startISO)}`);
    lines.push(`DTEND:${toICalDateTimeUTC(event.endISO)}`);
    lines.push(`SUMMARY:${escapeText(event.summary)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldLine).join(CRLF) + CRLF;
}
