<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  import { Button } from '$lib/components/ui/button';
  import { Alert } from '$lib/components/ui/alert';
  import { invoke } from '@tauri-apps/api/core';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  interface League {
    id: number;
    game_id: number;
    name: string;
    country: string;
    division: number;
    season: number;
    created_at: string;
  }

  interface Team {
    id: number;
    league_id: number;
    name: string;
    short_name: string;
    stadium_name: string;
    stadium_capacity: number;
    budget: number;
    reputation: number;
    created_at: string;
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

  let league = $state<League | null>(null);
  let teams = $state<Team[]>([]);
  let isLoadingData = true;
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
    await loadLeagueData();
  });

  async function loadLeagueData() {
    try {
      isLoadingData = true;

      const allGames = await invoke<Game[]>('get_all_games');
      if (allGames.length === 0) {
        showAlert($_('league.errors.noGame'), $_('league.errors.noGameMessage'));
        setTimeout(() => goto('/editor'), 2000);
        return;
      }

      const allLeagues = await invoke<League[]>('get_leagues', {
        gameId: allGames[0].id
      });

      league = allLeagues.find(l => l.id === data.leagueId) || null;

      if (!league) {
        showAlert($_('league.errors.notFound'), $_('league.errors.notFoundMessage'));
        setTimeout(() => goto('/editor'), 2000);
        return;
      }

      teams = await invoke<Team[]>('get_teams', { leagueId: data.leagueId });
    } catch (error) {
      console.error('Failed to load league data:', error);
      showAlert($_('league.errors.loadFailed'), String(error));
      setTimeout(() => goto('/editor'), 2000);
    } finally {
      isLoadingData = false;
    }
  }

  function handleBackToEditor() {
    goto('/editor');
  }

  function handleViewTeam(teamId: number) {
    goto(`/editor/team/${teamId}`);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
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
{:else if isLoadingData}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">Loading league data...</div>
  </main>
{:else if league}
  <main class="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold text-white">{league.name}</h1>
        <div class="mt-2 flex gap-4 text-slate-400">
          <span>{$_('league.info.country')}: {league.country}</span>
          <span>{$_('league.info.division')}: {league.division}</span>
          <span>{$_('league.info.season')}: {league.season}</span>
        </div>
      </div>
      <Button variant="outline" onclick={handleBackToEditor}>
        {$_('league.backToEditor')}
      </Button>
    </div>

    <div class="rounded-lg bg-slate-800/50 p-6">
      <h2 class="mb-4 text-2xl font-semibold text-white">
        {$_('league.teamsTitle')}
      </h2>

      {#if teams.length === 0}
        <p class="text-slate-400">{$_('league.noTeams')}</p>
      {:else}
        <div class="space-y-2">
          {#each teams as team}
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-md bg-slate-700/50 p-4 text-left transition-colors hover:bg-slate-700"
              onclick={() => handleViewTeam(team.id)}
            >
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-white">{team.name}</h3>
                <div class="mt-1 flex gap-6 text-sm text-slate-400">
                  <span>{$_('team.info.stadium')}: {team.stadium_name}</span>
                  <span>{$_('team.info.capacity')}: {team.stadium_capacity.toLocaleString()}</span>
                  <span>{$_('team.info.budget')}: {formatCurrency(team.budget)}</span>
                  <span>{$_('team.info.reputation')}: {team.reputation}/100</span>
                </div>
              </div>
              <span class="ml-4 rounded border border-slate-600 px-3 py-1 text-sm text-slate-300">
                {$_('league.viewTeam')}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </main>
{:else}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">League not found</div>
  </main>
{/if}
