export interface Team {
  id: string;
  name: string;
  attack: number;
  defense: number;
  midfield: number;
}

export interface MatchStats {
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  possessionHome: number;
  possessionAway: number;
}

export interface MatchResult {
  homeTeam: Team;
  awayTeam: Team;
  homeGoals: number;
  awayGoals: number;
  stats: MatchStats;
  events: MatchEvent[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'shot' | 'yellow_card' | 'red_card';
  team: 'home' | 'away';
  description: string;
}
