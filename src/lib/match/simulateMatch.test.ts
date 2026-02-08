import { describe, it, expect } from 'vitest';
import { simulateMatch } from './simulateMatch';
import type { Team } from './types';

const createTeam = (overrides: Partial<Team> = {}): Team => ({
  id: '1',
  name: 'Test Team',
  attack: 70,
  defense: 70,
  midfield: 70,
  ...overrides,
});

describe('simulateMatch', () => {
  it('should return a valid match result with stats', () => {
    const home = createTeam({ id: 'home', name: 'Home Team' });
    const away = createTeam({ id: 'away', name: 'Away Team' });

    const result = simulateMatch(home, away, { seed: 12345 });

    expect(result.homeTeam).toBe(home);
    expect(result.awayTeam).toBe(away);
    expect(result.homeGoals).toBeGreaterThanOrEqual(0);
    expect(result.awayGoals).toBeGreaterThanOrEqual(0);
    expect(result.stats).toBeDefined();
    expect(Array.isArray(result.events)).toBe(true);
  });

  it('should have events matching the goal count', () => {
    const home = createTeam({ id: 'home', name: 'Home Team' });
    const away = createTeam({ id: 'away', name: 'Away Team' });

    const result = simulateMatch(home, away, { seed: 12345 });

    const homeGoalEvents = result.events.filter((e) => e.type === 'goal' && e.team === 'home');
    const awayGoalEvents = result.events.filter((e) => e.type === 'goal' && e.team === 'away');

    expect(homeGoalEvents.length).toBe(result.homeGoals);
    expect(awayGoalEvents.length).toBe(result.awayGoals);
  });

  it('should have events with valid minutes (1-90)', () => {
    const home = createTeam({ id: 'home', name: 'Home Team' });
    const away = createTeam({ id: 'away', name: 'Away Team' });

    const result = simulateMatch(home, away, { seed: 12345 });

    for (const event of result.events) {
      expect(event.minute).toBeGreaterThanOrEqual(1);
      expect(event.minute).toBeLessThanOrEqual(90);
    }
  });

  it('should be deterministic with the same seed', () => {
    const home = createTeam({ id: 'home', name: 'Home Team' });
    const away = createTeam({ id: 'away', name: 'Away Team' });
    const seed = 42;

    const result1 = simulateMatch(home, away, { seed });
    const result2 = simulateMatch(home, away, { seed });

    expect(result1.homeGoals).toBe(result2.homeGoals);
    expect(result1.awayGoals).toBe(result2.awayGoals);
    expect(result1.stats).toEqual(result2.stats);
    expect(result1.events.length).toBe(result2.events.length);
  });

  it('should produce different results with different seeds', () => {
    const home = createTeam({ id: 'home', name: 'Home Team' });
    const away = createTeam({ id: 'away', name: 'Away Team' });

    const results = Array.from({ length: 10 }, (_, i) => simulateMatch(home, away, { seed: i }));

    const uniqueScores = new Set(results.map((r) => `${r.homeGoals}-${r.awayGoals}`));
    expect(uniqueScores.size).toBeGreaterThan(1);
  });

  it('should favor stronger teams over many simulations', () => {
    const strongTeam = createTeam({
      id: 'strong',
      name: 'Strong',
      attack: 95,
      defense: 95,
      midfield: 95,
    });
    const weakTeam = createTeam({ id: 'weak', name: 'Weak', attack: 40, defense: 40, midfield: 40 });

    let strongWins = 0;
    let weakWins = 0;
    const simulations = 100;

    for (let seed = 0; seed < simulations; seed++) {
      const result = simulateMatch(strongTeam, weakTeam, { seed });
      if (result.homeGoals > result.awayGoals) strongWins++;
      if (result.awayGoals > result.homeGoals) weakWins++;
    }

    expect(strongWins).toBeGreaterThan(weakWins);
  });

  describe('stats invariants', () => {
    it('should have shotsOnTarget <= shots for both teams', () => {
      const home = createTeam({ id: 'home', name: 'Home Team' });
      const away = createTeam({ id: 'away', name: 'Away Team' });

      for (let seed = 0; seed < 50; seed++) {
        const result = simulateMatch(home, away, { seed });
        expect(result.stats.shotsOnTargetHome).toBeLessThanOrEqual(result.stats.shotsHome);
        expect(result.stats.shotsOnTargetAway).toBeLessThanOrEqual(result.stats.shotsAway);
      }
    });

    it('should have goals <= shotsOnTarget for both teams', () => {
      const home = createTeam({ id: 'home', name: 'Home Team' });
      const away = createTeam({ id: 'away', name: 'Away Team' });

      for (let seed = 0; seed < 50; seed++) {
        const result = simulateMatch(home, away, { seed });
        expect(result.homeGoals).toBeLessThanOrEqual(result.stats.shotsOnTargetHome);
        expect(result.awayGoals).toBeLessThanOrEqual(result.stats.shotsOnTargetAway);
      }
    });

    it('should have possession summing to 100', () => {
      const home = createTeam({ id: 'home', name: 'Home Team' });
      const away = createTeam({ id: 'away', name: 'Away Team' });

      for (let seed = 0; seed < 50; seed++) {
        const result = simulateMatch(home, away, { seed });
        expect(result.stats.possessionHome + result.stats.possessionAway).toBe(100);
      }
    });

    it('should have possession within realistic bounds (30-70)', () => {
      const home = createTeam({ id: 'home', name: 'Home Team' });
      const away = createTeam({ id: 'away', name: 'Away Team' });

      for (let seed = 0; seed < 50; seed++) {
        const result = simulateMatch(home, away, { seed });
        expect(result.stats.possessionHome).toBeGreaterThanOrEqual(30);
        expect(result.stats.possessionHome).toBeLessThanOrEqual(70);
        expect(result.stats.possessionAway).toBeGreaterThanOrEqual(30);
        expect(result.stats.possessionAway).toBeLessThanOrEqual(70);
      }
    });
  });

  describe('calibration over 200 seeds', () => {
    it('should produce realistic average goals (1.5-3.5)', () => {
      const home = createTeam({ id: 'home', name: 'Home Team' });
      const away = createTeam({ id: 'away', name: 'Away Team' });

      let totalGoals = 0;
      const simulations = 200;

      for (let seed = 0; seed < simulations; seed++) {
        const result = simulateMatch(home, away, { seed });
        totalGoals += result.homeGoals + result.awayGoals;
      }

      const averageGoals = totalGoals / simulations;
      expect(averageGoals).toBeGreaterThanOrEqual(1.5);
      expect(averageGoals).toBeLessThanOrEqual(3.5);
    });

    it('should produce realistic average total shots (15-35 per match)', () => {
      const home = createTeam({ id: 'home', name: 'Home Team' });
      const away = createTeam({ id: 'away', name: 'Away Team' });

      let totalShots = 0;
      const simulations = 200;

      for (let seed = 0; seed < simulations; seed++) {
        const result = simulateMatch(home, away, { seed });
        totalShots += result.stats.shotsHome + result.stats.shotsAway;
      }

      const averageShots = totalShots / simulations;
      expect(averageShots).toBeGreaterThanOrEqual(15);
      expect(averageShots).toBeLessThanOrEqual(35);
    });

    it('should have consistent shot-to-goal ratio', () => {
      const home = createTeam({ id: 'home', name: 'Home Team' });
      const away = createTeam({ id: 'away', name: 'Away Team' });

      let totalGoals = 0;
      let totalShots = 0;
      const simulations = 200;

      for (let seed = 0; seed < simulations; seed++) {
        const result = simulateMatch(home, away, { seed });
        totalGoals += result.homeGoals + result.awayGoals;
        totalShots += result.stats.shotsHome + result.stats.shotsAway;
      }

      const conversionRate = totalGoals / totalShots;
      expect(conversionRate).toBeGreaterThanOrEqual(0.05);
      expect(conversionRate).toBeLessThanOrEqual(0.20);
    });
  });
});
