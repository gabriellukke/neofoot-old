<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { session } from '$lib/app/session';

  let { children }: { children: Snippet } = $props();

  const navItems = [
    { href: '/season', label: 'Dashboard' },
    { href: '/season/round', label: 'Round' },
    { href: '/season/standings', label: 'Standings' },
  ];

  function isActive(href: string): boolean {
    return page.url.pathname === href;
  }
</script>

{#if session.hasSession}
  <div class="min-h-screen bg-slate-900 flex flex-col">
    <nav class="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-1">
      <a
        href="/"
        class="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 rounded"
      >
        Menu
      </a>
      <div class="h-4 w-px bg-slate-700 mx-2"></div>
      {#each navItems as item}
        <a
          href={item.href}
          class="text-sm px-3 py-1.5 rounded {isActive(item.href)
            ? 'bg-slate-700 text-white'
            : 'text-slate-400 hover:text-slate-200'}"
        >
          {item.label}
        </a>
      {/each}
      <div class="ml-auto text-slate-500 text-xs">
        Round {(session.state?.currentRoundIndex ?? 0) + 1} / {session.state?.schedule.rounds.length ?? 0}
      </div>
    </nav>

    <main class="flex-1 p-6">
      {@render children()}
    </main>
  </div>
{:else}
  <div class="min-h-screen bg-slate-900 flex items-center justify-center">
    <div class="text-center">
      <p class="text-slate-400 text-lg mb-4">No active season</p>
      <a
        href="/"
        class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded inline-block"
      >
        Back to Menu
      </a>
    </div>
  </div>
{/if}
