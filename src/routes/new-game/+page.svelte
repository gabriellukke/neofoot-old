<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  import { Button } from '$lib/components/ui/button';
  import { Alert } from '$lib/components/ui/alert';
  import { invoke } from '@tauri-apps/api/core';
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

  interface LeaguesByCountry {
    [country: string]: League[];
  }

  let leagues = $state<League[]>([]);
  let leaguesByCountry = $state<LeaguesByCountry>({});
  let selectedLeague = $state<League | null>(null);
  let teams = $state<Team[]>([]);
  let selectedTeam = $state<Team | null>(null);
  let currentGameId = $state<number | null>(null);
  let isLoadingData = $state(true);
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
    await loadGameAndLeagues();
  });

  async function loadGameAndLeagues() {
    try {
      isLoadingData = true;

      const allGames = await invoke<Game[]>('get_all_games');
      if (allGames.length === 0) {
        const newGame = await invoke<Game>('create_game', { name: 'My Game' });
        currentGameId = newGame.id;
      } else {
        currentGameId = allGames[0].id;
      }

      leagues = await invoke<League[]>('get_leagues', { gameId: currentGameId });

      leaguesByCountry = leagues.reduce((acc, league) => {
        if (!acc[league.country]) {
          acc[league.country] = [];
        }
        acc[league.country].push(league);
        return acc;
      }, {} as LeaguesByCountry);

    } catch (error) {
      console.error('Failed to load data:', error);
      showAlert($_('newGame.errors.loadFailed'), String(error));
    } finally {
      isLoadingData = false;
    }
  }

  async function handleSelectLeague(league: League) {
    try {
      selectedLeague = league;
      selectedTeam = null;
      teams = await invoke<Team[]>('get_teams', { leagueId: league.id });
    } catch (error) {
      console.error('Failed to load teams:', error);
      showAlert($_('newGame.errors.loadTeamsFailed'), String(error));
    }
  }

  function handleSelectTeam(team: Team) {
    selectedTeam = team;
  }

  function handleStartGame() {
    if (!selectedTeam) return;
    goto(`/manage/${selectedTeam.id}`);
  }

  function handleBackToMenu() {
    goto('/');
  }

  function handleGoToEditor() {
    goto('/editor');
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
    <div class="text-white">Loading game data...</div>
  </main>
{:else}
  <main class="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-4xl font-bold text-white">{$_('newGame.title')}</h1>
      <Button variant="outline" onclick={handleBackToMenu}>
        {$_('newGame.backToMenu')}
      </Button>
    </div>

    {#if leagues.length === 0}
      <div class="flex flex-col items-center justify-center rounded-lg bg-slate-800/50 p-12 text-center">
        <h2 class="mb-4 text-2xl font-semibold text-white">
          {$_('newGame.noLeagues.title')}
        </h2>
        <p class="mb-6 text-slate-400">
          {$_('newGame.noLeagues.message')}
        </p>
        <Button onclick={handleGoToEditor}>
          {$_('newGame.noLeagues.goToEditor')}
        </Button>
      </div>
    {:else}
      <div class="grid gap-8 lg:grid-cols-3">
        <div class="rounded-lg bg-slate-800/50 p-6 lg:col-span-1">
          <h2 class="mb-4 text-2xl font-semibold text-white">
            {$_('newGame.selectLeague')}
          </h2>

          <div class="space-y-4">
            {#each Object.entries(leaguesByCountry) as [country, countryLeagues]}
              <div>
                <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {country}
                </h3>
                <div class="space-y-1">
                  {#each countryLeagues as league}
                    <button
                      type="button"
                      class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors
                        {selectedLeague?.id === league.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50'}"
                      onclick={() => handleSelectLeague(league)}
                    >
                      <div class="flex-1">
                        <div class="font-semibold">{league.name}</div>
                        <div class="text-xs opacity-80">
                          {$_('newGame.leagueInfo.division')} {league.division} - {$_('newGame.leagueInfo.season')} {league.season}
                        </div>
                      </div>
                      {#if selectedLeague?.id === league.id}
                        <span class="ml-2 text-xs">✓</span>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="rounded-lg bg-slate-800/50 p-6 lg:col-span-2">
          {#if !selectedLeague}
            <div class="flex h-full items-center justify-center text-slate-400">
              {$_('newGame.selectLeaguePrompt')}
            </div>
          {:else}
            <div class="mb-6">
              <h2 class="text-2xl font-semibold text-white">
                {$_('newGame.selectTeam')}
              </h2>
              <p class="mt-1 text-slate-400">{selectedLeague.name}</p>
            </div>

            {#if teams.length === 0}
              <p class="text-slate-400">{$_('newGame.noTeams')}</p>
            {:else}
              <div class="mb-6 space-y-2">
                {#each teams as team}
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-md p-4 text-left transition-colors
                      {selectedTeam?.id === team.id
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}"
                    onclick={() => handleSelectTeam(team)}
                  >
                    <div class="flex-1">
                      <h3 class="font-semibold text-lg">{team.name}</h3>
                      <div class="mt-1 flex gap-6 text-sm opacity-90">
                        <span>{$_('team.info.stadium')}: {team.stadium_name}</span>
                        <span>{$_('team.info.reputation')}: {team.reputation}/100</span>
                      </div>
                    </div>
                    {#if selectedTeam?.id === team.id}
                      <span class="ml-4 rounded bg-white/20 px-3 py-1 text-sm font-semibold">
                        {$_('newGame.selected')}
                      </span>
                    {/if}
                  </button>
                {/each}
              </div>

              {#if selectedTeam}
                <div class="flex justify-end">
                  <Button size="lg" onclick={handleStartGame}>
                    {$_('newGame.startGame')}
                  </Button>
                </div>
              {/if}
            {/if}
          {/if}
        </div>
      </div>
    {/if}
  </main>
{/if}
