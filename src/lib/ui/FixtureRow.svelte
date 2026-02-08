<script lang="ts">
  interface Props {
    homeTeamName: string;
    awayTeamName: string;
    homeTeamId: string;
    awayTeamId: string;
    homeGoals?: number;
    awayGoals?: number;
    userTeamId?: string;
  }

  let {
    homeTeamName,
    awayTeamName,
    homeTeamId,
    awayTeamId,
    homeGoals,
    awayGoals,
    userTeamId,
  }: Props = $props();

  const isUserMatch = $derived(
    userTeamId ? homeTeamId === userTeamId || awayTeamId === userTeamId : false
  );
  const hasResult = $derived(homeGoals !== undefined && awayGoals !== undefined);
</script>

<div
  class="flex items-center justify-between rounded px-4 py-3 text-sm {isUserMatch
    ? 'bg-amber-900/30 border border-amber-400/40'
    : 'bg-slate-700'}"
>
  <div class="flex items-center gap-3">
    <span class="text-slate-200">{homeTeamName}</span>
    {#if hasResult}
      <span class="text-white font-semibold">{homeGoals} - {awayGoals}</span>
    {:else}
      <span class="text-slate-500">vs</span>
    {/if}
    <span class="text-slate-200">{awayTeamName}</span>
  </div>
  {#if isUserMatch}
    <span class="text-xs text-amber-300">My match</span>
  {/if}
</div>
