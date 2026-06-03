<script lang="ts">
  import type { ExpenseInput } from '../types';
  import { VAT_OPTIONS, calculateFromGross, formatMoney, type VatRate } from '../vat';
  import { createExpense } from '../pocketbase';
  import { appendReferenceTag } from '../storage';

  interface Props {
    referenceTags: string[];
    onSaved: (tags: string[]) => void;
    onCancel: () => void;
  }

  let { referenceTags, onSaved, onCancel }: Props = $props();

  let date = $state(new Date().toISOString().slice(0, 10));
  let documentNumber = $state('');
  let vendor = $state('');
  let referenceTag = $state('');
  let grossInput = $state('');
  let vatRate = $state<VatRate>(20);
  let saving = $state(false);
  let error = $state('');

  const grossValue = $derived(parseFloat(grossInput) || 0);
  const breakdown = $derived(calculateFromGross(grossValue, vatRate));

  const tagSuggestions = $derived(referenceTags);

  function validate(): string | null {
    if (!date) return 'Date is required.';
    if (!documentNumber.trim()) return 'Document number is required.';
    if (!vendor.trim()) return 'Vendor name is required.';
    if (!referenceTag.trim()) return 'Reference tag is required.';
    if (!grossInput.trim() || grossValue <= 0) return 'Total gross amount must be greater than zero.';
    return null;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    const validationError = validate();
    if (validationError) {
      error = validationError;
      return;
    }

    const payload: ExpenseInput = {
      date,
      document_number: documentNumber.trim(),
      vendor: vendor.trim(),
      reference_tag: referenceTag.trim(),
      gross_with_vat: breakdown.gross,
      net_zero_vat: breakdown.net,
      vat_amount: breakdown.vat,
      vat_rate: vatRate,
    };

    saving = true;
    try {
      await createExpense(payload);
      const updatedTags = appendReferenceTag(referenceTag.trim(), referenceTags);
      resetForm();
      onSaved(updatedTags);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save expense.';
    } finally {
      saving = false;
    }
  }

  function resetForm() {
    date = new Date().toISOString().slice(0, 10);
    documentNumber = '';
    vendor = '';
    referenceTag = '';
    grossInput = '';
    vatRate = 20;
    error = '';
  }
</script>

<section class="entry overlay" aria-label="New expense entry">
  <header class="entry-header panel">
    <h1 class="title-red page-title">Manual Entry</h1>
    <button type="button" class="close-btn" onclick={onCancel} aria-label="Back to dashboard">
      ← Back
    </button>
  </header>

  <form class="entry-form panel" onsubmit={handleSubmit}>
    <div class="field">
      <label class="label" for="entry-date">Date</label>
      <input id="entry-date" type="date" bind:value={date} required />
    </div>

    <div class="field">
      <label class="label" for="entry-doc">Document Number</label>
      <input
        id="entry-doc"
        type="text"
        bind:value={documentNumber}
        autocomplete="off"
        required
      />
    </div>

    <div class="field">
      <label class="label" for="entry-vendor">Vendor Name</label>
      <input id="entry-vendor" type="text" bind:value={vendor} autocomplete="organization" required />
    </div>

    <div class="field">
      <label class="label" for="entry-tag">Reference Tag</label>
      <input
        id="entry-tag"
        type="text"
        list="tag-suggestions"
        bind:value={referenceTag}
        placeholder="e.g. car, materials, office"
        required
      />
      <datalist id="tag-suggestions">
        {#each tagSuggestions as tag}
          <option value={tag}></option>
        {/each}
      </datalist>
    </div>

    <div class="field">
      <label class="label" for="entry-vat-rate">VAT %</label>
      <select id="entry-vat-rate" bind:value={vatRate}>
        {#each VAT_OPTIONS as rate}
          <option value={rate}>{rate}%</option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label class="label" for="entry-gross">Total Gross Amount (WithVAT)</label>
      <input
        id="entry-gross"
        type="number"
        inputmode="decimal"
        step="0.01"
        min="0"
        bind:value={grossInput}
        placeholder="0.00"
        required
      />
    </div>

    <div class="vat-readout panel panel--dashed" aria-live="polite">
      <div class="vat-row">
        <span>ZeroVAT (Net)</span>
        <strong>{formatMoney(breakdown.net)}</strong>
      </div>
      <div class="vat-row">
        <span>VAT</span>
        <strong>{formatMoney(breakdown.vat)}</strong>
      </div>
      <div class="vat-row vat-row--gross">
        <span>WithVAT (Gross)</span>
        <strong>{formatMoney(breakdown.gross)}</strong>
      </div>
    </div>

    {#if error}
      <p class="status status--error" role="alert">{error}</p>
    {/if}

    <div class="form-actions">
      <button type="submit" class="btn btn--primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save Expense'}
      </button>
      <button type="button" class="btn btn--secondary" onclick={onCancel} disabled={saving}>
        Cancel
      </button>
    </div>
  </form>
</section>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 20;
    background: var(--canvas);
    overflow-y: auto;
    padding: 12px 12px calc(24px + var(--safe-bottom));
    max-width: 520px;
    margin: 0 auto;
  }

  .entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 15px;
  }

  .close-btn {
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 8px 14px;
    font-weight: 700;
    color: var(--ink);
  }

  .entry-form {
    padding: 16px;
  }

  .vat-readout {
    padding: 14px 16px;
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vat-row {
    display: flex;
    justify-content: space-between;
    color: var(--ink-muted);
  }

  .vat-row strong {
    color: var(--ink);
    font-size: 14px;
  }

  .vat-row--gross strong {
    color: var(--accent-red);
  }

  .status {
    margin: 0 0 12px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }

  .status--error {
    border-color: var(--accent-red);
    color: var(--accent-red);
  }

  .form-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
