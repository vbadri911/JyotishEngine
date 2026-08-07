<script lang="ts">
	import { onMount } from 'svelte';
	import { computePanchang, type PanchangResult } from 'jyotish-engine/free-tools';

	// Golden chart's own birth data (tests/golden-charts/reference-chart-1983.json) -- a
	// real, already-verified case, not a placeholder -- used here only to prove the engine
	// is genuinely reachable and runnable from this app, not to build the real free-tools UI
	// yet (that's separate follow-on work; see BACKLOG.md).
	//
	// Runs client-side only (onMount, never at prerender/build time): this project computes
	// entirely in-browser by design (requirements-spec.md SS1) -- nothing here should execute
	// during SvelteKit's static-build prerendering step, which runs in Node, not a browser.
	let panchang = $state<PanchangResult | null>(null);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			panchang = await computePanchang({
				date: '1983-04-23',
				time: '15:30',
				placeText: 'Chennai, Tamil Nadu, India',
				precision: 'exact_from_record'
			});
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	});
</script>

<h1>Jyotish Engine -- web scaffold</h1>
<p>
	Proves <code>web/</code> can import and run <code>jyotish-engine</code> client-side. This is a
	wiring check, not the real free-tools UI (kundli calculator, Panchang, dasha timeline viewer,
	confidence checker -- see BACKLOG.md).
</p>

<h2>Panchang for the golden chart (1983-04-23, 15:30, Chennai)</h2>
{#if error}
	<p style="color: red">Error: {error}</p>
{:else if panchang}
	<ul>
		<li>Nakshatra: {panchang.nakshatra.name}, pada {panchang.nakshatra.pada}</li>
		<li>Tithi: {panchang.tithi.name} ({panchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} Paksha)</li>
		<li>Yoga: {panchang.yoga.name}</li>
		<li>Karana: {panchang.karana.name}</li>
		<li>Vara: {panchang.vara.name}</li>
	</ul>
	<p>Expected (real Prokerala source): Purva Phalguni pada 2, Ekadashi (Shukla Paksha), Dhruva, Vishti, Shanivara.</p>
{:else}
	<p>Computing...</p>
{/if}
