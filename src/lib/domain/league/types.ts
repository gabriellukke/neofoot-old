export interface TeamRef {
  id: string;
  name?: string;
}

export interface MatchFixture {
  homeTeamId: string;
  awayTeamId: string;
}

export interface Round {
  roundNumber: number;
  matches: MatchFixture[];
  byeTeamId?: string;
}

export interface Schedule {
  rounds: Round[];
}

export interface GenerateScheduleOptions {
  seed?: number;
}

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingsTable {
  rows: StandingRow[];
}

export interface MatchResultInput {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
}
