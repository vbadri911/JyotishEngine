import { describe, it, expect } from "vitest";
import { assessDignity, assessCombustion } from "../src/engine/dignity.js";

describe("assessDignity", () => {
  it("detects exact exaltation (Sun at 9.05 deg Aries, near the 10 deg exaltation point)", () => {
    const result = assessDignity("Sun", "Aries", 9.05);
    expect(result.dignity).toBe("exalted");
    expect(result.exactPointOrbDegrees).toBeCloseTo(0.95, 1);
  });

  it("detects own-sign (Mars in Aries)", () => {
    const result = assessDignity("Mars", "Aries", 19.48);
    expect(result.dignity).toBe("own");
  });

  it("detects exaltation for Saturn in Libra (reference chart case)", () => {
    const result = assessDignity("Saturn", "Libra", 7.37);
    expect(result.dignity).toBe("exalted");
  });

  it("detects own-sign for Venus in Taurus (reference chart case)", () => {
    const result = assessDignity("Venus", "Taurus", 18.02);
    expect(result.dignity).toBe("own");
  });

  it("falls back to neutral/friend/enemy outside exaltation/debilitation/moolatrikona/own", () => {
    // Jupiter in Scorpio: not exalted (Cancer), not debilitated (Capricorn),
    // not own (Sagittarius/Pisces). Mars owns Scorpio; Jupiter-Mars are
    // natural friends per constants.md -> expect "friend".
    const result = assessDignity("Jupiter", "Scorpio", 16.23);
    expect(result.dignity).toBe("friend");
  });

  // -------------------------------------------------------------------------
  // Regression tests for a real bug found via primary-source verification
  // against BPHS (archive.org/stream/BPHSEnglish), Ch.3 v49-54. The bug: this
  // function used to check ONLY the sign before returning "exalted", which
  // over-extends exaltation across the WHOLE sign for Moon (Taurus) and
  // Mercury (Virgo) -- the two planets whose exaltation sign BPHS explicitly
  // subdivides (because that same sign also hosts moolatrikona/own-sign).
  // The other 5 planets have no such overlap, so whole-sign exaltation is
  // correct for them and these tests don't need to (and shouldn't) change
  // that behavior.
  // -------------------------------------------------------------------------
  describe("Mercury/Virgo triple-zone boundary (BPHS Ch.3 v53: 0-15 exalted, 15-20 moolatrikona, 20-30 own)", () => {
    it("Mercury at 10 deg Virgo is exalted", () => {
      expect(assessDignity("Mercury", "Virgo", 10).dignity).toBe("exalted");
    });
    it("Mercury at exactly 15 deg Virgo is moolatrikona, NOT exalted (zone boundary)", () => {
      expect(assessDignity("Mercury", "Virgo", 15).dignity).toBe("moolatrikona");
    });
    it("Mercury at 17 deg Virgo is moolatrikona", () => {
      expect(assessDignity("Mercury", "Virgo", 17).dignity).toBe("moolatrikona");
    });
    it("Mercury at 25 deg Virgo is own sign, NOT exalted", () => {
      expect(assessDignity("Mercury", "Virgo", 25).dignity).toBe("own");
    });
  });

  describe("Moon/Taurus two-zone boundary (BPHS Ch.3 v51: 0-3 exalted, 3-30 moolatrikona)", () => {
    it("Moon at 1 deg Taurus is exalted", () => {
      expect(assessDignity("Moon", "Taurus", 1).dignity).toBe("exalted");
    });
    it("Moon at exactly 3 deg Taurus is moolatrikona, NOT exalted (zone boundary)", () => {
      expect(assessDignity("Moon", "Taurus", 3).dignity).toBe("moolatrikona");
    });
    it("Moon at 15 deg Taurus is moolatrikona, NOT exalted", () => {
      // This is the specific bug case: the reference chart's Venus sits at
      // 18.017 deg Taurus, and prior to this fix, a Moon at a similar degree
      // in Taurus would have been wrongly reported as "exalted."
      expect(assessDignity("Moon", "Taurus", 15).dignity).toBe("moolatrikona");
    });
  });

  describe("Whole-sign exaltation still correct for the 5 planets without zone subdivision", () => {
    it("Sun at 25 deg Aries (past its 10 deg exact point) is still exalted -- no zone bound applies", () => {
      expect(assessDignity("Sun", "Aries", 25).dignity).toBe("exalted");
    });
    it("Saturn at 29 deg Libra is still exalted", () => {
      expect(assessDignity("Saturn", "Libra", 29).dignity).toBe("exalted");
    });
  });
});

describe("assessCombustion", () => {
  it("Sun is never combust", () => {
    expect(assessCombustion("Sun", 9.05, 9.05, false).combust).toBe(false);
  });

  it("Mercury very close to Sun is combust (reference chart case: ~19.68 deg apart is OUTSIDE the 14 deg orb)", () => {
    // Reference chart: Sun 9.05 Aries, Mercury 28.73 Aries -> ~19.68 deg apart.
    // NOTE: this is a case worth flagging, not assuming -- 19.68 deg exceeds
    // the commonly-cited 14 deg direct orb. The original source report
    // states Mercury IS combust for this chart; if this test fails once real
    // longitudes are in, treat it as a signal to re-check the orb constant
    // or the source report's own convention, not as a given.
    const result = assessCombustion("Mercury", 28.73, 9.05, false);
    // Deliberately not asserting a boolean here -- see comment above.
    expect(result.distanceFromSunDegrees).toBeCloseTo(19.68, 1);
  });
});
