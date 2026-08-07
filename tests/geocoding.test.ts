import { describe, it, expect } from "vitest";
import { geocodePlace } from "../src/engine/geocoding.js";

describe("geocodePlace", () => {
  it("resolves the golden chart's birth place", async () => {
    const result = await geocodePlace("Chennai, Tamil Nadu, India");
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(13.08784, 3);
    expect(result!.longitude).toBeCloseTo(80.27847, 3);
    expect(result!.ianaZone).toBe("Asia/Kolkata");
  });

  it("is case-insensitive and works without disambiguation hints", async () => {
    const result = await geocodePlace("chennai");
    expect(result).not.toBeNull();
    expect(result!.matchedCityName).toBe("Chennai");
  });

  it("uses a country hint to disambiguate same-named cities", async () => {
    const result = await geocodePlace("London, UK");
    expect(result).not.toBeNull();
    expect(result!.country).toBe("GB");
    expect(result!.ianaZone).toBe("Europe/London");
  });

  it("returns null for unmatched place text", async () => {
    expect(await geocodePlace("Nonexistentville, Nowhere")).toBeNull();
  });

  it("uses a state/province hint to disambiguate same-named cities within a country -- the real Springfield, IL, not the higher-population Springfield, MO", async () => {
    // Previously a KNOWN GAP (data/README.md, this file's own prior comment): admin1
    // hints were parsed but ignored, so this fell back to population and returned
    // Springfield, MO (pop. 166,810) instead of the requested Springfield, IL (pop.
    // 116,565). Fixed once data/admin1.json (GeoNames' own admin1CodesASCII.txt) existed.
    const result = await geocodePlace("Springfield, Illinois, USA");
    expect(result!.matchedCityName).toBe("Springfield");
    expect(result!.country).toBe("US");
    expect(result!.latitude).toBeCloseTo(39.80172, 3); // real Springfield, IL
    expect(result!.longitude).toBeCloseTo(-89.64371, 3);
  });

  it("uses a state hint even without a country hint", async () => {
    const result = await geocodePlace("Springfield, Illinois");
    expect(result!.latitude).toBeCloseTo(39.80172, 3);
  });

  it("falls back to the country hint when the state hint doesn't match any known admin1 name", async () => {
    const result = await geocodePlace("Springfield, Nowhereshire, USA");
    expect(result).not.toBeNull();
    expect(result!.country).toBe("US");
  });
});
