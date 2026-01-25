import { generateLeagueSchedule, getSortedStandings } from '$lib/app/league';
import type { MatchFixture, Round, Schedule } from '$lib/domain/league';
import { simulateMatch, type Team } from '$lib/match';
import {
  applyRoundResults,
  createSeasonState,
  getCurrentRound,
  getUserMatchInRound,
  getUserTeam,
  isRoundComplete,
  advanceRound,
} from '$lib/domain/season/season';
import type { MatchResult, SeasonState, TeamId } from '$lib/domain/season/types';
import type {
  LeagueSchedule,
  MyTeamDashboard,
  MyTeamLastResult,
  MyTeamNextMatch,
  SeasonFixtureView,
  SeasonResultView,
  SeasonView,
  SimulateCurrentRoundOptions,
  StartNewSeasonInput,
  TeamInfo,
} from './types';

export function startNewSeason(input: StartNewSeasonInput): SeasonState {
  const { teams, seed, schedule, config } = input;
  const seasonSchedule = schedule ?? toDomainSchedule(generateLeagueSchedule({ teams, seed, config }));
  return createSeasonState({ teams, schedule: seasonSchedule, seed });
}

export function simulateCurrentRound(
  state: SeasonState,
  options: SimulateCurrentRoundOptions = {}
): SeasonState {
  if (isRoundComplete(state, state.currentRoundIndex)) {
    // NO-OP: current round already complete.
    return state;
  }
  const { roundIndex, fixtures } = getCurrentRound(state);
  if (fixtures.length === 0) {
    // NO-OP: no fixtures in the current round.
    return state;
  }
  const ratings = options.baseRatings ?? { attack: 70, defense: 70, midfield: 70 };
  const teamMap = new Map(state.teams.map((team) => [team.id, team]));
  const existingResults = new Map(
    (state.resultsByRound[roundIndex] ?? []).map((result) => [
      `${result.homeTeamId}:${result.awayTeamId}`,
      result,
    ])
  );

  const combinedResults: MatchResult[] = fixtures.map((fixture, index) => {
    const existing = existingResults.get(`${fixture.homeTeamId}:${fixture.awayTeamId}`);
    if (existing) return existing;

    const homeInfo = teamMap.get(fixture.homeTeamId);
    const awayInfo = teamMap.get(fixture.awayTeamId);
    if (!homeInfo || !awayInfo) {
      throw new Error('Fixture references unknown team.');
    }
    const seed = state.meta.seed + roundIndex * 100 + index;
    const matchResult = simulateMatch(toMatchTeam(homeInfo, ratings), toMatchTeam(awayInfo, ratings), { seed });
    return {
      homeTeamId: matchResult.homeTeam.id,
      awayTeamId: matchResult.awayTeam.id,
      homeGoals: matchResult.homeGoals,
      awayGoals: matchResult.awayGoals,
      stats: matchResult.stats,
    };
  });

  const updated = applyRoundResults(state, roundIndex, combinedResults);
  if (isRoundComplete(updated, roundIndex)) {
    return advanceRound(updated);
  }
  return updated;
}

export function setUserTeam(state: SeasonState, teamId: TeamId): SeasonState {
  if (!state.teams.some((team) => team.id === teamId)) {
    return state;
  }
  return {
    ...state,
    userTeamId: teamId,
  };
}

export function simulateMyMatchOnly(
  state: SeasonState,
  options: SimulateCurrentRoundOptions = {}
): SeasonState {
  if (isRoundComplete(state, state.currentRoundIndex)) {
    // NO-OP: current round already complete.
    return state;
  }
  if (!state.userTeamId) return state;
  const roundIndex = state.currentRoundIndex;
  const round = state.schedule.rounds[roundIndex];
  if (!round) return state;

  const fixtureIndex = round.matches.findIndex(
    (match) => match.homeTeamId === state.userTeamId || match.awayTeamId === state.userTeamId
  );
  if (fixtureIndex === -1) return state;

  const fixture = round.matches[fixtureIndex];
  const existingResult =
    state.resultsByRound[roundIndex]?.find(
      (match) => match.homeTeamId === fixture.homeTeamId && match.awayTeamId === fixture.awayTeamId
    ) ?? null;
  if (existingResult) {
    // NO-OP: user's match already has a result.
    return state;
  }

  const ratings = options.baseRatings ?? { attack: 70, defense: 70, midfield: 70 };
  const teamMap = new Map(state.teams.map((team) => [team.id, team]));
  const homeInfo = teamMap.get(fixture.homeTeamId);
  const awayInfo = teamMap.get(fixture.awayTeamId);
  if (!homeInfo || !awayInfo) {
    throw new Error('Fixture references unknown team.');
  }

  const seed = state.meta.seed + roundIndex * 100 + fixtureIndex;
  const matchResult = simulateMatch(toMatchTeam(homeInfo, ratings), toMatchTeam(awayInfo, ratings), { seed });
  const result: MatchResult = {
    homeTeamId: matchResult.homeTeam.id,
    awayTeamId: matchResult.awayTeam.id,
    homeGoals: matchResult.homeGoals,
    awayGoals: matchResult.awayGoals,
    stats: matchResult.stats,
  };

  const nextResults = state.resultsByRound.map((roundResults, index) =>
    index === roundIndex ? [...roundResults, result] : roundResults
  );

  const updated = {
    ...state,
    resultsByRound: nextResults,
  };
  if (isRoundComplete(updated, roundIndex)) {
    return advanceRound(updated);
  }
  return updated;
}

