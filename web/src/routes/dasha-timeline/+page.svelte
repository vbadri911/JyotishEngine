<script lang="ts">
	import { computeChart } from 'jyotish-engine';
	import {
		computeAntardashas,
		computePratyantardashas,
		findActivePeriod,
		formatUtcDate,
		type BirthInput,
		type DashaComputationResult,
		type DashaPeriod,
		type Graha
	} from 'jyotish-engine/free-tools';
	import BirthInputForm from '$lib/components/BirthInputForm.svelte';

	let dasha = $state<DashaComputationResult | null>(null);
	let error = $state<string | null>(null);
	let pending = $state(false);

	let asOfDate = $state(new Date().toISOString().slice(0, 10));
	let activePeriod = $state<DashaPeriod | null>(null);

	let expandedMdLord = $state<Graha | null>(null);
	let antardashas = $state<DashaPeriod[]>([]);
	let expandedAdLord = $state<Graha | null>(null);
	let pratyantardashas = $state<DashaPeriod[]>([]);

	function collapseAll() {
		expandedMdLord = null;
		antardashas = [];
		expandedAdLord = null;
		pratyantardashas = [];
	}

	function toggleMahadasha(md: DashaPeriod) {
		if (expandedMdLord === md.lord) {
			collapseAll();
			return;
		}
		expandedMdLord = md.lord;
		antardashas = computeAntardashas(md);
		expandedAdLord = null;
		pratyantardashas = [];
	}

	function toggleAntardasha(ad: DashaPeriod) {
		if (expandedAdLord === ad.lord) {
			expandedAdLord = null;
			pratyantardashas = [];
			return;
		}
		expandedAdLord = ad.lord;
		pratyantardashas = computePratyantardashas(ad);
	}

	// Finds whichever Pratyantardasha is active on `asOfDate` and expands the tree down to
	// it -- reuses findActivePeriod() (which returns the deepest period, with a .parent
	// chain back up through Antardasha to Mahadasha) rather than a separate lookup per level.
	// Noon, not midnight, avoids an "as of" date landing exactly on a period boundary.
	function showActiveAsOf() {
		if (!dasha) return;
		const atISO = `${asOfDate}T12:00:00`;
		const active = findActivePeriod(dasha.mahadashas, atISO, 'pratyantardasha');
		activePeriod = active;
		if (!active) {
			collapseAll();
			return;
		}
		const ad = active.parent;
		const md = ad?.parent;
		if (md) {
			expandedMdLord = md.lord;
			antardashas = computeAntardashas(md);
		}
		if (ad) {
			expandedAdLord = ad.lord;
			pratyantardashas = computePratyantardashas(ad);
		}
	}

	async function handleSubmit(input: BirthInput) {
		pending = true;
		error = null;
		dasha = null;
		collapseAll();
		activePeriod = null;
		try {
			const result = await computeChart(input);
			// computeChart() already calls computeMahadashaSequence() internally (via the
			// Moon longitude it just computed) -- reusing its result here rather than
			// re-deriving the same Moon longitude and calling it a second time.
			dasha = result.dasha;
			showActiveAsOf();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			pending = false;
		}
	}
</script>

<h1>Dasha Timeline Viewer</h1>
<p>Vimshottari Mahadasha / Antardasha / Pratyantardasha, computed entirely in your browser.</p>

<BirthInputForm onSubmit={handleSubmit} submitLabel="Compute dasha timeline" {pending} />

{#if error}
	<p class="error">Could not compute this dasha timeline: {error}</p>
{/if}

{#if dasha}
	<section class="result">
		<p class="balance">
			Dasha balance at birth: {dasha.birthBalance.lord}, {dasha.birthBalance.balanceYears.toFixed(
				2
			)} years
		</p>

		<div class="as-of">
			<label for="as-of-date">As of</label>
			<input id="as-of-date" type="date" bind:value={asOfDate} onchange={showActiveAsOf} />
			{#if activePeriod}
				<span class="active-summary">
					Active: {activePeriod.parent?.parent?.lord} MD &rarr; {activePeriod.parent?.lord} AD &rarr;
					{activePeriod.lord} PD
				</span>
			{:else}
				<span class="active-summary">No dasha period found for this date (outside the computed 120-year cycle).</span>
			{/if}
		</div>

		<ul class="tree mahadashas">
			{#each dasha.mahadashas as md (md.lord)}
				<li>
					<button
						class="row"
						class:active={activePeriod?.parent?.parent?.lord === md.lord}
						onclick={() => toggleMahadasha(md)}
					>
						{expandedMdLord === md.lord ? '▾' : '▸'}
						<strong>{md.lord}</strong> Mahadasha -- {formatUtcDate(md.start)} to {formatUtcDate(md.end)}
					</button>

					{#if expandedMdLord === md.lord}
						<ul class="tree antardashas">
							{#each antardashas as ad (ad.lord)}
								<li>
									<button
										class="row"
										class:active={activePeriod?.parent?.lord === ad.lord && activePeriod?.parent?.parent?.lord === md.lord}
										onclick={() => toggleAntardasha(ad)}
									>
										{expandedAdLord === ad.lord ? '▾' : '▸'}
										{ad.lord} Antardasha -- {formatUtcDate(ad.start)} to {formatUtcDate(ad.end)}
									</button>

									{#if expandedAdLord === ad.lord}
										<ul class="tree pratyantardashas">
											{#each pratyantardashas as pd (pd.lord)}
												<li class="row" class:active={activePeriod?.lord === pd.lord && activePeriod?.parent?.lord === ad.lord}>
													{pd.lord} Pratyantardasha -- {formatUtcDate(pd.start)} to {formatUtcDate(pd.end)}
												</li>
											{/each}
										</ul>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.error {
		color: #b00020;
	}
	.result {
		margin-top: 1.5rem;
	}
	.balance {
		font-weight: 600;
	}
	.as-of {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0.75rem 0 1.25rem;
	}
	.as-of input {
		padding: 0.35rem;
	}
	.active-summary {
		font-size: 0.9rem;
		color: #555;
	}
	.tree {
		list-style: none;
		padding-left: 0;
		margin: 0;
	}
	.antardashas,
	.pratyantardashas {
		padding-left: 1.5rem;
	}
	.row {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		font: inherit;
		padding: 0.3rem 0.4rem;
		cursor: pointer;
		border-radius: 3px;
	}
	li > .row {
		cursor: default;
	}
	button.row:hover {
		background: #f0f0f0;
	}
	.row.active {
		background: #fff1e8;
		font-weight: 600;
	}
</style>
