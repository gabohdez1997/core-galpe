<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        Search,
        Plus,
        Boxes,
        AlertTriangle,
        Edit2,
        Trash2,
        Filter,
        TrendingDown,
        PackageCheck,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import { auth } from "$lib/auth.svelte";
    import type { Consumable } from "$lib/types/database";
    import ConsumableModal from "$lib/components/ui/ConsumableModal.svelte";

    let searchQuery = $state("");
    let loading = $state(true);
    let items = $state<Consumable[]>([]);
    let error = $state<string | null>(null);

    // Modal state
    let isModalOpen = $state(false);
    let editingItem = $state<Consumable | null>(null);

    async function fetchConsumables() {
        try {
            loading = true;
            error = null;
            const { data, error: sbError } = await supabase
                .from("consumables")
                .select("*")
                .order("name");
            if (sbError) throw sbError;
            items = data || [];
        } catch (e: any) {
            console.error(e);
            error = e.message || "Error al cargar los insumos.";
            toast.error(error);
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Estás seguro de que deseas eliminar este insumo?"))
            return;

        try {
            const { error } = await supabase
                .from("consumables")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast.success("Insumo eliminado");
            fetchConsumables();
        } catch (e: any) {
            toast.error("Error al eliminar: " + e.message);
        }
    }

    function openAddModal() {
        editingItem = null;
        isModalOpen = true;
    }

    function openEditModal(item: Consumable) {
        editingItem = item;
        isModalOpen = true;
    }

    onMount(fetchConsumables);

    let filteredItems = $derived(
        items.filter((item) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchLower) ||
                item.category.toLowerCase().includes(searchLower)
            );
        }),
    );

    let lowStockCount = $derived(
        items.filter((item) => item.stock_quantity <= item.min_stock).length,
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
                <Boxes class="text-galpe-red" size={32} />
                Gestión de Consumibles
            </h1>
            <p class="text-white/50">
                {filteredItems.length} insumos en inventario
            </p>
        </div>
        <div class="flex gap-3">
            {#if auth.has("consumables:create")}
                <GlassButton variant="primary" onclick={openAddModal}>
                    <Plus size={18} class="mr-2" />
                    Registrar Insumo
                </GlassButton>
            {/if}
        </div>
    </header>

    <!-- Stats Bar -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard class="p-4 flex items-center gap-4">
            <div class="p-3 bg-white/5 rounded-xl text-white/40">
                <Boxes size={24} />
            </div>
            <div>
                <p
                    class="text-xs text-white/40 font-bold uppercase tracking-wider"
                >
                    Total Insumos
                </p>
                <p class="text-2xl font-bold text-white">{items.length}</p>
            </div>
        </GlassCard>

        <GlassCard class="p-4 flex items-center gap-4 border-galpe-orange/20">
            <div class="p-3 bg-galpe-orange/10 rounded-xl text-galpe-orange">
                <TrendingDown size={24} />
            </div>
            <div>
                <p
                    class="text-xs text-galpe-orange/60 font-bold uppercase tracking-wider"
                >
                    Bajo Stock
                </p>
                <p class="text-2xl font-bold text-white">{lowStockCount}</p>
            </div>
        </GlassCard>

        <GlassCard class="p-4 flex items-center gap-4 border-galpe-green/20">
            <div class="p-3 bg-galpe-green/10 rounded-xl text-galpe-green">
                <PackageCheck size={24} />
            </div>
            <div>
                <p
                    class="text-xs text-galpe-green/60 font-bold uppercase tracking-wider"
                >
                    Estado de Inventario
                </p>
                <p class="text-2xl font-bold text-white">Óptimo</p>
            </div>
        </GlassCard>
    </div>

    <!-- Filters Bar -->
    <GlassCard class="p-4">
        <div class="relative w-full">
            <Search
                size={18}
                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Buscar por nombre o categoría..."
                class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-galpe-red/30 transition-all"
            />
        </div>
    </GlassCard>

    <!-- Results Table -->
    <div class="grid grid-cols-1 gap-4">
        {#if loading}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <div
                    class="w-10 h-10 border-4 border-galpe-red border-t-transparent rounded-full animate-spin mb-4"
                ></div>
                Cargando insumos...
            </div>
        {:else if filteredItems.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <Filter size={48} class="mb-4 opacity-10" />
                No se encontraron insumos.
            </div>
        {:else}
            <div
                class="overflow-x-auto rounded-2xl border border-white/10 glass"
            >
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr
                            class="bg-white/5 text-xs uppercase tracking-wider text-white/40"
                        >
                            <th class="px-6 py-4 font-semibold">Insumo</th>
                            <th class="px-6 py-4 font-semibold">Categoría</th>
                            <th class="px-6 py-4 font-semibold text-center"
                                >Stock</th
                            >
                            <th class="px-6 py-4 font-semibold text-center"
                                >Mínimo</th
                            >
                            <th class="px-6 py-4 font-semibold text-right"
                                >Acciones</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        {#each filteredItems as item}
                            <tr
                                class="hover:bg-white/5 transition-colors group"
                            >
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-10 h-10 rounded-xl bg-galpe-red/5 flex items-center justify-center text-galpe-red/40 group-hover:text-galpe-red transition-colors"
                                        >
                                            <Boxes size={20} />
                                        </div>
                                        <div>
                                            <div
                                                class="font-medium text-white/90"
                                            >
                                                {item.name}
                                            </div>
                                            {#if item.description}
                                                <div
                                                    class="text-[10px] text-white/30 truncate max-w-xs"
                                                >
                                                    {item.description}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        class="px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] text-white/40 uppercase font-bold"
                                    >
                                        {item.category}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <div class="flex flex-col items-center">
                                        <span
                                            class="text-lg font-bold {item.stock_quantity <=
                                            item.min_stock
                                                ? 'text-galpe-orange'
                                                : 'text-white'}"
                                        >
                                            {item.stock_quantity}
                                        </span>
                                        <span
                                            class="text-[10px] text-white/20 uppercase font-medium"
                                            >{item.unit}</span
                                        >
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span
                                        class="text-sm font-medium text-white/30"
                                    >
                                        {item.min_stock}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div
                                        class="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                    >
                                        {#if auth.has("consumables:update")}
                                            <button
                                                onclick={() =>
                                                    openEditModal(item)}
                                                class="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        {/if}
                                        {#if auth.has("consumables:delete")}
                                            <button
                                                onclick={() =>
                                                    handleDelete(item.id)}
                                                class="w-8 h-8 rounded-lg flex items-center justify-center bg-galpe-red/10 hover:bg-galpe-red/20 text-galpe-red/60 hover:text-galpe-red transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<ConsumableModal
    isOpen={isModalOpen}
    consumable={editingItem}
    onSave={fetchConsumables}
    onClose={() => (isModalOpen = false)}
/>
