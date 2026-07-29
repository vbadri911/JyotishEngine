/**
 * Resolves the UTC offset actually in force at a birth date/time/location --
 * not today's rules. See DECISIONS.md for the full research trail.
 *
 * For almost every IANA zone, this is just what the zone's own historical
 * transition table says, and Node's bundled tzdata (via Luxon) already
 * encodes that correctly, including obscure cases like India's two WWII
 * "war time" +1:00 windows (1941-10-01 to 1942-05-15, 1942-09-01 to
 * 1945-10-15) -- verified directly against the IANA tzdata source, not
 * assumed. See src/engine/timezone.test.ts.
 *
 * Two deliberate exceptions, both India:
 *
 * 1. Before 1906-01-01 (national IST unification), anywhere in India: a
 *    single Asia/Kolkata zone can only encode one lineage of historical
 *    transitions, and IANA's own commentary is explicit that the one it
 *    picked (Kolkata/Madras railway time) does NOT represent true local
 *    civil clocks in other cities during 1870-1906 -- contemporary sources
 *    say Bombay, Calcutta, and Karachi "retained their former time" civilly
 *    even as railways went national. A birth record from this era is a
 *    civil record, not a railway timetable, so this computes true local
 *    mean time from the birth location's own longitude instead of borrowing
 *    Kolkata's specific history.
 *
 * 2. Bombay and Calcutta specifically kept their own OFFICIAL local civil
 *    time well past 1906 -- until 1955 (Bombay) and 1948 (Calcutta)
 *    respectively, per Wikipedia's "Time in India" (Former time zones
 *    table: Bombay Time UTC+04:51 1884-1955, Calcutta Time UTC+05:53:20
 *    1884-1948, both "Official until 1906, later continued" in their city).
 *    That +05:53:20 figure for Calcutta matches IANA tzdata's independently
 *    documented "HMT" value to the second, and both fixed offsets are
 *    within a minute of straightforward longitude-based LMT for each city's
 *    own coordinates -- internally consistent, not an isolated claim, though
 *    this is a tertiary source (Wikipedia) and the exact day/month of each
 *    cutover isn't more precisely dated anywhere found; treat cross-year
 *    precision here as good, single-day precision as unconfirmed.
 */
import { DateTime } from "luxon";

const INDIA_TIME_UNIFICATION_ISO = "1906-01-01";

/** geonameId -> a city's own documented official local time, continued after 1906. See DECISIONS.md. */
const INDIA_EXTENDED_LOCAL_TIME: Record<number, { cityLabel: string; offsetMinutes: number; untilISO: string }> = {
  1275339: { cityLabel: "Bombay (Mumbai)", offsetMinutes: 4 * 60 + 51, untilISO: "1955-01-01" }, // +4:51:00
  1275004: { cityLabel: "Calcutta (Kolkata)", offsetMinutes: 5 * 60 + 53 + 20 / 60, untilISO: "1948-01-01" }, // +5:53:20
};

export interface OffsetResolution {
  utcOffsetMinutes: number;
  historicalTimezoneCaveat?: string;
}

/**
 * @param ianaZone IANA zone id, e.g. "Asia/Kolkata"
 * @param localDateTimeISO local wall-clock date+time, e.g. "1890-03-12T14:30"
 * @param longitude birth location longitude, degrees east positive -- used
 *   for the pre-1906 India exception above
 * @param geonameId the matched city's GeoNames id (GeocodeMatch.geonameId),
 *   if known -- used only to detect Bombay/Calcutta for exception 2 above
 */
export function resolveUtcOffset(
  ianaZone: string,
  localDateTimeISO: string,
  longitude: number,
  geonameId?: number
): OffsetResolution {
  if (ianaZone !== "Asia/Kolkata") {
    const dt = DateTime.fromISO(localDateTimeISO, { zone: ianaZone });
    return { utcOffsetMinutes: dt.offset };
  }

  const extended = geonameId !== undefined ? INDIA_EXTENDED_LOCAL_TIME[geonameId] : undefined;
  if (extended && localDateTimeISO < extended.untilISO) {
    return {
      utcOffsetMinutes: extended.offsetMinutes,
      historicalTimezoneCaveat:
        `${extended.cityLabel} officially kept its own local civil time (distinct from national IST) ` +
        `until ${extended.untilISO} -- used that documented fixed offset rather than national IST or a ` +
        "generic longitude estimate. See DECISIONS.md for sourcing and confidence.",
    };
  }

  if (localDateTimeISO < INDIA_TIME_UNIFICATION_ISO) {
    const utcOffsetMinutes = Math.round(longitude * 4); // 1 degree of longitude = 4 minutes of time
    return {
      utcOffsetMinutes,
      historicalTimezoneCaveat:
        "Birth predates India's 1906-01-01 railway/telegraph time unification to IST. " +
        "Civil clocks were genuinely local before this date, and period sources " +
        "indicate cities kept their own local civil time even after railways adopted " +
        `a national standard in 1870 -- so this location's own true local mean time ` +
        `(from its longitude, ${longitude.toFixed(4)} deg) was used rather than a ` +
        "single national offset. See DECISIONS.md.",
    };
  }

  const dt = DateTime.fromISO(localDateTimeISO, { zone: ianaZone });
  return { utcOffsetMinutes: dt.offset };
}
