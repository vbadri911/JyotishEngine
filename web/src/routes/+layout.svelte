<script lang="ts">
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	// Not the SvelteKit generator's own default Svelte-logo favicon -- see
	// scripts/build-pwa-icons.mjs, this project's own actual icon.
	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	let { children } = $props();

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icon-192.png" />
	{@html webManifestLink}
</svelte:head>

{@render children()}
