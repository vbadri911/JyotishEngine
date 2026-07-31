import { DateTime } from "luxon";

/**
 * Formats an ISO instant as a human-readable UTC calendar date (e.g.
 * "6 December 2019") for reader-facing text. `DashaPeriod.start`/`.end`
 * strings carry whatever local offset the running environment happens to
 * have (Luxon's `DateTime.fromISO()` displays in the local system zone
 * unless told otherwise -- see DECISIONS.md's P7a `.ics` UID/DESCRIPTION
 * entries for the same underlying behavior) -- explicitly forcing UTC before
 * formatting here means the SAME chart produces the SAME reader-facing date
 * regardless of which machine renders it, rather than leaking a raw,
 * environment-dependent offset (or worse, a raw ISO string) into prose meant
 * to be read by a person, not a machine.
 */
export function formatUtcDate(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" }).toFormat("d LLLL yyyy");
}
