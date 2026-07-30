import { describe, it, expect } from "vitest";
import { findNextSignCrossing } from "../src/engine/transit.js";

/** A synthetic, perfectly linear longitude-at-JD function -- lets the bracket+refine
 *  algorithm be checked against an analytically known crossing instant, fast and
 *  exactly, without touching the real (WASM) ephemeris. Deliberately not normalized
 *  to 0-360 here -- findNextSignCrossing's own signIndexOf() normalizes internally,
 *  so this also exercises that normalization (relevant for the wraparound case below). */
function linearLongitude(fromJulianDayUT: number, startDeg: number, ratePerDay: number) {
  return (jd: number) => startDeg + ratePerDay * (jd - fromJulianDayUT);
}

const FROM_JD = 2_460_000; // arbitrary baseline, no astronomical significance

describe("findNextSignCrossing (synthetic longitude function)", () => {
  it("finds a forward crossing (direct motion) and refines close to the true instant", async () => {
    // Aries (index 0) -> Taurus (index 1) at exactly 30 deg. True crossing at
    // t = (30 - 28.5) / 0.07 = 21.42857... days from FROM_JD.
    const longitude = linearLongitude(FROM_JD, 28.5, 0.07);
    const result = await findNextSignCrossing(longitude, FROM_JD);

    expect(result.fromSignIndex).toBe(0); // Aries
    expect(result.toSignIndex).toBe(1); // Taurus
    const trueCrossingJD = FROM_JD + (30 - 28.5) / 0.07;
    expect(Math.abs(result.julianDayUT - trueCrossingJD)).toBeLessThan(1 / 1440); // within ~1 minute
  });

  it("finds a retrograde (backward motion) crossing back into the prior sign", async () => {
    // Taurus (index 1) -> Aries (index 0), longitude DECREASING over time -- this is
    // the pattern real Jupiter/Saturn retrograde re-entries produce (see DECISIONS.md's
    // P7b entry: Saturn's 2027 retrograde from Aries back into Pisces is exactly this
    // shape). True crossing at t = (30 - 30.6) / -0.055 = 10.9090... days.
    const longitude = linearLongitude(FROM_JD, 30.6, -0.055);
    const result = await findNextSignCrossing(longitude, FROM_JD);

    expect(result.fromSignIndex).toBe(1); // Taurus
    expect(result.toSignIndex).toBe(0); // Aries
    const trueCrossingJD = FROM_JD + (30 - 30.6) / -0.055;
    expect(Math.abs(result.julianDayUT - trueCrossingJD)).toBeLessThan(1 / 1440);
  });

  it("handles the 360/0 wraparound (Pisces -> Aries) without special-casing", async () => {
    // Pisces (index 11, 330-359.99) -> Aries (index 0, 0-29.99) as longitude crosses
    // 360 (equivalently wraps to 0). True crossing at t = (360 - 359.5) / 0.06 = 8.333... days.
    const longitude = linearLongitude(FROM_JD, 359.5, 0.06);
    const result = await findNextSignCrossing(longitude, FROM_JD);

    expect(result.fromSignIndex).toBe(11); // Pisces
    expect(result.toSignIndex).toBe(0); // Aries
    const trueCrossingJD = FROM_JD + (360 - 359.5) / 0.06;
    expect(Math.abs(result.julianDayUT - trueCrossingJD)).toBeLessThan(1 / 1440);
  });

  it("throws rather than searching forever when no crossing occurs within the search window", async () => {
    const stationary = linearLongitude(FROM_JD, 15, 0); // rate 0 -- never crosses anything
    await expect(findNextSignCrossing(stationary, FROM_JD, 5)).rejects.toThrow(/No sign-boundary crossing/);
  });
});
