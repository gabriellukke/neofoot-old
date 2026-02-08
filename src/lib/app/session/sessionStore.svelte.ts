import type { StartNewSeasonInput, SimulateCurrentRoundOptions } from './types';
import {
  startNewSeason,
  simulateCurrentRound,
  simulateMyMatchOnly,
  setUserTeam,
  getSeasonView,
  getMyTeamDashboard,
} from '$lib/app/season';
import { advanceRound, isSeasonFinished } from '$lib/domain/season';
import type { SeasonState } from '$lib/domain/season';

let seasonState = $state<SeasonState | null>(null);
let saveId = $state<string | null>(null);

export const session = {
  get state() {
    return seasonState;
  },
  get saveId() {
    return saveId;
  },
  get hasSession() {
    return seasonState !== null;
  },
  get isFinished() {
    return seasonState ? isSeasonFinished(seasonState) : false;
  },
  get view() {
    return seasonState ? getSeasonView(seasonState) : null;
  },
  get dashboard() {
    return seasonState ? getMyTeamDashboard(seasonState) : null;
  },

  startNewSeason(input: StartNewSeasonInput) {
    seasonState = startNewSeason(input);
    saveId = null;
  },
  setUserTeam(teamId: string) {
    if (!seasonState) return;
    seasonState = setUserTeam(seasonState, teamId);
  },
  simulateMyMatch(options?: SimulateCurrentRoundOptions) {
    if (!seasonState) return;
    seasonState = simulateMyMatchOnly(seasonState, options);
  },
  simulateRound(options?: SimulateCurrentRoundOptions) {
    if (!seasonState) return;
    seasonState = simulateCurrentRound(seasonState, options);
  },
  advanceRound() {
    if (!seasonState) return;
    seasonState = advanceRound(seasonState);
  },
  resetSession() {
    seasonState = null;
    saveId = null;
  },
};
