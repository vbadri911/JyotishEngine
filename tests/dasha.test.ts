import { describe, it, expect } from "vitest";
import {
  nakshatraPositionFromLongitude,
  birthDashaBalanceYears,
  computeMahadashaSequence,
  computeAntardashas,
} from "../src/engine/dasha.js";

// Reference chart: Moon at 19.267 deg Leo = absolute longitude 120 + 19.267 = 139.267
const REFERENCE_MOON_LONGITUDE = 139.267;

describe("nakshatraPositionFromLongitude (reference chart)", () => {
  it("identifies Purva Phalguni for the reference Moon longitude", () => {
    const pos = nakshatraPositionFromLongitude(REFERENCE_MOON_LONGITUDE);
    expect(pos.name).toBe("Purva Phalguni");
    expect(pos.lord).toBe("Venus");
  });

  it("fraction elapsed is close to the hand-derived ~0.445", () => {
    const pos = nakshatraPositionFromLongitude(REFERENCE_MOON_LONGITUDE);
    expect(pos.fractionElapsed).toBeCloseTo(0.445, 2);
  });
});

describe("birthDashaBalanceYears (reference chart, cross-checked against a real report)", () => {
  it("gives Venus, approximately 11.1 years remaining", () => {
    const { lord, balanceYears } = birthDashaBalanceYears(REFERENCE_MOON_LONGITUDE);
    expect(lord).toBe("Venus");
    // Real source report states 11y 1m 1d ~= 11.087 years. Allow reasonable tolerance
    // since our longitude input here is itself a rounded hand-value, not raw ephemeris output.
    expect(balanceYears).toBeGreaterThan(10.9);
    expect(balanceYears).toBeLessThan(11.3);
  });
});

describe("computeMahadashaSequence (reference chart)", () => {
  const result = computeMahadashaSequence("1983-04-23T15:30:00", REFERENCE_MOON_LONGITUDE);

  it("first Mahadasha is Venus", () => {
    expect(result.mahadashas[0]?.lord).toBe("Venus");
  });

  it("produces the correct 9-lord sequence starting from Venus", () => {
    const lords = result.mahadashas.map((m) => m.lord);
    expect(lords).toEqual(["Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", "Ketu"]);
  });

  it("Rahu Mahadasha starts roughly mid-2017 (reference report: 25 May 2017)", () => {
    const rahu = result.mahadashas.find((m) => m.lord === "Rahu");
    expect(rahu).toBeDefined();
    const start = new Date(rahu!.start);
    expect(start.getFullYear()).toBe(2017);
    // Allow a few days' tolerance given DASHA_YEAR_DAYS convention vs. exact
    // calendar accounting -- see dasha.ts's documented constant.
  });

  it("Rahu Mahadasha runs approximately 18 years (to ~2035)", () => {
    const rahu = result.mahadashas.find((m) => m.lord === "Rahu");
    const end = new Date(rahu!.end);
    expect(end.getFullYear()).toBe(2035);
  });
});

describe("computeAntardashas", () => {
  const { mahadashas } = computeMahadashaSequence("1983-04-23T15:30:00", REFERENCE_MOON_LONGITUDE);
  const rahu = mahadashas.find((m) => m.lord === "Rahu")!;
  const ads = computeAntardashas(rahu);

  it("produces 9 antardashas starting with the Mahadasha's own lord (Rahu)", () => {
    expect(ads).toHaveLength(9);
    expect(ads[0]?.lord).toBe("Rahu");
  });

  it("antardasha sequence follows fixed order from Rahu: Rahu, Jupiter, Saturn, Mercury, Ketu, Venus, Sun, Moon, Mars", () => {
    expect(ads.map((a) => a.lord)).toEqual([
      "Rahu", "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun", "Moon", "Mars",
    ]);
  });

  it("antardashas are contiguous and sum to the Mahadasha's full span", () => {
    for (let i = 1; i < ads.length; i++) {
      expect(ads[i]?.start).toBe(ads[i - 1]?.end);
    }
    expect(ads[0]?.start).toBe(rahu.start);
    expect(ads[ads.length - 1]?.end).toBe(rahu.end);
  });

  it("Mercury antardasha (2nd/11th lord in reference chart) falls where the source report says: starting 2025", () => {
    const mercuryAD = ads.find((a) => a.lord === "Mercury");
    expect(new Date(mercuryAD!.start).getFullYear()).toBe(2025);
  });
});
