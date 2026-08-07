// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// Type declarations for the virtual:pwa-info / virtual:pwa-register modules
// @vite-pwa/sveltekit's SvelteKitPWA plugin provides (used in +layout.svelte).
// client.d.ts covers virtual:pwa-register; info.d.ts (virtual:pwa-info) isn't
// re-exported from there, so both are referenced explicitly.
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
