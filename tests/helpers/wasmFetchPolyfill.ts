/**
 * @swisseph/browser's WASM loader is fetch()-based and browser-only -- it has
 * no Node-native file-read path (see DECISIONS.md). It resolves its default
 * wasm path to a file:// URL, which Node's built-in fetch (undici) cannot
 * read. This patches fetch, for the test run only, to serve file:// URLs
 * from disk; every other URL is passed through unchanged. Real browser
 * deployments never hit this path since http(s) fetch already works there.
 */
import { readFileSync } from "node:fs";

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const href = typeof input === "string" ? input : "href" in input ? input.href : input.url;
  if (href.startsWith("file://")) {
    const buffer = readFileSync(new URL(href));
    return new Response(buffer, { status: 200, headers: { "Content-Type": "application/wasm" } });
  }
  return originalFetch(input as RequestInfo, init);
}) as typeof fetch;
