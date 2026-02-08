import type { Team, MatchResult, MatchEvent, MatchStats } from './types';
import { createRng, type RNG } from './rng';

const BASE_SHOT_CHANCE = 0.11;
const BASE_ON_TARGET_RATE = 0.35;
const BASE_CONVERSION_RATE = 0.30;

function calculateShotChance(attackingTeam: Team, defendingTeam: Team): number {
  const attackStrength = (attackingTeam.attack * 2 + attackingTeam.midfield) / 3;
  const defenseStrength = (defendingTeam.defense * 2 + defendingTeam.midfield) / 3;
  const ratio = attackStrength / (attackStrength + defenseStrength);
  return BASE_SHOT_CHANCE * (0.5 + ratio);
}

function calculateOnTargetRate(attackingTeam: Team): number {
  const attackRating = attackingTeam.attack / 100;
  return BASE_ON_TARGET_RATE * (0.7 + 0.6 * attackRating);
}

function calculateConversionRate(attackingTeam: Team, defendingTeam: Team): number {
  const attackRating = attackingTeam.attack / 100;
  const defenseRating = defendingTeam.defense / 100;
  return BASE_CONVERSION_RATE * (0.7 + 0.6 * attackRating - 0.3 * defenseRating);
}

interface MinuteResult {
  homeShot: boolean;
  homeOnTarget: boolean;
  homeScored: boolean;
  awayShot: boolean;
  awayOnTarget: boolean;
  awayScored: boolean;
}

function simulateMinute(
  homeTeam: Team,
  awayTeam: Team,
  minute: number,
  events: MatchEvent[],
  rng: RNG
): MinuteResult {
  const result: MinuteResult = {
    homeShot: false,
    homeOnTarget: false,
    homeScored: false,
    awayShot: false,
    awayOnTarget: false,
    awayScored: false,
  };

  const homeShotChance = calculateShotChance(homeTeam, awayTeam);
  if (rng() < homeShotChance) {
    result.homeShot = true;
    const homeOnTargetRate = calculateOnTargetRate(homeTeam);
    if (rng() < homeOnTargetRate) {
      result.homeOnTarget = true;
      const homeConversion = calculateConversionRate(homeTeam, awayTeam);
      if (rng() < homeConversion) {
        result.homeScored = true;
        events.push({
          minute,
          type: 'goal',
          team: 'home',
          description: `Goal for ${homeTeam.name}!`,
        });
      }
    }
  }

  const awayShotChance = calculateShotChance(awayTeam, homeTeam);
  if (rng() < awayShotChance) {
    result.awayShot = true;
    const awayOnTargetRate = calculateOnTargetRate(awayTeam);
    if (rng() < awayOnTargetRate) {
      result.awayOnTarget = true;
      const awayConversion = calculateConversionRate(awayTeam, homeTeam);
      if (rng() < awayConversion) {
        result.awayScored = true;
        events.push({
          minute,
          type: 'goal',
          team: 'away',
          description: `Goal for ${awayTeam.name}!`,
        });
      }
    }
  }

  return result;
}

function calculatePossession(homeTeam: Team, awayTeam: Team, rng: RNG): { home: number; away: number } {
  const homeMidfield = homeTeam.midfield;
  const awayMidfield = awayTeam.midfield;
  const baseRatio = homeMidfield / (homeMidfield + awayMidfield);
  const variance = (rng() - 0.5) * 0.1;
  const homePossession = Math.round((baseRatio + variance) * 100);
  const clampedHome = Math.max(30, Math.min(70, homePossession));
  return { home: clampedHome, away: 100 - clampedHome };
}

export interface SimulateMatchOptions {
  seed?: number;
}

export function simulateMatch(
  homeTeam: Team,
  awayTeam: Team,
  options: SimulateMatchOptions = {}
): MatchResult {
  const seed = options.seed ?? Date.now();
  const rng = createRng(seed);

  const events: MatchEvent[] = [];
  let homeGoals = 0;
  let awayGoals = 0;
  let shotsHome = 0;
  let shotsAway = 0;
  let shotsOnTargetHome = 0;
  let shotsOnTargetAway = 0;

  for (let minute = 1; minute <= 90; minute++) {
    const result = simulateMinute(homeTeam, awayTeam, minute, events, rng);
    if (result.homeShot) shotsHome++;
    if (result.homeOnTarget) shotsOnTargetHome++;
    if (result.homeScored) homeGoals++;
    if (result.awayShot) shotsAway++;
    if (result.awayOnTarget) shotsOnTargetAway++;
    if (result.awayScored) awayGoals++;
  }

  const possession = calculatePossession(homeTeam, awayTeam, rng);

  const stats: MatchStats = {
    shotsHome,
    shotsAway,
    shotsOnTargetHome,
    shotsOnTargetAway,
    possessionHome: possession.home,
    possessionAway: possession.away,
  };

  return {
    homeTeam,
    awayTeam,
    homeGoals,
    awayGoals,
    stats,
    events,
  };
}
