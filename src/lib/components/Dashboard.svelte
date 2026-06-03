<script lang="ts">
  import type { Expense, VendorSummary } from '../types';
  import { formatMoney } from '../vat';
  import { expensesToCsv } from '../csv';
  import { shareCsvExport } from '../share';

  interface Props {
    expenses: Expense[];
    referenceTags: string[];
    onAdd: () => void;
    onRefresh: () => void;
  }

  let { expenses, referenceTags, onAdd, onRefresh }: Props = $props();

  let startDate = $state('');
  let endDate = $state('');
  let tagFilter = $state('');
  let exportBusy = $state(false);
  let exportError = $state('');

  const filtered = $derived.by(() => {
    return expenses.filter((row) => {
      if (startDate && row.date < startDate) return false;
      if (endDate && row.date > endDate) return false;
      if (tagFilter && row.reference_tag !== tagFilter) return false;
      return true;
    });
  });

  const totalNet = $derived(filtered.reduce((sum, r) => sum + r.net_zero_vat, 0));
  const totalGross = $derived(filtered.reduce((sum, r) => sum + r.gross_with_vat, 0));

  const vendorFeed = $derived.by((): VendorSummary[] => {
    const map = new Map<string, VendorSummary>();
    for (const row of filtered) {
      const key = row.vendor.trim() || '(no vendor)';
      const existing = map.get(key);
      if (existing) {
        existing.netTotal += row.net_zero_vat;
        existing.grossTotal += row.gross_with_vat;
        existing.count += 1;
      } else {
        map.set(key, {
          vendor: key,
          netTotal: row.net_zero_vat,
          grossTotal: row.gross_with_vat,
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.grossTotal - a.grossTotal);
  });

  const tagOptions = $derived.by(() => {
    const fromData = [...new Set(expenses.map((e) => e.reference_tag).filter(Boolean))];
    const merged = [...new Set([...referenceTags, ...fromData])].sort((a, b) =>
      a.localeCompare(b),
    );
    return merged;
  });

  async function handleExport() {
    exportError = '';
    if (filtered.length === 0) {
      exportError = 'No rows to export for current filters.';
      return;
    }
    exportBusy = true;
    try {
      const csv = expensesToCsv(filtered);
      await shareCsvExport(csv);
    } catch (err) {
      exportError = err instanceof Error ? err.message : 'Export failed.';
    } finally {
      exportBusy = false;
    }
  }
</script>

<section class="dashboard">
  <header class="hero panel">
    <h1 class="title-red page-title">Expense Monitor</h1>
    <div class="metrics">
      <div class="metric panel panel--dashed">
        <span class="metric__label">Total Net (ZeroVAT)</span>
        <span class="metric__value">{formatMoney(totalNet)}</span>
      </div>
      <div class="metric panel panel--dashed">
        <span class="metric__label">Total Gross (WithVAT)</span>
        <span class="metric__value">{formatMoney(totalGross)}</span>
      </div>
    </div>
  </header>

  <section class="filters panel" aria-label="Filter bar">
    <h2 class="title-red section-title">Filters</h2>
    <div class="filter-grid">
      <div class="field">
        <label class="label" for="filter-start">Start Date</label>
        <input id="filter-start" type="date" bind:value={startDate} />
      </div>
      <div class="field">
        <label class="label" for="filter-end">End Date</label>
        <input id="filter-end" type="date" bind:value={endDate} />
      </div>
      <div class="field field--full">
        <label class="label" for="filter-tag">Reference Tag</label>
        <select id="filter-tag" bind:value={tagFilter}>
          <option value="">All tags</option>
          {#each tagOptions as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
      </div>
    </div>
    <button type="button" class="btn btn--secondary refresh-btn" onclick={onRefresh}>
      Refresh data
    </button>
  </section>

  <section class="feed panel" aria-label="Vendor spending feed">
    <h2 class="title-red section-title">By Vendor</h2>
    {#if vendorFeed.length === 0}
      <p class="feed-empty">No expenses match the current filters.</p>
    {:else}
      <ul class="feed-list">
        {#each vendorFeed as row}
          <li class="feed-row">
            <span class="feed-vendor">{row.vendor}</span>
            <span class="feed-detail">
              NET {formatMoney(row.netTotal)} · GROSS {formatMoney(row.grossTotal)} · {row.count}
              {row.count === 1 ? 'entry' : 'entries'}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if exportError}
    <p class="status status--error" role="alert">{exportError}</p>
  {/if}

  <footer class="footer">
    <button type="button" class="btn btn--primary" onclick={onAdd}>+ Add New Expense</button>
    <button
      type="button"
      class="btn btn--secondary"
      onclick={handleExport}
      disabled={exportBusy || filtered.length === 0}
    >
      {exportBusy ? 'Exporting…' : 'Export Data'}
    </button>
  </footer>
</section>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 12px calc(140px + var(--safe-bottom));
    max-width: 520px;
    margin: 0 auto;
  }

  .page-title {
    font-size: 15px;
    padding: 14px 18px 0;
  }

  .section-title {
    font-size: 13px;
    margin: 0 0 12px;
  }

  .hero {
    padding-bottom: 14px;
  }

  .metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 10px 14px 16px;
  }

  .metric {
    padding: 18px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 96px;
    justify-content: center;
  }

  .metric__label {
    font-size: 11px;
    color: var(--ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .metric__value {
    font-size: 22px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.1;
  }

  .filters,
  .feed {
    padding: 14px 16px;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .field--full {
    grid-column: 1 / -1;
  }

  .refresh-btn {
    margin-top: 8px;
    padding: 12px;
    font-size: 12px;
  }

  .feed-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .feed-row {
    border-top: 1px solid var(--border-light);
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .feed-row:first-child {
    border-top: none;
    padding-top: 0;
  }

  .feed-vendor {
    font-weight: 700;
    color: var(--ink);
  }

  .feed-detail {
    color: var(--ink-muted);
    font-size: 12px;
  }

  .feed-empty {
    margin: 0;
    color: var(--ink-muted);
  }

  .status {
    margin: 0 12px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
  }

  .status--error {
    border-color: var(--accent-red);
    color: var(--accent-red);
  }

  .footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px 12px calc(12px + var(--safe-bottom));
    background: var(--canvas);
    border-top: var(--border-w) solid var(--accent-red);
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 520px;
    margin: 0 auto;
  }

  @media (min-width: 521px) {
    .footer {
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
    }
  }
</style>
