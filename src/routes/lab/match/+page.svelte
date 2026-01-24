<script lang="ts">
  import { simulateMatch, type Team, type MatchResult } from '$lib/match';

  const homeTeam: Team = {
    id: 'home',
    name: 'FC Barcelona',
    attack: 88,
    defense: 75,
    midfield: 85,
  };

  const awayTeam: Team = {
    id: 'away',
    name: 'Real Madrid',
    attack: 86,
    defense: 78,
    midfield: 82,
  };

  let result = $state<MatchResult | null>(null);

  function runSimulation() {
    result = simulateMatch(homeTeam, awayTeam);
  }
</script>

<main class="min-h-screen bg-slate-900 p-8">
  <a href="/lab" class="text-blue-400 hover:text-blue-300 mb-4 inline-block">&larr; Back to Lab</a>

  <h1 class="text-3xl font-bold text-white mb-6">Match Simulation</h1>

  <div class="grid grid-cols-2 gap-8 max-w-2xl mb-8">
    <div class="bg-slate-800 rounded-lg p-4">
      <h2 class="text-xl font-semibold text-white mb-2">{homeTeam.name}</h2>
      <p class="text-slate-400">Attack: {homeTeam.attack}</p>
      <p class="text-slate-400">Midfield: {homeTeam.midfield}</p>
      <p class="text-slate-400">Defense: {homeTeam.defense}</p>
    </div>
    <div class="bg-slate-800 rounded-lg p-4">
      <h2 class="text-xl font-semibold text-white mb-2">{awayTeam.name}</h2>
      <p class="text-slate-400">Attack: {awayTeam.attack}</p>
      <p class="text-slate-400">Midfield: {awayTeam.midfield}</p>
      <p class="text-slate-400">Defense: {awayTeam.defense}</p>
    </div>
  </div>

  <button
    class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold mb-8"
    onclick={runSimulation}
  >
    Simulate Match
  </button>

  {#if result}
    <div class="bg-slate-800 rounded-lg p-6 max-w-2xl">
      <div class="text-center mb-6">
        <div class="text-4xl font-bold text-white">
          {result.homeGoals} - {result.awayGoals}
        </div>
        <div class="text-slate-400 mt-2">
          {result.homeTeam.name} vs {result.awayTeam.name}
        </div>
      </div>

      {#if result.events.length > 0}
        <h3 class="text-lg font-semibold text-white mb-3">Match Events</h3>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#each result.events as event}
            <div class="flex items-center gap-3 text-sm">
              <span class="text-slate-500 font-mono w-8">{event.minute}'</span>
              <span class="text-white">{event.description}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-slate-400 text-center">No goals scored - 0-0 draw</p>
      {/if}
    </div>
  {/if}
</main>
