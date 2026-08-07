import { describe, it, expect } from "vitest";
import {
  tithiFor,
  karanaFor,
  panchangYogaFor,
  nakshatraFor,
  varaFor,
  sunriseJulianDayUT,
  computePanchang,
} from "../src/engine/panchang.js";
import { julianDayUTToUtcISO } from "../src/engine/ephemeris.js";
import { DEFAULT_ENGINE_SETTINGS } from "../src/types.js";
import fixture from "./golden-charts/reference-chart-1983.json";

// Golden chart's own real Sun/Moon absolute sidereal longitude (Aries starts at 0):
// Sun 9deg03' Aries = 9.05, Moon 19deg16' Leo = 4*30 + 19.267 = 139.267
// (tests/golden-charts/sources/reference-chart-1983-prokerala-raw.md, lines 70-79)
const GOLDEN_SUN_LONGITUDE = 9.05;
const GOLDEN_MOON_LONGITUDE = 4 * 30 + 19.267;

// Chennai coordinates, matching data/cities.json's own resolution for "Chennai, Tamil Nadu, India".
const CHENNAI_LATITUDE = 13.0827;
const CHENNAI_LONGITUDE = 80.2707;
const IST_OFFSET_MINUTES = 5.5 * 60;

describe("tithiFor", () => {
  it("matches the golden chart's real Prokerala panchangam: Ekadashi, Shukla Paksha", () => {
    const result = tithiFor(GOLDEN_SUN_LONGITUDE, GOLDEN_MOON_LONGITUDE);
    expect(result.number).toBe(11);
    expect(result.paksha).toBe("shukla");
    expect(result.name).toBe("Ekadashi");
  });

  it("Purnima just before exact opposition, Amavasya just before exact conjunction", () => {
    // diff=175 falls in tithi 15's range [168,180) -- 180 itself is the exact opposition
    // instant, i.e. the boundary where tithi 15 ends and tithi 16 begins (floor semantics).
    expect(tithiFor(0, 175).name).toBe("Purnima");
    expect(tithiFor(0, 175).number).toBe(15);
    // diff=355 falls in tithi 30's range [348,360).
    expect(tithiFor(0, 355).name).toBe("Amavasya");
    expect(tithiFor(0, 355).number).toBe(30);
  });

  it("wraps correctly when Moon is numerically behind Sun (mod 360)", () => {
    // Moon 5 deg, Sun 350 deg -> diff = (5-350) mod 360 = 15 -> tithi 2 (Dwitiya)
    const result = tithiFor(350, 5);
    expect(result.number).toBe(2);
    expect(result.paksha).toBe("shukla");
    expect(result.name).toBe("Dwitiya");
  });

  it("krishna paksha names start over from Pratipada at tithi 16", () => {
    const result = tithiFor(0, 186); // diff 186 -> floor(186/12)+1 = 16
    expect(result.number).toBe(16);
    expect(result.paksha).toBe("krishna");
    expect(result.name).toBe("Pratipada");
  });
});

describe("karanaFor", () => {
  it("matches the golden chart's real Prokerala panchangam: Vishti", () => {
    const result = karanaFor(GOLDEN_SUN_LONGITUDE, GOLDEN_MOON_LONGITUDE);
    expect(result.name).toBe("Vishti");
  });

  it("karana #1 is Kimstughna (the very start of the cycle)", () => {
    expect(karanaFor(0, 0).number).toBe(1);
    expect(karanaFor(0, 0).name).toBe("Kimstughna");
  });

  it("karana #15 is Vishti -- cross-validated against Surya Siddhanta's own worked example (panchang.md)", () => {
    // diff must fall in [84, 90) degrees for karana 15: floor(diff/6)+1=15 -> diff in [84,90)
    const result = karanaFor(0, 85);
    expect(result.number).toBe(15);
    expect(result.name).toBe("Vishti");
  });

  it("karanas #58-60 are the three final fixed karanas: Sakuni, Naga, Chatushpada", () => {
    // diff for #58: [342,348), #59: [348,354), #60: [354,360)
    expect(karanaFor(0, 343).name).toBe("Sakuni");
    expect(karanaFor(0, 349).name).toBe("Naga");
    expect(karanaFor(0, 355).name).toBe("Chatushpada");
  });

  it("the 7-name chara cycle repeats correctly across all 8 repetitions (#2-57)", () => {
    const CHARA = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
    for (let n = 2; n <= 57; n++) {
      const diffStart = (n - 1) * 6; // lower bound of the diff range mapping to karana n
      const result = karanaFor(0, diffStart);
      expect(result.name, `karana #${n}`).toBe(CHARA[(n - 2) % 7]);
    }
  });
});

