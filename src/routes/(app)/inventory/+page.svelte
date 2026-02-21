<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        Package,
        Search,
        Filter,
        Laptop,
        Server,
        Printer,
        Router,
        Plus,
        Download,
        ChevronRight,
        AlertCircle,
        Edit2,
        Trash2,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import type { Equipment } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import EquipmentModal from "$lib/components/ui/EquipmentModal.svelte";
    import ScanReviewModal from "$lib/components/ui/ScanReviewModal.svelte";

    let searchQuery = $state("");
    let selectedType = $state("all");
    let loading = $state(true);
    let items = $state<Equipment[]>([]);
    let error = $state<string | null>(null);
    let pendingScans = $state<any[]>([]);

    // Modal state
    let isModalOpen = $state(false);
    let isReviewModalOpen = $state(false);
    let editingEquipment = $state<Equipment | null>(null);

    async function handleImportComplete() {
        fetchInventory();
        fetchPendingScans();
    }

    async function fetchPendingScans() {
        try {
            const { data, error: sbError } = await supabase
                .from("inventory_scans")
                .select("*")
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (sbError) throw sbError;
            pendingScans = data || [];
        } catch (e: any) {
            console.error("Error fetching scans:", e);
            toast.error("Error al cargar escaneos pendientes: " + e.message);
        }
    }

    const itemTypes = [
        { id: "all", label: "Todos", icon: Filter },
        { id: "computer", label: "Computadoras", icon: Laptop },
        { id: "server", label: "Servidores", icon: Server },
        { id: "printer", label: "Impresoras", icon: Printer },
        { id: "router", label: "Routers", icon: Router },
    ];

    async function fetchInventory() {
        try {
            loading = true;
            error = null;

            const { data, error: sbError } = await supabase
                .from("equipment")
                .select(
                    `
                    *,
                    departments (
                        id,
                        name,
                        locations (id, name)
                    ),
                    personnel (
                        id,
                        full_name
                    )
                `,
                )
                .order("created_at", { ascending: false });

            if (sbError) throw sbError;
            items = (data as any) || [];
        } catch (e: any) {
            console.error(e);
            error =
                e.message ||
                "No se pudo conectar con Supabase. Verifica tu configuración.";
            toast.error(error || "Ocurrió un error inesperado");
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Estás seguro de que deseas eliminar este equipo?"))
            return;

        try {
            const { error } = await supabase
                .from("equipment")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast.success("Equipo eliminado");
            fetchInventory();
        } catch (e: any) {
            toast.error("Error al eliminar: " + e.message);
        }
    }

    function openAddModal() {
        editingEquipment = null;
        isModalOpen = true;
    }

    function openEditModal(item: Equipment) {
        editingEquipment = item;
        isModalOpen = true;
    }

    onMount(() => {
        fetchInventory();
        fetchPendingScans();

        // Realtime subscription for new scans
        const channel = supabase
            .channel("public:inventory_scans")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "inventory_scans",
                },
                () => {
                    fetchPendingScans();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    });

    let filteredItems = $derived(
        items.filter((item) => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                item.name.toLowerCase().includes(searchLower) ||
                (item.asset_tag?.toLowerCase().includes(searchLower) ??
                    false) ||
                (item.serial_number?.toLowerCase().includes(searchLower) ??
                    false) ||
                (item.departments?.name.toLowerCase().includes(searchLower) ??
                    false);
            const matchesType =
                selectedType === "all" || item.type === selectedType;
            return matchesSearch && matchesType;
        }),
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-galpe-green bg-galpe-green/20 border-galpe-green/30";
            case "maintenance":
                return "text-galpe-orange bg-galpe-orange/20 border-galpe-orange/30";
            case "retired":
                return "text-galpe-green bg-galpe-green/20 border-galpe-green/30";
            default:
                return "text-white/50 bg-white/5 border-white/10";
        }
    };
</script>

