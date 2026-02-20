<script lang="ts">
    import type { Snippet } from "svelte";
    import { Loader2 } from "lucide-svelte";

    let {
        children,
        onclick,
        variant = "primary",
        class: className = "",
        loading = false,
        disabled = false,
        type = "button",
    }: {
        children: Snippet;
        onclick?: (e: MouseEvent) => void;
        variant?: "primary" | "secondary" | "danger" | "success";
        class?: string;
        loading?: boolean;
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
    } = $props();

    const variants = {
        primary: "bg-white/10 hover:bg-white/20 text-white border-white/20",
        secondary: "bg-white/5 hover:bg-white/10 text-white/60 border-white/10",
        danger: "bg-galpe-red/20 hover:bg-galpe-red/30 text-galpe-red border-galpe-red/30",
        success:
            "bg-galpe-green/20 hover:bg-galpe-green/30 text-galpe-green border-galpe-green/30",
    };
</script>

<button
    {onclick}
    {disabled}
    {type}
    class="relative px-6 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 {variants[
        variant
    ]} {className}"
>
    {#if loading}
        <Loader2 class="animate-spin" size={18} />
    {/if}
    <div class={loading ? "opacity-0" : "opacity-100 flex items-center gap-2"}>
        {@render children()}
    </div>
</button>