describe("panchangYogaFor", () => {
  it("matches the golden chart's real Prokerala panchangam: Dhruva", () => {
    const result = panchangYogaFor(GOLDEN_SUN_LONGITUDE, GOLDEN_MOON_LONGITUDE);
    expect(result.number).toBe(12);
    expect(result.name).toBe("Dhruva");
  });

  it("yoga #1 is Vishkambha, #27 is Vaidhriti", () => {
    expect(panchangYogaFor(0, 0).name).toBe("Vishkambha");
    // sum just under 360 -> index 26 -> Vaidhriti
    expect(panchangYogaFor(0, 359).name).toBe("Vaidhriti");
  });
});

describe("nakshatraFor", () => {
  it("matches the golden chart's real Prokerala panchangam: Purva Phalguni, pada 2", () => {
    const result = nakshatraFor(GOLDEN_MOON_LONGITUDE);
    expect(result.name).toBe("Purva Phalguni");
    expect(result.pada).toBe(2);
  });
});

describe("sunriseJulianDayUT", () => {
  it("matches the golden chart's real reported sunrise (Chennai, 1983-04-23, 05:55 AM IST) within a few minutes", () => {
    const sunriseJD = sunriseJulianDayUT("1983-04-23", CHENNAI_LATITUDE, CHENNAI_LONGITUDE, IST_OFFSET_MINUTES);
    const sunriseISO = julianDayUTToUtcISO(sunriseJD);
    const sunriseIST = new Date(new Date(sunriseISO).getTime() + IST_OFFSET_MINUTES * 60_000);
    const hours = sunriseIST.getUTCHours();
    const minutes = sunriseIST.getUTCMinutes();
    const totalMinutesFromMidnight = hours * 60 + minutes;
    const expectedMinutesFromMidnight = 5 * 60 + 55; // 05:55 AM
    expect(Math.abs(totalMinutesFromMidnight - expectedMinutesFromMidnight)).toBeLessThanOrEqual(10);
  });
});

describe("varaFor", () => {
  it("matches the golden chart's real reported weekday: Saturday (birth well after sunrise, no boundary case)", () => {
    // Birth instant: 1983-04-23T15:30 IST = 1983-04-23T10:00:00Z
    const result = varaFor(
      "1983-04-23",
      "1983-04-23T10:00:00.000Z",
      CHENNAI_LATITUDE,
      CHENNAI_LONGITUDE,
      IST_OFFSET_MINUTES
    );
    expect(result.name).toBe("Shanivara"); // Saturday
    expect(result.index).toBe(6);
  });

  it("a birth before local sunrise takes the PRECEDING calendar date's weekday", () => {
    // 1983-04-23's sunrise is ~05:55 IST (~00:25 UTC). A birth at 00:05 UTC same date
    // is before that sunrise -> civil vara should be 1983-04-22 (Friday), not Saturday.
    const result = varaFor(
      "1983-04-23",
      "1983-04-23T00:05:00.000Z",
      CHENNAI_LATITUDE,
      CHENNAI_LONGITUDE,
      IST_OFFSET_MINUTES
    );
    expect(result.name).toBe("Shukravara"); // Friday
  });

  it("a birth after local sunrise on the same date keeps that date's own weekday", () => {
    // Same date, but comfortably after ~00:25 UTC sunrise.
    const result = varaFor(
      "1983-04-23",
      "1983-04-23T02:00:00.000Z",
      CHENNAI_LATITUDE,
      CHENNAI_LONGITUDE,
      IST_OFFSET_MINUTES
    );
    expect(result.name).toBe("Shanivara"); // Saturday
  });
});

describe("computePanchang: real golden-chart pipeline (resolveLocation + computeRawPositions, not hand-supplied coordinates)", () => {
  it("reproduces all four Prokerala-reported panchang elements for the golden chart", async () => {
    const result = await computePanchang(
      {
        date: fixture.input.date,
        time: fixture.input.time,
        placeText: fixture.input.placeText,
        precision: "exact_from_record",
      },
      DEFAULT_ENGINE_SETTINGS
    );

    expect(result.nakshatra.name).toBe("Purva Phalguni");
    expect(result.nakshatra.pada).toBe(2);
    expect(result.tithi.name).toBe("Ekadashi");
    expect(result.tithi.paksha).toBe("shukla");
    expect(result.yoga.name).toBe("Dhruva");
    expect(result.karana.name).toBe("Vishti");
    expect(result.vara.name).toBe("Shanivara"); // Saturday, per the raw source's "Weekday: Saturday"
  });
});
