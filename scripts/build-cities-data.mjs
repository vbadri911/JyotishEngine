#!/usr/bin/env node
/**
 * Converts a raw GeoNames cities15000.txt dump into the compact
 * data/cities.json this project actually bundles. See data/README.md for
 * where to obtain the source file and CC BY 4.0 attribution requirements.
 *
 * Usage: node scripts/build-cities-data.mjs <path-to-cities15000.txt>
 */
import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/build-cities-data.mjs <path-to-cities15000.txt>");
  process.exit(1);
}

const raw = readFileSync(sourcePath, "utf-8");
const lines = raw.split("\n").filter((l) => l.trim().length > 0);

// Only keep alternate names that are plain ASCII (Latin script) -- the full
// multi-script alternatenames field is enormous and most of it doesn't help
// text-based matching for this project's expected input style ("City, State,
// Country" typed in Latin script). Capped per city to control bundle size.
const ASCII_ONLY = /^[A-Za-z0-9 .'-]+$/;
const MAX_ALT_NAMES = 6;

const cities = lines.map((line) => {
  const cols = line.split("\t");
  const [
    geonameid, name, asciiname, alternatenames, latitude, longitude,
    , , countryCode, , admin1Code, , , , population, , , timezone,
  ] = cols;

  const altSet = new Set();
  for (const alt of alternatenames.split(",")) {
    const trimmed = alt.trim();
    if (trimmed && trimmed !== name && trimmed !== asciiname && ASCII_ONLY.test(trimmed)) {
      altSet.add(trimmed);
      if (altSet.size >= MAX_ALT_NAMES) break;
    }
  }

  return {
    id: Number(geonameid),
    name,
    asciiname,
    altNames: [...altSet],
    country: countryCode,
    admin1: admin1Code,
    lat: Number(latitude),
    lon: Number(longitude),
    population: Number(population),
    timezone,
  };
});

writeFileSync(new URL("../data/cities.json", import.meta.url), JSON.stringify(cities));
console.log(`Wrote ${cities.length} cities to data/cities.json`);