export function getMyTeamDashboard(state: SeasonState): MyTeamDashboard | null {
  const userTeam = getUserTeam(state);
  if (!userTeam) return null;

  const standings = getSortedStandings({
    teams: state.teams,
    matches: flattenResults(state.resultsByRound),
  });
  const positionIndex = standings.rows.findIndex((row) => row.teamId === userTeam.id);
  const position = positionIndex >= 0 ? positionIndex + 1 : null;

  const nextMatch = findNextUserMatch(state);
  const lastResults = getLastResults(state, userTeam.id);

  return {
    teamName: userTeam.name,
    position,
    nextMatch,
    lastResults,
  };
}

export function getSeasonView(state: SeasonState): SeasonView {
  const teamMap = new Map(state.teams.map((team) => [team.id, team.name]));
  const currentRound = getCurrentRound(state);
  const fixtures = currentRound.fixtures.map((fixture) => toFixtureView(fixture, teamMap));
  const standings = getSortedStandings({
    teams: state.teams,
    matches: flattenResults(state.resultsByRound),
  });
  const resultsByRound = state.resultsByRound.map((roundResults, index) => ({
    roundIndex: index,
    results: roundResults.map((result) => toResultView(result, teamMap)),
  }));

  return {
    currentRoundIndex: currentRound.roundIndex,
    fixtures,
    standings,
    resultsByRound,
  };
}

function toDomainSchedule(schedule: LeagueSchedule): Schedule {
  const rounds: Round[] = schedule.rounds.map((round) => {
    const matches: MatchFixture[] = [];
    let byeTeamId: string | undefined;

    for (const fixture of round.fixtures) {
      if (fixture.type === 'match') {
        matches.push({
          homeTeamId: fixture.homeTeam.id,
          awayTeamId: fixture.awayTeam.id,
        });
      } else {
        byeTeamId = fixture.byeTeam.id;
      }
    }

    return {
      roundNumber: round.roundNumber,
      matches,
      byeTeamId,
    };
  });

  return { rounds };
}

function toMatchTeam(team: TeamInfo, ratings: { attack: number; defense: number; midfield: number }): Team {
  return {
    id: team.id,
    name: team.name,
    attack: ratings.attack,
    defense: ratings.defense,
    midfield: ratings.midfield,
  };
}

function toFixtureView(fixture: MatchFixture, teamMap: Map<string, string>): SeasonFixtureView {
  return {
    homeTeamId: fixture.homeTeamId,
    awayTeamId: fixture.awayTeamId,
    homeTeamName: teamMap.get(fixture.homeTeamId) ?? fixture.homeTeamId,
    awayTeamName: teamMap.get(fixture.awayTeamId) ?? fixture.awayTeamId,
  };
}

function toResultView(result: MatchResult, teamMap: Map<string, string>): SeasonResultView {
  return {
    homeTeamId: result.homeTeamId,
    awayTeamId: result.awayTeamId,
    homeTeamName: teamMap.get(result.homeTeamId) ?? result.homeTeamId,
    awayTeamName: teamMap.get(result.awayTeamId) ?? result.awayTeamId,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
  };
}

function flattenResults(resultsByRound: MatchResult[][]) {
  return resultsByRound.flat().map((result) => ({
    homeTeamId: result.homeTeamId,
    awayTeamId: result.awayTeamId,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
  }));
}

function findNextUserMatch(state: SeasonState): MyTeamNextMatch | null {
  if (!state.userTeamId) return null;

  for (let roundIndex = state.currentRoundIndex; roundIndex < state.schedule.rounds.length; roundIndex++) {
    const matchInfo = getUserMatchInRound(state, roundIndex);
    if (!matchInfo) continue;
    if (!matchInfo.result) {
      const isHome = matchInfo.fixture.homeTeamId === state.userTeamId;
      const opponentId = isHome ? matchInfo.fixture.awayTeamId : matchInfo.fixture.homeTeamId;
      const opponentName = state.teams.find((team) => team.id === opponentId)?.name ?? opponentId;
      return { roundIndex, opponentName, isHome };
    }
  }

  return null;
}

function getLastResults(state: SeasonState, teamId: TeamId): MyTeamLastResult[] {
  const results: MyTeamLastResult[] = [];
  for (let roundIndex = 0; roundIndex < state.resultsByRound.length; roundIndex++) {
    for (const result of state.resultsByRound[roundIndex]) {
      const isHome = result.homeTeamId === teamId;
      const isAway = result.awayTeamId === teamId;
      if (!isHome && !isAway) continue;
      const opponentId = isHome ? result.awayTeamId : result.homeTeamId;
      const opponentName = state.teams.find((team) => team.id === opponentId)?.name ?? opponentId;
      const goalsFor = isHome ? result.homeGoals : result.awayGoals;
      const goalsAgainst = isHome ? result.awayGoals : result.homeGoals;
      const outcome = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
      results.push({ roundIndex, opponentName, isHome, goalsFor, goalsAgainst, outcome });
    }
  }

  return results.slice(-5).reverse();
}
