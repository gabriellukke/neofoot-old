import type { TeamRef, StandingRow, StandingsTable, MatchResultInput } from './types';

export function createEmptyStandings(teams: TeamRef[]): StandingsTable {
  const rows: StandingRow[] = teams.map((team) => ({
    teamId: team.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  return { rows };
}

export function applyMatchToStandings(
  table: StandingsTable,
  match: MatchResultInput
): StandingsTable {
  const newRows = table.rows.map((row) => {
    if (row.teamId === match.homeTeamId) {
      return applyResultToRow(row, match.homeGoals, match.awayGoals);
    }
    if (row.teamId === match.awayTeamId) {
      return applyResultToRow(row, match.awayGoals, match.homeGoals);
    }
    return row;
  });

  return { rows: newRows };
}

function applyResultToRow(row: StandingRow, goalsFor: number, goalsAgainst: number): StandingRow {
  const isWin = goalsFor > goalsAgainst;
  const isDraw = goalsFor === goalsAgainst;
  const isLoss = goalsFor < goalsAgainst;

  const won = row.won + (isWin ? 1 : 0);
  const drawn = row.drawn + (isDraw ? 1 : 0);
  const lost = row.lost + (isLoss ? 1 : 0);
  const newGoalsFor = row.goalsFor + goalsFor;
  const newGoalsAgainst = row.goalsAgainst + goalsAgainst;

  return {
    teamId: row.teamId,
    played: won + drawn + lost,
    won,
    drawn,
    lost,
    goalsFor: newGoalsFor,
    goalsAgainst: newGoalsAgainst,
    goalDifference: newGoalsFor - newGoalsAgainst,
    points: won * 3 + drawn,
  };
}

export function sortStandings(table: StandingsTable): StandingsTable {
  const sortedRows = [...table.rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });

  return { rows: sortedRows };
}
