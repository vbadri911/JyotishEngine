import { describe, it, expect } from "vitest";
import { houseOf, signOfHouse, houseLord, aspectedHouses } from "../src/engine/houses.js";

describe("houseOf / signOfHouse (reference chart: Lagna = Leo)", () => {
  const lagna = "Leo" as const;

  it("Leo itself is house 1", () => {
    expect(houseOf(lagna, "Leo")).toBe(1);
  });
  it("Aries (Sun/Mars/Mercury cluster) is house 9 from Leo", () => {
    expect(houseOf(lagna, "Aries")).toBe(9);
  });
  it("Taurus (Venus) is house 10 from Leo", () => {
    expect(houseOf(lagna, "Taurus")).toBe(10);
  });
  it("Libra (Saturn) is house 3 from Leo", () => {
    expect(houseOf(lagna, "Libra")).toBe(3);
  });
  it("Scorpio (Jupiter) is house 4 from Leo", () => {
    expect(houseOf(lagna, "Scorpio")).toBe(4);
  });
  it("Gemini (Rahu) is house 11 from Leo", () => {
    expect(houseOf(lagna, "Gemini")).toBe(11);
  });
  it("Sagittarius (Ketu) is house 5 from Leo", () => {
    expect(houseOf(lagna, "Sagittarius")).toBe(5);
  });
  it("round-trips: signOfHouse(lagna, houseOf(lagna, sign)) === sign", () => {
    expect(signOfHouse(lagna, houseOf(lagna, "Scorpio"))).toBe("Scorpio");
  });
});

describe("houseLord", () => {
  it("2nd house from Leo is Virgo, lord Mercury", () => {
    expect(houseLord("Leo", 2)).toBe("Mercury");
  });
  it("10th house from Leo is Taurus, lord Venus", () => {
    expect(houseLord("Leo", 10)).toBe("Venus");
  });
});

describe("aspectedHouses", () => {
  it("every graha aspects the 7th house from its own position (universal)", () => {
    expect(aspectedHouses("Venus", 10)).toContain(4); // 7th from house 10 wraps to 4
  });
  it("Jupiter additionally aspects 5th and 9th from its own position", () => {
    const houses = aspectedHouses("Jupiter", 4); // reference chart: Jupiter in house 4
    expect(houses).toContain(10); // 7th from 4 (universal)
    expect(houses).toContain(8);  // 5th from 4
    expect(houses).toContain(12); // 9th from 4
  });
  it("Saturn additionally aspects 3rd and 10th from its own position", () => {
    const houses = aspectedHouses("Saturn", 3); // reference chart: Saturn in house 3
    expect(houses).toContain(9);  // 7th from 3 (universal)
    expect(houses).toContain(5);  // 3rd from 3
    expect(houses).toContain(12); // 10th from 3
  });
});
