<script lang="ts">
  import { goto } from '$app/navigation';
  import type { TeamInfo } from '$lib/app/league';
  import { session } from '$lib/app/session';

  const DEFAULT_TEAMS: TeamInfo[] = [
    { id: 'team-1', name: 'Arsenal' },
    { id: 'team-2', name: 'Chelsea' },
    { id: 'team-3', name: 'Liverpool' },
    { id: 'team-4', name: 'Manchester City' },
    { id: 'team-5', name: 'Manchester United' },
    { id: 'team-6', name: 'Tottenham' },
    { id: 'team-7', name: 'Leicester' },
    { id: 'team-8', name: 'West Ham' },
    { id: 'team-9', name: 'Aston Villa' },
    { id: 'team-10', name: 'Fulham' },
  ];

  function handleNewGame() {
    session.startNewSeason({ teams: DEFAULT_TEAMS, seed: Date.now() });
    goto('/season');
  }
</script>

<main
  class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800"
>
  <h1 class="text-4xl font-bold text-white mb-2">Neofoot</h1>
  <p class="text-slate-400 mb-12">Football Manager</p>

  <nav class="flex flex-col gap-4 min-w-48">
    <button
      onclick={handleNewGame}
      class="px-8 py-3 text-white bg-green-600 hover:bg-green-700 rounded text-center font-semibold"
    >
      New Game
    </button>

    <a
      href="/season"
      class="px-8 py-3 text-white bg-slate-700 rounded text-center {session.hasSession
        ? 'hover:bg-slate-600'
        : 'opacity-40 pointer-events-none'}"
    >
      Continue
    </a>

    <div class="border-t border-slate-700 my-2"></div>

    <a
      href="/lab"
      class="px-8 py-3 text-slate-400 hover:text-slate-200 rounded text-center text-sm"
    >
      Labs
    </a>
  </nav>
</main>
