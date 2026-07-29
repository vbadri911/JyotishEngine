import { describe, it, expect } from "vitest";
import { navamsaSign, navamsaPart } from "../src/engine/varga.js";

describe("navamsaSign (worked example from references/varga.md)", () => {
  it("Venus at 18.017 deg Taurus -> Gemini (cross-checked against original source chart)", () => {
    expect(navamsaSign("Taurus", 18.017)).toBe("Gemini");
  });

  it("movable sign navamsa starts from itself: Aries 0-3.33 deg -> Aries", () => {
    expect(navamsaSign("Aries", 1)).toBe("Aries");
  });

  it("fixed sign navamsa starts from the precomputed 9th-equivalent: Leo 0-3.33 deg -> Aries", () => {
    expect(navamsaSign("Leo", 1)).toBe("Aries");
  });

  it("dual sign navamsa starts from the precomputed 5th-equivalent: Gemini 0-3.33 deg -> Libra", () => {
    expect(navamsaSign("Gemini", 1)).toBe("Libra");
  });
});

describe("navamsaPart", () => {
  it("18.017 deg falls in part 6 (parts span 3.333 deg each)", () => {
    expect(navamsaPart(18.017)).toBe(6);
  });
  it("0 deg is part 1", () => {
    expect(navamsaPart(0)).toBe(1);
  });
  it("29.99 deg is part 9", () => {
    expect(navamsaPart(29.99)).toBe(9);
  });
});
