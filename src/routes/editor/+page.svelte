<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  import { Button } from '$lib/components/ui/button';
  import { Alert } from '$lib/components/ui/alert';
  import { invoke } from '@tauri-apps/api/core';
  import { open } from '@tauri-apps/plugin-dialog';
  import { readTextFile } from '@tauri-apps/plugin-fs';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  interface League {
    id: number;
    game_id: number;
    name: string;
    country: string;
    division: number;
    season: number;
    created_at: string;
  }

  interface ImportResult {
    league_id: number;
    teams_imported: number;
    players_imported: number;
  }

  interface Game {
    id: number;
    name: string;
    created_at: string;
  }

  interface AlertState {
    open: boolean;
    title: string;
    message: string;
    variant: 'info' | 'error' | 'success' | 'warning';
  }

  let leagues = $state<League[]>([]);
  let isImporting = $state(false);
  let currentGameId = $state<number | null>(null);
  let alertState = $state<AlertState>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  function showAlert(title: string, message: string, variant: 'info' | 'error' | 'success' | 'warning' = 'error') {
    alertState = { open: true, title, message, variant };
  }

  function closeAlert() {
    alertState = { ...alertState, open: false };
  }

  onMount(async () => {
    try {
      let games = await invoke<Game[]>('get_all_games');
      if (games.length === 0) {
        const newGame = await invoke<Game>('create_game', { name: 'My Game' });
        games = [newGame];
      }
      currentGameId = games[0].id;
      await loadLeagues();
    } catch (error) {
      console.error('Failed to load games:', error);
      showAlert($_('editor.errors.importFailed'), String(error));
    }
  });

  async function loadLeagues() {
    if (!currentGameId) return;

    try {
      leagues = await invoke<League[]>('get_leagues', { gameId: currentGameId });
    } catch (error) {
      console.error('Failed to load leagues:', error);
      showAlert($_('editor.errors.importFailed'), String(error));
    }
  }

  async function handleImport() {
    if (!currentGameId) {
      showAlert($_('editor.errors.noGameSelected'), $_('editor.errors.noGameSelected'));
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });

      if (!selected) return;

      isImporting = true;

      const filePath = selected as string;
      const fileContent = await readTextFile(filePath);

      const result = await invoke<ImportResult>('import_league', {
        gameId: currentGameId,
        jsonContent: fileContent
      });

      showAlert(
        $_('editor.success.importComplete'),
        `${result.teams_imported} teams, ${result.players_imported} players`,
        'success'
      );

      await loadLeagues();
    } catch (error) {
      console.error('Import failed:', error);

      let errorMessage = $_('editor.errors.importFailed');
      if (error && typeof error === 'string') {
        errorMessage += ': ' + error;
      } else if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      }

      showAlert($_('editor.errors.importFailed'), errorMessage);
    } finally {
      isImporting = false;
    }
  }

  function handleBackToMenu() {
    goto('/');
  }

  function handleViewLeague(leagueId: number) {
    goto(`/editor/league/${leagueId}`);
  }
</script>

<Alert
  open={alertState.open}
  title={alertState.title}
  message={alertState.message}
  variant={alertState.variant}
  onClose={closeAlert}
/>

{#if $isLoading}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">Loading...</div>
  </main>
{:else}
  <main class="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-4xl font-bold text-white">{$_('editor.title')}</h1>
      <Button variant="outline" onclick={handleBackToMenu}>
        {$_('editor.backToMenu')}
      </Button>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="rounded-lg bg-slate-800/50 p-6">
        <h2 class="mb-4 text-2xl font-semibold text-white">
          {$_('editor.importSection.title')}
        </h2>
        <p class="mb-6 text-slate-400">
          {$_('editor.importSection.description')}
        </p>
        <Button
          onclick={handleImport}
          disabled={isImporting || !currentGameId}
          class="w-full"
        >
          {#if isImporting}
            Importing...
          {:else}
            {$_('editor.importSection.importButton')}
          {/if}
        </Button>
        {#if !currentGameId}
          <p class="mt-4 text-sm text-yellow-500">
            {$_('editor.errors.noGameSelected')}
          </p>
        {/if}
      </div>

      <div class="rounded-lg bg-slate-800/50 p-6">
        <h2 class="mb-4 text-2xl font-semibold text-white">
          {$_('editor.leaguesSection.title')}
        </h2>
        {#if leagues.length === 0}
          <p class="text-slate-400">{$_('editor.leaguesSection.noLeagues')}</p>
        {:else}
          <div class="space-y-3">
            {#each leagues as league}
              <div class="rounded-md bg-slate-700/50 p-4">
                <h3 class="font-semibold text-white">{league.name}</h3>
                <div class="mt-2 text-sm text-slate-400">
                  <p>{league.country} - Division {league.division}</p>
                  <p>Season: {league.season}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  class="mt-3 w-full"
                  onclick={() => handleViewLeague(league.id)}
                >
                  {$_('editor.leaguesSection.viewLeague')}
                </Button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </main>
{/if}
