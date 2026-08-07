<script lang="ts">
	import type { BirthInput, BirthTimePrecision } from 'jyotish-engine/free-tools';

	// Shared across all four free tools (kundli calculator, Panchang, dasha timeline
	// viewer, confidence checker) -- every one of them needs the same date/time/place
	// input, per requirements-spec.md SS8. Built here first because the kundli
	// calculator needed it first, not because it's kundli-specific.
	let {
		onSubmit,
		submitLabel = 'Calculate',
		pending = false
	}: {
		onSubmit: (input: BirthInput) => void;
		submitLabel?: string;
		pending?: boolean;
	} = $props();

	let date = $state('');
	let time = $state('');
	let placeText = $state('');
	let precision = $state<BirthTimePrecision>('exact_from_record');

	let canSubmit = $derived(date !== '' && time !== '' && placeText.trim() !== '' && !pending);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		onSubmit({ date, time, placeText: placeText.trim(), precision });
	}
</script>

<form onsubmit={handleSubmit}>
	<div class="field">
		<label for="birth-date">Birth date</label>
		<input id="birth-date" type="date" bind:value={date} required />
	</div>

	<div class="field">
		<label for="birth-time">Birth time</label>
		<input id="birth-time" type="time" bind:value={time} required />
	</div>

	<div class="field">
		<label for="birth-place">Birth place</label>
		<input
			id="birth-place"
			type="text"
			bind:value={placeText}
			placeholder="City, State/Province, Country"
			required
		/>
	</div>

	<div class="field">
		<label for="birth-precision">How exact is the time?</label>
		<select id="birth-precision" bind:value={precision}>
			<option value="exact_from_record">Exact, from a birth record</option>
			<option value="approximate">Approximate (remembered/estimated)</option>
			<option value="unknown">Unknown</option>
		</select>
	</div>

	<button type="submit" disabled={!canSubmit}>{pending ? 'Calculating…' : submitLabel}</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 24rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	label {
		font-size: 0.85rem;
		font-weight: 600;
	}
	input,
	select {
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #999;
		border-radius: 4px;
	}
	button {
		padding: 0.6rem 1rem;
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-radius: 4px;
		background: #ff3e00;
		color: white;
		cursor: pointer;
	}
	button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
</style>
