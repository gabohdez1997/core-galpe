<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        Search,
        Plus,
        Wrench,
        Calendar,
        Clock,
        CheckCircle2,
        XCircle,
        Filter,
        DollarSign,
        MoreVertical,
        Edit2,
        Trash2,
        AlertCircle,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import { auth } from "$lib/auth.svelte";
    import type { MaintenanceRecord } from "$lib/types/database";
    import MaintenanceModal from "$lib/components/ui/MaintenanceModal.svelte";

    let searchQuery = $state("");
    let selectedStatus = $state("all");
    let loading = $state(true);
    let records = $state<MaintenanceRecord[]>([]);
    let error = $state<string | null>(null);

    // Modal state
    let isModalOpen = $state(false);
    let editingRecord = $state<MaintenanceRecord | null>(null);

    const statusOptions = [
        { id: "all", label: "Todos", icon: Filter },
        { id: "scheduled", label: "Programados", icon: Calendar },
        { id: "in_progress", label: "En Proceso", icon: Clock },
        { id: "completed", label: "Completados", icon: CheckCircle2 },
        { id: "cancelled", label: "Cancelados", icon: XCircle },
    ];

    async function fetchRecords() {
        try {
            loading = true;
            error = null;
            const { data, error: sbError } = await supabase
                .from("maintenance_records")
                .select(
                    `
                    *,
                    equipment (id, name, asset_tag),
                    personnel (id, full_name)
                `,
                )
                .order("scheduled_date", { ascending: false });

            if (sbError) throw sbError;
            records = (data as any) || [];
        } catch (e: any) {
            console.error(e);
            error = e.message || "Error al cargar los mantenimientos.";
            toast.error(error);
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Eliminar este registro de mantenimiento?")) return;

        try {
            const { error } = await supabase
                .from("maintenance_records")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast.success("Registro eliminado");
            fetchRecords();
        } catch (e: any) {
            toast.error("Error al eliminar: " + e.message);
        }
    }

    function openAddModal() {
        editingRecord = null;
        isModalOpen = true;
    }

    function openEditModal(record: MaintenanceRecord) {
        editingRecord = record;
        isModalOpen = true;
    }

    onMount(fetchRecords);

    let filteredRecords = $derived(
        records.filter((r) => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                r.title.toLowerCase().includes(searchLower) ||
                (r.equipment?.name.toLowerCase().includes(searchLower) ??
                    false) ||
                (r.equipment?.asset_tag?.toLowerCase().includes(searchLower) ??
                    false);
            const matchesStatus =
                selectedStatus === "all" || r.status === selectedStatus;
            return matchesSearch && matchesStatus;
        }),
    );

    let totalPending = $derived(
        records.filter(
            (r) => r.status === "scheduled" || r.status === "in_progress",
        ).length,
    );
    let totalCost = $derived(
        records.reduce((acc, r) => acc + (r.cost || 0), 0),
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "scheduled":
                return "text-blue-400 bg-blue-400/20 border-blue-400/30";
            case "in_progress":
                return "text-galpe-orange bg-galpe-orange/20 border-galpe-orange/30";
            case "completed":
                return "text-galpe-green bg-galpe-green/20 border-galpe-green/30";
            case "cancelled":
                return "text-galpe-red bg-galpe-red/20 border-galpe-red/30";
            default:
                return "text-white/40 bg-white/5 border-white/10";
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString();
    };
</script>

