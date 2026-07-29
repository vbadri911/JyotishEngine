import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only needed by ephemeris-dependent tests (see tests/helpers/wasmFetchPolyfill.ts
    // and DECISIONS.md); applied globally since it's a no-op for the pure-logic suites.
    setupFiles: ["./tests/helpers/wasmFetchPolyfill.ts"],
  },
});
