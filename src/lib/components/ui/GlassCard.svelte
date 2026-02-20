<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        children,
        class: className = "",
        title = "",
    }: { children: Snippet; class?: string; title?: string } = $props();
</script>

<div class="glass p-6 rounded-2xl {className}">
    {#if title}
        <h3 class="text-xl font-semibold mb-4 text-white/90">{title}</h3>
    {/if}
    {@render children()}
</div>

<style>
    /* Ensure the backdrop blur is applied correctly */
    .glass {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
</style>
