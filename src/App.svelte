<script lang="ts">
  import Dashboard from './lib/components/Dashboard.svelte';
  import EntryForm from './lib/components/EntryForm.svelte';
  import LoginForm from './lib/components/LoginForm.svelte';
  import type { Expense } from './lib/types';
  import { fetchExpenses, pb } from './lib/pocketbase';
  import { isAuthenticated, logout } from './lib/auth';
  import { loadReferenceTags } from './lib/storage';

  type View = 'dashboard' | 'entry';

  let authed = $state(isAuthenticated());
  let view = $state<View>('dashboard');
  let expenses = $state<Expense[]>([]);
  let referenceTags = $state<string[]>(loadReferenceTags());
  let loading = $state(false);
  let loadError = $state('');

  $effect(() => {
    return pb.authStore.onChange(() => {
      authed = isAuthenticated();
      if (!authed) {
        expenses = [];
        view = 'dashboard';
      }
    });
  });

  async function loadData() {
    if (!authed) return;
    loading = true;
    loadError = '';
    try {
      expenses = await fetchExpenses();
    } catch (err) {
      loadError =
        err instanceof Error
          ? err.message
          : 'Could not load expenses. Check HTTPS URL, auth, and network.';
      expenses = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (authed) {
      loadData();
    }
  });

  function handleLoginSuccess() {
    authed = true;
    loadData();
  }

  function handleLogout() {
    logout();
    authed = false;
    expenses = [];
    view = 'dashboard';
  }

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
  {#if !authed}
    <LoginForm onSuccess={handleLoginSuccess} />
  {:else if loading && view === 'dashboard'}
    <p class="global-status panel">Loading expenses…</p>
  {:else if loadError && view === 'dashboard'}
    <p class="global-status panel status--error" role="alert">{loadError}</p>
  {/if}

  {#if authed}
    {#if view === 'dashboard'}
      <Dashboard
        {expenses}
        {referenceTags}
        onAdd={openEntry}
        onRefresh={loadData}
        onLogout={handleLogout}
      />
    {:else}
      <EntryForm
        {referenceTags}
        onSaved={handleSaved}
        onCancel={closeEntry}
      />
    {/if}
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
