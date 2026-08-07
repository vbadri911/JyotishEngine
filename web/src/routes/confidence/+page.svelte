<script lang="ts">
	import { computeChart } from 'jyotish-engine';
	import type { ChartData, BirthInput, ConfidenceFlagType } from 'jyotish-engine/free-tools';
	import BirthInputForm from '$lib/components/BirthInputForm.svelte';

	// Presentation-only labels for ConfidenceFlagType -- not engine logic, just
	// human-readable headers for the same five flag types confidence.ts defines.
	const FLAG_LABELS: Record<ConfidenceFlagType, string> = {
		ascendant_near_cusp: 'Ascendant near a sign boundary',
		planet_near_cusp: 'Planet near a sign boundary',
		moon_near_nakshatra_boundary: 'Moon near a nakshatra boundary',
		birth_time_approximate_or_unknown: 'Birth time approximate or unknown',
		birth_time_round_number: 'Birth time is a round number'
	};

	let chart = $state<ChartData | null>(null);
	let error = $state<string | null>(null);
	let pending = $state(false);

	async function handleSubmit(input: BirthInput) {
		pending = true;
		error = null;
		chart = null;
		try {
			const result = await computeChart(input);
			// chart.confidenceFlags IS computeConfidenceFlags()'s own output --
			// computeChart() already calls it internally with this exact
			// input/ascendant/planets. Reusing it here rather than calling it a
			// second time for the same input, same reasoning as the dasha
			// timeline viewer's reuse of result.dasha (see DECISIONS.md).
			chart = result.chart;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			pending = false;
		}
	}
</script>

<h1>Birth-Time Confidence Checker</h1>
<p>
	Flags real, chart-specific reasons a birth chart's claims might be sensitive to a small error
	in the recorded birth time -- computed entirely in your browser.
</p>

<BirthInputForm onSubmit={handleSubmit} submitLabel="Check confidence" {pending} />

{#if error}
	<p class="error">Could not compute this chart: {error}</p>
{/if}

{#if chart}
	<section class="result">
		{#if chart.confidenceFlags.length === 0}
			<p class="clear">
				No confidence concerns found for this chart -- the Ascendant and every planet sit clear
				of sign boundaries, the birth time isn't a round number, and the Moon is clear of its
				nakshatra boundary.
			</p>
		{:else}
			<p class="count">
				{chart.confidenceFlags.length} confidence flag{chart.confidenceFlags.length === 1 ? '' : 's'} found:
			</p>
			<ul class="flags">
				{#each chart.confidenceFlags as flag, i (i)}
					<li>
						<strong>{FLAG_LABELS[flag.type]}</strong>
						<p>{flag.message}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<style>
	.error {
		color: #b00020;
	}
	.result {
		margin-top: 1.5rem;
		max-width: 40rem;
	}
	.clear {
		color: #1a7a3c;
	}
	.count {
		font-weight: 600;
	}
	.flags {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.flags li {
		border-left: 3px solid #d97706;
		padding: 0.25rem 0 0.25rem 0.75rem;
	}
	.flags p {
		margin: 0.25rem 0 0;
		color: #444;
	}
</style>
