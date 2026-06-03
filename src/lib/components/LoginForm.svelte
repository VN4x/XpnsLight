<script lang="ts">
  import { login } from '../auth';

  interface Props {
    onSuccess: () => void;
  }

  let { onSuccess }: Props = $props();

  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state('');

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    if (!email.trim() || !password) {
      error = 'Email and password are required.';
      return;
    }
    busy = true;
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed.';
    } finally {
      busy = false;
    }
  }
</script>

<section class="login panel" aria-label="Sign in">
  <h1 class="title-red page-title">XpnsLight</h1>
  <p class="hint">Sign in with your PocketBase user account.</p>

  <form class="login-form" onsubmit={handleSubmit}>
    <div class="field">
      <label class="label" for="login-email">Email</label>
      <input
        id="login-email"
        type="email"
        autocomplete="username"
        bind:value={email}
        required
      />
    </div>
    <div class="field">
      <label class="label" for="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        autocomplete="current-password"
        bind:value={password}
        required
      />
    </div>

    {#if error}
      <p class="status status--error" role="alert">{error}</p>
    {/if}

    <button type="submit" class="btn btn--primary" disabled={busy}>
      {busy ? 'Signing in…' : 'Sign In'}
    </button>
  </form>
</section>

<style>
  .login {
    max-width: 420px;
    margin: 24px auto;
    padding: 20px 18px;
  }

  .page-title {
    font-size: 15px;
    margin-bottom: 8px;
  }

  .hint {
    margin: 0 0 16px;
    color: var(--ink-muted);
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
</style>
