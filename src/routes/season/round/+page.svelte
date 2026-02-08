<script lang="ts">
  import { session } from '$lib/app/session';
  import FixtureRow from '$lib/ui/FixtureRow.svelte';

  const view = $derived(session.view);
  const state = $derived(session.state);
  const currentRoundIndex = $derived(state?.currentRoundIndex ?? 0);
  const totalRounds = $derived(state?.schedule.rounds.length ?? 0);

  const currentRoundResults = $derived(
    view?.resultsByRound[currentRoundIndex]?.results ?? []
  );

  const currentRoundMatchCount = $derived(
    state?.schedule.rounds[currentRoundIndex]?.matches.length ?? 0
  );

  const canSimulate = $derived(
    !!state && currentRoundMatchCount > 0 && currentRoundResults.length < currentRoundMatchCount
  );

  const canSimulateMyMatch = $derived.by(() => {
    if (!state?.userTeamId || !canSimulate) return false;
    const round = state.schedule.rounds[state.currentRoundIndex];
    if (!round) return false;
    const myFixture = round.matches.find(
      (m) => m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId
    );
    if (!myFixture) return false;
    return !(
      state.resultsByRound[state.currentRoundIndex]?.some(
        (r) => r.homeTeamId === myFixture.homeTeamId && r.awayTeamId === myFixture.awayTeamId
      ) ?? false
    );
  });

  function getResultForFixture(homeTeamId: string, awayTeamId: string) {
    return currentRoundResults.find(
      (r) => r.homeTeamId === homeTeamId && r.awayTeamId === awayTeamId
    );
  }
</script>

<h1 class="text-2xl font-bold text-white mb-6">
  Round {currentRoundIndex + 1} of {totalRounds}
</h1>

{#if view && state}
  <section class="bg-slate-800 rounded-lg p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-white">Fixtures</h2>
      <span class="text-slate-500 text-xs">
        {currentRoundResults.length}/{currentRoundMatchCount} played
      </span>
    </div>

    <div class="space-y-2">
      {#each view.fixtures as fixture}
        {@const result = getResultForFixture(fixture.homeTeamId, fixture.awayTeamId)}
        <FixtureRow
          homeTeamName={fixture.homeTeamName}
          awayTeamName={fixture.awayTeamName}
          homeTeamId={fixture.homeTeamId}
          awayTeamId={fixture.awayTeamId}
          homeGoals={result?.homeGoals}
          awayGoals={result?.awayGoals}
          userTeamId={state.userTeamId}
        />
      {/each}
    </div>
  </section>

  <div class="flex gap-3">
    <button
      onclick={() => session.simulateMyMatch()}
      class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm disabled:opacity-40 disabled:pointer-events-none"
      disabled={!canSimulateMyMatch}
    >
      Play My Match
    </button>
    <button
      onclick={() => session.simulateRound()}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-40 disabled:pointer-events-none"
      disabled={!canSimulate}
    >
      Simulate Remaining
    </button>
  </div>
{/if}
