#!/usr/bin/env node
/**
 * Converts GeoNames' admin1CodesASCII.txt (state/province code -> name) into
 * the compact data/admin1.json this project bundles -- closes geocoding.ts's
 * own documented KNOWN GAP (state/province disambiguation was previously
 * unimplemented because this table didn't exist yet; data/cities.json
 * already retained each city's raw admin1 code for exactly this reason).
 *
 * Unlike cities.json/countries.json (built from third-party npm mirrors
 * because download.geonames.org was unreachable from the original sandboxed
 * build environment -- see data/README.md), this file was fetched directly
 * from GeoNames' own server, reachable from this environment:
 *   curl -o /tmp/admin1CodesASCII.txt https://download.geonames.org/export/dump/admin1CodesASCII.txt
 *
 * Usage: node scripts/build-admin1-data.mjs <path-to-admin1CodesASCII.txt>
 */
import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/build-admin1-data.mjs <path-to-admin1CodesASCII.txt>");
  process.exit(1);
}

const raw = readFileSync(sourcePath, "utf-8");
const lines = raw.split("\n").filter((l) => l.trim().length > 0);

// code is already the full "CC.XX" form (e.g. "US.IL") -- matches
// `${city.country}.${city.admin1}` as built from data/cities.json's own
// separate country/admin1 fields, so no reformatting needed on either side.
const admin1 = {};
for (const line of lines) {
  const [code, name] = line.split("\t");
  admin1[code] = name;
}

writeFileSync(new URL("../data/admin1.json", import.meta.url), JSON.stringify(admin1));
console.log(`Wrote ${Object.keys(admin1).length} admin1 entries to data/admin1.json`);
