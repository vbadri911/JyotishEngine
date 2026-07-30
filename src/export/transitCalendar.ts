/**
 * P7b: .ics export of Jupiter/Saturn sign-ingress events. The search itself
 * lives in src/engine/transit.ts; this module only maps its output onto
 * ics.ts's generic CalendarEvent shape -- unchanged from P7a, exactly as that
 * module's own doc comment anticipated.
 *
 * Unlike dasha, ingresses are NOT birth-chart-specific -- the transiting sky
 * is the same for everyone, so there is no "compute the full cycle once"
 * equivalent. This instead exports a rolling window of UPCOMING ingresses
 * from a given instant (default: real "now") forward, per planet. v1 depth
 * policy: next 3 ingresses per planet -- comfortably covers both a plain
 * permanent entry and the preview/retrograde/permanent three-stage pattern
 * real Jupiter/Saturn transits sometimes show (see DECISIONS.md's P7b
 * validation entry, where exactly this pattern showed up for both planets).
 * Not an unbounded forward search -- revisit the count if real usage wants
 * a longer horizon.
 *
 * Represented as a full-UTC-day timed event (00:00 to the next day's 00:00,
 * UTC) rather than a native RFC 5545 all-day (VALUE=DATE) event: ics.ts's
 * builder only emits timed DATE-TIME events, and this reuses it unchanged
 * rather than adding a second value-type code path for one caller. See
 * DECISIONS.md (P7b design gate) for why the reported precision is the UTC
 * calendar day, not finer, and why that's still a deliberate choice near
 * a midnight-UTC crossing, not an accident of sampling.
 */
import { DateTime } from "luxon";
import type { EngineSettings } from "../types.js";
import {
  findUpcomingSignIngresses,
  nowAsJulianDayUT,
  type SignIngressEvent,
  type TransitGraha,
} from "../engine/transit.js";
import { buildICalendar, type CalendarEvent } from "./ics.js";

const TRANSIT_GRAHAS: TransitGraha[] = ["Jupiter", "Saturn"];
const DEFAULT_INGRESSES_PER_GRAHA = 3;

function toEvent(event: SignIngressEvent): CalendarEvent {
  // event.dateUTC is already UTC-normalized (derived from julianDayUTToUtcISO in
  // transit.ts) -- safe to interpolate directly. Contrast DashaPeriod.start/.end,
  // which carry the *generating machine's* local offset and broke UID/DESCRIPTION
  // in dashaCalendar.ts twice before that was swept properly (see DECISIONS.md).
  const dayStart = DateTime.fromISO(`${event.dateUTC}T00:00:00Z`, { zone: "utc" });
  const dayEnd = dayStart.plus({ days: 1 });
  return {
    uid: `ingress-${event.graha}-${event.dateUTC}@jyotish-engine.local`,
    startISO: dayStart.toISO()!,
    endISO: dayEnd.toISO()!,
    summary: `${event.graha} enters ${event.toSign}`,
    description: `${event.graha} moves from ${event.fromSign} into ${event.toSign} on ${event.dateUTC} (UTC calendar date -- see calendar description for the settings used).`,
  };
}

export interface TransitCalendarOptions {
  /** Search start instant, as a Julian Day (UT). Defaults to real "now";
   *  parameterized for reproducible tests. */
  fromJulianDayUT?: number;
  /** Upcoming ingresses to include per planet. See module doc for the v1 default. */
  ingressesPerGraha?: number;
}

/**
 * Builds the upcoming Jupiter/Saturn ingress events for a given search start.
 * Pure function of (settings, options) -- no chart/birth data involved, since
 * transits aren't birth-chart-specific. See module doc for the depth policy.
 */
export async function transitCalendarEvents(
  settings: Pick<EngineSettings, "ayanamsa">,
  options: TransitCalendarOptions = {}
): Promise<CalendarEvent[]> {
  const fromJulianDayUT = options.fromJulianDayUT ?? nowAsJulianDayUT();
  const count = options.ingressesPerGraha ?? DEFAULT_INGRESSES_PER_GRAHA;

  const events: CalendarEvent[] = [];
  for (const graha of TRANSIT_GRAHAS) {
    const ingresses = await findUpcomingSignIngresses(graha, fromJulianDayUT, settings, count);
    for (const ingress of ingresses) {
      events.push(toEvent(ingress));
    }
  }
  return events;
}

/**
 * Top-level convenience: settings -> a complete, importable .ics file as text.
 * Ayanamsa disclosed once at the calendar level (interpretation.md's settings-
 * disclosure requirement), not per event -- matches exportDashaICalendar's
 * convention. Node type isn't mentioned: it only affects Rahu/Ketu, irrelevant
 * to Jupiter/Saturn's longitude, so including it here would be noise, not disclosure.
 */
export async function exportTransitICalendar(
  settings: EngineSettings,
  options: TransitCalendarOptions & { generatedAtISO?: string } = {}
): Promise<string> {
  const events = await transitCalendarEvents(settings, options);
  return buildICalendar(events, {
    prodId: "-//Jyotish Engine//Transit Calendar//EN",
    calendarName: "Jupiter/Saturn Sign Ingresses",
    calendarDescription: `Upcoming Jupiter/Saturn sidereal sign-ingress dates, reported to the nearest UTC calendar day (see project docs for why not finer). Computed using ${settings.ayanamsa} ayanamsa. Results are not comparable across different ayanamsa settings.`,
    ...(options.generatedAtISO !== undefined ? { generatedAtISO: options.generatedAtISO } : {}),
  });
}
