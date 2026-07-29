import { describe, it, expect } from "vitest";
import { computeRawPositions } from "../../src/engine/ephemeris.js";
import { DEFAULT_ENGINE_SETTINGS, type Graha, type ResolvedLocation } from "../../src/types.js";
import fixture from "./reference-chart-1983.json";

// Chennai coordinates, hand-supplied -- offline geocoding (data/README.md) isn't
// implemented yet, so this bypasses that step to test the ephemeris call directly.
const CHENNAI: ResolvedLocation = {
  placeText: fixture.input.placeText,
  latitude: 13.0827,
  longitude: 80.2707,
  ianaZone: "Asia/Kolkata",
  utcOffsetMinutesAtBirth: 330, // IST, unchanged since 1955 -- no historical caveat for a 1983 birth
};

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

function toSignDegree(longitude: number) {
  const signIndex = Math.floor(longitude / 30);
  return { sign: SIGNS[signIndex], degreeInSign: longitude - signIndex * 30 };
}

const TOLERANCE_ARCMIN = 1;

describe("golden chart: reference-chart-1983 vs real ephemeris output", () => {
  it("computes all 9 planets within stated tolerance", async () => {
    const result = await computeRawPositions(
      { date: fixture.input.date, time: fixture.input.time, placeText: fixture.input.placeText, precision: "exact_from_record" },
      CHENNAI,
      DEFAULT_ENGINE_SETTINGS
    );

    for (const raw of result.planets) {
      const expected = fixture.expected.planets[raw.graha as Graha];
      const { sign, degreeInSign } = toSignDegree(raw.siderealLongitude);
      const deltaArcmin =
        sign === expected.sign ? Math.abs(degreeInSign - expected.degreeInSign) * 60 : Number.POSITIVE_INFINITY;

      // eslint-disable-next-line no-console
      console.log(
        `${raw.graha.padEnd(8)} computed=${sign} ${degreeInSign.toFixed(3)}  expected=${expected.sign} ${expected.degreeInSign}  delta=${deltaArcmin.toFixed(2)}'`
      );

      expect(sign, `${raw.graha} sign mismatch`).toBe(expected.sign);
      expect(
        deltaArcmin,
        `${raw.graha} off by ${deltaArcmin.toFixed(2)}' (tolerance ${TOLERANCE_ARCMIN}') -- see DECISIONS.md Moshier-precision note before treating as a bug`
      ).toBeLessThanOrEqual(TOLERANCE_ARCMIN);
    }
  });

  it("computes the ascendant within stated tolerance", async () => {
    const result = await computeRawPositions(
      { date: fixture.input.date, time: fixture.input.time, placeText: fixture.input.placeText, precision: "exact_from_record" },
      CHENNAI,
      DEFAULT_ENGINE_SETTINGS
    );
    const { sign, degreeInSign } = toSignDegree(result.ascendantSiderealLongitude);
    const expected = fixture.expected.ascendant;
    const deltaArcmin = sign === expected.sign ? Math.abs(degreeInSign - expected.degreeInSign) * 60 : Number.POSITIVE_INFINITY;

    // eslint-disable-next-line no-console
    console.log(`Ascendant computed=${sign} ${degreeInSign.toFixed(3)}  expected=${expected.sign} ${expected.degreeInSign}  delta=${deltaArcmin.toFixed(2)}'`);

    expect(sign).toBe(expected.sign);
    expect(deltaArcmin).toBeLessThanOrEqual(TOLERANCE_ARCMIN);
  });
});
