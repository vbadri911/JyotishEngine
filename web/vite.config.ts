import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

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
		})
	]
});
