<script lang="ts">
    import { X, Save, AlertCircle, Palette, Smile } from "lucide-svelte";
    import GlassButton from "./GlassButton.svelte";
    import { supabase } from "$lib/supabase/client";
    import type { TicketCategory } from "$lib/types/database";
    import { toast } from "svelte-sonner";

    let {
        isOpen,
        category = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        category?: TicketCategory | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);

    let formData = $state({
        name: "",
        description: "",
        color: "#ef4444",
        icon: "AlertCircle",
    });

    const colors = [
        "#ef4444", // red
        "#f97316", // orange
        "#eab308", // yellow
        "#22c55e", // green
        "#06b6d4", // cyan
        "#3b82f6", // blue
        "#8b5cf6", // violet
        "#ec4899", // pink
    ];

    const icons = [
        "AlertCircle",
        "Settings",
        "Wrench",
        "Laptop",
        "Mouse",
        "Network",
        "Shield",
        "HardDrive",
        "Smartphone",
    ];

    $effect(() => {
        if (category) {
            formData = {
                name: category.name,
                description: category.description || "",
                color: category.color || "#ef4444",
                icon: category.icon || "AlertCircle",
            };
        } else {
            formData = {
                name: "",
                description: "",
                color: "#ef4444",
                icon: "AlertCircle",
            };
        }
    });

    async function handleSubmit() {
        try {
            loading = true;
            const dataToSave = {
                ...formData,
                description: formData.description || null,
            };

            if (category) {
                const { error } = await supabase
                    .from("ticket_categories")
                    .update(dataToSave)
                    .eq("id", category.id);
                if (error) throw error;
                toast.success("Categoría actualizada");
            } else {
                const { error } = await supabase
                    .from("ticket_categories")
                    .insert(dataToSave);
                if (error) throw error;
                toast.success("Categoría creada");
            }
            onSave();
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error("Error: " + e.message);
        } finally {
            loading = false;
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <div
            class="glass w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        >
            <div
                class="p-6 border-b border-white/10 flex justify-between items-center"
            >
                <h2
                    class="text-xl font-bold text-white flex items-center gap-2"
                >
                    <div
                        class="p-2 rounded-lg"
                        style="background: {formData.color}20; color: {formData.color}"
                    >
                        <AlertCircle size={24} />
                    </div>
                    {category ? "Editar Falla" : "Nueva Falla"}
                </h2>
                <button
                    onclick={onClose}
                    class="text-white/40 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                class="p-6 space-y-6"
            >
                <div class="space-y-1">
                    <label
                        for="name"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Nombre de la Falla / Categoría</label
                    >
                    <input
                        id="name"
                        type="text"
                        bind:value={formData.name}
                        required
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-red/40 transition-all font-medium"
                        placeholder="Ej: Falla de Red Interna"
                    />
                </div>

                <div class="space-y-1">
                    <label
                        for="description"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Descripción</label
                    >
                    <textarea
                        id="description"
                        bind:value={formData.description}
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-red/40 transition-all min-h-[80px]"
                        placeholder="Opcional..."
                    ></textarea>
                </div>

                <div class="space-y-3">
                    <label
                        class="text-xs font-semibold uppercase text-white/40 ml-1 flex items-center gap-2"
                    >
                        <Palette size={14} /> Color de Identificación
                    </label>
                    <div class="flex flex-wrap gap-3">
                        {#each colors as color}
                            <button
                                type="button"
                                onclick={() => (formData.color = color)}
                                class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 {formData.color ===
                                color
                                    ? 'border-white scale-110 shadow-lg'
                                    : 'border-transparent'}"
                                style="background-color: {color}"
                            ></button>
                        {/each}
                    </div>
                </div>

                <div class="pt-6 flex gap-4">
                    <GlassButton
                        variant="secondary"
                        class="flex-1 rounded-2xl"
                        onclick={onClose}
                        type="button"
                    >
                        Cancelar
                    </GlassButton>
                    <GlassButton
                        variant="primary"
                        class="flex-1 rounded-2xl"
                        type="submit"
                        {loading}
                    >
                        <Save size={18} class="mr-2" />
                        {category ? "Actualizar" : "Crear"}
                    </GlassButton>
                </div>
            </form>
        </div>
    </div>
{/if}
