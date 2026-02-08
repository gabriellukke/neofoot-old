<script lang="ts">
  import { session } from '$lib/app/session';
  import StandingsTable from '$lib/ui/StandingsTable.svelte';

  const view = $derived(session.view);
  const userTeamId = $derived(session.state?.userTeamId);
</script>

<h1 class="text-2xl font-bold text-white mb-6">Standings</h1>

{#if view}
  <section class="bg-slate-800 rounded-lg p-6">
    <StandingsTable rows={view.standings.rows} highlightTeamId={userTeamId} />
  </section>
{/if}
