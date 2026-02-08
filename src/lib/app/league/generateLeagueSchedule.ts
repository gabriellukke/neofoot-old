import { generateRoundRobinSchedule } from '$lib/domain/league';
import type {
  GenerateLeagueScheduleInput,
  LeagueSchedule,
  RoundUI,
  FixtureUI,
  TeamInfo,
} from './types';

export function generateLeagueSchedule(input: GenerateLeagueScheduleInput): LeagueSchedule {
  const { teams, seed, config } = input;
  const doubleRound = config?.doubleRound ?? false;

  if (teams.length < 2) {
    return { rounds: [] };
  }

  const teamMap = new Map<string, TeamInfo>();
  for (const team of teams) {
    teamMap.set(team.id, team);
  }

  const domainSchedule = generateRoundRobinSchedule(teams, { seed });

  const firstHalfRounds: RoundUI[] = domainSchedule.rounds.map((round) => {
    const fixtures: FixtureUI[] = [];

    for (const match of round.matches) {
      const homeTeam = teamMap.get(match.homeTeamId);
      const awayTeam = teamMap.get(match.awayTeamId);
      if (homeTeam && awayTeam) {
        fixtures.push({
          type: 'match',
          homeTeam,
          awayTeam,
        });
      }
    }

    if (round.byeTeamId) {
      const byeTeam = teamMap.get(round.byeTeamId);
      if (byeTeam) {
        fixtures.push({
          type: 'bye',
          byeTeam,
        });
      }
    }

    return {
      roundNumber: round.roundNumber,
      fixtures,
    };
  });

  if (!doubleRound) {
    return { rounds: firstHalfRounds };
  }

  const secondHalfRounds: RoundUI[] = firstHalfRounds.map((round, index) => {
    const fixtures: FixtureUI[] = round.fixtures.map((fixture) => {
      if (fixture.type === 'bye') {
        return fixture;
      }
      return {
        type: 'match',
        homeTeam: fixture.awayTeam,
        awayTeam: fixture.homeTeam,
      };
    });

    return {
      roundNumber: firstHalfRounds.length + index + 1,
      fixtures,
    };
  });

  return { rounds: [...firstHalfRounds, ...secondHalfRounds] };
}
