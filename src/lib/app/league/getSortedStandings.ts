import { applyMatchToStandings, createEmptyStandings, sortStandings } from '$lib/domain/league';
import type { StandingRow } from '$lib/domain/league';
import type { GetSortedStandingsInput, StandingsRowUI, StandingsTableUI } from './types';

export function getSortedStandings(input: GetSortedStandingsInput): StandingsTableUI {
  const { teams, matches } = input;
  const teamNameMap = new Map<string, string>();

  for (const team of teams) {
    teamNameMap.set(team.id, team.name);
  }

  let table = createEmptyStandings(teams);
  for (const match of matches) {
    table = applyMatchToStandings(table, match);
  }

  const sorted = sortStandings(table);
  const rows = sorted.rows.map((row) => toStandingsRowUI(row, teamNameMap));

  return { rows };
}

function toStandingsRowUI(row: StandingRow, teamNameMap: Map<string, string>): StandingsRowUI {
  return {
    ...row,
    teamName: teamNameMap.get(row.teamId) ?? row.teamId,
  };
}
