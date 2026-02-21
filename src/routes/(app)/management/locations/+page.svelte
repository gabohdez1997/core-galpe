<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        MapPin,
        Plus,
        Trash2,
        Edit2,
        Loader2,
        Save,
        X,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import type { Location } from "$lib/types/database";

    let locations = $state<Location[]>([]);
    let loading = $state(true);
    let isModalOpen = $state(false);
    let saving = $state(false);
    let editingItem = $state<Location | null>(null);
    let itemName = $state("");

    async function fetchLocations() {
        loading = true;
        const { data, error } = await supabase
            .from("locations")
            .select("*")
            .order("name");
        if (error) toast.error("Error al cargar sedes");
        else locations = data || [];
        loading = false;
    }

    async function handleSave() {
        if (!itemName.trim()) return;
        saving = true;
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from("locations")
                    .update({ name: itemName })
                    .eq("id", editingItem.id);
                if (error) throw error;
                toast.success("Sede actualizada");
            } else {
                const { error } = await supabase
                    .from("locations")
                    .insert({ name: itemName });
                if (error) throw error;
                toast.success("Sede creada");
            }
            closeModal();
            fetchLocations();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            saving = false;
        }
    }

    async function handleDelete(id: string) {
        if (
            !confirm(
                "¿Seguro? Esto podría fallar si hay departamentos asociados.",
            )
        )
            return;
        const { error } = await supabase
            .from("locations")
            .delete()
            .eq("id", id);
        if (error) toast.error("Error: " + error.message);
        else {
            toast.success("Eliminado");
            fetchLocations();
        }
    }

    function openModal(item: Location | null = null) {
        editingItem = item;
        itemName = item ? item.name : "";
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
        editingItem = null;
        itemName = "";
    }

    onMount(fetchLocations);
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
    <header class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                <MapPin size={32} class="text-galpe-green" />
                Sedes / Ubicaciones
            </h1>
            <p class="text-white/50">
                Gestiona las sedes físicas de la empresa
            </p>
        </div>
        <GlassButton variant="primary" onclick={() => openModal()}>
            <Plus size={18} class="mr-2" />
            Nueva Sede
        </GlassButton>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#if loading}
            {#each [1, 2, 3, 4] as i}
                <div class="h-24 glass animate-pulse rounded-2xl"></div>
            {/each}
        {:else if locations.length === 0}
            <div
                class="col-span-full py-20 text-center text-white/20 glass rounded-2xl"
            >
                No hay sedes registradas.
            </div>
        {:else}
            {#each locations as item}
                <GlassCard class="group">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-10 h-10 rounded-full bg-galpe-green/10 flex items-center justify-center text-galpe-green"
                            >
                                <MapPin size={20} />
                            </div>
                            <span class="font-medium text-lg text-white/90"
                                >{item.name}</span
                            >
                        </div>
                        <div
                            class="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                onclick={() => openModal(item)}
                                class="p-2 text-white/40 hover:text-white transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onclick={() => handleDelete(item.id)}
                                class="p-2 text-galpe-green/60 hover:text-galpe-green transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </GlassCard>
            {/each}
        {/if}
    </div>
</div>

{#if isModalOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <div
            class="glass w-full max-w-md rounded-3xl border border-white/10 p-6 space-y-4 animate-in fade-in zoom-in duration-200"
        >
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-white">
                    {editingItem ? "Editar Sede" : "Nueva Sede"}
                </h2>
                <button
                    onclick={closeModal}
                    class="text-white/40 hover:text-white"
                    ><X size={24} /></button
                >
            </div>
            <div class="space-y-1">
                <label
                    for="loc-name"
                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                    >Nombre de la Sede</label
                >
                <input
                    id="loc-name"
                    type="text"
                    bind:value={itemName}
                    placeholder="Nombre de la sede (ej: Principal, Sucursal Norte)"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40"
                />
            </div>
            <div class="flex gap-3 pt-2">
                <GlassButton
                    variant="secondary"
                    class="flex-1"
                    onclick={closeModal}>Cancelar</GlassButton
                >
                <GlassButton
                    variant="primary"
                    class="flex-1"
                    onclick={handleSave}
                    loading={saving}
                >
                    <Save size={18} class="mr-2" />
                    Guardar
                </GlassButton>
            </div>
        </div>
    </div>
{/if}
