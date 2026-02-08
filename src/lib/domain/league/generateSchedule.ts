import type { TeamRef, MatchFixture, Round, Schedule, GenerateScheduleOptions } from './types';
import { createRng } from '$lib/match/rng';

const BYE_TEAM_ID = '__BYE__';

function shuffleArray<T>(array: T[], seed: number): T[] {
  const rng = createRng(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateRoundRobinSchedule(
  teams: TeamRef[],
  options: GenerateScheduleOptions = {}
): Schedule {
  if (teams.length < 2) {
    return { rounds: [] };
  }

  const seed = options.seed ?? 0;
  const teamIds = shuffleArray(
    teams.map((t) => t.id),
    seed
  );

  const isOdd = teamIds.length % 2 === 1;
  const participants = isOdd ? [...teamIds, BYE_TEAM_ID] : [...teamIds];
  const n = participants.length;
  const numRounds = n - 1;
  const matchesPerRound = n / 2;

  const rounds: Round[] = [];

  for (let round = 0; round < numRounds; round++) {
    const matches: MatchFixture[] = [];
    let byeTeamId: string | undefined;

    for (let match = 0; match < matchesPerRound; match++) {
      const home = participants[match];
      const away = participants[n - 1 - match];

      if (home === BYE_TEAM_ID) {
        byeTeamId = away;
      } else if (away === BYE_TEAM_ID) {
        byeTeamId = home;
      } else {
        const homeFirst = (round + match) % 2 === 0;
        matches.push({
          homeTeamId: homeFirst ? home : away,
          awayTeamId: homeFirst ? away : home,
        });
      }
    }

    rounds.push({
      roundNumber: round + 1,
      matches,
      byeTeamId,
    });

    const fixed = participants[0];
    const rotating = participants.slice(1);
    const last = rotating.pop()!;
    rotating.unshift(last);
    participants.splice(0, participants.length, fixed, ...rotating);
  }

  return { rounds };
}
