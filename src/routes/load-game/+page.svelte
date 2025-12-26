<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  import { Button } from '$lib/components/ui/button';
  import { Alert } from '$lib/components/ui/alert';
  import Dialog from '$lib/components/ui/dialog/Dialog.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  interface SavedGameWithTeamName {
    id: number;
    game_id: number;
    save_name: string;
    team_id: number;
    team_name: string;
    current_date: string;
    season: number;
    created_at: string;
    updated_at: string;
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

  let savedGames = $state<SavedGameWithTeamName[]>([]);
  let isLoadingData = $state(true);
  let error = $state<string | null>(null);
  let saveToDelete = $state<SavedGameWithTeamName | null>(null);
  let showDeleteDialog = $state(false);
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
    await loadSavedGames();
  });

  async function loadSavedGames() {
    try {
      isLoadingData = true;
      error = null;

      const allGames = await invoke<Game[]>('get_all_games');
      if (allGames.length === 0) {
        error = $_('loadGame.errors.noGameMessage');
        return;
      }

      savedGames = await invoke<SavedGameWithTeamName[]>('get_saved_games', { 
        gameId: allGames[0].id 
      });
    } catch (err) {
      console.error('Failed to load saved games:', err);
      error = String(err);
    } finally {
      isLoadingData = false;
    }
  }

  function handleBackToMenu() {
    goto('/');
  }

  function handleLoadGame(save: SavedGameWithTeamName) {
    // Navigate to manage page with the saved game's team
    goto(`/manage/${save.team_id}?saveId=${save.id}`);
  }

  function handleDeleteClick(save: SavedGameWithTeamName) {
    saveToDelete = save;
    showDeleteDialog = true;
  }

  function closeDeleteDialog() {
    showDeleteDialog = false;
    saveToDelete = null;
  }

  async function confirmDelete() {
    if (!saveToDelete) return;

    try {
      const success = await invoke<boolean>('delete_saved_game', { id: saveToDelete.id });
      
      if (success) {
        showAlert(
          $_('loadGame.success.deleteComplete'),
          $_('loadGame.success.deleteCompleteMessage'),
          'success'
        );
        await loadSavedGames();
      } else {
        showAlert($_('loadGame.errors.deleteFailed'), $_('loadGame.errors.deleteFailedMessage'));
      }
    } catch (err) {
      console.error('Delete failed:', err);
      showAlert($_('loadGame.errors.deleteFailed'), String(err));
    } finally {
      closeDeleteDialog();
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
</script>

<Alert
  open={alertState.open}
  title={alertState.title}
  message={alertState.message}
  variant={alertState.variant}
  onClose={closeAlert}
/>

<Dialog
  open={showDeleteDialog}
  title={$_('loadGame.deleteDialog.title')}
  onClose={closeDeleteDialog}
>
  {#snippet children()}
    <p class="text-slate-300">
      {$_('loadGame.deleteDialog.message', { values: { saveName: saveToDelete?.save_name || '' } })}
    </p>
  {/snippet}
  {#snippet actions()}
    <Button variant="destructive" onclick={confirmDelete}>
      {$_('loadGame.deleteDialog.confirmButton')}
    </Button>
  {/snippet}
</Dialog>

{#if $isLoading}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">Loading...</div>
  </main>
{:else if isLoadingData}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">Loading saved games...</div>
  </main>
{:else if error}
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="text-center">
      <h1 class="mb-4 text-3xl font-bold text-white">{$_('loadGame.errors.loadFailed')}</h1>
      <p class="text-slate-400 max-w-md">{error}</p>
    </div>
    <Button variant="outline" onclick={handleBackToMenu}>
      {$_('loadGame.backToMenu')}
    </Button>
  </main>
{:else}
  <main class="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-4xl font-bold text-white">{$_('loadGame.title')}</h1>
      <Button variant="outline" onclick={handleBackToMenu}>
        {$_('loadGame.backToMenu')}
      </Button>
    </div>

    {#if savedGames.length === 0}
      <div class="flex flex-col items-center justify-center rounded-lg bg-slate-800/50 p-12 text-center">
        <h2 class="mb-4 text-2xl font-semibold text-white">
          {$_('loadGame.noSaves.title')}
        </h2>
        <p class="mb-6 text-slate-400">
          {$_('loadGame.noSaves.message')}
        </p>
        <Button onclick={handleBackToMenu}>
          {$_('loadGame.backToMenu')}
        </Button>
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each savedGames as save}
          <div class="rounded-lg bg-slate-800/50 p-6 transition-colors hover:bg-slate-800">
            <div class="mb-4">
              <h3 class="text-xl font-semibold text-white">{save.save_name}</h3>
              <p class="mt-1 text-sm text-slate-400">{save.team_name}</p>
            </div>

            <div class="mb-4 space-y-1 text-sm">
              <div class="flex justify-between text-slate-300">
                <span>{$_('loadGame.saveInfo.season')}:</span>
                <span class="font-semibold">{save.season}</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>{$_('loadGame.saveInfo.date')}:</span>
                <span class="font-semibold">{save.current_date}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span class="text-xs">{$_('loadGame.saveInfo.lastPlayed')}:</span>
                <span class="text-xs">{formatDate(save.updated_at)}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <Button
                size="sm"
                class="flex-1"
                onclick={() => handleLoadGame(save)}
              >
                {$_('loadGame.loadButton')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="text-red-400 hover:bg-red-900/50 hover:text-red-300"
                onclick={() => handleDeleteClick(save)}
              >
                {$_('loadGame.deleteButton')}
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
{/if}

