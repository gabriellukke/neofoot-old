<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  import { Button } from '$lib/components/ui/button';
  import { exit } from '@tauri-apps/plugin-process';
  import { goto } from '$app/navigation';

  function handleNewGame() {
    goto('/new-game');
  }

  function handleLoadGame() {
    goto('/load-game');
  }

  function handleTeamEditor() {
    goto('/editor');
  }

  async function handleExit() {
    await exit(0);
  }
</script>

{#if $isLoading}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">Loading...</div>
  </main>
{:else}
  <main class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="mb-12 text-center">
      <h1 class="text-6xl font-bold text-white mb-2">{$_('app.title')}</h1>
      <p class="text-slate-400 text-lg">{$_('app.subtitle')}</p>
    </div>

    <div class="flex flex-col gap-4 w-80">
      <Button
        size="lg"
        class="text-lg py-6"
        onclick={handleNewGame}
      >
        {$_('menu.newGame')}
      </Button>

      <Button
        size="lg"
        class="text-lg py-6"
        variant="outline"
        onclick={handleLoadGame}
      >
        {$_('menu.loadGame')}
      </Button>

      <Button
        size="lg"
        class="text-lg py-6"
        variant="outline"
        onclick={handleTeamEditor}
      >
        {$_('menu.teamEditor')}
      </Button>

      <Button
        size="lg"
        class="text-lg py-6"
        variant="destructive"
        onclick={handleExit}
      >
        {$_('menu.exit')}
      </Button>
    </div>

    <div class="absolute bottom-8 text-slate-500 text-sm">
      {$_('version')}
    </div>
  </main>
{/if}
