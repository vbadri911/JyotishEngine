/**
 * Shared across every export depth that assembles all six domains' narrative
 * text (Essence, Overview, eventually Full) -- one place naming the five
 * `DomainTemplate`-driven domains plus Timing's own `TimingTemplate`, and
 * their display labels, so each depth-specific document builder doesn't
 * re-declare the same five-plus-one shape.
 */
import type { DomainTemplate } from "../narrative/render.js";
import type { TimingTemplate } from "../narrative/timing.js";

export interface SixDomainTemplates {
  career: DomainTemplate;
  wealth: DomainTemplate;
  health: DomainTemplate;
  relationships: DomainTemplate;
  purpose: DomainTemplate;
  timing: TimingTemplate;
}

export const DOMAIN_LABELS: Record<keyof Omit<SixDomainTemplates, "timing">, string> = {
  career: "Career",
  wealth: "Wealth",
  health: "Health",
  relationships: "Relationships",
  purpose: "Purpose",
};
