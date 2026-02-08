<script lang="ts">
  import type { StandingsRowUI } from '$lib/app/league';

  interface Props {
    rows: StandingsRowUI[];
    highlightTeamId?: string;
  }

  let { rows, highlightTeamId }: Props = $props();
</script>

<div class="overflow-x-auto">
  <table class="w-full text-sm text-slate-200">
    <thead>
      <tr class="text-left text-slate-400 border-b border-slate-700">
        <th class="py-2 pr-2">Pos</th>
        <th class="py-2 pr-2">Team</th>
        <th class="py-2 pr-2">P</th>
        <th class="py-2 pr-2">W</th>
        <th class="py-2 pr-2">D</th>
        <th class="py-2 pr-2">L</th>
        <th class="py-2 pr-2">GF</th>
        <th class="py-2 pr-2">GA</th>
        <th class="py-2 pr-2">GD</th>
        <th class="py-2 pr-2">Pts</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row, index (row.teamId)}
        <tr
          class="border-b border-slate-700 {highlightTeamId && row.teamId === highlightTeamId
            ? 'bg-amber-900/20'
            : ''}"
        >
          <td class="py-2 pr-2">{index + 1}</td>
          <td class="py-2 pr-2">{row.teamName}</td>
          <td class="py-2 pr-2">{row.played}</td>
          <td class="py-2 pr-2">{row.won}</td>
          <td class="py-2 pr-2">{row.drawn}</td>
          <td class="py-2 pr-2">{row.lost}</td>
          <td class="py-2 pr-2">{row.goalsFor}</td>
          <td class="py-2 pr-2">{row.goalsAgainst}</td>
          <td class="py-2 pr-2">{row.goalDifference}</td>
          <td class="py-2 pr-2 font-semibold">{row.points}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
