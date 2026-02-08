import type { SeasonState } from '$lib/domain/season';
import type {
  SeasonView,
  MyTeamDashboard,
  StartNewSeasonInput,
  SimulateCurrentRoundOptions,
} from '$lib/app/season';

export interface SessionState {
  seasonState: SeasonState | null;
  saveId: string | null;
}

export type { SeasonView, MyTeamDashboard, StartNewSeasonInput, SimulateCurrentRoundOptions };
