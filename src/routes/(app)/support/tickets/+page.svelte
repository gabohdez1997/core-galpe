<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        Search,
        Plus,
        Ticket,
        Clock,
        CheckCircle2,
        XCircle,
        AlertCircle,
        User,
        Laptop,
        Edit2,
        Calendar,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import type { Ticket as TicketType } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import TicketModal from "$lib/components/ui/TicketModal.svelte";
    import TicketDetailModal from "$lib/components/ui/TicketDetailModal.svelte";

    let searchQuery = $state("");
    let loading = $state(true);
    let items = $state<TicketType[]>([]);
    let error = $state<string | null>(null);

    // Filter states
    let selectedStatus = $state("all");
    let selectedPriority = $state("all");

    // Modal state
    let isModalOpen = $state(false);
    let isDetailOpen = $state(false);
    let editingTicket = $state<TicketType | null>(null);
    let selectedTicket = $state<TicketType | null>(null);

    async function fetchTickets() {
        try {
            loading = true;
            error = null;

            const { data, error: sbError } = await supabase
                .from("tickets")
                .select(
                    `
                    *,
                    ticket_categories (id, name, color),
                    personnel (id, full_name),
                    equipment (id, name, asset_tag),
                    profiles!assigned_to (id, full_name)
                `,
                )
                .order("created_at", { ascending: false });

            if (sbError) throw sbError;
            items = (data as any) || [];
        } catch (e: any) {
            console.error(e);
            error = e.message || "Error al cargar los tickets.";
            toast.error(error);
        } finally {
            loading = false;
        }
    }

    function openAddModal() {
        editingTicket = null;
        isModalOpen = true;
    }

    function openEditModal(ticket: TicketType) {
        editingTicket = ticket;
        isModalOpen = true;
    }

    function openDetail(ticket: TicketType) {
        selectedTicket = ticket;
        isDetailOpen = true;
    }

    onMount(fetchTickets);

    const statusMap = {
        abierto: {
            label: "Abierto",
            color: "text-blue-400 bg-blue-400/10",
            icon: Ticket,
        },
        en_proceso: {
            label: "En Proceso",
            color: "text-yellow-400 bg-yellow-400/10",
            icon: Clock,
        },
        resuelto: {
            label: "Resuelto",
            color: "text-green-400 bg-green-400/10",
            icon: CheckCircle2,
        },
        cerrado: {
            label: "Cerrado",
            color: "text-white/20 bg-white/5",
            icon: XCircle,
        },
    };

    const priorityMap = {
        baja: { label: "Baja", color: "border-blue-400 text-blue-400" },
        media: { label: "Media", color: "border-yellow-400 text-yellow-400" },
        alta: { label: "Alta", color: "border-orange-400 text-orange-400" },
        critica: { label: "Crítica", color: "border-red-500 text-red-500" },
    };

    let filteredItems = $derived(
        items.filter((item) => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                item.title.toLowerCase().includes(searchLower) ||
                (item.personnel?.full_name
                    ?.toLowerCase()
                    .includes(searchLower) ??
                    false) ||
                (item.ticket_categories?.name
                    ?.toLowerCase()
                    .includes(searchLower) ??
                    false);

            const matchesStatus =
                selectedStatus === "all" || item.status === selectedStatus;
            const matchesPriority =
                selectedPriority === "all" ||
                item.priority === selectedPriority;

            return matchesSearch && matchesStatus && matchesPriority;
        }),
    );

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="max-w-7xl mx-auto space-y-6">
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1
                class="text-3xl font-bold text-white/90 flex items-center gap-3"
            >
                <Ticket class="text-galpe-green" size={32} />
                Gestión de Soporte Técnico
            </h1>
            <p class="text-white/50">
                {filteredItems.length} tickets en pantalla
            </p>
        </div>
        <div class="flex gap-3">
            <GlassButton variant="primary" onclick={openAddModal}>
                <Plus size={18} class="mr-2" />
                Nueva Solicitud
            </GlassButton>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <GlassCard class="lg:col-span-2 p-4 flex items-center gap-3">
            <Search size={18} class="text-white/30" />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Buscar por título, usuario o falla..."
                class="flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-white/20"
            />
        </GlassCard>

        <div class="p-2 border border-white/10 rounded-2xl flex gap-2">
            {#each Object.keys(statusMap) as status}
                <button
                    onclick={() =>
                        (selectedStatus =
                            selectedStatus === status ? "all" : status)}
                    class="flex-1 text-[10px] font-bold uppercase rounded-xl transition-all {selectedStatus ===
                    status
                        ? statusMap[status].color
                        : 'text-white/20 hover:text-white/40'}"
                >
                    {statusMap[status].label}
                </button>
            {/each}
        </div>

        <select
            bind:value={selectedPriority}
            class="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none"
        >
            <option value="all">TODAS LAS PRIORIDADES</option>
            <option value="baja">PRIORIDAD BAJA</option>
            <option value="media">PRIORIDAD MEDIA</option>
            <option value="alta">PRIORIDAD ALTA</option>
            <option value="critica">CRÍTICA (URGENTE)</option>
        </select>
    </div>

    <div class="space-y-4">
        {#if error}
            <div
                class="py-20 text-center glass rounded-3xl border-galpe-green/20"
            >
                <AlertCircle size={48} class="mx-auto mb-4 text-galpe-green/60" />
                <p class="text-white/40 mb-4">{error}</p>
                <GlassButton variant="secondary" onclick={fetchTickets}
                    >Reintentar</GlassButton
                >
            </div>
        {:else if loading}
            <div class="py-20 text-center text-white/20">
                <div
                    class="w-10 h-10 border-4 border-galpe-green border-t-transparent rounded-full animate-spin mx-auto mb-4"
                ></div>
                Sincronizando tickets...
            </div>
        {:else if filteredItems.length === 0}
            <div
                class="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl"
            >
                <Ticket size={48} class="mx-auto mb-4 opacity-10" />
                <p>No se encontraron tickets con los filtros aplicados.</p>
            </div>
        {:else}
            {#each filteredItems as item}
                <GlassCard
                    class="group hover:border-white/20 transition-all border-white/5 overflow-hidden flex flex-col md:flex-row"
                >
                    <div
                        class="w-1 md:w-2"
                        style="background-color: {item.ticket_categories
                            ?.color || '#333'}"
                    ></div>

                    <div
                        class="flex-1 p-6 flex flex-col md:flex-row md:items-center gap-6"
                    >
                        <div class="flex-1 min-w-0 space-y-3">
                            <div class="flex items-center gap-3">
                                <span
                                    class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border {priorityMap[
                                        item.priority
                                    ].color} {priorityMap[
                                        item.priority
                                    ].color.replace('text-', 'bg-') + '/10'}"
                                >
                                    {item.priority}
                                </span>
                                <span class="text-white/30 text-xs font-mono"
                                    >#{item.id.slice(0, 8)}</span
                                >
                                <span
                                    class="text-white/20 text-[10px] flex items-center gap-1"
                                >
                                    <Calendar size={12} />
                                    {formatDate(item.created_at)}
                                </span>
                            </div>

                            <h3
                                onclick={() => openDetail(item)}
                                class="text-xl font-bold text-white group-hover:text-galpe-green transition-colors truncate cursor-pointer"
                            >
                                {item.title}
                            </h3>

                            <div class="flex flex-wrap gap-4 text-sm">
                                <div
                                    class="flex items-center gap-2 text-white/50"
                                >
                                    <User size={14} class="text-galpe-green/60" />
                                    {item.personnel?.full_name || "Desconocido"}
                                </div>
                                {#if item.equipment}
                                    <div
                                        class="flex items-center gap-2 text-white/50"
                                    >
                                        <Laptop
                                            size={14}
                                            class="text-white/20"
                                        />
                                        {item.equipment.name}
                                    </div>
                                {/if}
                                <div
                                    class="flex items-center gap-2 text-white/50"
                                >
                                    <AlertCircle
                                        size={14}
                                        style="color: {item.ticket_categories
                                            ?.color}"
                                    />
                                    {item.ticket_categories?.name ||
                                        "Sin categoría"}
                                </div>
                            </div>
                        </div>

                        <div
                            class="flex flex-col md:items-end gap-3 min-w-[150px]"
                        >
                            <div
                                class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold {statusMap[
                                    item.status
                                ].color}"
                            >
                                {statusMap[item.status].label.toUpperCase()}
                            </div>

                            <div
                                class="flex items-center gap-2 text-white/30 text-xs italic"
                            >
                                <span>Asignado:</span>
                                <span class="text-white/60"
                                    >{item.profiles?.full_name ||
                                        "PENDIENTE"}</span
                                >
                            </div>

                            <div class="flex gap-2">
                                <button
                                    onclick={() => openDetail(item)}
                                    class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                                >
                                    <History size={14} /> Historial
                                </button>
                                <button
                                    onclick={() => openEditModal(item)}
                                    class="px-3 py-2 rounded-xl bg-galpe-green/10 hover:bg-galpe-green/20 text-galpe-green/60 hover:text-galpe-green transition-all"
                                    title="Editar / Gestionar"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            {/each}
        {/if}
    </div>
</div>

<TicketModal
    isOpen={isModalOpen}
    ticket={editingTicket}
    onSave={fetchTickets}
    onClose={() => (isModalOpen = false)}
/>

<TicketDetailModal
    isOpen={isDetailOpen}
    ticket={selectedTicket}
    onClose={() => (isDetailOpen = false)}
/>

<style>
    select option {
        background: #1a1a1a;
        color: white;
    }
</style>
