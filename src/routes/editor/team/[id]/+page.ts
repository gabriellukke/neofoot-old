import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  return {
    teamId: parseInt(params.id, 10)
  };
};
