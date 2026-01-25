<script lang="ts">
  import type { TeamInfo } from '$lib/app/league';
  import { getSeasonView, simulateCurrentRound, startNewSeason } from '$lib/app/season';
  import type { SeasonState } from '$lib/domain/season';
  import { advanceRound } from '$lib/domain/season';

  type HistoryMatch = {
    id: string;
    roundIndex: number;
    homeTeamId: string;
    awayTeamId: string;
    homeTeamName: string;
    awayTeamName: string;
    homeGoals: number;
    awayGoals: number;
    stats?: {
      shotsHome: number;
      shotsAway: number;
      shotsOnTargetHome: number;
      shotsOnTargetAway: number;
      possessionHome: number;
      possessionAway: number;
    };
    events?: {
      minute: number;
      type: string;
      team: 'home' | 'away';
      description: string;
    }[];
  };

  let teams = $state<TeamInfo[]>([
    { id: 'team-1', name: 'Arsenal' },
    { id: 'team-2', name: 'Chelsea' },
    { id: 'team-3', name: 'Liverpool' },
    { id: 'team-4', name: 'Manchester City' },
    { id: 'team-5', name: 'Manchester United' },
    { id: 'team-6', name: 'Tottenham' },
    { id: 'team-7', name: 'Leicester' },
    { id: 'team-8', name: 'West Ham' },
    { id: 'team-9', name: 'Aston Villa' },
    { id: 'team-10', name: 'Fulham' },
  ]);

  let seed = $state(42);
  let seasonState = $state<SeasonState | null>(null);
  let nextId = $state(7);
  let selectedHistoryRoundIndex = $state<number | null>(null);
  let selectedMatchId = $state<string | null>(null);
  let teamFilterId = $state('all');
  let searchQuery = $state('');

  const seasonView = $derived(seasonState ? getSeasonView(seasonState) : null);
  const totalRounds = $derived(seasonState ? seasonState.schedule.rounds.length : 0);
  const currentRoundIndex = $derived(seasonState?.currentRoundIndex ?? 0);
  const currentRoundMatches = $derived(
    seasonState ? seasonState.schedule.rounds[seasonState.currentRoundIndex]?.matches.length ?? 0 : 0
  );
  const currentRoundResults = $derived(
    seasonState ? seasonState.resultsByRound[seasonState.currentRoundIndex]?.length ?? 0 : 0
  );
  const canSimulate = $derived(!!seasonState && currentRoundMatches > 0 && currentRoundResults < currentRoundMatches);
  const canAdvance = $derived(!!seasonState && seasonState.currentRoundIndex < totalRounds - 1);
  const historyRounds = $derived(buildHistoryRounds(seasonState));
  const selectedHistoryRound = $derived(
    historyRounds.find((round) => round.roundIndex === selectedHistoryRoundIndex) ?? null
  );
  const filteredMatches = $derived(filterHistoryMatches(selectedHistoryRound, teamFilterId, searchQuery));
  const selectedMatch = $derived(filteredMatches.find((match) => match.id === selectedMatchId) ?? null);
  const selectedMatchIndex = $derived(
    selectedMatch ? filteredMatches.findIndex((match) => match.id === selectedMatch.id) : -1
  );
  const canNavigatePrev = $derived(selectedMatchIndex > 0);
  const canNavigateNext = $derived(selectedMatchIndex >= 0 && selectedMatchIndex < filteredMatches.length - 1);

  function startSeason() {
    seasonState = startNewSeason({ teams, seed });
  }

  function resetSeason() {
    seasonState = null;
  }

  function addTeam() {
    teams = [...teams, { id: `team-${nextId}`, name: `Team ${nextId}` }];
    nextId++;
  }

  function removeTeam(id: string) {
    teams = teams.filter((t) => t.id !== id);
  }

  function updateTeamName(id: string, name: string) {
    teams = teams.map((t) => (t.id === id ? { ...t, name } : t));
  }

  function toggleOddTeams() {
    if (teams.length === 6) {
      teams = [...teams, { id: `team-${nextId}`, name: `Team ${nextId}` }];
      nextId++;
    } else if (teams.length === 7) {
      teams = teams.slice(0, 6);
    }
  }

  function simulateRound() {
    if (!seasonState) return;
    seasonState = simulateCurrentRound(seasonState);
  }

  function advanceToNextRound() {
    if (!seasonState) return;
    seasonState = advanceRound(seasonState);
  }

  $effect(() => {
    if (historyRounds.length === 0) {
      selectedHistoryRoundIndex = null;
      selectedMatchId = null;
      return;
    }
    if (
      selectedHistoryRoundIndex === null ||
      !historyRounds.some((round) => round.roundIndex === selectedHistoryRoundIndex)
    ) {
      selectedHistoryRoundIndex = historyRounds[historyRounds.length - 1].roundIndex;
      selectedMatchId = null;
    }
  });

  $effect(() => {
    if (!selectedHistoryRound) {
      selectedMatchId = null;
      return;
    }
    if (filteredMatches.length === 0) {
      selectedMatchId = null;
      return;
    }
    if (!selectedMatchId || !filteredMatches.some((match) => match.id === selectedMatchId)) {
      selectedMatchId = filteredMatches[0].id;
    }
  });

  function buildHistoryRounds(state: SeasonState | null) {
    if (!state) return [];
    const teamMap = new Map(state.teams.map((team) => [team.id, team.name]));
    const rounds: { roundIndex: number; matches: HistoryMatch[] }[] = [];

    for (let roundIndex = 0; roundIndex < state.resultsByRound.length; roundIndex++) {
      const roundResults = state.resultsByRound[roundIndex];
      if (roundResults.length === 0) continue;
      const matches = roundResults.map((result) => ({
        id: `${roundIndex}:${result.homeTeamId}:${result.awayTeamId}`,
        roundIndex,
        homeTeamId: result.homeTeamId,
        awayTeamId: result.awayTeamId,
        homeTeamName: teamMap.get(result.homeTeamId) ?? result.homeTeamId,
        awayTeamName: teamMap.get(result.awayTeamId) ?? result.awayTeamId,
        homeGoals: result.homeGoals,
        awayGoals: result.awayGoals,
        stats: result.stats,
        events: [],
      }));
      rounds.push({ roundIndex, matches });
    }

    return rounds;
  }

  function filterHistoryMatches(
    round: { roundIndex: number; matches: HistoryMatch[] } | null,
    teamId: string,
    query: string
  ) {
    if (!round) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return round.matches.filter((match) => {
      const teamMatch =
        teamId === 'all' || match.homeTeamId === teamId || match.awayTeamId === teamId;
      if (!teamMatch) return false;
      if (!normalizedQuery) return true;
      return (
        match.homeTeamName.toLowerCase().includes(normalizedQuery) ||
        match.awayTeamName.toLowerCase().includes(normalizedQuery)
      );
    });
  }

  function formatScore(match: { homeGoals: number; awayGoals: number }) {
    return `${match.homeGoals}–${match.awayGoals}`;
  }

  function handleHistoryKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectPreviousMatch();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectNextMatch();
    }
  }

  function selectPreviousMatch() {
    if (!canNavigatePrev || selectedMatchIndex < 0) return;
    selectedMatchId = filteredMatches[selectedMatchIndex - 1].id;
  }

  function selectNextMatch() {
    if (!canNavigateNext || selectedMatchIndex < 0) return;
    selectedMatchId = filteredMatches[selectedMatchIndex + 1].id;
  }

  function groupEventsByMinute(
    events: { minute: number; type: string; team: 'home' | 'away'; description: string }[]
  ) {
    const grouped = new Map<number, { minute: number; items: typeof events }>();
    for (const event of events) {
      const group = grouped.get(event.minute);
      if (group) {
        group.items.push(event);
      } else {
        grouped.set(event.minute, { minute: event.minute, items: [event] });
      }
    }
    return Array.from(grouped.values()).sort((a, b) => a.minute - b.minute);
  }

  function getMatchOutcome(match: HistoryMatch) {
    if (match.homeGoals > match.awayGoals) return 'Home win';
    if (match.awayGoals > match.homeGoals) return 'Away win';
    return 'Draw';
  }

  function getStatsSummary(match: HistoryMatch) {
    if (!match.stats) return null;
    if (match.stats.shotsHome > match.stats.shotsAway) return 'Home had more shots.';
    if (match.stats.shotsAway > match.stats.shotsHome) return 'Away had more shots.';
    return 'Shots were even.';
  }
