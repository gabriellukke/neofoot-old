import { describe, it, expect } from 'vitest';
import { createEmptyStandings, applyMatchToStandings, sortStandings } from './standings';
import type { TeamRef, StandingsTable, MatchResultInput } from './types';

function createTeams(count: number): TeamRef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
  }));
}

describe('createEmptyStandings', () => {
  it('should create standings with all zeros for each team', () => {
    const teams = createTeams(4);
    const table = createEmptyStandings(teams);

    expect(table.rows.length).toBe(4);
    for (const row of table.rows) {
      expect(row.played).toBe(0);
      expect(row.won).toBe(0);
      expect(row.drawn).toBe(0);
      expect(row.lost).toBe(0);
      expect(row.goalsFor).toBe(0);
      expect(row.goalsAgainst).toBe(0);
      expect(row.goalDifference).toBe(0);
      expect(row.points).toBe(0);
    }
  });

  it('should preserve team ids', () => {
    const teams = createTeams(3);
    const table = createEmptyStandings(teams);

    expect(table.rows.map((r) => r.teamId)).toEqual(['team-1', 'team-2', 'team-3']);
  });
});

describe('applyMatchToStandings', () => {
  it('should update winner with 3 points and loser with 0', () => {
    const teams = createTeams(2);
    let table = createEmptyStandings(teams);

    const match: MatchResultInput = {
      homeTeamId: 'team-1',
      awayTeamId: 'team-2',
      homeGoals: 2,
      awayGoals: 1,
    };

    table = applyMatchToStandings(table, match);

    const home = table.rows.find((r) => r.teamId === 'team-1')!;
    const away = table.rows.find((r) => r.teamId === 'team-2')!;

    expect(home.won).toBe(1);
    expect(home.lost).toBe(0);
    expect(home.drawn).toBe(0);
    expect(home.points).toBe(3);
    expect(home.goalsFor).toBe(2);
    expect(home.goalsAgainst).toBe(1);

    expect(away.won).toBe(0);
    expect(away.lost).toBe(1);
    expect(away.drawn).toBe(0);
    expect(away.points).toBe(0);
    expect(away.goalsFor).toBe(1);
    expect(away.goalsAgainst).toBe(2);
  });

  it('should update both teams with 1 point each for a draw', () => {
    const teams = createTeams(2);
    let table = createEmptyStandings(teams);

    const match: MatchResultInput = {
      homeTeamId: 'team-1',
      awayTeamId: 'team-2',
      homeGoals: 1,
      awayGoals: 1,
    };

    table = applyMatchToStandings(table, match);

    const home = table.rows.find((r) => r.teamId === 'team-1')!;
    const away = table.rows.find((r) => r.teamId === 'team-2')!;

    expect(home.drawn).toBe(1);
    expect(home.points).toBe(1);
    expect(away.drawn).toBe(1);
    expect(away.points).toBe(1);
  });

  it('should correctly update away team as winner', () => {
    const teams = createTeams(2);
    let table = createEmptyStandings(teams);

    const match: MatchResultInput = {
      homeTeamId: 'team-1',
      awayTeamId: 'team-2',
      homeGoals: 0,
      awayGoals: 3,
    };

    table = applyMatchToStandings(table, match);

    const home = table.rows.find((r) => r.teamId === 'team-1')!;
    const away = table.rows.find((r) => r.teamId === 'team-2')!;

    expect(home.lost).toBe(1);
    expect(home.points).toBe(0);
    expect(away.won).toBe(1);
    expect(away.points).toBe(3);
  });

  describe('invariants', () => {
    it('should maintain played = won + drawn + lost', () => {
      const teams = createTeams(2);
      let table = createEmptyStandings(teams);

      const matches: MatchResultInput[] = [
        { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 2, awayGoals: 0 },
        { homeTeamId: 'team-2', awayTeamId: 'team-1', homeGoals: 1, awayGoals: 1 },
        { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 0, awayGoals: 1 },
      ];

      for (const match of matches) {
        table = applyMatchToStandings(table, match);
      }

      for (const row of table.rows) {
        expect(row.played).toBe(row.won + row.drawn + row.lost);
      }
    });

    it('should maintain points = won*3 + drawn', () => {
      const teams = createTeams(2);
      let table = createEmptyStandings(teams);

      const matches: MatchResultInput[] = [
        { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 2, awayGoals: 0 },
        { homeTeamId: 'team-2', awayTeamId: 'team-1', homeGoals: 1, awayGoals: 1 },
      ];

      for (const match of matches) {
        table = applyMatchToStandings(table, match);
      }

      for (const row of table.rows) {
        expect(row.points).toBe(row.won * 3 + row.drawn);
      }
    });

    it('should maintain goalDifference = goalsFor - goalsAgainst', () => {
      const teams = createTeams(2);
      let table = createEmptyStandings(teams);

      const matches: MatchResultInput[] = [
        { homeTeamId: 'team-1', awayTeamId: 'team-2', homeGoals: 3, awayGoals: 1 },
        { homeTeamId: 'team-2', awayTeamId: 'team-1', homeGoals: 2, awayGoals: 2 },
      ];

      for (const match of matches) {
        table = applyMatchToStandings(table, match);
      }

      for (const row of table.rows) {
        expect(row.goalDifference).toBe(row.goalsFor - row.goalsAgainst);
      }
    });
  });
});

