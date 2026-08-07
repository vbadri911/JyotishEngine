<script lang="ts">
	import { computePanchang, type PanchangResult, type BirthInput } from 'jyotish-engine/free-tools';
	import BirthInputForm from '$lib/components/BirthInputForm.svelte';

	let panchang = $state<PanchangResult | null>(null);
	let error = $state<string | null>(null);
	let pending = $state(false);

	async function handleSubmit(input: BirthInput) {
		pending = true;
		error = null;
		panchang = null;
		try {
			panchang = await computePanchang(input);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			pending = false;
		}
	}

	const PAKSHA_LABEL = { shukla: 'Shukla Paksha', krishna: 'Krishna Paksha' } as const;
</script>

<h1>Panchang</h1>
<p>Tithi, Vara, Karana, Yoga, and Nakshatra for any date/time/place, computed entirely in your browser.</p>

<BirthInputForm onSubmit={handleSubmit} submitLabel="Compute Panchang" {pending} />

{#if error}
	<p class="error">Could not compute this Panchang: {error}</p>
{/if}

{#if panchang}
	<section class="result">
		<dl>
			<dt>Vara (weekday)</dt>
			<dd>{panchang.vara.name}</dd>

			<dt>Tithi</dt>
			<dd>{panchang.tithi.name} ({PAKSHA_LABEL[panchang.tithi.paksha]})</dd>

			<dt>Nakshatra</dt>
			<dd>{panchang.nakshatra.name}, pada {panchang.nakshatra.pada}</dd>

			<dt>Yoga</dt>
			<dd>{panchang.yoga.name}</dd>

			<dt>Karana</dt>
			<dd>{panchang.karana.name}</dd>
		</dl>
		<p class="sunrise">
			Sunrise used for the Vara's civil-day boundary: {panchang.sunriseUtcISO} (UTC)
		</p>
	</section>
{/if}

<style>
	.error {
		color: #b00020;
	}
	.result {
		margin-top: 1.5rem;
		max-width: 28rem;
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.4rem 1rem;
	}
	dt {
		font-weight: 600;
		color: #555;
	}
	dd {
		margin: 0;
	}
	.sunrise {
		margin-top: 1rem;
		font-size: 0.85rem;
		color: #666;
	}
</style>
