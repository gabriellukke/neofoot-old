<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  import { Button } from '$lib/components/ui/button';
  import { Alert } from '$lib/components/ui/alert';
  import Dialog from '$lib/components/ui/dialog/Dialog.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

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

  interface League {
    id: number;
    game_id: number;
    name: string;
    country: string;
    division: number;
    season: number;
    created_at: string;
  }

  interface PlayerAttributes {
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
    diving?: number;
    handling?: number;
    kicking?: number;
    reflexes?: number;
    positioning?: number;
  }

  interface Player {
    id: number;
    team_id: number;
    name: string;
    position: string;
    birth_date: string;
    nationality: string;
    shirt_number: number;
    overall: number;
    attributes: PlayerAttributes | null;
    attributes_json: string;
    created_at: string;
  }

  interface AlertState {
    open: boolean;
    title: string;
    message: string;
    variant: 'info' | 'error' | 'success' | 'warning';
  }

  interface PlayersByPosition {
    GK: Player[];
    DEF: Player[];
    MID: Player[];
    FWD: Player[];
  }

  type SortField = 'number' | 'name' | 'age' | 'nationality' | 'overall' | 'position';
  type SortDirection = 'asc' | 'desc';

  let team = $state<Team | null>(null);
  let league = $state<League | null>(null);
  let players = $state<Player[]>([]);
  let playersByPosition = $state<PlayersByPosition>({
    GK: [],
    DEF: [],
    MID: [],
    FWD: []
  });
  let sortField = $state<SortField>('position');
  let sortDirection = $state<SortDirection>('asc');
  let isLoadingData = $state(true);
  let groupByPosition = $state(false);
  let error = $state<string | null>(null);
  let showSaveDialog = $state(false);
  let saveName = $state('');
  let isSaving = $state(false);
  let currentSaveId = $state<number | null>(null);
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
    await loadGameData();
  });

  async function loadGameData() {
    try {
      isLoadingData = true;
      error = null;

      const foundTeam = await invoke<Team | null>('get_team', { teamId: data.teamId });

      if (!foundTeam) {
        error = $_('manage.errors.teamNotFoundMessage');
        return;
      }

      team = foundTeam;

      const allPlayers = await invoke<Player[]>('get_players', { teamId: data.teamId });
      players = allPlayers;

      playersByPosition = groupPlayersByPosition(allPlayers);

      league = await invoke<League | null>('get_league', { leagueId: foundTeam.league_id });

    } catch (err) {
      console.error('Failed to load game data:', err);
      error = String(err);
    } finally {
      isLoadingData = false;
    }
  }

  function getPositionOrder(position: string): number {
    const pos = position.toUpperCase();
    if (pos === 'GK') return 1;
    if (['DEF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 2;
    if (['MID', 'CM', 'CDM', 'CAM', 'LM', 'RM'].includes(pos)) return 3;
    if (['FWD', 'ST', 'CF', 'LW', 'RW'].includes(pos)) return 4;
    return 5;
  }

  function sortPlayers(playersList: Player[]): Player[] {
    return playersList.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'number':
          comparison = a.shirt_number - b.shirt_number;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'age':
          comparison = calculateAge(a.birth_date) - calculateAge(b.birth_date);
          break;
        case 'nationality':
          comparison = a.nationality.localeCompare(b.nationality);
          break;
        case 'overall':
          comparison = a.overall - b.overall;
          break;
        case 'position':
          comparison = getPositionOrder(a.position) - getPositionOrder(b.position);
          if (comparison === 0) {
            comparison = a.position.localeCompare(b.position);
          }
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  function groupPlayersByPosition(allPlayers: Player[]): PlayersByPosition {
    const grouped: PlayersByPosition = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: []
    };

    allPlayers.forEach(player => {
      const pos = player.position.toUpperCase();
      if (pos === 'GK') {
        grouped.GK.push(player);
      } else if (['DEF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) {
        grouped.DEF.push(player);
      } else if (['MID', 'CM', 'CDM', 'CAM', 'LM', 'RM'].includes(pos)) {
        grouped.MID.push(player);
      } else if (['FWD', 'ST', 'CF', 'LW', 'RW'].includes(pos)) {
        grouped.FWD.push(player);
      }
    });

    grouped.GK = sortPlayers([...grouped.GK]);
    grouped.DEF = sortPlayers([...grouped.DEF]);
    grouped.MID = sortPlayers([...grouped.MID]);
    grouped.FWD = sortPlayers([...grouped.FWD]);

    return grouped;
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
    if (groupByPosition) {
      playersByPosition = groupPlayersByPosition(players);
    } else {
      players = sortPlayers([...players]);
    }
  }

  function toggleGroupByPosition() {
    groupByPosition = !groupByPosition;
    if (groupByPosition) {
      playersByPosition = groupPlayersByPosition(players);
    }
  }

  let sortedPlayers = $derived(groupByPosition ? players : sortPlayers([...players]));

  function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  function handleBackToMenu() {
    goto('/');
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  }

  function handleSaveGameClick() {
    if (!team) return;
    // Generate default save name
    const now = new Date();
    saveName = `${team.name} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    showSaveDialog = true;
  }

  function closeSaveDialog() {
    showSaveDialog = false;
    saveName = '';
  }

  async function handleSaveGame() {
    if (!team || !league || !saveName.trim()) {
      showAlert($_('manage.saveGame.errors.nameRequired'), $_('manage.saveGame.errors.nameRequiredMessage'));
      return;
    }

    try {
      isSaving = true;

      const gameState = JSON.stringify({
        teamId: team.id,
        timestamp: new Date().toISOString(),
      });

      const currentDate = new Date().toISOString().split('T')[0];
      const season = league.season;

      if (currentSaveId) {
        await invoke('update_saved_game', {
          id: currentSaveId,
          currentDate,
          season,
          gameState,
        });
      } else {
        const result = await invoke('create_saved_game', {
          gameId: league.game_id,
          saveName: saveName.trim(),
          teamId: team.id,
          currentDate,
          season,
          gameState,
        });
        currentSaveId = (result as any).id;
      }

      showAlert(
        $_('manage.saveGame.success.saveComplete'),
        $_('manage.saveGame.success.saveCompleteMessage'),
        'success'
      );
      closeSaveDialog();
    } catch (err) {
      console.error('Failed to save game:', err);
      showAlert($_('manage.saveGame.errors.saveFailed'), String(err));
    } finally {
      isSaving = false;
    }
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
  open={showSaveDialog}
  title={$_('manage.saveGame.title')}
  onClose={closeSaveDialog}
>
  {#snippet children()}
    <div class="space-y-4">
      <div>
        <label for="saveName" class="block text-sm font-medium text-slate-300 mb-2">
          {$_('manage.saveGame.nameLabel')}
        </label>
        <input
          id="saveName"
          type="text"
          bind:value={saveName}
          class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={$_('manage.saveGame.namePlaceholder')}
          disabled={isSaving}
        />
      </div>
    </div>
  {/snippet}
  {#snippet actions()}
    <Button onclick={handleSaveGame} disabled={isSaving}>
      {isSaving ? $_('manage.saveGame.saving') : $_('manage.saveGame.saveButton')}
    </Button>
  {/snippet}
</Dialog>

{#if $isLoading}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">Loading...</div>
  </main>
{:else if isLoadingData}
  <main class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
    <div class="text-white">Loading game data...</div>
  </main>
{:else if error}
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="text-center">
      <h1 class="mb-4 text-3xl font-bold text-white">{$_('manage.errors.loadFailed')}</h1>
      <p class="text-slate-400 max-w-md">{error}</p>
    </div>
    <Button variant="outline" onclick={handleBackToMenu}>
      {$_('manage.menu')}
    </Button>
  </main>
{:else if team}
  <div class="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800">
    <header class="border-b border-slate-700 bg-slate-900/50 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div>
            <h1 class="text-2xl font-bold text-white">{team.name}</h1>
            <p class="text-sm text-slate-400">{league?.name || ''} - {$_('manage.season')} {league?.season || ''}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-xs text-slate-400">{$_('team.info.budget')}</p>
            <p class="text-lg font-semibold text-white">{formatCurrency(team.budget)}</p>
          </div>
          <Button variant="default" size="sm" onclick={handleSaveGameClick}>
            {$_('manage.saveGame.button')}
          </Button>
          <Button variant="outline" size="sm" onclick={handleBackToMenu}>
            {$_('manage.menu')}
          </Button>
        </div>
      </div>
    </header>

    <div class="flex flex-1">
      <aside class="w-80 border-r border-slate-700 bg-slate-900/30 p-4">
        <div class="space-y-4">
          <div class="rounded-lg bg-slate-800/50 p-4">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {$_('manage.nextMatch.title')}
            </h2>
            <div class="space-y-2 text-sm text-slate-300">
              <p class="text-slate-500">{$_('manage.nextMatch.noMatch')}</p>
            </div>
          </div>

          <div class="rounded-lg bg-slate-800/50 p-4">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {$_('manage.teamInfo.title')}
            </h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-400">{$_('team.info.stadium')}</span>
                <span class="text-white">{team.stadium_name}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">{$_('team.info.capacity')}</span>
                <span class="text-white">{team.stadium_capacity.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">{$_('team.info.reputation')}</span>
                <span class="text-white">{team.reputation}/100</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-slate-800/50 p-4">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {$_('manage.standings.title')}
            </h2>
            <div class="space-y-2 text-sm text-slate-300">
              <p class="text-slate-500">{$_('manage.standings.notAvailable')}</p>
            </div>
          </div>
        </div>
      </aside>

      <main class="flex-1 p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-white">{$_('manage.squad.title')}</h2>
            <p class="text-sm text-slate-400">{players.length} {$_('manage.squad.players')}</p>
          </div>
          <Button 
            variant={groupByPosition ? 'default' : 'outline'} 
            size="sm" 
            onclick={toggleGroupByPosition}
          >
            {groupByPosition ? $_('manage.squad.groupedView') : $_('manage.squad.listView')}
          </Button>
        </div>

        {#if groupByPosition}
        <div class="space-y-6">
          {#if playersByPosition.GK.length > 0}
            <div>
              <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {$_('manage.positions.goalkeepers')}
              </h3>
              <div class="rounded-lg bg-slate-800/20 overflow-hidden">
                <div class="flex items-center gap-4 border-b border-slate-700 bg-slate-800/50 px-4 py-2">
                  <button type="button" onclick={() => handleSort('number')} class="w-8 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'number' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.number')}
                    {#if sortField === 'number'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <span class="w-12 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{$_('manage.table.pos')}</span>
                  <button type="button" onclick={() => handleSort('name')} class="flex-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'name' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.name')}
                    {#if sortField === 'name'}<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('age')} class="w-16 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'age' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.age')}
                    {#if sortField === 'age'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('nationality')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'nationality' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.nat')}
                    {#if sortField === 'nationality'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('overall')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'overall' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.ovr')}
                    {#if sortField === 'overall'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </div>
                {#each playersByPosition.GK as player}
                  <div class="flex items-center gap-4 border-b border-slate-700/50 px-4 py-3 transition-colors hover:bg-slate-800/50">
                    <span class="w-8 text-center font-semibold text-slate-300">{player.shirt_number}</span>
                    <span class="w-12 rounded bg-yellow-600 px-2 py-1 text-center text-xs font-semibold text-white">{player.position}</span>
                    <span class="flex-1 font-medium text-white">{player.name}</span>
                    <span class="w-16 text-center text-sm text-slate-300">{calculateAge(player.birth_date)}</span>
                    <span class="w-12 text-center text-sm text-slate-300">{player.nationality}</span>
                    <span class="w-12 text-center font-semibold text-white">{player.overall}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if playersByPosition.DEF.length > 0}
            <div>
              <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {$_('manage.positions.defenders')}
              </h3>
              <div class="rounded-lg bg-slate-800/20 overflow-hidden">
                <div class="flex items-center gap-4 border-b border-slate-700 bg-slate-800/50 px-4 py-2">
                  <button type="button" onclick={() => handleSort('number')} class="w-8 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'number' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.number')}
                    {#if sortField === 'number'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <span class="w-12 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{$_('manage.table.pos')}</span>
                  <button type="button" onclick={() => handleSort('name')} class="flex-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'name' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.name')}
                    {#if sortField === 'name'}<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('age')} class="w-16 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'age' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.age')}
                    {#if sortField === 'age'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('nationality')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'nationality' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.nat')}
                    {#if sortField === 'nationality'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('overall')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'overall' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.ovr')}
                    {#if sortField === 'overall'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </div>
                {#each playersByPosition.DEF as player}
                  <div class="flex items-center gap-4 border-b border-slate-700/50 px-4 py-3 transition-colors hover:bg-slate-800/50">
                    <span class="w-8 text-center font-semibold text-slate-300">{player.shirt_number}</span>
                    <span class="w-12 rounded bg-blue-600 px-2 py-1 text-center text-xs font-semibold text-white">{player.position}</span>
                    <span class="flex-1 font-medium text-white">{player.name}</span>
                    <span class="w-16 text-center text-sm text-slate-300">{calculateAge(player.birth_date)}</span>
                    <span class="w-12 text-center text-sm text-slate-300">{player.nationality}</span>
                    <span class="w-12 text-center font-semibold text-white">{player.overall}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if playersByPosition.MID.length > 0}
            <div>
              <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {$_('manage.positions.midfielders')}
              </h3>
              <div class="rounded-lg bg-slate-800/20 overflow-hidden">
                <div class="flex items-center gap-4 border-b border-slate-700 bg-slate-800/50 px-4 py-2">
                  <button type="button" onclick={() => handleSort('number')} class="w-8 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'number' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.number')}
                    {#if sortField === 'number'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <span class="w-12 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{$_('manage.table.pos')}</span>
                  <button type="button" onclick={() => handleSort('name')} class="flex-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'name' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.name')}
                    {#if sortField === 'name'}<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('age')} class="w-16 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'age' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.age')}
                    {#if sortField === 'age'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('nationality')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'nationality' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.nat')}
                    {#if sortField === 'nationality'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('overall')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'overall' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.ovr')}
                    {#if sortField === 'overall'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </div>
                {#each playersByPosition.MID as player}
                  <div class="flex items-center gap-4 border-b border-slate-700/50 px-4 py-3 transition-colors hover:bg-slate-800/50">
                    <span class="w-8 text-center font-semibold text-slate-300">{player.shirt_number}</span>
                    <span class="w-12 rounded bg-green-600 px-2 py-1 text-center text-xs font-semibold text-white">{player.position}</span>
                    <span class="flex-1 font-medium text-white">{player.name}</span>
                    <span class="w-16 text-center text-sm text-slate-300">{calculateAge(player.birth_date)}</span>
                    <span class="w-12 text-center text-sm text-slate-300">{player.nationality}</span>
                    <span class="w-12 text-center font-semibold text-white">{player.overall}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if playersByPosition.FWD.length > 0}
            <div>
              <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {$_('manage.positions.forwards')}
              </h3>
              <div class="rounded-lg bg-slate-800/20 overflow-hidden">
                <div class="flex items-center gap-4 border-b border-slate-700 bg-slate-800/50 px-4 py-2">
                  <button type="button" onclick={() => handleSort('number')} class="w-8 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'number' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.number')}
                    {#if sortField === 'number'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <span class="w-12 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{$_('manage.table.pos')}</span>
                  <button type="button" onclick={() => handleSort('name')} class="flex-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'name' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.name')}
                    {#if sortField === 'name'}<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('age')} class="w-16 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'age' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.age')}
                    {#if sortField === 'age'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('nationality')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'nationality' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.nat')}
                    {#if sortField === 'nationality'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                  <button type="button" onclick={() => handleSort('overall')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'overall' ? 'text-blue-400' : 'text-slate-400'}">
                    {$_('manage.table.ovr')}
                    {#if sortField === 'overall'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </div>
                {#each playersByPosition.FWD as player}
                  <div class="flex items-center gap-4 border-b border-slate-700/50 px-4 py-3 transition-colors hover:bg-slate-800/50">
                    <span class="w-8 text-center font-semibold text-slate-300">{player.shirt_number}</span>
                    <span class="w-12 rounded bg-red-600 px-2 py-1 text-center text-xs font-semibold text-white">{player.position}</span>
                    <span class="flex-1 font-medium text-white">{player.name}</span>
                    <span class="w-16 text-center text-sm text-slate-300">{calculateAge(player.birth_date)}</span>
                    <span class="w-12 text-center text-sm text-slate-300">{player.nationality}</span>
                    <span class="w-12 text-center font-semibold text-white">{player.overall}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        {:else}
        <div class="rounded-lg bg-slate-800/20 overflow-hidden">
          <div class="flex items-center gap-4 border-b border-slate-700 bg-slate-800/50 px-4 py-2">
            <button type="button" onclick={() => handleSort('number')} class="w-8 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'number' ? 'text-blue-400' : 'text-slate-400'}">
              {$_('manage.table.number')}
              {#if sortField === 'number'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
            </button>
            <button type="button" onclick={() => handleSort('position')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'position' ? 'text-blue-400' : 'text-slate-400'}">
              {$_('manage.table.pos')}
              {#if sortField === 'position'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
            </button>
            <button type="button" onclick={() => handleSort('name')} class="flex-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'name' ? 'text-blue-400' : 'text-slate-400'}">
              {$_('manage.table.name')}
              {#if sortField === 'name'}<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
            </button>
            <button type="button" onclick={() => handleSort('age')} class="w-16 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'age' ? 'text-blue-400' : 'text-slate-400'}">
              {$_('manage.table.age')}
              {#if sortField === 'age'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
            </button>
            <button type="button" onclick={() => handleSort('nationality')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'nationality' ? 'text-blue-400' : 'text-slate-400'}">
              {$_('manage.table.nat')}
              {#if sortField === 'nationality'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
            </button>
            <button type="button" onclick={() => handleSort('overall')} class="w-12 text-center text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white {sortField === 'overall' ? 'text-blue-400' : 'text-slate-400'}">
              {$_('manage.table.ovr')}
              {#if sortField === 'overall'}<span class="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>{/if}
            </button>
          </div>
          {#each sortedPlayers as player}
            <div class="flex items-center gap-4 border-b border-slate-700/50 px-4 py-3 transition-colors hover:bg-slate-800/50">
              <span class="w-8 text-center font-semibold text-slate-300">{player.shirt_number}</span>
              <span class="w-12 rounded {
                player.position.toUpperCase() === 'GK' ? 'bg-yellow-600' :
                ['DEF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(player.position.toUpperCase()) ? 'bg-blue-600' :
                ['MID', 'CM', 'CDM', 'CAM', 'LM', 'RM'].includes(player.position.toUpperCase()) ? 'bg-green-600' :
                'bg-red-600'
              } px-2 py-1 text-center text-xs font-semibold text-white">{player.position}</span>
              <span class="flex-1 font-medium text-white">{player.name}</span>
              <span class="w-16 text-center text-sm text-slate-300">{calculateAge(player.birth_date)}</span>
              <span class="w-12 text-center text-sm text-slate-300">{player.nationality}</span>
              <span class="w-12 text-center font-semibold text-white">{player.overall}</span>
            </div>
          {/each}
        </div>
        {/if}
      </main>
    </div>
  </div>
{/if}