describe('sortStandings', () => {
  it('should sort by points descending', () => {
    const table: StandingsTable = {
      rows: [
        createRow('team-1', { points: 3 }),
        createRow('team-2', { points: 9 }),
        createRow('team-3', { points: 6 }),
      ],
    };

    const sorted = sortStandings(table);
    expect(sorted.rows.map((r) => r.teamId)).toEqual(['team-2', 'team-3', 'team-1']);
  });

  it('should use goal difference as tiebreaker', () => {
    const table: StandingsTable = {
      rows: [
        createRow('team-1', { points: 6, goalDifference: 2 }),
        createRow('team-2', { points: 6, goalDifference: 5 }),
        createRow('team-3', { points: 6, goalDifference: -1 }),
      ],
    };

    const sorted = sortStandings(table);
    expect(sorted.rows.map((r) => r.teamId)).toEqual(['team-2', 'team-1', 'team-3']);
  });

  it('should use goals for as second tiebreaker', () => {
    const table: StandingsTable = {
      rows: [
        createRow('team-1', { points: 6, goalDifference: 2, goalsFor: 5 }),
        createRow('team-2', { points: 6, goalDifference: 2, goalsFor: 8 }),
        createRow('team-3', { points: 6, goalDifference: 2, goalsFor: 3 }),
      ],
    };

    const sorted = sortStandings(table);
    expect(sorted.rows.map((r) => r.teamId)).toEqual(['team-2', 'team-1', 'team-3']);
  });

  it('should use team id as final tiebreaker for stability', () => {
    const table: StandingsTable = {
      rows: [
        createRow('team-c', { points: 6, goalDifference: 2, goalsFor: 5 }),
        createRow('team-a', { points: 6, goalDifference: 2, goalsFor: 5 }),
        createRow('team-b', { points: 6, goalDifference: 2, goalsFor: 5 }),
      ],
    };

    const sorted = sortStandings(table);
    expect(sorted.rows.map((r) => r.teamId)).toEqual(['team-a', 'team-b', 'team-c']);
  });
});

function createRow(
  teamId: string,
  overrides: Partial<{
    points: number;
    goalDifference: number;
    goalsFor: number;
    goalsAgainst: number;
  }> = {}
) {
  const goalsFor = overrides.goalsFor ?? 0;
  const goalsAgainst = overrides.goalsAgainst ?? 0;
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor,
    goalsAgainst,
    goalDifference: overrides.goalDifference ?? goalsFor - goalsAgainst,
    points: overrides.points ?? 0,
  };
}
