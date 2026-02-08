import { describe, it, expect } from 'vitest';
import { generateLeagueSchedule } from './generateLeagueSchedule';
import type { TeamInfo, MatchFixtureUI } from './types';

function createTeams(count: number): TeamInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
  }));
}

describe('generateLeagueSchedule', () => {
  describe('basic functionality', () => {
    it('should return empty rounds for less than 2 teams', () => {
      expect(generateLeagueSchedule({ teams: [] }).rounds.length).toBe(0);
      expect(generateLeagueSchedule({ teams: createTeams(1) }).rounds.length).toBe(0);
    });

    it('should return UI-friendly structure with team objects', () => {
      const teams = createTeams(4);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      expect(schedule.rounds.length).toBeGreaterThan(0);
      for (const round of schedule.rounds) {
        for (const fixture of round.fixtures) {
          if (fixture.type === 'match') {
            expect(fixture.homeTeam).toHaveProperty('id');
            expect(fixture.homeTeam).toHaveProperty('name');
            expect(fixture.awayTeam).toHaveProperty('id');
            expect(fixture.awayTeam).toHaveProperty('name');
          }
        }
      }
    });
  });

  describe('no team plays twice in same round', () => {
    it('should ensure no team plays more than once per round (even N)', () => {
      const teams = createTeams(6);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      for (const round of schedule.rounds) {
        const teamsInRound = new Set<string>();
        for (const fixture of round.fixtures) {
          if (fixture.type === 'match') {
            expect(teamsInRound.has(fixture.homeTeam.id)).toBe(false);
            expect(teamsInRound.has(fixture.awayTeam.id)).toBe(false);
            teamsInRound.add(fixture.homeTeam.id);
            teamsInRound.add(fixture.awayTeam.id);
          } else {
            expect(teamsInRound.has(fixture.byeTeam.id)).toBe(false);
            teamsInRound.add(fixture.byeTeam.id);
          }
        }
      }
    });

    it('should ensure no team plays more than once per round (odd N)', () => {
      const teams = createTeams(5);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      for (const round of schedule.rounds) {
        const teamsInRound = new Set<string>();
        for (const fixture of round.fixtures) {
          if (fixture.type === 'match') {
            expect(teamsInRound.has(fixture.homeTeam.id)).toBe(false);
            expect(teamsInRound.has(fixture.awayTeam.id)).toBe(false);
            teamsInRound.add(fixture.homeTeam.id);
            teamsInRound.add(fixture.awayTeam.id);
          } else {
            expect(teamsInRound.has(fixture.byeTeam.id)).toBe(false);
            teamsInRound.add(fixture.byeTeam.id);
          }
        }
      }
    });
  });

  describe('single round - every pair appears exactly once', () => {
    it('should have each pair of teams appear exactly once', () => {
      const teams = createTeams(6);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      const pairs = new Set<string>();
      for (const round of schedule.rounds) {
        for (const fixture of round.fixtures) {
          if (fixture.type === 'match') {
            const pair = [fixture.homeTeam.id, fixture.awayTeam.id].sort().join('-');
            expect(pairs.has(pair)).toBe(false);
            pairs.add(pair);
          }
        }
      }

      const expectedPairs = (6 * 5) / 2;
      expect(pairs.size).toBe(expectedPairs);
    });

    it('should have correct total match count for single round', () => {
      const n = 6;
      const teams = createTeams(n);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      let totalMatches = 0;
      for (const round of schedule.rounds) {
        totalMatches += round.fixtures.filter((f) => f.type === 'match').length;
      }

      expect(totalMatches).toBe((n * (n - 1)) / 2);
    });
  });

  describe('BYE handling for odd teams', () => {
    it('should have exactly one BYE per round for odd N', () => {
      const teams = createTeams(5);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      for (const round of schedule.rounds) {
        const byeFixtures = round.fixtures.filter((f) => f.type === 'bye');
        expect(byeFixtures.length).toBe(1);
      }
    });

    it('should have no BYE for even N', () => {
      const teams = createTeams(6);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      for (const round of schedule.rounds) {
        const byeFixtures = round.fixtures.filter((f) => f.type === 'bye');
        expect(byeFixtures.length).toBe(0);
      }
    });

    it('should give each team exactly one BYE across all rounds (odd N)', () => {
      const teams = createTeams(5);
      const schedule = generateLeagueSchedule({ teams, seed: 42 });

      const byeCounts = new Map<string, number>();
      for (const team of teams) {
        byeCounts.set(team.id, 0);
      }

      for (const round of schedule.rounds) {
        for (const fixture of round.fixtures) {
          if (fixture.type === 'bye') {
            byeCounts.set(fixture.byeTeam.id, (byeCounts.get(fixture.byeTeam.id) ?? 0) + 1);
          }
        }
      }

      for (const team of teams) {
        expect(byeCounts.get(team.id)).toBe(1);
      }
    });
  });

  describe('doubleRound option', () => {
    it('should double the number of rounds when doubleRound is enabled', () => {
      const teams = createTeams(4);
      const singleSchedule = generateLeagueSchedule({ teams, seed: 42 });
      const doubleSchedule = generateLeagueSchedule({
        teams,
        seed: 42,
        config: { doubleRound: true },
      });

      expect(doubleSchedule.rounds.length).toBe(singleSchedule.rounds.length * 2);
    });

    it('should double the total fixtures when doubleRound is enabled', () => {
      const teams = createTeams(6);
      const singleSchedule = generateLeagueSchedule({ teams, seed: 42 });
      const doubleSchedule = generateLeagueSchedule({
        teams,
        seed: 42,
        config: { doubleRound: true },
      });

      const singleMatches = singleSchedule.rounds.reduce(
        (sum, r) => sum + r.fixtures.filter((f) => f.type === 'match').length,
        0
      );
      const doubleMatches = doubleSchedule.rounds.reduce(
        (sum, r) => sum + r.fixtures.filter((f) => f.type === 'match').length,
        0
      );

      expect(doubleMatches).toBe(singleMatches * 2);
    });

    it('should reverse home/away in second half', () => {
      const teams = createTeams(4);
      const schedule = generateLeagueSchedule({
        teams,
        seed: 42,
        config: { doubleRound: true },
      });

      const firstHalfRounds = schedule.rounds.slice(0, schedule.rounds.length / 2);
      const secondHalfRounds = schedule.rounds.slice(schedule.rounds.length / 2);

      for (let i = 0; i < firstHalfRounds.length; i++) {
        const firstRound = firstHalfRounds[i];
        const secondRound = secondHalfRounds[i];

        const firstMatches = firstRound.fixtures.filter(
          (f) => f.type === 'match'
        ) as MatchFixtureUI[];
        const secondMatches = secondRound.fixtures.filter(
          (f) => f.type === 'match'
        ) as MatchFixtureUI[];

        expect(firstMatches.length).toBe(secondMatches.length);

        for (let j = 0; j < firstMatches.length; j++) {
          expect(firstMatches[j].homeTeam.id).toBe(secondMatches[j].awayTeam.id);
          expect(firstMatches[j].awayTeam.id).toBe(secondMatches[j].homeTeam.id);
        }
      }
    });

    it('should have each pair appear exactly twice with doubleRound', () => {
      const teams = createTeams(4);
      const schedule = generateLeagueSchedule({
        teams,
        seed: 42,
        config: { doubleRound: true },
      });

      const pairCounts = new Map<string, number>();
      for (const round of schedule.rounds) {
        for (const fixture of round.fixtures) {
          if (fixture.type === 'match') {
            const pair = [fixture.homeTeam.id, fixture.awayTeam.id].sort().join('-');
            pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
          }
        }
      }

      for (const count of pairCounts.values()) {
        expect(count).toBe(2);
      }
    });

    it('should maintain correct round numbering in second half', () => {
      const teams = createTeams(4);
      const schedule = generateLeagueSchedule({
        teams,
        seed: 42,
        config: { doubleRound: true },
      });

      for (let i = 0; i < schedule.rounds.length; i++) {
        expect(schedule.rounds[i].roundNumber).toBe(i + 1);
      }
    });
  });

  describe('determinism', () => {
    it('should produce identical schedules with the same seed', () => {
      const teams = createTeams(6);
      const schedule1 = generateLeagueSchedule({ teams, seed: 123 });
      const schedule2 = generateLeagueSchedule({ teams, seed: 123 });

      expect(schedule1).toEqual(schedule2);
    });
  });
});
