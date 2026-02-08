<script lang="ts">
  import { session } from '$lib/app/session';

  const dashboard = $derived(session.dashboard);
  const view = $derived(session.view);

  function handleSelectTeam(teamId: string) {
    session.setUserTeam(teamId);
  }
</script>

<h1 class="text-2xl font-bold text-white mb-6">Dashboard</h1>

{#if session.state && !session.state.userTeamId}
  <section class="bg-slate-800 rounded-lg p-6 mb-6">
    <h2 class="text-lg font-semibold text-white mb-3">Select Your Team</h2>
    <select
      class="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 text-sm"
      onchange={(e) => handleSelectTeam(e.currentTarget.value)}
      value=""
    >
      <option value="" disabled>Choose a team</option>
      {#each session.state.teams as team}
        <option value={team.id}>{team.name}</option>
      {/each}
    </select>
  </section>
{/if}

{#if dashboard}
  <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <p class="text-slate-400 text-xs mb-1">Team</p>
      <p class="text-white text-lg font-semibold">{dashboard.teamName}</p>
      <p class="text-slate-400 text-sm mt-1">
        Position: {dashboard.position ?? '-'}
      </p>
    </div>

    <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <p class="text-slate-400 text-xs mb-1">Next Match</p>
      {#if dashboard.nextMatch}
        <p class="text-white">
          {dashboard.nextMatch.isHome ? 'Home vs' : 'Away at'}
          {dashboard.nextMatch.opponentName}
        </p>
        <p class="text-slate-500 text-xs mt-1">
          Round {dashboard.nextMatch.roundIndex + 1}
        </p>
      {:else}
        <p class="text-slate-500 text-sm">No upcoming match</p>
      {/if}
    </div>

    <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <p class="text-slate-400 text-xs mb-1">Last Results</p>
      {#if dashboard.lastResults.length > 0}
        <div class="mt-1 space-y-1">
          {#each dashboard.lastResults as result}
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-200">
                {result.outcome}
                {result.goalsFor}-{result.goalsAgainst}
                {result.isHome ? 'vs' : '@'}
                {result.opponentName}
              </span>
              <span class="text-slate-500 text-xs">R{result.roundIndex + 1}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-slate-500 text-sm">No results yet</p>
      {/if}
    </div>
  </section>
{/if}

<section class="flex gap-3">
  <a
    href="/season/round"
    class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
  >
    View Current Round
  </a>
  <a
    href="/season/standings"
    class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
  >
    View Standings
  </a>
</section>

{#if session.isFinished}
  <section class="mt-6 bg-green-900/30 border border-green-600/40 rounded-lg p-6 text-center">
    <p class="text-green-300 text-lg font-semibold">Season Complete</p>
    <p class="text-slate-400 text-sm mt-2">Check the standings for final results.</p>
  </section>
{/if}