<div class="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1
                class="text-3xl font-bold text-white/90 flex items-center gap-3"
            >
                <Package size={32} class="text-galpe-green" />
                Gestión de Inventario
            </h1>
            <p class="text-white/50">
                {filteredItems.length} equipos encontrados
            </p>
        </div>
        <div class="flex gap-3">
            <GlassButton variant="secondary">
                <Download size={18} class="mr-2" />
                Exportar
            </GlassButton>
            <GlassButton variant="primary" onclick={openAddModal}>
                <Plus size={18} class="mr-2" />
                Nuevo Equipo
            </GlassButton>
        </div>
    </header>

    {#if pendingScans.length > 0}
        <GlassCard class="bg-galpe-green/5 border-galpe-green/20 p-4 border-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-galpe-green/20 text-galpe-green rounded-lg"
                    >
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 class="font-bold text-white">
                            Escaneos de PC Pendientes
                        </h3>
                        <p class="text-xs text-white/50">
                            Hay {pendingScans.length} escaneos realizados recientemente
                            pendientes de revisión.
                        </p>
                    </div>
                </div>
                <GlassButton
                    variant="primary"
                    onclick={() => (isReviewModalOpen = true)}
                >
                    Revisar ahora
                </GlassButton>
            </div>
        </GlassCard>
    {/if}

    <!-- Filters Bar -->
    <GlassCard class="p-4">
        <div class="flex flex-col lg:flex-row gap-6">
            <!-- Search -->
            <div class="relative flex-1">
                <Search
                    size={18}
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Buscar por nombre o número de serie..."
                    class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-galpe-green/30 transition-all"
                />
            </div>

            <!-- Type Tabs -->
            <div class="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                {#each itemTypes as type}
                    <button
                        onclick={() => (selectedType = type.id)}
                        class="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap
                        {selectedType === type.id
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-transparent border-transparent text-white/40 hover:text-white/70'}"
                    >
                        <type.icon size={16} />
                        {type.label}
                    </button>
                {/each}
            </div>
        </div>
    </GlassCard>

    <!-- Results Table/Grid -->
    <div class="grid grid-cols-1 gap-4">
        {#if error}
            <div
                class="flex flex-col items-center justify-center py-20 text-galpe-green/60 glass rounded-2xl border-galpe-green/20"
            >
                <AlertCircle size={48} class="mb-4" />
                <p class="text-sm font-mono bg-black/20 p-4 rounded-lg mb-4">
                    {error}
                </p>
                <GlassButton
                    variant="secondary"
                    onclick={fetchInventory}
                    class="mt-2">Reintentar</GlassButton
                >
            </div>
        {:else if loading}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <div
                    class="w-10 h-10 border-4 border-galpe-green border-t-transparent rounded-full animate-spin mb-4"
                ></div>
                Cargando inventario...
            </div>
        {:else if filteredItems.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <Filter size={48} class="mb-4 opacity-10" />
                No se encontraron equipos con los filtros actuales.
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
                            <th class="px-6 py-4 font-semibold"
                                >Cód. Activo / Equipo</th
                            >
                            <th class="px-6 py-4 font-semibold text-center"
                                >Tipo</th
                            >
                            <th class="px-6 py-4 font-semibold">Serial</th>
                            <th class="px-6 py-4 font-semibold">Ubicación</th>
                            <th class="px-6 py-4 font-semibold">Estado</th>
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
                                    <div class="flex items-center gap-4">
                                        {#if item.image_url}
                                            <div
                                                class="w-12 h-12 rounded-lg border border-white/10 overflow-hidden flex-shrink-0 bg-white/5"
                                            >
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    class="w-full h-full object-cover"
                                                />
                                            </div>
                                        {:else}
                                            <div
                                                class="w-12 h-12 rounded-lg border border-white/10 border-dashed flex items-center justify-center flex-shrink-0 text-white/10"
                                            >
                                                <Laptop size={20} />
                                            </div>
                                        {/if}
                                        <div>
                                            <div
                                                class="text-[10px] font-black uppercase tracking-tighter text-galpe-green mb-0.5"
                                            >
                                                {item.asset_tag ?? "Sin Código"}
                                            </div>
                                            <div
                                                class="font-bold text-white/90 leading-tight"
                                            >
                                                {item.name}
                                            </div>
                                            <div
                                                class="text-[11px] text-white/30 mt-1"
                                            >
                                                {#if item.personnel}
                                                    Responsable: {item.personnel
                                                        .full_name}
                                                {:else}
                                                    {item.departments?.name ??
                                                        "Sin asignar"}
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td
                                    class="px-6 py-4 capitalize text-xs font-bold text-white/40 text-center"
                                >
                                    <div
                                        class="px-2 py-1 bg-white/5 rounded-lg border border-white/10 inline-block capitalize"
                                    >
                                        {item.type}
                                    </div>
                                </td>
                                <td
                                    class="px-6 py-4 font-mono text-xs text-white/50"
                                >
                                    {item.serial_number ?? "N/A"}
                                </td>
                                <td class="px-6 py-4 text-sm text-white/60">
                                    {item.departments?.locations?.name ??
                                        "Sin asignar"}
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        class="px-2 py-1 text-[10px] rounded-full border uppercase font-bold {getStatusColor(
                                            item.status,
                                        )}"
                                    >
                                        {item.status}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div
                                        class="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                    >
                                        <button
                                            onclick={() => openEditModal(item)}
                                            class="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onclick={() =>
                                                handleDelete(item.id)}
                                            class="w-8 h-8 rounded-lg flex items-center justify-center bg-galpe-green/10 hover:bg-galpe-green/20 text-galpe-green/60 hover:text-galpe-green transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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

<ScanReviewModal
    isOpen={isReviewModalOpen}
    scans={pendingScans}
    onImport={handleImportComplete}
    onClose={() => (isReviewModalOpen = false)}
/>

<EquipmentModal
    isOpen={isModalOpen}
    equipment={editingEquipment}
    onSave={fetchInventory}
    onClose={() => (isModalOpen = false)}
/>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
