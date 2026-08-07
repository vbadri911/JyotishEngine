// Every route in this app is static/client-only by design (requirements-spec.md
// SS1/SS3) -- prerendering app-wide is what makes adapter-static emit real,
// directly-servable HTML files (no SPA-fallback rewrite rule needed on the host).
export const prerender = true;
