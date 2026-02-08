import { describe, it, expect } from 'vitest';
import { getSortedStandings } from './getSortedStandings';
import type { TeamInfo } from './types';
import type { MatchResultInput } from '$lib/domain/league';

function createTeams(count: number): TeamInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
  }));
}

describe('getSortedStandings', () => {
  it('should update win and loss with points', () => {
    const teams = createTeams(2);
    const matches: MatchResultInput[] = [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 2, awayGoals: 1 },
    ];

    const table = getSortedStandings({ teams, matches });
    const home = table.rows.find((row) => row.teamId === 'team-1')!;
    const away = table.rows.find((row) => row.teamId === 'team-2')!;

    expect(home.won).toBe(1);
    expect(home.lost).toBe(0);
    expect(home.drawn).toBe(0);
    expect(home.points).toBe(3);
    expect(home.teamName).toBe('Team 1');

    expect(away.won).toBe(0);
    expect(away.lost).toBe(1);
    expect(away.drawn).toBe(0);
    expect(away.points).toBe(0);
  });

  it('should update draw with points', () => {
    const teams = createTeams(2);
    const matches: MatchResultInput[] = [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 1, awayGoals: 1 },
    ];

    const table = getSortedStandings({ teams, matches });
    const home = table.rows.find((row) => row.teamId === 'team-1')!;
    const away = table.rows.find((row) => row.teamId === 'team-2')!;

    expect(home.drawn).toBe(1);
    expect(home.points).toBe(1);
    expect(away.drawn).toBe(1);
    expect(away.points).toBe(1);
  });

  it('should keep invariants for played, points, and goal difference', () => {
    const teams = createTeams(2);
    const matches: MatchResultInput[] = [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 2, awayGoals: 0 },
      { homeTeamId: 'team-2', awayTeamId: 'team-1', homeGoals: 1, awayGoals: 1 },
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 0, awayGoals: 1 },
    ];

    const table = getSortedStandings({ teams, matches });
    for (const row of table.rows) {
      expect(row.played).toBe(row.won + row.drawn + row.lost);
      expect(row.points).toBe(row.won * 3 + row.drawn);
      expect(row.goalDifference).toBe(row.goalsFor - row.goalsAgainst);
    }
  });

  it('should sort by points, goal difference, then goals for', () => {
    const teams = createTeams(3);
    const matches: MatchResultInput[] = [
      { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 2, awayGoals: 0 },
      { homeTeamId: 'team-2', awayTeamId: 'team-3', homeGoals: 3, awayGoals: 1 },
      { homeTeamId: 'team-3', awayTeamId: 'team-1', homeGoals: 4, awayGoals: 2 },
    ];

    const table = getSortedStandings({ teams, matches });
    expect(table.rows.map((row) => row.teamId)).toEqual(['team-3', 'team-1', 'team-2']);
  });
});
