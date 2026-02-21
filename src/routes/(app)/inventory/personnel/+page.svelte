<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        Search,
        Plus,
        Users,
        Mail,
        Phone,
        Building,
        Edit2,
        Trash2,
        AlertCircle,
        User,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import type { Personnel } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import PersonnelModal from "$lib/components/ui/PersonnelModal.svelte";

    let searchQuery = $state("");
    let loading = $state(true);
    let items = $state<Personnel[]>([]);
    let error = $state<string | null>(null);

    // Modal state
    let isModalOpen = $state(false);
    let editingPerson = $state<Personnel | null>(null);

    async function fetchPersonnel() {
        try {
            loading = true;
            error = null;

            const { data, error: sbError } = await supabase
                .from("personnel")
                .select(
                    `
                    *,
                    departments (
                        id,
                        name,
                        locations (id, name)
                    )
                `,
                )
                .order("created_at", { ascending: false });

            if (sbError) throw sbError;
            items = (data as any) || [];
        } catch (e: any) {
            console.error(e);
            error = e.message || "Error al cargar el personal.";
            toast.error(error || "Error al cargar el personal.");
        } finally {
            loading = false;
        }
    }

    async function handleDelete(id: string) {
        if (
            !confirm(
                "¿Estás seguro de que deseas eliminar este registro de personal?",
            )
        )
            return;

        try {
            const { error } = await supabase
                .from("personnel")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast.success("Registro eliminado");
            fetchPersonnel();
        } catch (e: any) {
            toast.error("Error al eliminar: " + e.message);
        }
    }

    function openAddModal() {
        editingPerson = null;
        isModalOpen = true;
    }

    function openEditModal(person: Personnel) {
        editingPerson = person;
        isModalOpen = true;
    }

    onMount(fetchPersonnel);

    let filteredItems = $derived(
        items.filter((item) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                item.full_name.toLowerCase().includes(searchLower) ||
                (item.email?.toLowerCase().includes(searchLower) ?? false) ||
                (item.departments?.name.toLowerCase().includes(searchLower) ??
                    false)
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
                <Users class="text-galpe-green" size={32} />
                Gestión de Personal
            </h1>
            <p class="text-white/50">
                {filteredItems.length} personas registradas
            </p>
        </div>
        <div class="flex gap-3">
            <GlassButton variant="primary" onclick={openAddModal}>
                <Plus size={18} class="mr-2" />
                Registrar Personal
            </GlassButton>
        </div>
    </header>

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
                placeholder="Buscar por nombre, correo o departamento..."
                class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-galpe-green/30 transition-all"
            />
        </div>
    </GlassCard>

    <!-- Results -->
    <div class="grid grid-cols-1 gap-4">
        {#if error}
            <div
                class="flex flex-col items-center justify-center py-20 text-galpe-green/60 glass rounded-2xl border-galpe-green/20"
            >
                <AlertCircle size={48} class="mb-4" />
                <p class="text-sm font-mono bg-black/20 p-4 rounded-lg mb-4">
                    {error}
                </p>
                <GlassButton variant="secondary" onclick={fetchPersonnel}
                    >Reintentar</GlassButton
                >
            </div>
        {:else if loading}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <div
                    class="w-10 h-10 border-4 border-galpe-green border-t-transparent rounded-full animate-spin mb-4"
                ></div>
                Cargando personal...
            </div>
        {:else if filteredItems.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 text-white/20"
            >
                <User size={48} class="mb-4 opacity-10" />
                No se encontró personal con los filtros actuales.
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
                            <th class="px-6 py-4 font-semibold">Nombre</th>
                            <th class="px-6 py-4 font-semibold">Contacto</th>
                            <th class="px-6 py-4 font-semibold">Ubicación</th>
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
                                            class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-galpe-green font-bold"
                                        >
                                            {item.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div
                                                class="font-medium text-white/90"
                                            >
                                                {item.full_name}
                                            </div>
                                            <div class="text-xs text-white/30">
                                                ID: {item.id.slice(0, 8)}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 space-y-1">
                                    {#if item.email}
                                        <div
                                            class="flex items-center gap-2 text-sm text-white/60"
                                        >
                                            <Mail
                                                size={14}
                                                class="text-white/20"
                                            />
                                            {item.email}
                                        </div>
                                    {/if}
                                    {#if item.phone}
                                        <div
                                            class="flex items-center gap-2 text-sm text-white/60"
                                        >
                                            <Phone
                                                size={14}
                                                class="text-white/20"
                                            />
                                            {item.phone}
                                        </div>
                                    {/if}
                                </td>
                                <td class="px-6 py-4">
                                    <div
                                        class="flex items-center gap-2 text-sm text-white/60"
                                    >
                                        <Building
                                            size={14}
                                            class="text-white/20"
                                        />
                                        {item.departments?.name ?? "Sin depto."}
                                    </div>
                                    <div class="text-xs text-white/30 ml-6">
                                        {item.departments?.locations?.name ??
                                            ""}
                                    </div>
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

<PersonnelModal
    isOpen={isModalOpen}
    person={editingPerson}
    onSave={fetchPersonnel}
    onClose={() => (isModalOpen = false)}
/>
