import type { LeagueSchedule, StandingsTableUI, TeamInfo } from '$lib/app/league';
import type { Schedule } from '$lib/domain/league';

export interface StartNewSeasonInput {
  teams: TeamInfo[];
  seed: number;
  schedule?: Schedule;
  config?: {
    doubleRound?: boolean;
  };
}

export interface SimulateCurrentRoundOptions {
  baseRatings?: {
    attack: number;
    defense: number;
    midfield: number;
  };
}

export interface SeasonFixtureView {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

export interface SeasonResultView extends SeasonFixtureView {
  homeGoals: number;
  awayGoals: number;
}

export interface SeasonRoundResultsView {
  roundIndex: number;
  results: SeasonResultView[];
}

export interface SeasonView {
  currentRoundIndex: number;
  fixtures: SeasonFixtureView[];
  standings: StandingsTableUI;
  resultsByRound: SeasonRoundResultsView[];
}

export type { LeagueSchedule, TeamInfo };
