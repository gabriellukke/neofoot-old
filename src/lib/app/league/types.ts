import type { MatchResultInput, StandingRow } from '$lib/domain/league';

export interface TeamInfo {
  id: string;
  name: string;
}

export interface MatchFixtureUI {
  type: 'match';
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

export interface ByeFixtureUI {
  type: 'bye';
  byeTeam: TeamInfo;
}

export type FixtureUI = MatchFixtureUI | ByeFixtureUI;

export interface RoundUI {
  roundNumber: number;
  fixtures: FixtureUI[];
}

export interface LeagueSchedule {
  rounds: RoundUI[];
}

export interface GenerateLeagueScheduleInput {
  teams: TeamInfo[];
  seed?: number;
  config?: {
    doubleRound?: boolean;
  };
}

export interface StandingsRowUI extends StandingRow {
  teamName: string;
}

export interface StandingsTableUI {
  rows: StandingsRowUI[];
}

export interface GetSortedStandingsInput {
  teams: TeamInfo[];
  matches: MatchResultInput[];
}
