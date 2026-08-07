# data/

`signs.json` and `nakshatras.json` are complete and hand-verified against
`.claude/skills/jyotish-engine/references/`.

## Offline geocoding data -- DONE (with one open gap, see below)

`cities.json` is a compact conversion of the GeoNames `cities15000` dataset
(26,435 cities, population 15,000+), used by `src/engine/geocoding.ts` for
place-name -> latitude/longitude/IANA-timezone lookup. `countries.json` is a
country-code -> name(s) table used to parse country hints out of free-text
input like "Chennai, Tamil Nadu, India".

**Provenance note**: `download.geonames.org` (the URL this file originally
pointed to) is not reachable from the sandboxed environment this was built
in -- DNS resolution fails for that specific host, though `registry.npmjs.org`
and `raw.githubusercontent.com` are reachable, so this isn't a full network
block, just an allowlist that doesn't include GeoNames' own domain.
`cities15000.txt` was obtained instead via the npm package
[`cities-15000-structured`](https://www.npmjs.com/package/cities-15000-structured)
(MIT-licensed code; that package's own description claims GeoNames CC BY 4.0
data, unmodified -- see `scripts/build-cities-data.mjs`, which converts it to
`cities.json`). **That claim was not independently verified against
GeoNames' own served copy** -- `download.geonames.org`, `api.geonames.org`,
and `www.geonames.org`'s city pages were all unreachable or unusable from
this sandbox for a direct comparison (see `DECISIONS.md` for exactly what
was tried). A spot-check of 4 sample cities against Wikipedia's independent
coordinates matched within normal city-center variance, which supports the
data being real and usable, but is a different, weaker claim than "matches
GeoNames byte-for-byte." `countries.json` came from
[`i18n-iso-countries`](https://www.npmjs.com/package/i18n-iso-countries)
(MIT, ISO 3166-1 standard data), not GeoNames.

**Attribution (required by CC BY 4.0)**: city data (c) GeoNames.org
contributors, licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See this project's
top-level README for the same notice -- both must carry it per the license.

## admin1 (state/province) disambiguation -- DONE (2026-08-07)

`admin1.json` is GeoNames' own `admin1CodesASCII.txt` (3,865 entries,
code -> name, e.g. `"US.IL": "Illinois"`), fetched directly from
`download.geonames.org` -- unlike `cities.json`/`countries.json`, this file
was reachable from THIS environment (a full Claude Code CLI session, not the
originally-sandboxed chat session `cities.json` was built in) via
`scripts/build-admin1-data.mjs`. `geocodePlace()` now disambiguates
same-named cities by state/province first (if a hint matches an admin1
name), then by country, then falls back to population -- previously only
country-level disambiguation existed; see DECISIONS.md for the fix and its
real-data verification (`tests/geocoding.test.ts`: "Springfield, Illinois,
USA" now correctly resolves to Springfield, IL, not the higher-population
Springfield, MO).
