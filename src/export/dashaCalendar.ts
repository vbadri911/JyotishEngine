/**
 * P7a: .ics export of dasha/Antardasha/Pratyantardasha transitions.
 * See BACKLOG.md -- P7b (Jupiter/Saturn transit ingress detection) is a
 * separate, not-yet-started unit; nothing here anticipates it.
 *
 * Depth policy (Mahadasha/Antardasha: full 120-year cycle; Pratyantardasha:
 * current Mahadasha + next two only) follows
 * .claude/skills/jyotish-engine/references/dasha.md's own documented
 * guidance verbatim: "Compute [Pratyantardasha] to this depth for at least
 * the current and next two Mahadashas... deeper computation... is a
 * reasonable v1 deferral." Not a new policy invented for this export --
 * the same depth this project already treats as correct everywhere else.
 * Full depth for all 9 Mahadashas would be 9 + 81 + 729 = 819 events; this
 * scoping gives 9 + 81 + (up to 3 x 9 x 9 = 243) = up to 333.
 */
import { DateTime } from "luxon";
import type { DashaPeriod } from "../types.js";
import type { DashaComputationResult } from "../engine/dasha.js";
import { computeAntardashas, computePratyantardashas, findActivePeriod } from "../engine/dasha.js";
import { buildICalendar, type CalendarEvent } from "./ics.js";
import type { EngineSettings } from "../types.js";

function summaryFor(period: DashaPeriod): string {
  if (period.level === "mahadasha") {
    return `${period.lord} Mahadasha`;
  }
  if (period.level === "antardasha") {
    const md = period.parent!;
    return `${period.lord} Antardasha (${md.lord} Mahadasha)`;
  }
  const ad = period.parent!;
  const md = ad.parent!;
  return `${period.lord} Pratyantardasha (${ad.lord} Antardasha / ${md.lord} Mahadasha)`;
}

/** UTC, deterministic regardless of the running environment's local timezone --
 *  period.start/end are ISO strings that carry whatever offset Luxon's default
 *  toISO() picked at computation time (system-local, not UTC; see DECISIONS.md's
 *  julianDayUTToUtcISO() note for the same underlying Luxon behavior), so
 *  interpolating them directly into human-readable text would make DESCRIPTION
 *  non-reproducible across environments even though DTSTART/DTEND (built via
 *  ics.ts's own UTC normalization) already are. */
function formatUTC(iso: string): string {
  return DateTime.fromISO(iso).toUTC().toFormat("yyyy-MM-dd HH:mm 'UTC'");
}

function toEvent(period: DashaPeriod): CalendarEvent {
  return {
    uid: `${period.level}-${period.lord}-${period.start}@jyotish-engine.local`,
    startISO: period.start,
    endISO: period.end,
    summary: summaryFor(period),
    description: `${period.level} period, ${formatUTC(period.start)} to ${formatUTC(period.end)}.`,
  };
}

export interface DashaCalendarOptions {
  /** Determines which Mahadasha counts as "current" for Pratyantardasha-depth
   *  scoping. Defaults to real current time; parameterized for reproducible tests. */
  nowISO?: string;
}

/**
 * Builds the full list of dasha-transition calendar events for a computed
 * dasha sequence. Pure function of (dasha, nowISO) -- see module doc for the
 * depth policy.
 */
export function dashaCalendarEvents(dasha: DashaComputationResult, options: DashaCalendarOptions = {}): CalendarEvent[] {
  const nowISO = options.nowISO ?? DateTime.now().toISO()!;
  const events: CalendarEvent[] = [];

  for (const md of dasha.mahadashas) {
    events.push(toEvent(md));
    for (const ad of computeAntardashas(md)) {
      events.push(toEvent(ad));
    }
  }

  const currentMD = findActivePeriod(dasha.mahadashas, nowISO, "mahadasha");
  if (currentMD) {
    const idx = dasha.mahadashas.indexOf(currentMD);
    const targetMDs = dasha.mahadashas.slice(idx, idx + 3);
    for (const md of targetMDs) {
      for (const ad of computeAntardashas(md)) {
        for (const pd of computePratyantardashas(ad)) {
          events.push(toEvent(pd));
        }
      }
    }
  }
  // If nowISO falls outside the computed 120-year cycle (no active Mahadasha),
  // Pratyantardasha-depth events are simply omitted -- Mahadasha/Antardasha
  // events above are unaffected, since those don't depend on "now" at all.

  return events;
}

/**
 * Top-level convenience: dasha data -> a complete, importable .ics file as text.
 * Settings (ayanamsa/node type) are disclosed once at the calendar level, not
 * repeated per event -- per-event descriptions would bloat a ~300-event file
 * for no benefit, and the settings apply uniformly to every event in it.
 */
export function exportDashaICalendar(
  dasha: DashaComputationResult,
  settings: EngineSettings,
  options: DashaCalendarOptions & { generatedAtISO?: string } = {}
): string {
  const events = dashaCalendarEvents(dasha, options);
  return buildICalendar(events, {
    prodId: "-//Jyotish Engine//Dasha Calendar//EN",
    calendarName: "Vimshottari Dasha Timeline",
    // interpretation.md's "Confidence disclosures" requires ayanamsa/node convention
    // in every output -- disclosed once here rather than per event (see module doc).
    calendarDescription: `Vimshottari Dasha transitions (Mahadasha/Antardasha for the full cycle; Pratyantardasha for the current Mahadasha and the next two). Computed using ${settings.ayanamsa} ayanamsa, ${settings.nodeType} node. Results are not comparable across different settings.`,
    ...(options.generatedAtISO !== undefined ? { generatedAtISO: options.generatedAtISO } : {}),
  });
}
