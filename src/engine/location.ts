/**
 * Combines geocoding (geocoding.ts) and historical-timezone resolution
 * (timezone.ts) into the full ResolvedLocation downstream code needs.
 */
import type { BirthInput, ResolvedLocation } from "../types.js";
import { geocodePlace } from "./geocoding.js";
import { resolveUtcOffset } from "./timezone.js";

export async function resolveLocation(input: BirthInput): Promise<ResolvedLocation | null> {
  const geo = await geocodePlace(input.placeText);
  if (!geo) return null;

  const { utcOffsetMinutes, historicalTimezoneCaveat } = resolveUtcOffset(
    geo.ianaZone,
    `${input.date}T${input.time}`,
    geo.longitude,
    geo.geonameId
  );

  return {
    placeText: input.placeText,
    latitude: geo.latitude,
    longitude: geo.longitude,
    ianaZone: geo.ianaZone,
    utcOffsetMinutesAtBirth: utcOffsetMinutes,
    ...(historicalTimezoneCaveat !== undefined ? { historicalTimezoneCaveat } : {}),
  };
}
