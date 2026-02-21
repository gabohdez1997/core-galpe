<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import { Users, Plus, Trash2, Edit2, Save, X, MapPin } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import type { Department, Location } from "$lib/types/database";

    let departments = $state<Department[]>([]);
    let locations = $state<Location[]>([]);
    let loading = $state(true);
    let isModalOpen = $state(false);
    let saving = $state(false);
    let editingItem = $state<Department | null>(null);

    let formData = $state({
        name: "",
        location_id: "",
    });

    async function fetchData() {
        loading = true;
        const [deptsRes, locsRes] = await Promise.all([
            supabase
                .from("departments")
                .select("*, locations(*)")
                .order("name"),
            supabase.from("locations").select("*").order("name"),
        ]);

        if (deptsRes.data) departments = deptsRes.data as any;
        if (locsRes.data) locations = locsRes.data || [];
        loading = false;
    }

    async function handleSave() {
        if (!formData.name.trim() || !formData.location_id) {
            toast.error("Completa los campos");
            return;
        }
        saving = true;
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from("departments")
                    .update(formData)
                    .eq("id", editingItem.id);
                if (error) throw error;
                toast.success("Departamento actualizado");
            } else {
                const { error } = await supabase
                    .from("departments")
                    .insert(formData);
                if (error) throw error;
                toast.success("Departamento creado");
            }
            closeModal();
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            saving = false;
        }
    }

    async function handleDelete(id: string) {
        if (
            !confirm(
                "¿Seguro? Esto podría fallar si hay equipos o usuarios asociados.",
            )
        )
            return;
        const { error } = await supabase
            .from("departments")
            .delete()
            .eq("id", id);
        if (error) toast.error("Error: " + error.message);
        else {
            toast.success("Eliminado");
            fetchData();
        }
    }

    function openModal(item: Department | null = null) {
        editingItem = item;
        formData = item
            ? { name: item.name, location_id: item.location_id }
            : { name: "", location_id: "" };
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
        editingItem = null;
    }

    onMount(fetchData);
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
    <header class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                <Users size={32} class="text-galpe-green" />
                Departamentos
            </h1>
            <p class="text-white/50">
                Gestiona los equipos de trabajo y divisiones
            </p>
        </div>
        <GlassButton variant="primary" onclick={() => openModal()}>
            <Plus size={18} class="mr-2" />
            Nuevo Dept
        </GlassButton>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#if loading}
            {#each [1, 2, 3, 4] as i}
                <div class="h-28 glass animate-pulse rounded-2xl"></div>
            {/each}
        {:else if departments.length === 0}
            <div
                class="col-span-full py-20 text-center text-white/20 glass rounded-2xl"
            >
                No hay departamentos registrados.
            </div>
        {:else}
            {#each departments as item}
                <GlassCard class="group">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div
                                class="w-10 h-10 rounded-full bg-galpe-orange/10 flex items-center justify-center text-galpe-orange"
                            >
                                <Users size={20} />
                            </div>
                            <div>
                                <p class="font-medium text-lg text-white/90">
                                    {item.name}
                                </p>
                                <p
                                    class="text-xs text-white/40 flex items-center gap-1"
                                >
                                    <MapPin size={10} />
                                    {item.locations?.name ||
                                        "Ubicación no asignada"}
                                </p>
                            </div>
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
                    {editingItem ? "Editar Depto" : "Nuevo Depto"}
                </h2>
                <button
                    onclick={closeModal}
                    class="text-white/40 hover:text-white"
                    ><X size={24} /></button
                >
            </div>

            <div class="space-y-4">
                <div class="space-y-1">
                    <label
                        for="dept-name"
                        class="text-[10px] font-bold uppercase text-white/30 ml-1"
                        >Nombre</label
                    >
                    <input
                        id="dept-name"
                        type="text"
                        bind:value={formData.name}
                        placeholder="Ej: Finanzas, Recursos Humanos"
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40"
                    />
                </div>

                <div class="space-y-1">
                    <label
                        for="dept-location"
                        class="text-[10px] font-bold uppercase text-white/30 ml-1"
                        >Ubicación / Sede</label
                    >
                    <select
                        id="dept-location"
                        bind:value={formData.location_id}
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Selecciona una sede</option>
                        {#each locations as loc}
                            <option value={loc.id}>{loc.name}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <div class="flex gap-3 pt-4">
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

<style>
    select option {
        background: #1a1a1a;
        color: white;
    }
</style>
