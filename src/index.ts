/**
 * Pipeline entry point. Wires the stages described in the project spec:
 * Input -> Location -> Ephemeris -> Chart assembly -> Rules/Findings.
 * (Narrative/Document assembly, Phase 5-6, not yet built -- see BACKLOG.md.)
 */
import { DateTime } from "luxon";
import type { BirthInput, ChartData, DashaPeriod, EngineSettings, Finding, Graha, PlanetPosition, SignName } from "./types.js";
import { DEFAULT_ENGINE_SETTINGS } from "./types.js";
import { computeRawPositions, julianDayUTToUtcISO } from "./engine/ephemeris.js";
import { resolveLocation } from "./engine/location.js";
import { assessDignity, assessCombustion } from "./engine/dignity.js";
import { houseOf, houseLord } from "./engine/houses.js";
import {
  nakshatraPositionFromLongitude,
  computeMahadashaSequence,
  findActivePeriod,
  type DashaComputationResult,
} from "./engine/dasha.js";
import { computeConfidenceFlags } from "./engine/confidence.js";
import { detectAllCoreYogas } from "./rules/yogas.js";
import { aggregateFindings } from "./findings/index.js";
import signsData from "../data/signs.json" with { type: "json" };

const SIGN_ORDER = signsData.signs.map((s) => s.name) as SignName[];

// julianDayUTToUtcISO() now lives in ephemeris.ts (engine layer needs it too -- see
// transit.ts) and is re-exported here for existing call sites/tests unchanged.
export { julianDayUTToUtcISO };

function signAndDegree(absoluteSiderealLongitude: number): { sign: SignName; degreeInSign: number } {
  const norm = ((absoluteSiderealLongitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const sign = SIGN_ORDER[signIndex];
  if (!sign) throw new Error(`Unreachable: sign index ${signIndex} out of range`);
  return { sign, degreeInSign: norm - signIndex * 30 };
}

function nakshatraAndPada(absoluteSiderealLongitude: number): { nakshatra: number; pada: number } {
  const nak = nakshatraPositionFromLongitude(absoluteSiderealLongitude);
  return { nakshatra: nak.index + 1, pada: Math.floor(nak.fractionElapsed * 4) + 1 };
}

export async function computeChart(
  input: BirthInput,
  settings: EngineSettings = DEFAULT_ENGINE_SETTINGS
): Promise<{
  chart: ChartData;
  findings: Finding[];
  dasha: DashaComputationResult;
  currentDashaPeriod: DashaPeriod | null;
}> {
  const location = resolveLocation(input);
  if (!location) {
    throw new Error(
      `Could not resolve location for "${input.placeText}" -- see data/README.md and BACKLOG.md ` +
        "for current geocoding coverage and known limitations."
    );
  }

  const raw = await computeRawPositions(input, location, settings);

  const ascendantSD = signAndDegree(raw.ascendantSiderealLongitude);
  const ascendantNak = nakshatraAndPada(raw.ascendantSiderealLongitude);

  const sunRaw = raw.planets.find((p) => p.graha === "Sun");
  if (!sunRaw) throw new Error("Unreachable: Sun missing from raw ephemeris positions");

  const planets = {} as Record<Graha, PlanetPosition>;
  for (const rawPlanet of raw.planets) {
    const sd = signAndDegree(rawPlanet.siderealLongitude);
    const nak = nakshatraAndPada(rawPlanet.siderealLongitude);
    const dignity = assessDignity(rawPlanet.graha, sd.sign, sd.degreeInSign);
    const combustion = assessCombustion(
      rawPlanet.graha,
      rawPlanet.siderealLongitude,
      sunRaw.siderealLongitude,
      rawPlanet.retrograde
    );

    planets[rawPlanet.graha] = {
      graha: rawPlanet.graha,
      siderealLongitude: rawPlanet.siderealLongitude,
      sign: sd.sign,
      degreeInSign: sd.degreeInSign,
      nakshatra: nak.nakshatra,
      pada: nak.pada,
      house: houseOf(ascendantSD.sign, sd.sign),
      retrograde: rawPlanet.retrograde,
      combust: combustion.combust,
      distanceFromSunDegrees: combustion.distanceFromSunDegrees,
      dignity: dignity.dignity,
      exactPointOrbDegrees: dignity.exactPointOrbDegrees,
    };
  }

  const houseLords: ChartData["houseLords"] = {};
  for (let house = 1; house <= 12; house++) {
    const lord = houseLord(ascendantSD.sign, house);
    houseLords[house] = { lord, placedInHouse: planets[lord].house };
  }

  const chart: ChartData = {
    input,
    location,
    settings,
    julianDayUT: raw.julianDayUT,
    ascendant: {
      siderealLongitude: raw.ascendantSiderealLongitude,
      sign: ascendantSD.sign,
      degreeInSign: ascendantSD.degreeInSign,
      nakshatra: ascendantNak.nakshatra,
      pada: ascendantNak.pada,
    },
    planets,
    houseLords,
    confidenceFlags: computeConfidenceFlags(input, ascendantSD, planets),
  };

  const yogaFindings = detectAllCoreYogas(chart);

  const birthInstantUTC = julianDayUTToUtcISO(raw.julianDayUT);
  const dasha = computeMahadashaSequence(birthInstantUTC, planets.Moon.siderealLongitude);

  const nowISO = DateTime.now().toISO()!;
  const currentDashaPeriod = findActivePeriod(dasha.mahadashas, nowISO, "pratyantardasha");
  const findings = aggregateFindings(chart, dasha, yogaFindings, nowISO);

  return { chart, findings, dasha, currentDashaPeriod };
}
