import { describe, it, expect } from 'vitest';
import { generateRoundRobinSchedule } from './generateSchedule';
import type { TeamRef } from './types';

function createTeams(count: number): TeamRef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
  }));
}

describe('generateRoundRobinSchedule', () => {
  describe('round count', () => {
    it('should generate N-1 rounds for even number of teams', () => {
      const teams = createTeams(4);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });
      expect(schedule.rounds.length).toBe(3);
    });

    it('should generate N rounds for odd number of teams', () => {
      const teams = createTeams(5);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });
      expect(schedule.rounds.length).toBe(5);
    });

    it('should generate 0 rounds for less than 2 teams', () => {
      expect(generateRoundRobinSchedule([], { seed: 42 }).rounds.length).toBe(0);
      expect(generateRoundRobinSchedule(createTeams(1), { seed: 42 }).rounds.length).toBe(0);
    });

    it('should generate correct rounds for various even team counts', () => {
      expect(generateRoundRobinSchedule(createTeams(6), { seed: 42 }).rounds.length).toBe(5);
      expect(generateRoundRobinSchedule(createTeams(8), { seed: 42 }).rounds.length).toBe(7);
      expect(generateRoundRobinSchedule(createTeams(10), { seed: 42 }).rounds.length).toBe(9);
    });

    it('should generate correct rounds for various odd team counts', () => {
      expect(generateRoundRobinSchedule(createTeams(3), { seed: 42 }).rounds.length).toBe(3);
      expect(generateRoundRobinSchedule(createTeams(7), { seed: 42 }).rounds.length).toBe(7);
      expect(generateRoundRobinSchedule(createTeams(9), { seed: 42 }).rounds.length).toBe(9);
    });
  });

  describe('match count', () => {
    it('should generate N*(N-1)/2 total matches for even N', () => {
      const n = 6;
      const teams = createTeams(n);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });
      const totalMatches = schedule.rounds.reduce((sum, r) => sum + r.matches.length, 0);
      expect(totalMatches).toBe((n * (n - 1)) / 2);
    });

    it('should generate N*(N-1)/2 total matches for odd N', () => {
      const n = 5;
      const teams = createTeams(n);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });
      const totalMatches = schedule.rounds.reduce((sum, r) => sum + r.matches.length, 0);
      expect(totalMatches).toBe((n * (n - 1)) / 2);
    });

    it('should have correct matches per round for even N', () => {
      const n = 8;
      const teams = createTeams(n);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });
      for (const round of schedule.rounds) {
        expect(round.matches.length).toBe(n / 2);
      }
    });

    it('should have correct matches per round for odd N', () => {
      const n = 7;
      const teams = createTeams(n);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });
      for (const round of schedule.rounds) {
        expect(round.matches.length).toBe((n - 1) / 2);
      }
    });
  });

  describe('pair uniqueness', () => {
    it('should have each pair of teams appear exactly once', () => {
      const teams = createTeams(6);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      const pairs = new Set<string>();
      for (const round of schedule.rounds) {
        for (const match of round.matches) {
          const pair = [match.homeTeamId, match.awayTeamId].sort().join('-');
          expect(pairs.has(pair)).toBe(false);
          pairs.add(pair);
        }
      }

      const expectedPairs = (6 * 5) / 2;
      expect(pairs.size).toBe(expectedPairs);
    });

    it('should have each pair appear exactly once for odd N', () => {
      const teams = createTeams(5);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      const pairs = new Set<string>();
      for (const round of schedule.rounds) {
        for (const match of round.matches) {
          const pair = [match.homeTeamId, match.awayTeamId].sort().join('-');
          expect(pairs.has(pair)).toBe(false);
          pairs.add(pair);
        }
      }

      const expectedPairs = (5 * 4) / 2;
      expect(pairs.size).toBe(expectedPairs);
    });
  });

  describe('no duplicate teams per round', () => {
    it('should have no team play more than once per round (even N)', () => {
      const teams = createTeams(8);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      for (const round of schedule.rounds) {
        const teamsInRound = new Set<string>();
        for (const match of round.matches) {
          expect(teamsInRound.has(match.homeTeamId)).toBe(false);
          expect(teamsInRound.has(match.awayTeamId)).toBe(false);
          teamsInRound.add(match.homeTeamId);
          teamsInRound.add(match.awayTeamId);
        }
      }
    });

    it('should have no team play more than once per round (odd N)', () => {
      const teams = createTeams(7);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      for (const round of schedule.rounds) {
        const teamsInRound = new Set<string>();
        for (const match of round.matches) {
          expect(teamsInRound.has(match.homeTeamId)).toBe(false);
          expect(teamsInRound.has(match.awayTeamId)).toBe(false);
          teamsInRound.add(match.homeTeamId);
          teamsInRound.add(match.awayTeamId);
        }
        if (round.byeTeamId) {
          expect(teamsInRound.has(round.byeTeamId)).toBe(false);
        }
      }
    });
  });

  describe('BYE handling for odd N', () => {
    it('should have exactly one BYE team per round for odd N', () => {
      const teams = createTeams(5);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      for (const round of schedule.rounds) {
        expect(round.byeTeamId).toBeDefined();
        expect(typeof round.byeTeamId).toBe('string');
      }
    });

    it('should have no BYE for even N', () => {
      const teams = createTeams(6);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      for (const round of schedule.rounds) {
        expect(round.byeTeamId).toBeUndefined();
      }
    });

    it('should have each team get exactly one BYE across all rounds (odd N)', () => {
      const teams = createTeams(5);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      const byeCounts = new Map<string, number>();
      for (const team of teams) {
        byeCounts.set(team.id, 0);
      }

      for (const round of schedule.rounds) {
        if (round.byeTeamId) {
          byeCounts.set(round.byeTeamId, (byeCounts.get(round.byeTeamId) ?? 0) + 1);
        }
      }

      for (const team of teams) {
        expect(byeCounts.get(team.id)).toBe(1);
      }
    });

    it('should distribute BYEs correctly for various odd team counts', () => {
      for (const n of [3, 5, 7, 9]) {
        const teams = createTeams(n);
        const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

        const byeCounts = new Map<string, number>();
        for (const team of teams) {
          byeCounts.set(team.id, 0);
        }

        for (const round of schedule.rounds) {
          if (round.byeTeamId) {
            byeCounts.set(round.byeTeamId, (byeCounts.get(round.byeTeamId) ?? 0) + 1);
          }
        }

        for (const team of teams) {
          expect(byeCounts.get(team.id)).toBe(1);
        }
      }
    });
  });

  describe('determinism', () => {
    it('should produce identical schedules with the same seed', () => {
      const teams = createTeams(6);
      const schedule1 = generateRoundRobinSchedule(teams, { seed: 123 });
      const schedule2 = generateRoundRobinSchedule(teams, { seed: 123 });

      expect(schedule1.rounds.length).toBe(schedule2.rounds.length);
      for (let i = 0; i < schedule1.rounds.length; i++) {
        expect(schedule1.rounds[i].matches).toEqual(schedule2.rounds[i].matches);
        expect(schedule1.rounds[i].byeTeamId).toBe(schedule2.rounds[i].byeTeamId);
      }
    });

    it('should produce different schedules with different seeds', () => {
      const teams = createTeams(6);
      const schedule1 = generateRoundRobinSchedule(teams, { seed: 1 });
      const schedule2 = generateRoundRobinSchedule(teams, { seed: 2 });

      const matches1 = schedule1.rounds.flatMap((r) => r.matches);
      const matches2 = schedule2.rounds.flatMap((r) => r.matches);

      const isDifferent = matches1.some(
        (m, i) => m.homeTeamId !== matches2[i].homeTeamId || m.awayTeamId !== matches2[i].awayTeamId
      );
      expect(isDifferent).toBe(true);
    });
  });

  describe('round numbering', () => {
    it('should number rounds starting from 1', () => {
      const teams = createTeams(4);
      const schedule = generateRoundRobinSchedule(teams, { seed: 42 });

      for (let i = 0; i < schedule.rounds.length; i++) {
        expect(schedule.rounds[i].roundNumber).toBe(i + 1);
      }
    });
  });
});
