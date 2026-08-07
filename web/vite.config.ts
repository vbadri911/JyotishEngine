import { readFile } from 'node:fs/promises';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig, type Plugin } from 'vite';

/**
 * Dev-server-only fix for a real Vite/browser interaction, not a workaround for
 * anything in this project's own code: geocoding.ts (jyotish-engine's
 * src/engine/geocoding.ts) dynamically imports data/cities.json and
 * data/countries.json with `{ with: { type: "json" } }` -- required for plain
 * Node to load a dynamic JSON import at all (confirmed directly: Node throws
 * "needs an import attribute of type: json" without it). The production
 * `adapter-static` build handles this fine (Rollup resolves the import at
 * build time, no browser-side attribute checking involved -- confirmed via a
 * real browser session against the built output). Vite's DEV server doesn't:
 * it transforms `.json` requests into JS (`Content-Type: text/javascript`),
 * but the browser's own native ESM loader, told via the import attribute to
 * expect a real JSON module, checks the response's actual Content-Type and
 * rejects the mismatch ("Expected a JSON module script but the server
 * responded with a MIME type of text/javascript") -- confirmed directly in a
 * real dev-server browser session, not assumed from the error text alone.
 * This plugin serves exactly these files as raw JSON (the correct
 * Content-Type, no transform) before Vite's own JSON-to-JS middleware would
 * otherwise claim the request -- registered directly in configureServer
 * (not via its returned callback) so it runs BEFORE Vite's internal
 * middlewares, per Vite's own plugin-ordering documentation.
 *
 * admin1.json added 2026-08-07 alongside geocoding.ts's admin1/state-hint
 * disambiguation fix -- it's dynamically imported with the same import
 * attribute, so it needs the same fix, not a new one.
 */
function rawJsonForImportAttributes(): Plugin {
	const files = ['cities.json', 'countries.json', 'admin1.json'];
	return {
		name: 'raw-json-for-import-attributes',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const url = req.url ?? '';
				const match = files.find((f) => url.includes(f));
				if (!match) return next();
				try {
					const path = new URL(`../data/${match}`, import.meta.url);
					const contents = await readFile(path, 'utf-8');
					res.setHeader('Content-Type', 'application/json');
					res.end(contents);
				} catch {
					next();
				}
			});
		}
	};
}

export default defineConfig({
	server: {
		// jyotish-engine is a `file:..` dependency (Option 1's separate-subdirectory
		// layout, see DECISIONS.md) -- its real files (including @swisseph/browser's
		// swisseph.wasm, itself a nested dependency of the engine, not of web/ directly)
		// resolve outside web/'s own root. Vite's dev server sandboxes filesystem access
		// to its root by default and 403s anything outside it; this allows the repo root.
		fs: { allow: ['..'] }
	},
	plugins: [
		rawJsonForImportAttributes(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-static, not adapter-auto: this app has no server by design (see
			// requirements-spec.md SS1/SS3 -- client-side/zero-retention, static hosting on a
			// free tier). Every route is prerendered (root +layout.ts sets `prerender = true`)
			// rather than using SPA fallback mode, so it works on static hosts that don't
			// support fallback rewrites, not just ones that do.
			adapter: adapter()
		}),
		// @vite-pwa/sveltekit, not plain vite-plugin-pwa directly -- this session
		// already hit several subtle SvelteKit+adapter-static integration gaps
		// (fs.allow, JSON MIME types) that a generic Vite plugin wouldn't know to
		// handle; this one is purpose-built for SvelteKit's own build/output shape.
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['robots.txt'],
			manifest: {
				name: 'Jyotish Engine',
				short_name: 'Jyotish Engine',
				description:
					'Open-source, client-side Vedic (Jyotish) chart tools. Computes entirely in your browser -- no birth data ever leaves your device.',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				background_color: '#1a1a1a',
				theme_color: '#ff3e00',
				icons: [
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				// Precache the app shell (HTML/JS/CSS/icons), but NOT cities.json's
				// ~5.7MB chunk (bundled into a content-hashed .js filename that isn't
				// predictable at config time) -- precaching it here would eagerly
				// download the exact thing geocoding.ts's own lazy-load fix
				// (2026-08-07) exists to avoid. maximumFileSizeToCacheInBytes below
				// 3MB makes Workbox skip it automatically, regardless of filename;
				// showMaximumFileSize...=true keeps that a warning (the pre-0.20.2
				// vite-plugin-pwa default), not a build-failing error, since skipping
				// it is intentional. admin1.json's own chunk (~86KB) is well under
				// this threshold and IS precached -- confirmed directly against the
				// built sw.js, not assumed; harmless at that size, so no special
				// exclusion was added for it.
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
				maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
			},
			showMaximumFileSizeToCacheInBytesWarning: true
		})
	]
});
