import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  return {
    leagueId: parseInt(params.id, 10)
  };
};
