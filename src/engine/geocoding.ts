/**
 * Offline place-name -> coordinates lookup. See data/README.md for where
 * data/cities.json comes from (GeoNames cities15000, CC BY 4.0) and
 * DECISIONS.md for how it was obtained in this environment.
 *
 * This resolves only latitude/longitude/IANA zone -- NOT the UTC offset at
 * birth, which needs the birth date (historical timezone resolution,
 * Phase 1 step 4, not yet implemented). See ResolvedLocation in types.ts.
 *
 * data/cities.json is ~5.7MB -- loaded via a dynamic import(), not a static
 * one, so a bundler (Vite, for web/) code-splits it into its own chunk that
 * only loads the first time geocodePlace() is actually called, not eagerly
 * on every page load of every free tool. See DECISIONS.md, 2026-08-07. The
 * index built from it (nameIndex/countryNameToCode) is expensive to build
 * (one pass over every city) and is cached after the first call -- same
 * lazy-init-once pattern as ephemeris.ts's getSwissEphemeris(), not rebuilt
 * per lookup.
 */

interface City {
  id: number;
  name: string;
  asciiname: string;
  altNames: string[];
  country: string;
  admin1: string;
  lat: number;
  lon: number;
  population: number;
  timezone: string;
}

interface GeocodingIndex {
  countryNameToCode: Map<string, string>;
  nameIndex: Map<string, City[]>;
}

function buildIndex(cities: City[], countries: Record<string, string | string[]>): GeocodingIndex {
  // A handful of countries (US, GB, CN, ...) list multiple English names/aliases
  // ("USA", "UK", "China") rather than one -- index all of them.
  const countryNameToCode = new Map<string, string>();
  for (const [code, names] of Object.entries(countries)) {
    for (const name of Array.isArray(names) ? names : [names]) {
      countryNameToCode.set(name.toLowerCase(), code);
    }
  }

  // name (lowercased) -> every city that goes by that name, via name/asciiname/altNames
  const nameIndex = new Map<string, City[]>();
  for (const city of cities) {
    const keys = new Set([city.name, city.asciiname, ...city.altNames].map((n) => n.toLowerCase()));
    for (const key of keys) {
      const bucket = nameIndex.get(key);
      if (bucket) bucket.push(city);
      else nameIndex.set(key, [city]);
    }
  }

  return { countryNameToCode, nameIndex };
}

let indexPromise: Promise<GeocodingIndex> | null = null;

function getGeocodingIndex(): Promise<GeocodingIndex> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const [citiesModule, countriesModule] = await Promise.all([
        import("../../data/cities.json", { with: { type: "json" } }),
        import("../../data/countries.json", { with: { type: "json" } }),
      ]);
      return buildIndex(
        citiesModule.default as City[],
        countriesModule.default as Record<string, string | string[]>
      );
    })();
  }
  return indexPromise;
}

export interface GeocodeMatch {
  placeText: string;
  geonameId: number;
  matchedCityName: string;
  latitude: number;
  longitude: number;
  ianaZone: string;
  country: string;
  population: number;
}

/**
 * Parses free text like "Chennai, Tamil Nadu, India" into a city name and
 * disambiguation hints, matches against the bundled GeoNames cities15000
 * data, and returns the best candidate. Returns null if no city name in the
 * input matches anything in the dataset.
 *
 * KNOWN GAP, tracked in BACKLOG.md: only country-level disambiguation is
 * implemented. State/province (admin1) hints in the input are currently
 * ignored -- ties within a country fall back to population. Each city
 * retains its raw GeoNames admin1 code (`City.admin1`) so this is fixable
 * without re-deriving anything, once the missing admin1-code -> name table
 * is available.
 */
export async function geocodePlace(placeText: string): Promise<GeocodeMatch | null> {
  const parts = placeText.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const { countryNameToCode, nameIndex } = await getGeocodingIndex();

  const cityCandidate = parts[0]!.toLowerCase();
  const hintCountryCode = parts
    .slice(1)
    .map((p) => countryNameToCode.get(p.toLowerCase()))
    .find((code): code is string => code !== undefined);

  const candidates = nameIndex.get(cityCandidate);
  if (!candidates || candidates.length === 0) return null;

  const filtered = hintCountryCode ? candidates.filter((c) => c.country === hintCountryCode) : candidates;
  const pool = filtered.length > 0 ? filtered : candidates;

  const best = pool.reduce((a, b) => (b.population > a.population ? b : a));

  return {
    placeText,
    geonameId: best.id,
    matchedCityName: best.name,
    latitude: best.lat,
    longitude: best.lon,
    ianaZone: best.timezone,
    country: best.country,
    population: best.population,
  };
}
