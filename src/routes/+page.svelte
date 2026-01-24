<script lang="ts">
  let name = $state('');
  let greetMsg = $state('');

  async function greet() {
    const { invoke } = await import('@tauri-apps/api/core');
    greetMsg = await invoke('greet', { name });
  }
</script>

<main class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
  <h1 class="text-4xl font-bold text-white mb-8">Neofoot</h1>

  <form class="flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); greet(); }}>
    <input
      class="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
      placeholder="Enter a name..."
      bind:value={name}
    />
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      type="submit"
    >
      Greet
    </button>
  </form>

  {#if greetMsg}
    <p class="mt-4 text-white">{greetMsg}</p>
  {/if}
</main>
