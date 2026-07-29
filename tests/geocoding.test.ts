import { describe, it, expect } from "vitest";
import { geocodePlace } from "../src/engine/geocoding.js";

describe("geocodePlace", () => {
  it("resolves the golden chart's birth place", () => {
    const result = geocodePlace("Chennai, Tamil Nadu, India");
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(13.08784, 3);
    expect(result!.longitude).toBeCloseTo(80.27847, 3);
    expect(result!.ianaZone).toBe("Asia/Kolkata");
  });

  it("is case-insensitive and works without disambiguation hints", () => {
    const result = geocodePlace("chennai");
    expect(result).not.toBeNull();
    expect(result!.matchedCityName).toBe("Chennai");
  });

  it("uses a country hint to disambiguate same-named cities", () => {
    const result = geocodePlace("London, UK");
    expect(result).not.toBeNull();
    expect(result!.country).toBe("GB");
    expect(result!.ianaZone).toBe("Europe/London");
  });

  it("returns null for unmatched place text", () => {
    expect(geocodePlace("Nonexistentville, Nowhere")).toBeNull();
  });

  it("KNOWN GAP: falls back to population within a country, ignoring state hints", () => {
    // Documents the real limitation in data/README.md and geocoding.ts -- not a
    // desired behavior, a recorded one, so a future fix changes this test on purpose.
    const result = geocodePlace("Springfield, Illinois, USA");
    expect(result!.matchedCityName).toBe("Springfield");
    expect(result!.country).toBe("US");
    expect(result!.latitude).not.toBeCloseTo(39.80172, 1); // actual Springfield, IL
  });
});
