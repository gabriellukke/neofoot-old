import type { MatchStats } from '$lib/match';
import type { MatchFixture, Schedule } from '$lib/domain/league';

export type TeamId = string;

export interface SeasonTeam {
  id: TeamId;
  name: string;
}

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  stats?: MatchStats;
}

export interface SeasonState {
  teams: SeasonTeam[];
  schedule: Schedule;
  currentRoundIndex: number;
  resultsByRound: MatchResult[][];
  userTeamId?: TeamId;
  meta: {
    seed: number;
    version: string;
  };
}

export interface CreateSeasonStateInput {
  teams: SeasonTeam[];
  schedule: Schedule;
  seed: number;
}

export interface UserMatchInRound {
  roundIndex: number;
  fixture: MatchFixture;
  result: MatchResult | null;
}
