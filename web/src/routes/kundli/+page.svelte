<script lang="ts">
	import { computeChart } from 'jyotish-engine';
	import {
		renderSouthIndianChartSVG,
		buildD1ChartInput,
		buildD9ChartInput,
		type ChartData,
		type BirthInput,
		type Graha
	} from 'jyotish-engine/free-tools';
	import BirthInputForm from '$lib/components/BirthInputForm.svelte';

	let chart = $state<ChartData | null>(null);
	let error = $state<string | null>(null);
	let pending = $state(false);

	// Real chart computation, client-side only (this handler only ever runs from a
	// user click, never during SvelteKit's prerendering step) -- see
	// requirements-spec.md SS1, the same "computes entirely in-browser" design the
	// Panchang wiring-check page (web/src/routes/+page.svelte) already established.
	async function handleSubmit(input: BirthInput) {
		pending = true;
		error = null;
		chart = null;
		try {
			const result = await computeChart(input);
			chart = result.chart;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			pending = false;
		}
	}

	let chartSvgD1 = $derived(
		chart ? renderSouthIndianChartSVG(buildD1ChartInput(chart), { size: 360, centerText: 'D1\nRasi' }) : null
	);
	let chartSvgD9 = $derived(
		chart ? renderSouthIndianChartSVG(buildD9ChartInput(chart), { size: 360, centerText: 'D9\nNavamsa' }) : null
	);
	let planetOrder: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
</script>

<h1>Kundli Calculator</h1>
<p>South Indian Rasi (D1) and Navamsa (D9) charts, computed entirely in your browser.</p>

<BirthInputForm onSubmit={handleSubmit} submitLabel="Generate chart" {pending} />

{#if error}
	<p class="error">Could not compute this chart: {error}</p>
{/if}

{#if chart}
	<section class="result">
		<p class="ascendant">
			Ascendant: {chart.ascendant.sign} {chart.ascendant.degreeInSign.toFixed(2)}&deg;
		</p>

		<div class="charts">
			<div>{@html chartSvgD1}</div>
			<div>{@html chartSvgD9}</div>
		</div>

		<table>
			<thead>
				<tr>
					<th>Planet</th>
					<th>Sign</th>
					<th>Degree</th>
					<th>House</th>
					<th>Nakshatra / Pada</th>
					<th>Dignity</th>
				</tr>
			</thead>
			<tbody>
				{#each planetOrder as graha (graha)}
					{@const p = chart.planets[graha]}
					<tr>
						<td>{graha}{p.retrograde ? ' (R)' : ''}</td>
						<td>{p.sign}</td>
						<td>{p.degreeInSign.toFixed(2)}&deg;</td>
						<td>{p.house}</td>
						<td>{p.nakshatra} / {p.pada}</td>
						<td>{p.dignity}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

<style>
	.error {
		color: #b00020;
	}
	.result {
		margin-top: 1.5rem;
	}
	.ascendant {
		font-weight: 600;
	}
	.charts {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin: 1rem 0;
	}
	table {
		border-collapse: collapse;
		margin-top: 1rem;
	}
	th,
	td {
		border: 1px solid #ccc;
		padding: 0.35rem 0.6rem;
		text-align: left;
		font-size: 0.9rem;
	}
	th {
		background: #f5f5f5;
	}
</style>
