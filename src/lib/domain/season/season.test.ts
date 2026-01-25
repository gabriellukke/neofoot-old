import { describe, it, expect } from 'vitest';
import {
  applyRoundResults,
  advanceRound,
  createSeasonState,
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
  it('should not advance past the final round', () => {
    const state = createSeasonState({ teams, schedule, seed: 1 });
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
