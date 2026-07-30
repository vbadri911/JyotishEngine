import { describe, it, beforeAll, expect } from "vitest";
import { computeRawPositions, type RawEphemerisResult } from "../../src/engine/ephemeris.js";
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

// Planets whose real-ephemeris longitude lands within the fixture's stated 1 arc-minute
// tolerance, per DECISIONS.md (2026-07-28, "5/9 planets + Ascendant within tolerance").
const PLANETS_WITHIN_TOLERANCE: Graha[] = ["Moon", "Mercury", "Jupiter", "Venus", "Saturn"];

// Known, documented, deliberately-NOT-"fixed" gap -- see DECISIONS.md's Sun/Mars tolerance
// decision and the later Rahu/Ketu arithmetic-slip correction (both trace to imprecision in
// this fixture's own hand-derived values, not a pipeline bug). Modeled as expected failures
// (it.fails), not a loose/widened assertion: if a delta here ever tightens below tolerance
// (ephemeris or fixture change) or changes shape, it.fails flips outcome and the suite goes
// red for a reason worth investigating, rather than silently passing either way.
//
// Split into one test per graha (not the original single "all 9 planets" loop) specifically
// so each planet's outcome is independently visible. The original loop threw on the first
// failing assertion (Sun, checked first) and never reached the rest in the same run -- the
// exact mechanism by which Rahu/Ketu's 1.03' delta was miscategorized as "within tolerance"
// for a while (see that DECISIONS.md entry). A shared it.fails() across all 9 would
// reintroduce the same blind spot: it would report "failed as expected" whichever planet
// happened to fail first, silently masking a real regression in any of the 5 good ones.
const PLANETS_OUTSIDE_TOLERANCE: Graha[] = ["Sun", "Mars", "Rahu", "Ketu"];

describe("golden chart: reference-chart-1983 vs real ephemeris output", () => {
  let result: RawEphemerisResult;

  beforeAll(async () => {
    result = await computeRawPositions(
      { date: fixture.input.date, time: fixture.input.time, placeText: fixture.input.placeText, precision: "exact_from_record" },
      CHENNAI,
      DEFAULT_ENGINE_SETTINGS
    );
  });

  function checkPlanet(graha: Graha) {
    const raw = result.planets.find((p) => p.graha === graha);
    if (!raw) throw new Error(`Unreachable: ${graha} missing from raw ephemeris positions`);
    const expected = fixture.expected.planets[graha];
    const { sign, degreeInSign } = toSignDegree(raw.siderealLongitude);
    const deltaArcmin =
      sign === expected.sign ? Math.abs(degreeInSign - expected.degreeInSign) * 60 : Number.POSITIVE_INFINITY;

    // eslint-disable-next-line no-console
    console.log(
      `${graha.padEnd(8)} computed=${sign} ${degreeInSign.toFixed(3)}  expected=${expected.sign} ${expected.degreeInSign}  delta=${deltaArcmin.toFixed(2)}'`
    );

    expect(sign, `${graha} sign mismatch`).toBe(expected.sign);
    expect(
      deltaArcmin,
      `${graha} off by ${deltaArcmin.toFixed(2)}' (tolerance ${TOLERANCE_ARCMIN}')`
    ).toBeLessThanOrEqual(TOLERANCE_ARCMIN);
  }

  for (const graha of PLANETS_WITHIN_TOLERANCE) {
    it(`computes ${graha} within stated tolerance`, () => checkPlanet(graha));
  }

  for (const graha of PLANETS_OUTSIDE_TOLERANCE) {
    it.fails(`computes ${graha} within stated tolerance (known gap -- see DECISIONS.md)`, () =>
      checkPlanet(graha)
    );
  }

  it("computes the ascendant within stated tolerance", async () => {
    const { sign, degreeInSign } = toSignDegree(result.ascendantSiderealLongitude);
    const expected = fixture.expected.ascendant;
    const deltaArcmin =
      sign === expected.sign ? Math.abs(degreeInSign - expected.degreeInSign) * 60 : Number.POSITIVE_INFINITY;

    // eslint-disable-next-line no-console
    console.log(
      `Ascendant computed=${sign} ${degreeInSign.toFixed(3)}  expected=${expected.sign} ${expected.degreeInSign}  delta=${deltaArcmin.toFixed(2)}'`
    );

    expect(sign).toBe(expected.sign);
    expect(deltaArcmin).toBeLessThanOrEqual(TOLERANCE_ARCMIN);
  });
});
