import type { Dignity } from "../types.js";

/**
 * Renders a Dignity value as a natural predicate phrase for use in a
 * standalone sentence -- e.g. "Venus is {predicate} in the 10th house."
 * "own"/"moolatrikona"/"friend"/"neutral"/"enemy" don't read as fluent
 * adjectives on their own ("Venus is own" is not a sentence); "exalted" and
 * "debilitated" already do and are returned unchanged.
 */
export function dignityPredicate(dignity: Dignity): string {
  switch (dignity) {
    case "exalted":
      return "exalted";
    case "debilitated":
      return "debilitated";
    case "own":
      return "in its own sign";
    case "moolatrikona":
      return "in its moolatrikona";
    case "friend":
      return "in a friendly sign";
    case "neutral":
      return "in a neutral sign";
    case "enemy":
      return "in an enemy sign";
    default: {
      const exhaustive: never = dignity;
      throw new Error(`Unreachable: unknown dignity ${exhaustive as string}`);
    }
  }
}
