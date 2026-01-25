import { describe, it, expect } from 'vitest';
import { generateRoundRobinSchedule } from '$lib/domain/league';
import { simulateCurrentRound, startNewSeason } from './season';
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
});
