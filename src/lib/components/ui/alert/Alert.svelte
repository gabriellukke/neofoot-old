<script lang="ts">
  import Button from '../button/button.svelte';

  interface Props {
    open?: boolean;
    title: string;
    message: string;
    variant?: 'info' | 'error' | 'success' | 'warning';
    onClose: () => void;
  }

  let { open = false, title, message, variant = 'info', onClose }: Props = $props();

  const variantClasses = {
    info: 'bg-blue-900 border-blue-700',
    error: 'bg-red-900 border-red-700',
    success: 'bg-green-900 border-green-700',
    warning: 'bg-yellow-900 border-yellow-700'
  };
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50" onclick={onClose}></div>
    <div
      class="relative z-10 w-full max-w-md rounded-lg border p-6 shadow-lg {variantClasses[variant]}"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-title"
    >
      <h2 id="alert-title" class="mb-3 text-xl font-semibold text-white">{title}</h2>
      <p class="mb-6 text-slate-300">{message}</p>
      <div class="flex justify-end">
        <Button onclick={onClose}>OK</Button>
      </div>
    </div>
  </div>
{/if}
