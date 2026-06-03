<script lang="ts">
  import Dashboard from './lib/components/Dashboard.svelte';
  import EntryForm from './lib/components/EntryForm.svelte';
  import type { Expense } from './lib/types';
  import { fetchExpenses } from './lib/pocketbase';
  import { loadReferenceTags } from './lib/storage';

  type View = 'dashboard' | 'entry';

  let view = $state<View>('dashboard');
  let expenses = $state<Expense[]>([]);
  let referenceTags = $state<string[]>(loadReferenceTags());
  let loading = $state(true);
  let loadError = $state('');

  async function loadData() {
    loading = true;
    loadError = '';
    try {
      expenses = await fetchExpenses();
    } catch (err) {
      loadError =
        err instanceof Error
          ? err.message
          : 'Could not load expenses. Check PocketBase URL and network.';
      expenses = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadData();
  });

  function openEntry() {
    view = 'entry';
  }

  function closeEntry() {
    view = 'dashboard';
  }

  async function handleSaved(tags: string[]) {
    referenceTags = tags;
    await loadData();
    view = 'dashboard';
  }
</script>

<main class="app-shell">
  {#if loading && view === 'dashboard'}
    <p class="global-status panel">Loading expenses…</p>
  {:else if loadError && view === 'dashboard'}
    <p class="global-status panel status--error" role="alert">{loadError}</p>
  {/if}

  {#if view === 'dashboard'}
    <Dashboard
      {expenses}
      {referenceTags}
      onAdd={openEntry}
      onRefresh={loadData}
    />
  {:else}
    <EntryForm
      {referenceTags}
      onSaved={handleSaved}
      onCancel={closeEntry}
    />
  {/if}
</main>

<style>
  .app-shell {
    min-height: 100dvh;
  }

  .global-status {
    margin: 12px auto;
    max-width: 496px;
    padding: 12px 16px;
    text-align: center;
  }

  .status--error {
    border-color: var(--accent-red);
    color: var(--accent-red);
  }
</style>