<div class="max-w-7xl mx-auto space-y-6">
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1
                class="text-3xl font-bold text-white/90 flex items-center gap-3"
            >
                <Wrench class="text-galpe-red" size={32} />
                Gestión de Mantenimientos
            </h1>
            <p class="text-white/50">
                Planificación y registro de soporte técnico
            </p>
        </div>
        <div class="flex gap-3">
            {#if auth.has("maintenance:create")}
                <GlassButton variant="primary" onclick={openAddModal}>
                    <Plus size={18} class="mr-2" />
                    Nueva Tarea
                </GlassButton>
            {/if}
        </div>
    </header>

    <!-- Stats Bar -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard class="p-4 flex items-center gap-4">
            <div class="p-3 bg-white/5 rounded-xl text-white/40">
                <Calendar size={20} />
            </div>
            <div>
                <p
                    class="text-[10px] text-white/40 font-bold uppercase tracking-wider"
                >
                    Total Tareas
                </p>
                <p class="text-xl font-bold text-white">{records.length}</p>
            </div>
        </GlassCard>

        <GlassCard class="p-4 flex items-center gap-4 border-galpe-orange/20">
            <div class="p-3 bg-galpe-orange/10 rounded-xl text-galpe-orange">
                <Clock size={20} />
            </div>
            <div>
                <p
                    class="text-[10px] text-galpe-orange/60 font-bold uppercase tracking-wider"
                >
                    Pendientes
                </p>
                <p class="text-xl font-bold text-white">{totalPending}</p>
            </div>
        </GlassCard>

        <GlassCard class="p-4 flex items-center gap-4 border-galpe-green/20">
            <div class="p-3 bg-galpe-green/10 rounded-xl text-galpe-green">
                <CheckCircle2 size={20} />
            </div>
            <div>
                <p
                    class="text-[10px] text-galpe-green/60 font-bold uppercase tracking-wider"
                >
                    Completados
                </p>
                <p class="text-xl font-bold text-white">
                    {records.filter((r) => r.status === "completed").length}
                </p>
            </div>
        </GlassCard>

        <GlassCard class="p-4 flex items-center gap-4 border-white/10">
            <div class="p-3 bg-white/5 rounded-xl text-white/40">
                <DollarSign size={20} />
            </div>
            <div>
                <p
                    class="text-[10px] text-white/40 font-bold uppercase tracking-wider"
                >
                    Costo Total
                </p>
                <p class="text-xl font-bold text-white">
                    ${totalCost.toLocaleString()}
                </p>
            </div>
        </GlassCard>
    </div>

    <!-- Filters Bar -->
    <GlassCard class="p-4">
        <div class="flex flex-col lg:flex-row gap-6">
            <div class="relative flex-1">
                <Search
                    size={18}
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Buscar por título o equipo..."
                    class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-galpe-red/30 transition-all"
                />
            </div>
            <div class="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                {#each statusOptions as opt}
                    <button
                        onclick={() => (selectedStatus = opt.id)}
                        class="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap
                        {selectedStatus === opt.id
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-transparent border-transparent text-white/40 hover:text-white/70'}"
                    >
                        <opt.icon size={16} />
                        <span class="text-sm font-medium">{opt.label}</span>
                    </button>
                {/each}
            </div>
        </div>
    </GlassCard>

    <!-- Table -->
    <div class="grid grid-cols-1 gap-4">
        {#if loading}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <div
                    class="w-10 h-10 border-4 border-galpe-red border-t-transparent rounded-full animate-spin mb-4"
                ></div>
                Cargando registros...
            </div>
        {:else if error}
            <div
                class="flex flex-col items-center justify-center py-20 text-galpe-red/60 glass rounded-2xl"
            >
                <AlertCircle size={48} class="mb-4" />
                <p>{error}</p>
                <GlassButton
                    variant="secondary"
                    onclick={fetchRecords}
                    class="mt-4">Reintentar</GlassButton
                >
            </div>
        {:else if filteredRecords.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <Wrench size={48} class="mb-4 opacity-10" />
                No hay registros que coincidan.
            </div>
        {:else}
            <div
                class="overflow-x-auto rounded-2xl border border-white/10 glass"
            >
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr
                            class="bg-white/5 text-[10px] uppercase tracking-wider text-white/40 font-bold"
                        >
                            <th class="px-6 py-4">Actividad / Equipo</th>
                            <th class="px-6 py-4">Tipo</th>
                            <th class="px-6 py-4 text-center">Progreso</th>
                            <th class="px-6 py-4">Próxima Fecha</th>
                            <th class="px-6 py-4 text-right">Costo</th>
                            <th class="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        {#each filteredRecords as record}
                            <tr
                                class="hover:bg-white/5 transition-colors group"
                            >
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-galpe-red transition-colors"
                                        >
                                            <Wrench size={18} />
                                        </div>
                                        <div>
                                            <div
                                                class="font-bold text-white/90 leading-tight"
                                            >
                                                {record.title}
                                            </div>
                                            <div
                                                class="text-[10px] text-white/30 uppercase mt-1"
                                            >
                                                {record.equipment?.name}
                                                <span class="mx-1 opacity-50"
                                                    >|</span
                                                >
                                                {record.equipment?.asset_tag ||
                                                    "Sin Código"}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border {record.type ===
                                        'preventative'
                                            ? 'text-galpe-green border-galpe-green/20 bg-galpe-green/5'
                                            : 'text-galpe-orange border-galpe-orange/20 bg-galpe-orange/5'}"
                                    >
                                        {record.type === "preventative"
                                            ? "PREVENTIVO"
                                            : "CORRECTIVO"}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col items-center">
                                        <span
                                            class="px-2 py-1 text-[10px] rounded-full border uppercase font-bold {getStatusStyles(
                                                record.status,
                                            )}"
                                        >
                                            {record.status}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-xs text-white/60">
                                        {formatDate(record.scheduled_date)}
                                    </div>
                                    {#if record.status === "completed"}
                                        <div
                                            class="text-[10px] text-galpe-green/60 mt-0.5"
                                        >
                                            Finalizado: {formatDate(
                                                record.performed_at || "",
                                            )}
                                        </div>
                                    {/if}
                                </td>
                                <td
                                    class="px-6 py-4 text-right font-mono text-sm"
                                >
                                    {record.cost ? `$${record.cost}` : "-"}
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div
                                        class="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                    >
                                        {#if auth.has("maintenance:update")}
                                            <button
                                                onclick={() =>
                                                    openEditModal(record)}
                                                class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        {/if}
                                        {#if auth.has("maintenance:delete")}
                                            <button
                                                onclick={() =>
                                                    handleDelete(record.id)}
                                                class="p-2 rounded-lg bg-galpe-red/10 hover:bg-galpe-red/20 text-galpe-red/60 hover:text-galpe-red"
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

<MaintenanceModal
    isOpen={isModalOpen}
    record={editingRecord}
    onSave={fetchRecords}
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
