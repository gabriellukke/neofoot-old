import { describe, it, expect } from 'vitest';
import { generateRoundRobinSchedule } from '$lib/domain/league';
import { getSeasonView, setUserTeam, simulateCurrentRound, simulateMyMatchOnly, startNewSeason } from './season';
import type { TeamInfo } from '$lib/app/league';

const teams: TeamInfo[] = [
  { id: 'team-1', name: 'Alpha' },
  { id: 'team-2', name: 'Beta' },
  { id: 'team-3', name: 'Gamma' },
  { id: 'team-4', name: 'Delta' },
];

describe('simulateCurrentRound', () => {
  it('should be deterministic for the same seed and schedule', () => {
    const seed = 11;
    const schedule = generateRoundRobinSchedule(teams, { seed });
    const baseState = startNewSeason({ teams, seed, schedule });

    const firstRun = simulateCurrentRound(baseState);
    const secondRun = simulateCurrentRound(baseState);

    expect(firstRun).toEqual(secondRun);
  });

  it('should auto-advance when the round is complete', () => {
    const seed = 18;
    const schedule = generateRoundRobinSchedule(teams, { seed });
    const baseState = startNewSeason({ teams, seed, schedule });

    const updated = simulateCurrentRound(baseState);
    expect(updated.currentRoundIndex).toBe(1);
  });

  it('should be a no-op when the current round is already complete', () => {
    const seed = 22;
    const schedule = generateRoundRobinSchedule(teams.slice(0, 2), { seed });
    const baseState = startNewSeason({ teams: teams.slice(0, 2), seed, schedule });
    const completed = simulateCurrentRound(baseState);
    const noOp = simulateCurrentRound(completed);

    expect(noOp).toEqual(completed);
  });
});

describe('setUserTeam', () => {
  it('should set userTeamId without changing other state', () => {
    const seed = 12;
    const schedule = generateRoundRobinSchedule(teams, { seed });
    const baseState = startNewSeason({ teams, seed, schedule });
    const updated = setUserTeam(baseState, 'team-2');

    expect(updated.userTeamId).toBe('team-2');
    expect(updated.schedule).toEqual(baseState.schedule);
    expect(updated.resultsByRound).toEqual(baseState.resultsByRound);
  });
});

describe('simulateMyMatchOnly', () => {
  it('should simulate only the user match in the current round', () => {
    const seed = 15;
    const schedule = generateRoundRobinSchedule(teams, { seed });
    let state = startNewSeason({ teams, seed, schedule });
    state = setUserTeam(state, 'team-1');

    const updated = simulateMyMatchOnly(state);
    const roundResults = updated.resultsByRound[updated.currentRoundIndex];

    expect(roundResults.length).toBe(1);
  });

  it('should not advance when other matches remain', () => {
    const seed = 19;
    const schedule = generateRoundRobinSchedule(teams, { seed });
    let state = startNewSeason({ teams, seed, schedule });
    state = setUserTeam(state, 'team-1');

    const updated = simulateMyMatchOnly(state);

    expect(updated.currentRoundIndex).toBe(state.currentRoundIndex);
  });

  it('should update standings based on only the simulated match', () => {
    const seed = 21;
    const schedule = generateRoundRobinSchedule(teams, { seed });
    let state = startNewSeason({ teams, seed, schedule });
    state = setUserTeam(state, 'team-1');

    const updated = simulateMyMatchOnly(state);
    const view = getSeasonView(updated);
    const totalPlayed = view.standings.rows.reduce((sum, row) => sum + row.played, 0);

    expect(totalPlayed).toBe(2);
  });

  it('should be deterministic for the same seed and state', () => {
    const seed = 33;
    const schedule = generateRoundRobinSchedule(teams, { seed });
    let state = startNewSeason({ teams, seed, schedule });
    state = setUserTeam(state, 'team-1');

    const firstRun = simulateMyMatchOnly(state);
    const secondRun = simulateMyMatchOnly(state);

    expect(firstRun).toEqual(secondRun);
  });
});
