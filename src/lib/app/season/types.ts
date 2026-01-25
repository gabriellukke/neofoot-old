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

export interface MyTeamNextMatch {
  roundIndex: number;
  opponentName: string;
  isHome: boolean;
}

export interface MyTeamLastResult {
  roundIndex: number;
  opponentName: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  outcome: 'W' | 'D' | 'L';
}

export interface MyTeamDashboard {
  teamName: string;
  position: number | null;
  nextMatch: MyTeamNextMatch | null;
  lastResults: MyTeamLastResult[];
}

export type { LeagueSchedule, TeamInfo };
