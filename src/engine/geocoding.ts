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
  /** admin1 name (lowercased) -> full "CC.XX" code, e.g. "illinois" -> "US.IL". */
  admin1NameToCode: Map<string, string>;
  nameIndex: Map<string, City[]>;
}

function buildIndex(
  cities: City[],
  countries: Record<string, string | string[]>,
  admin1: Record<string, string>
): GeocodingIndex {
  // A handful of countries (US, GB, CN, ...) list multiple English names/aliases
  // ("USA", "UK", "China") rather than one -- index all of them.
  const countryNameToCode = new Map<string, string>();
  for (const [code, names] of Object.entries(countries)) {
    for (const name of Array.isArray(names) ? names : [names]) {
      countryNameToCode.set(name.toLowerCase(), code);
    }
  }

  // Rare cross-country admin1-name collisions (e.g. two countries both
  // having a region called the same thing in English) resolve to whichever
  // entry was inserted last -- the same population-tiebreak-style tolerance
  // for imperfect disambiguation this file already accepts elsewhere, not a
  // new category of imprecision.
  const admin1NameToCode = new Map<string, string>();
  for (const [code, name] of Object.entries(admin1)) {
    admin1NameToCode.set(name.toLowerCase(), code);
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

  return { countryNameToCode, admin1NameToCode, nameIndex };
}

let indexPromise: Promise<GeocodingIndex> | null = null;

function getGeocodingIndex(): Promise<GeocodingIndex> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const [citiesModule, countriesModule, admin1Module] = await Promise.all([
        import("../../data/cities.json", { with: { type: "json" } }),
        import("../../data/countries.json", { with: { type: "json" } }),
        import("../../data/admin1.json", { with: { type: "json" } }),
      ]);
      return buildIndex(
        citiesModule.default as City[],
        countriesModule.default as Record<string, string | string[]>,
        admin1Module.default as Record<string, string>
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
 * Disambiguates by state/province (admin1) first if a hint matches one
 * (`data/admin1.json`, GeoNames' own admin1CodesASCII.txt), then by country
 * if not, then falls back to population -- previously only country-level
 * disambiguation existed (tracked as a KNOWN GAP in BACKLOG.md/data/
 * README.md until this admin1 table existed to fix it; `City.admin1`
 * already carried each city's raw code for exactly this reason).
 */
export async function geocodePlace(placeText: string): Promise<GeocodeMatch | null> {
  const parts = placeText.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const { countryNameToCode, admin1NameToCode, nameIndex } = await getGeocodingIndex();

  const cityCandidate = parts[0]!.toLowerCase();
  const hints = parts.slice(1).map((p) => p.toLowerCase());
  const hintCountryCode = hints.map((h) => countryNameToCode.get(h)).find((code): code is string => code !== undefined);
  const hintAdmin1Code = hints.map((h) => admin1NameToCode.get(h)).find((code): code is string => code !== undefined);

  const candidates = nameIndex.get(cityCandidate);
  if (!candidates || candidates.length === 0) return null;

  const admin1Filtered = hintAdmin1Code
    ? candidates.filter((c) => `${c.country}.${c.admin1}` === hintAdmin1Code)
    : [];
  const countryFiltered = hintCountryCode ? candidates.filter((c) => c.country === hintCountryCode) : [];
  const pool = admin1Filtered.length > 0 ? admin1Filtered : countryFiltered.length > 0 ? countryFiltered : candidates;

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
