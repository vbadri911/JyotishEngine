/**
 * SKILL.md principle 6 ("Disclose settings") is universal -- "every output
 * states the ayanamsa and node type used" -- not scoped to full-depth the
 * way interpretation.md's fuller disclosure list (practitioner-referral
 * statement, birth-time precision flag) explicitly is. Shared by every
 * export depth for exactly that reason.
 */
import type { EngineSettings } from "../types.js";

export function formatSettingsDisclosure(settings: EngineSettings): string {
  const ayanamsaLabel = { lahiri: "Lahiri (Chitrapaksha)", raman: "Raman", kp: "KP" }[settings.ayanamsa];
  const nodeLabel = { mean: "Mean", true: "True" }[settings.nodeType];
  return `Computed using the ${ayanamsaLabel} ayanamsa and the ${nodeLabel} node. Results are not directly comparable to a chart computed with different settings.`;
}