</script>

<main class="min-h-screen bg-slate-900 p-8">
  <a href="/lab" class="text-blue-400 hover:text-blue-300 mb-4 inline-block">&larr; Back to Lab</a>

  <h1 class="text-3xl font-bold text-white mb-6">League Season Lab</h1>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <section class="bg-slate-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Teams ({teams.length})</h2>

      <div class="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {#each teams as team (team.id)}
          <div class="flex items-center gap-2">
            <input
              type="text"
              value={team.name}
              oninput={(e) => updateTeamName(team.id, e.currentTarget.value)}
              class="flex-1 px-3 py-1.5 bg-slate-700 text-white rounded border border-slate-600 text-sm"
              disabled={!!seasonState}
            />
            <button
              onclick={() => removeTeam(team.id)}
              class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              disabled={teams.length <= 2 || !!seasonState}
            >
              X
            </button>
          </div>
        {/each}
      </div>

      <div class="flex gap-2 mb-4">
        <button
          onclick={addTeam}
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          disabled={!!seasonState}
        >
          Add Team
        </button>
        <button
          onclick={toggleOddTeams}
          class="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm"
          disabled={!!seasonState}
        >
          {teams.length === 6 ? 'Switch to 7 teams' : teams.length === 7 ? 'Switch to 6 teams' : 'Toggle 6/7'}
        </button>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <label class="text-slate-400 text-sm" for="league-seed-input">Seed:</label>
        <input
          id="league-seed-input"
          type="number"
          bind:value={seed}
          class="w-24 px-3 py-1.5 bg-slate-700 text-white rounded border border-slate-600 text-sm"
          disabled={!!seasonState}
        />
      </div>

      <button
        onclick={startSeason}
        class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
        disabled={!!seasonState || teams.length < 2}
      >
        Start New Season
      </button>
    </section>

    <section class="bg-slate-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Season</h2>

      {#if seasonState && seasonView}
        <div class="flex items-center gap-3 mb-4">
          <p class="text-slate-300 text-sm">
            Round {currentRoundIndex + 1} of {totalRounds}
          </p>
          {#if totalRounds === 0}
            <span class="text-slate-500 text-xs">(No rounds)</span>
          {/if}
        </div>

        <div class="space-y-3 mb-4">
          {#if seasonView.fixtures.length > 0}
            {#each seasonView.fixtures as fixture}
              <div class="flex items-center justify-between bg-slate-700 rounded px-3 py-2 text-sm">
                <div class="text-slate-200">
                  {fixture.homeTeamName} vs {fixture.awayTeamName}
                </div>
              </div>
            {/each}
          {:else}
            <p class="text-slate-500 text-sm">No fixtures for this round.</p>
          {/if}
        </div>

        <div class="flex gap-2">
          <button
            onclick={simulateRound}
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            disabled={!canSimulate}
          >
            Simulate Current Round
          </button>
          <button
            onclick={advanceToNextRound}
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 text-sm"
            disabled={!canAdvance}
          >
            Advance to Next Round
          </button>
        </div>
        <button
          onclick={resetSeason}
          class="mt-3 w-full px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 text-sm"
        >
          Reset Season
        </button>
      {:else}
        <p class="text-slate-400">Click "Start New Season" to create fixtures.</p>
      {/if}
    </section>
  </div>

  <section class="mt-8 bg-slate-800 rounded-lg p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Standings</h2>

    <div class="overflow-x-auto">
      {#if seasonView}
        <table class="w-full text-sm text-slate-200">
          <thead>
            <tr class="text-left text-slate-400 border-b border-slate-700">
              <th class="py-2 pr-2">Pos</th>
              <th class="py-2 pr-2">Team</th>
              <th class="py-2 pr-2">P</th>
              <th class="py-2 pr-2">W</th>
              <th class="py-2 pr-2">D</th>
              <th class="py-2 pr-2">L</th>
              <th class="py-2 pr-2">GF</th>
              <th class="py-2 pr-2">GA</th>
              <th class="py-2 pr-2">GD</th>
              <th class="py-2 pr-2">Pts</th>
            </tr>
          </thead>
          <tbody>
            {#each seasonView.standings.rows as row, index (row.teamId)}
              <tr class="border-b border-slate-700">
                <td class="py-2 pr-2">{index + 1}</td>
                <td class="py-2 pr-2">{row.teamName}</td>
                <td class="py-2 pr-2">{row.played}</td>
                <td class="py-2 pr-2">{row.won}</td>
                <td class="py-2 pr-2">{row.drawn}</td>
                <td class="py-2 pr-2">{row.lost}</td>
                <td class="py-2 pr-2">{row.goalsFor}</td>
                <td class="py-2 pr-2">{row.goalsAgainst}</td>
                <td class="py-2 pr-2">{row.goalDifference}</td>
                <td class="py-2 pr-2 font-semibold">{row.points}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="text-slate-400 text-sm">Start a season to view standings.</p>
      {/if}
    </div>
  </section>

  <section class="mt-8 bg-slate-800 rounded-lg p-6">
    <h2 class="text-xl font-semibold text-white mb-4">History</h2>

    {#if !seasonState}
      <p class="text-slate-400 text-sm">Start a season to view match history.</p>
    {:else if historyRounds.length === 0}
      <p class="text-slate-400 text-sm">No completed rounds yet.</p>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <label class="text-slate-300 text-sm" for="history-round">Round:</label>
            <select
              id="history-round"
              class="px-3 py-1.5 bg-slate-700 text-white rounded border border-slate-600 text-sm"
              onchange={(e) => (selectedHistoryRoundIndex = Number(e.currentTarget.value))}
              value={selectedHistoryRoundIndex ?? 0}
            >
              {#each historyRounds as round}
                <option value={round.roundIndex}>Round {round.roundIndex + 1}</option>
              {/each}
            </select>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <label class="text-slate-300 text-sm flex items-center gap-2" for="history-team">
              Team:
              <select
                id="history-team"
                class="px-3 py-1.5 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                bind:value={teamFilterId}
              >
                <option value="all">All teams</option>
                {#each seasonState.teams as team}
                  <option value={team.id}>{team.name}</option>
                {/each}
              </select>
            </label>

            <label class="text-slate-300 text-sm flex items-center gap-2" for="history-search">
              Search:
              <input
                id="history-search"
                type="text"
                class="px-3 py-1.5 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                placeholder="Team name"
                bind:value={searchQuery}
              />
            </label>
          </div>

          <div
            class="space-y-2"
            tabindex="0"
            role="listbox"
            aria-label="Match list"
            onkeydown={handleHistoryKeydown}
          >
            {#if filteredMatches.length > 0}
              {#each filteredMatches as match}
                <button
                  class={`w-full text-left px-3 py-2 rounded border text-sm ${
                    match.id === selectedMatchId
                      ? 'bg-slate-700 border-slate-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  onclick={() => (selectedMatchId = match.id)}
                >
                  {match.homeTeamName} {formatScore(match)} {match.awayTeamName}
                  <div class="text-xs text-slate-500 mt-1">Round {match.roundIndex + 1}</div>
                </button>
              {/each}
            {:else}
              <p class="text-slate-500 text-sm">No matches for this filter.</p>
            {/if}
          </div>
        </div>

        <div class="bg-slate-900 rounded-lg p-4 border border-slate-700">
          {#if selectedMatch}
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 class="text-white font-semibold text-lg">
                  {selectedMatch.homeTeamName} {formatScore(selectedMatch)} {selectedMatch.awayTeamName}
                </h3>
                <div class="text-slate-400 text-sm">
                  Round {selectedMatch.roundIndex + 1} · Seed {seasonState.meta.seed}
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  class="px-3 py-1.5 rounded bg-slate-700 text-slate-200 text-sm disabled:opacity-50"
                  onclick={selectPreviousMatch}
                  disabled={!canNavigatePrev}
                >
                  Previous match
                </button>
                <button
                  class="px-3 py-1.5 rounded bg-slate-700 text-slate-200 text-sm disabled:opacity-50"
                  onclick={selectNextMatch}
                  disabled={!canNavigateNext}
                >
                  Next match
                </button>
              </div>

              <div class="border-t border-slate-800 pt-3">
                <h4 class="text-slate-200 font-semibold text-sm mb-2">Summary</h4>
                <p class="text-slate-300 text-sm">{getMatchOutcome(selectedMatch)}</p>
                {#if getStatsSummary(selectedMatch)}
                  <p class="text-slate-500 text-sm mt-1">{getStatsSummary(selectedMatch)}</p>
                {/if}
              </div>

              <div class="border-t border-slate-800 pt-3">
                <h4 class="text-slate-200 font-semibold text-sm mb-2">Stats</h4>
                {#if selectedMatch.stats}
                  <div class="grid grid-cols-2 gap-3 text-sm text-slate-200">
                    <div class="bg-slate-800 rounded p-3">
                      <p class="text-slate-400 text-xs mb-1">Shots</p>
                      <p>{selectedMatch.stats.shotsHome} - {selectedMatch.stats.shotsAway}</p>
                    </div>
                    <div class="bg-slate-800 rounded p-3">
                      <p class="text-slate-400 text-xs mb-1">Shots on Target</p>
                      <p>{selectedMatch.stats.shotsOnTargetHome} - {selectedMatch.stats.shotsOnTargetAway}</p>
                    </div>
                    <div class="bg-slate-800 rounded p-3">
                      <p class="text-slate-400 text-xs mb-1">Possession</p>
                      <p>{selectedMatch.stats.possessionHome}% - {selectedMatch.stats.possessionAway}%</p>
                    </div>
                  </div>
                {:else}
                  <p class="text-slate-500 text-sm">No stats available.</p>
                {/if}
              </div>

              <div class="border-t border-slate-800 pt-3">
                <h4 class="text-slate-200 font-semibold text-sm mb-2">Timeline</h4>
                {#if selectedMatch.events && selectedMatch.events.length > 0}
                  {#each groupEventsByMinute(selectedMatch.events) as group}
                    <div class="text-sm text-slate-300 mb-2">
                      <div class="text-slate-400">{group.minute}'</div>
                      {#each group.items as event}
                        <div>
                          {event.minute}' {event.type.toUpperCase()} – {event.team === 'home'
                            ? selectedMatch.homeTeamName
                            : selectedMatch.awayTeamName}
                        </div>
                      {/each}
                    </div>
                  {/each}
                {:else}
                  <p class="text-slate-500 text-sm">No events recorded.</p>
                {/if}
              </div>
            </div>
          {:else}
            <p class="text-slate-400 text-sm">Select a match to see details.</p>
          {/if}
        </div>
      </div>
    {/if}
  </section>
</main>
