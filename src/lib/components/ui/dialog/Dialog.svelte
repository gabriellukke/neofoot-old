<script lang="ts">
  import Button from '../button/button.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title: string;
    onClose: () => void;
    children?: Snippet;
    actions?: Snippet;
  }

  let { open = false, title, onClose, children, actions }: Props = $props();
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="bg-background/80 fixed inset-0" onclick={onClose}></div>
    <div
      class="bg-background relative z-10 w-full max-w-md rounded-lg border p-6 shadow-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title" class="text-foreground mb-4 text-xl font-semibold">{title}</h2>
      <div class="mb-6">
        {@render children?.()}
      </div>
      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={onClose}>Cancel</Button>
        {@render actions?.()}
      </div>
    </div>
  </div>
{/if}
