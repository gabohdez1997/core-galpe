<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        Search,
        Plus,
        AlertCircle,
        Edit2,
        Trash2,
        Tag,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import type { TicketCategory } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import TicketCategoryModal from "$lib/components/ui/TicketCategoryModal.svelte";

    let searchQuery = $state("");
    let loading = $state(true);
    let items = $state<TicketCategory[]>([]);
    let error = $state<string | null>(null);

    // Modal state
    let isModalOpen = $state(false);
    let editingCategory = $state<TicketCategory | null>(null);

    async function fetchCategories() {
        try {
            loading = true;
            error = null;

            const { data, error: sbError } = await supabase
                .from("ticket_categories")
                .select("*")
                .order("name", { ascending: true });

            if (sbError) throw sbError;
            items = data || [];
        } catch (e: any) {
            console.error(e);
            error = e.message || "Error al cargar las categorías.";
            toast.error(error);
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Estás seguro de eliminar esta categoría de falla?"))
            return;

        try {
            const { error } = await supabase
                .from("ticket_categories")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast.success("Categoría eliminada");
            fetchCategories();
        } catch (e: any) {
            toast.error("Error al eliminar: " + e.message);
        }
    }

    function openAddModal() {
        editingCategory = null;
        isModalOpen = true;
    }

    function openEditModal(cat: TicketCategory) {
        editingCategory = cat;
        isModalOpen = true;
    }

    onMount(fetchCategories);

    let filteredItems = $derived(
        items.filter((item) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchLower) ||
                (item.description?.toLowerCase().includes(searchLower) ?? false)
            );
        }),
    );
</script>

<div class="max-w-7xl mx-auto space-y-6">
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1
                class="text-3xl font-bold text-white/90 flex items-center gap-3"
            >
                <AlertCircle class="text-galpe-green" size={32} />
                Tipos de Fallas
            </h1>
            <p class="text-white/50">
                {filteredItems.length} categorías de soporte configuradas
            </p>
        </div>
        <div class="flex gap-3">
            <GlassButton variant="primary" onclick={openAddModal}>
                <Plus size={18} class="mr-2" />
                Nueva Categoría
            </GlassButton>
        </div>
    </header>

    <GlassCard class="p-4">
        <div class="relative w-full">
            <Search
                size={18}
                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Buscar por nombre o descripción..."
                class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-galpe-green/30 transition-all"
            />
        </div>
    </GlassCard>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#if error}
            <div
                class="col-span-full py-20 text-center glass rounded-2xl border-galpe-green/20"
            >
                <AlertCircle size={48} class="mx-auto mb-4 text-galpe-green/60" />
                <p class="text-white/40 mb-4">{error}</p>
                <GlassButton variant="secondary" onclick={fetchCategories}
                    >Reintentar</GlassButton
                >
            </div>
        {:else if loading}
            <div class="col-span-full py-20 text-center text-white/20">
                <div
                    class="w-10 h-10 border-4 border-galpe-green border-t-transparent rounded-full animate-spin mx-auto mb-4"
                ></div>
                Cargando categorías...
            </div>
        {:else if filteredItems.length === 0}
            <div
                class="col-span-full py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl"
            >
                <Tag size={48} class="mx-auto mb-4 opacity-10" />
                <p>No se encontraron categorías.</p>
            </div>
        {:else}
            {#each filteredItems as item}
                <GlassCard
                    class="p-6 group hover:border-white/20 transition-all border-white/5 relative overflow-hidden"
                >
                    <div
                        class="absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none opacity-20"
                        style="background-color: {item.color}"
                    ></div>

                    <div class="flex justify-between items-start mb-4">
                        <div
                            class="p-3 rounded-2xl"
                            style="background-color: {item.color}20; color: {item.color}"
                        >
                            <AlertCircle size={24} />
                        </div>
                        <div class="flex gap-2">
                            <button
                                onclick={() => openEditModal(item)}
                                class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onclick={() => handleDelete(item.id)}
                                class="p-2 rounded-lg bg-galpe-green/10 hover:bg-galpe-green/20 text-galpe-green/60 hover:text-galpe-green transition-all"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <h3 class="text-lg font-bold text-white mb-2">
                        {item.name}
                    </h3>
                    <p
                        class="text-sm text-white/40 line-clamp-2 min-h-[2.5rem]"
                    >
                        {item.description || "Sin descripción adicional."}
                    </p>
                </GlassCard>
            {/each}
        {/if}
    </div>
</div>

<TicketCategoryModal
    isOpen={isModalOpen}
    category={editingCategory}
    onSave={fetchCategories}
    onClose={() => (isModalOpen = false)}
/>
