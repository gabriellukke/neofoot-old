import type { MatchFixture } from '$lib/domain/league';
import { applyMatchToStandings, createEmptyStandings, sortStandings } from '$lib/domain/league';
import type {
  CreateSeasonStateInput,
  MatchResult,
  SeasonState,
  SeasonTeam,
  UserMatchInRound,
} from './types';

const SEASON_VERSION = '0.1';

export function createSeasonState(input: CreateSeasonStateInput): SeasonState {
  const { teams, schedule, seed } = input;
  return {
    teams: [...teams],
    schedule,
    currentRoundIndex: 0,
    resultsByRound: schedule.rounds.map(() => []),
    userTeamId: undefined,
    meta: {
      seed,
      version: SEASON_VERSION,
    },
  };
}

export function getCurrentRound(state: SeasonState): { roundIndex: number; fixtures: MatchFixture[] } {
  const round = state.schedule.rounds[state.currentRoundIndex];
  return {
    roundIndex: state.currentRoundIndex,
    fixtures: round ? round.matches : [],
  };
}

export function applyRoundResults(
  state: SeasonState,
  roundIndex: number,
  results: MatchResult[]
): SeasonState {
  const round = state.schedule.rounds[roundIndex];
  if (!round) {
    throw new Error('Round index out of bounds.');
  }

  validateRoundResults(round.matches, results);

  const nextResults = state.resultsByRound.map((roundResults, index) =>
    index === roundIndex ? results.map((result) => ({ ...result })) : roundResults
  );

  return {
    ...state,
    resultsByRound: nextResults,
  };
}

export function advanceRound(state: SeasonState): SeasonState {
  if (!isRoundComplete(state, state.currentRoundIndex)) {
    // NO-OP: cannot advance while current round is incomplete.
    return state;
  }
  if (state.currentRoundIndex >= state.schedule.rounds.length - 1) {
    return state;
  }

  return {
    ...state,
    currentRoundIndex: state.currentRoundIndex + 1,
  };
}

export function isSeasonFinished(state: SeasonState): boolean {
  return state.schedule.rounds.every(
    (round, index) => (state.resultsByRound[index]?.length ?? 0) === round.matches.length
  );
}

export function getRoundProgress(state: SeasonState, roundIndex: number) {
  const round = state.schedule.rounds[roundIndex];
  const fixturesCount = round ? round.matches.length : 0;
  const resultsCount = state.resultsByRound[roundIndex]?.length ?? 0;

  return {
    fixturesCount,
    resultsCount,
    isComplete: fixturesCount > 0 && resultsCount === fixturesCount,
  };
}

export function isRoundComplete(state: SeasonState, roundIndex: number): boolean {
  return getRoundProgress(state, roundIndex).isComplete;
}

export function getStandingsFromSeason(state: SeasonState) {
  let table = createEmptyStandings(state.teams);
  for (const roundResults of state.resultsByRound) {
    for (const result of roundResults) {
      table = applyMatchToStandings(table, result);
    }
  }
  return sortStandings(table);
}

export function getUserTeam(state: SeasonState): SeasonTeam | null {
  if (!state.userTeamId) return null;
  return state.teams.find((team) => team.id === state.userTeamId) ?? null;
}

export function getUserMatchInRound(state: SeasonState, roundIndex: number): UserMatchInRound | null {
  if (!state.userTeamId) return null;
  const round = state.schedule.rounds[roundIndex];
  if (!round) return null;
  const fixture = round.matches.find(
    (match) => match.homeTeamId === state.userTeamId || match.awayTeamId === state.userTeamId
  );
  if (!fixture) return null;
  const result =
    state.resultsByRound[roundIndex]?.find(
      (match) =>
        match.homeTeamId === fixture.homeTeamId && match.awayTeamId === fixture.awayTeamId
    ) ?? null;

  return { roundIndex, fixture, result };
}

function validateRoundResults(fixtures: MatchFixture[], results: MatchResult[]) {
  if (results.length !== fixtures.length) {
    throw new Error('Results must match fixture count.');
  }

  const fixtureKeys = new Set(fixtures.map((fixture) => fixtureKey(fixture.homeTeamId, fixture.awayTeamId)));
  const resultKeys = results.map((result) => fixtureKey(result.homeTeamId, result.awayTeamId));
  const uniqueResultKeys = new Set(resultKeys);

  if (uniqueResultKeys.size !== results.length) {
    throw new Error('Results contain duplicate fixtures.');
  }

  for (const resultKey of resultKeys) {
    if (!fixtureKeys.has(resultKey)) {
      throw new Error('Results must correspond to scheduled fixtures.');
    }
  }
}

function fixtureKey(homeTeamId: string, awayTeamId: string): string {
  return `${homeTeamId}:${awayTeamId}`;
}
