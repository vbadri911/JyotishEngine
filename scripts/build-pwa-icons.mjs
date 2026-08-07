#!/usr/bin/env node
/**
 * Generates web/'s PWA icons (manifest.webmanifest needs real raster icons,
 * not just a favicon) from a simple, on-brand SVG mark -- a stylized South
 * Indian chart grid, since that's this app's own actual visual identity
 * (the kundli calculator's D1/D9 charts), not a generic placeholder or the
 * Svelte scaffold's own default logo (web/src/lib/assets/favicon.svg, which
 * is the SvelteKit generator's logo, not this project's).
 *
 * Rasterizes via @resvg/resvg-js, already a root devDependency (used
 * elsewhere in this project for chart PNG embedding in DOCX export) -- no
 * new dependency added for this.
 *
 * Usage: node scripts/build-pwa-icons.mjs
 */
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const ORANGE = "#ff3e00"; // same accent color web/'s own UI already uses

// A simple 3x3 grid mark with the center cell filled -- evocative of the
// South Indian chart layout (4x4 grid, 2x2 unused center block) without
// trying to be a literal miniature chart at icon size.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1a1a1a"/>
  <g stroke="${ORANGE}" stroke-width="14" fill="none">
    <rect x="96" y="96" width="320" height="320"/>
    <line x1="202.67" y1="96" x2="202.67" y2="416"/>
    <line x1="309.33" y1="96" x2="309.33" y2="416"/>
    <line x1="96" y1="202.67" x2="416" y2="202.67"/>
    <line x1="96" y1="309.33" x2="416" y2="309.33"/>
  </g>
  <rect x="202.67" y="202.67" width="106.66" height="106.66" fill="${ORANGE}"/>
</svg>
`.trim();

for (const size of [192, 512]) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  writeFileSync(new URL(`../web/static/icon-${size}.png`, import.meta.url), png);
  console.log(`Wrote web/static/icon-${size}.png (${size}x${size})`);
}
