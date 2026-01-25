import type { MatchFixture } from '$lib/domain/league';
import { applyMatchToStandings, createEmptyStandings, sortStandings } from '$lib/domain/league';
import type { CreateSeasonStateInput, MatchResult, SeasonState } from './types';

const SEASON_VERSION = '0.1';

export function createSeasonState(input: CreateSeasonStateInput): SeasonState {
  const { teams, schedule, seed } = input;
  return {
    teams: [...teams],
    schedule,
    currentRoundIndex: 0,
    resultsByRound: schedule.rounds.map(() => []),
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

export function getStandingsFromSeason(state: SeasonState) {
  let table = createEmptyStandings(state.teams);
  for (const roundResults of state.resultsByRound) {
    for (const result of roundResults) {
      table = applyMatchToStandings(table, result);
    }
  }
  return sortStandings(table);
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
