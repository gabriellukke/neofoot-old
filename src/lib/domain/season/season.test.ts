import { describe, it, expect } from 'vitest';
import {
  applyRoundResults,
  advanceRound,
  createSeasonState,
  getRoundProgress,
  isRoundComplete,
  getUserMatchInRound,
  getUserTeam,
  getStandingsFromSeason,
  isSeasonFinished,
} from './season';
import type { Schedule } from '$lib/domain/league';

const teams = [
  { id: 'team-1', name: 'Alpha' },
  { id: 'team-2', name: 'Beta' },
];

const schedule: Schedule = {
  rounds: [
    {
      roundNumber: 1,
      matches: [{ homeTeamId: 'team-1', awayTeamId: 'team-2' }],
    },
    {
      roundNumber: 2,
      matches: [{ homeTeamId: 'team-2', awayTeamId: 'team-1' }],
    },
  ],
};

describe('createSeasonState', () => {
  it('should initialize with empty results and metadata', () => {
    const state = createSeasonState({ teams, schedule, seed: 7 });

    expect(state.teams).toEqual(teams);
    expect(state.schedule).toEqual(schedule);
    expect(state.currentRoundIndex).toBe(0);
    expect(state.resultsByRound).toEqual([[], []]);
    expect(state.userTeamId).toBeUndefined();
    expect(state.meta.seed).toBe(7);
    expect(state.meta.version).toBe('0.1');
  });
});

describe('applyRoundResults', () => {
  it('should validate fixture alignment', () => {
    const state = createSeasonState({ teams, schedule, seed: 1 });

    expect(() =>
      applyRoundResults(state, 0, [
        { homeTeamId: 'team-2', awayTeamId: 'team-1', homeGoals: 1, awayGoals: 0 },
      ])
    ).toThrow();
  });
});

describe('advanceRound', () => {
  it('should not advance while current round is incomplete', () => {
    const state = createSeasonState({ teams, schedule, seed: 1 });
    const next = advanceRound(state);

    expect(next).toEqual(state);
  });

  it('should not advance past the final round', () => {
    let state = createSeasonState({ teams, schedule, seed: 1 });
    state = applyRoundResults(state, 0, [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 1, awayGoals: 0 },
    ]);
    const next = advanceRound(state);
    const last = advanceRound(next);
    const stillLast = advanceRound(last);

    expect(next.currentRoundIndex).toBe(1);
    expect(last.currentRoundIndex).toBe(1);
    expect(stillLast.currentRoundIndex).toBe(1);
  });
});

describe('standings and season completion', () => {
  it('should derive standings from season results', () => {
    let state = createSeasonState({ teams, schedule, seed: 3 });
    state = applyRoundResults(state, 0, [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 2, awayGoals: 0 },
    ]);

    const table = getStandingsFromSeason(state);
    const leader = table.rows[0];

    expect(leader.teamId).toBe('team-1');
    expect(leader.points).toBe(3);
    expect(leader.won).toBe(1);
  });

  it('should report season finished only when all rounds are complete', () => {
    let state = createSeasonState({ teams, schedule, seed: 5 });
    expect(isSeasonFinished(state)).toBe(false);

    state = applyRoundResults(state, 0, [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 1, awayGoals: 0 },
    ]);
    expect(isSeasonFinished(state)).toBe(false);

    state = applyRoundResults(state, 1, [
      { homeTeamId: 'team-2', awayTeamId: 'team-1', homeGoals: 1, awayGoals: 1 },
    ]);
    expect(isSeasonFinished(state)).toBe(true);
  });
});

describe('round progress helpers', () => {
  it('should return progress and completion status', () => {
    let state = createSeasonState({ teams, schedule, seed: 2 });
    const initial = getRoundProgress(state, 0);

    expect(initial.fixturesCount).toBe(1);
    expect(initial.resultsCount).toBe(0);
    expect(initial.isComplete).toBe(false);

    state = applyRoundResults(state, 0, [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 0, awayGoals: 0 },
    ]);
    const completed = getRoundProgress(state, 0);

    expect(completed.resultsCount).toBe(1);
    expect(isRoundComplete(state, 0)).toBe(true);
  });
});

describe('user team helpers', () => {
  it('should return the selected user team', () => {
    const state = createSeasonState({ teams, schedule, seed: 9 });
    const withUser = { ...state, userTeamId: 'team-1' };
    const userTeam = getUserTeam(withUser);

    expect(userTeam?.id).toBe('team-1');
  });

  it('should return the user match in a round when available', () => {
    const state = createSeasonState({ teams, schedule, seed: 9 });
    const withUser = { ...state, userTeamId: 'team-2' };
    const matchInfo = getUserMatchInRound(withUser, 0);

    expect(matchInfo?.fixture.homeTeamId).toBe('team-1');
    expect(matchInfo?.fixture.awayTeamId).toBe('team-2');
    expect(matchInfo?.result).toBeNull();
  });
});
