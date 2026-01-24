<script lang="ts">
  let counter = $state(0);
</script>

<main class="min-h-screen bg-slate-900 p-8">
  <h1 class="text-3xl font-bold text-white mb-6">Lab</h1>
  <p class="text-slate-400 mb-8">Experimental playground for frontend components</p>

  <section class="bg-slate-800 rounded-lg p-6 max-w-md">
    <h2 class="text-xl font-semibold text-white mb-4">Counter Example</h2>
    <div class="flex items-center gap-4">
      <button
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        onclick={() => counter--}
      >
        -
      </button>
      <span class="text-2xl text-white font-mono w-12 text-center">{counter}</span>
      <button
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onclick={() => counter++}
      >
        +
      </button>
    </div>
  </section>
</main>
