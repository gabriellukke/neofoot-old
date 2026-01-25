import type { MatchStats } from '$lib/match';
import type { Schedule } from '$lib/domain/league';

export interface SeasonTeam {
  id: string;
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
