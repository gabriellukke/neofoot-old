import { generateLeagueSchedule, getSortedStandings } from '$lib/app/league';
import type { MatchFixture, Round, Schedule } from '$lib/domain/league';
import { simulateMatch, type Team } from '$lib/match';
import {
  applyRoundResults,
  createSeasonState,
  getCurrentRound,
} from '$lib/domain/season/season';
import type { MatchResult, SeasonState } from '$lib/domain/season/types';
import type {
  LeagueSchedule,
  SeasonFixtureView,
  SeasonResultView,
  SeasonView,
  SimulateCurrentRoundOptions,
  StartNewSeasonInput,
  TeamInfo,
} from './types';

export function startNewSeason(input: StartNewSeasonInput): SeasonState {
  const { teams, seed, schedule, config } = input;
  const seasonSchedule = schedule ?? toDomainSchedule(generateLeagueSchedule({ teams, seed, config }));
  return createSeasonState({ teams, schedule: seasonSchedule, seed });
}

export function simulateCurrentRound(
  state: SeasonState,
  options: SimulateCurrentRoundOptions = {}
): SeasonState {
  const { roundIndex, fixtures } = getCurrentRound(state);
  const ratings = options.baseRatings ?? { attack: 70, defense: 70, midfield: 70 };
  const teamMap = new Map(state.teams.map((team) => [team.id, team]));
  const results: MatchResult[] = fixtures.map((fixture, index) => {
    const homeInfo = teamMap.get(fixture.homeTeamId);
    const awayInfo = teamMap.get(fixture.awayTeamId);
    if (!homeInfo || !awayInfo) {
      throw new Error('Fixture references unknown team.');
    }
    const seed = state.meta.seed + roundIndex * 100 + index;
    const matchResult = simulateMatch(toMatchTeam(homeInfo, ratings), toMatchTeam(awayInfo, ratings), { seed });
    return {
      homeTeamId: matchResult.homeTeam.id,
      awayTeamId: matchResult.awayTeam.id,
      homeGoals: matchResult.homeGoals,
      awayGoals: matchResult.awayGoals,
      stats: matchResult.stats,
    };
  });

  return applyRoundResults(state, roundIndex, results);
}

export function getSeasonView(state: SeasonState): SeasonView {
  const teamMap = new Map(state.teams.map((team) => [team.id, team.name]));
  const currentRound = getCurrentRound(state);
  const fixtures = currentRound.fixtures.map((fixture) => toFixtureView(fixture, teamMap));
  const standings = getSortedStandings({
    teams: state.teams,
    matches: flattenResults(state.resultsByRound),
  });
  const resultsByRound = state.resultsByRound.map((roundResults, index) => ({
    roundIndex: index,
    results: roundResults.map((result) => toResultView(result, teamMap)),
  }));

  return {
    currentRoundIndex: currentRound.roundIndex,
    fixtures,
    standings,
    resultsByRound,
  };
}

function toDomainSchedule(schedule: LeagueSchedule): Schedule {
  const rounds: Round[] = schedule.rounds.map((round) => {
    const matches: MatchFixture[] = [];
    let byeTeamId: string | undefined;

    for (const fixture of round.fixtures) {
      if (fixture.type === 'match') {
        matches.push({
          homeTeamId: fixture.homeTeam.id,
          awayTeamId: fixture.awayTeam.id,
        });
      } else {
        byeTeamId = fixture.byeTeam.id;
      }
    }

    return {
      roundNumber: round.roundNumber,
      matches,
      byeTeamId,
    };
  });

  return { rounds };
}

function toMatchTeam(team: TeamInfo, ratings: { attack: number; defense: number; midfield: number }): Team {
  return {
    id: team.id,
    name: team.name,
    attack: ratings.attack,
    defense: ratings.defense,
    midfield: ratings.midfield,
  };
}

function toFixtureView(fixture: MatchFixture, teamMap: Map<string, string>): SeasonFixtureView {
  return {
    homeTeamId: fixture.homeTeamId,
    awayTeamId: fixture.awayTeamId,
    homeTeamName: teamMap.get(fixture.homeTeamId) ?? fixture.homeTeamId,
    awayTeamName: teamMap.get(fixture.awayTeamId) ?? fixture.awayTeamId,
  };
}

function toResultView(result: MatchResult, teamMap: Map<string, string>): SeasonResultView {
  return {
    homeTeamId: result.homeTeamId,
    awayTeamId: result.awayTeamId,
    homeTeamName: teamMap.get(result.homeTeamId) ?? result.homeTeamId,
    awayTeamName: teamMap.get(result.awayTeamId) ?? result.awayTeamId,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
  };
}

function flattenResults(resultsByRound: MatchResult[][]) {
  return resultsByRound.flat().map((result) => ({
    homeTeamId: result.homeTeamId,
    awayTeamId: result.awayTeamId,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
  }));
}
