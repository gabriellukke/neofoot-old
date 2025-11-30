<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  import { Button } from '$lib/components/ui/button';
  import { Alert } from '$lib/components/ui/alert';
  import { invoke } from '@tauri-apps/api/core';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { logger } from '$lib/utils/logger';

  const log = logger.page('EditorTeam');

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

  let team = $state<Team | null>(null);
  let players = $state<Player[]>([]);
  let isLoadingData = $state(true);
  let error = $state<string | null>(null);
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
    await loadTeamData();
  });

  async function loadTeamData() {
    try {
      isLoadingData = true;
      error = null;

      const foundTeam = await invoke<Team | null>('get_team', { teamId: data.teamId });

      if (!foundTeam) {
        error = 'Team not found';
        return;
      }

      team = foundTeam;
      players = await invoke<Player[]>('get_players', { teamId: data.teamId });
    } catch (err) {
      console.error('Failed to load team data:', err);
      error = String(err);
    } finally {
      isLoadingData = false;
    }
  }

  function handleBackToLeague() {
    if (team) {
      goto(`/editor/league/${team.league_id}`);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  }

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

  function getPositionColor(position: string): string {
    if (position === 'GK') return 'bg-yellow-600';
    if (position === 'DEF' || ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'bg-blue-600';
    if (position === 'MID' || ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(position)) return 'bg-green-600';
    if (position === 'FWD' || ['ST', 'CF', 'LW', 'RW'].includes(position)) return 'bg-red-600';
    return 'bg-slate-600';
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
    <div class="text-white">Loading team data...</div>
  </main>
{:else if error}
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="text-center">
      <h1 class="mb-4 text-3xl font-bold text-white">{$_('team.errors.loadFailed')}</h1>
      <p class="text-slate-400 max-w-md">{error}</p>
    </div>
    <Button variant="outline" onclick={handleBackToLeague}>
      {$_('team.backToLeague')}
    </Button>
  </main>
{:else if team}
  <main class="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold text-white">{team.name}</h1>
        <p class="mt-1 text-lg text-slate-400">{team.short_name}</p>
      </div>
      <Button variant="outline" onclick={handleBackToLeague}>
        {$_('team.backToLeague')}
      </Button>
    </div>

    <div class="mb-6 grid gap-4 md:grid-cols-4">
      <div class="rounded-lg bg-slate-800/50 p-4">
        <p class="text-sm text-slate-400">{$_('team.info.stadium')}</p>
        <p class="mt-1 text-lg font-semibold text-white">{team.stadium_name}</p>
      </div>
      <div class="rounded-lg bg-slate-800/50 p-4">
        <p class="text-sm text-slate-400">{$_('team.info.capacity')}</p>
        <p class="mt-1 text-lg font-semibold text-white">{team.stadium_capacity.toLocaleString()}</p>
      </div>
      <div class="rounded-lg bg-slate-800/50 p-4">
        <p class="text-sm text-slate-400">{$_('team.info.budget')}</p>
        <p class="mt-1 text-lg font-semibold text-white">{formatCurrency(team.budget)}</p>
      </div>
      <div class="rounded-lg bg-slate-800/50 p-4">
        <p class="text-sm text-slate-400">{$_('team.info.reputation')}</p>
        <p class="mt-1 text-lg font-semibold text-white">{team.reputation}/100</p>
      </div>
    </div>

    <div class="rounded-lg bg-slate-800/50 p-6">
      <h2 class="mb-4 text-2xl font-semibold text-white">
        {$_('team.playersTitle')}
      </h2>

      {#if players.length === 0}
        <p class="text-slate-400">{$_('team.noPlayers')}</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-700 text-left">
                <th class="pb-3 text-sm font-semibold text-slate-300">#</th>
                <th class="pb-3 text-sm font-semibold text-slate-300">{$_('team.player.position')}</th>
                <th class="pb-3 text-sm font-semibold text-slate-300">Name</th>
                <th class="pb-3 text-sm font-semibold text-slate-300">{$_('team.player.nationality')}</th>
                <th class="pb-3 text-sm font-semibold text-slate-300">{$_('team.player.age')}</th>
                <th class="pb-3 text-sm font-semibold text-slate-300">{$_('team.player.overall')}</th>
              </tr>
            </thead>
            <tbody>
              {#each [...players].sort((a, b) => a.shirt_number - b.shirt_number) as player}
                <tr class="border-b border-slate-700/50 transition-colors hover:bg-slate-700/30">
                  <td class="py-3 text-slate-300">{player.shirt_number}</td>
                  <td class="py-3">
                    <span class="{getPositionColor(player.position)} rounded px-2 py-1 text-xs font-semibold text-white">
                      {player.position}
                    </span>
                  </td>
                  <td class="py-3 font-medium text-white">{player.name}</td>
                  <td class="py-3 text-slate-300">{player.nationality}</td>
                  <td class="py-3 text-slate-300">{calculateAge(player.birth_date)}</td>
                  <td class="py-3">
                    <span class="font-semibold text-white">{player.overall}</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </main>
{:else}
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-900 to-slate-800 p-8">
    <div class="text-center">
      <h1 class="mb-4 text-3xl font-bold text-white">Unexpected State</h1>
      <p class="text-slate-400 max-w-md">isLoadingData: {isLoadingData}, error: {error}, team: {team ? 'loaded' : 'null'}</p>
    </div>
    <Button variant="outline" onclick={() => goto('/editor')}>
      Back to Editor
    </Button>
  </main>
{/if}
