<script lang="ts">
    import {
        X,
        Save,
        Wrench,
        Tag,
        Info,
        Hash,
        Shield,
        Building,
        User,
    } from "lucide-svelte";
    import GlassButton from "./GlassButton.svelte";
    import { supabase } from "$lib/supabase/client";
    import type {
        Tool,
        Personnel,
        Department,
        EquipmentStatus,
    } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let {
        isOpen,
        tool = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        tool?: Tool | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let departments = $state<Department[]>([]);
    let personnel = $state<Personnel[]>([]);

    let formData = $state({
        name: "",
        description: "",
        serial_number: "",
        status: "in_stock" as EquipmentStatus,
        department_id: "",
        responsible_id: "",
    });

    $effect(() => {
        if (tool) {
            formData = {
                name: tool.name,
                description: tool.description || "",
                serial_number: tool.serial_number || "",
                status: tool.status,
                department_id: tool.department_id || "",
                responsible_id: tool.responsible_id || "",
            };
        } else {
            formData = {
                name: "",
                description: "",
                serial_number: "",
                status: "in_stock",
                department_id: "",
                responsible_id: "",
            };
        }
    });

    onMount(async () => {
        const [deptsRes, personnelRes] = await Promise.all([
            supabase.from("departments").select("*, locations(name)"),
            supabase.from("personnel").select("*"),
        ]);

        if (deptsRes.data) departments = deptsRes.data as any;
        if (personnelRes.data) personnel = personnelRes.data as any;
    });

    async function handleSubmit() {
        try {
            loading = true;
            const dataToSave = {
                ...formData,
                description: formData.description || null,
                serial_number: formData.serial_number || null,
                department_id: formData.department_id || null,
                responsible_id: formData.responsible_id || null,
            };

            if (tool) {
                const { error } = await supabase
                    .from("tools")
                    .update(dataToSave)
                    .eq("id", tool.id);
                if (error) throw error;
                toast.success("Herramienta actualizada correctamente");
            } else {
                const { error } = await supabase
                    .from("tools")
                    .insert(dataToSave);
                if (error) throw error;
                toast.success("Herramienta registrada correctamente");
            }
            onSave();
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error("Error al guardar: " + e.message);
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
                    <Wrench class="text-galpe-green" size={24} />
                    {tool ? "Editar Herramienta" : "Nueva Herramienta"}
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
                class="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
                <div class="space-y-1">
                    <label
                        for="name"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Nombre de la Herramienta</label
                    >
                    <div class="relative group">
                        <Tag
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                            size={18}
                        />
                        <input
                            id="name"
                            type="text"
                            bind:value={formData.name}
                            required
                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-medium"
                            placeholder="Ej: Multímetro Digital"
                        />
                    </div>
                </div>

                <div class="space-y-1">
                    <label
                        for="description"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Descripción</label
                    >
                    <div class="relative group">
                        <Info
                            class="absolute left-4 top-4 text-white/20 group-focus-within:text-galpe-green transition-colors"
                            size={18}
                        />
                        <textarea
                            id="description"
                            bind:value={formData.description}
                            rows="2"
                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                            placeholder="Detalles adicionales..."
                        ></textarea>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label
                            for="serial"
                            class="text-xs font-semibold uppercase text-white/40 ml-1"
                            >Serial</label
                        >
                        <div class="relative group">
                            <Hash
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                                size={18}
                            />
                            <input
                                id="serial"
                                type="text"
                                bind:value={formData.serial_number}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-mono"
                                placeholder="SN-..."
                            />
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label
                            for="status"
                            class="text-xs font-semibold uppercase text-white/40 ml-1"
                            >Estado</label
                        >
                        <div class="relative group">
                            <Shield
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                                size={18}
                            />
                            <select
                                id="status"
                                bind:value={formData.status}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                            >
                                <option value="active">Activo</option>
                                <option value="maintenance"
                                    >Mantenimiento</option
                                >
                                <option value="in_stock">En Stock</option>
                                <option value="retired">Retirado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="space-y-1">
                    <label
                        for="dept"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Departamento / Sede</label
                    >
                    <div class="relative group">
                        <Building
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                            size={18}
                        />
                        <select
                            id="dept"
                            bind:value={formData.department_id}
                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                        >
                            <option value="">Sin asignar</option>
                            {#each departments as dept}
                                <option value={dept.id}
                                    >{dept.name} ({dept.locations
                                        ?.name})</option
                                >
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="space-y-1">
                    <label
                        for="responsible"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Responsable</label
                    >
                    <div class="relative group">
                        <User
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                            size={18}
                        />
                        <select
                            id="responsible"
                            bind:value={formData.responsible_id}
                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                        >
                            <option value="">Sin asignar</option>
                            {#each personnel as p}
                                <option value={p.id}>{p.full_name}</option>
                            {/each}
                        </select>
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
                        {tool ? "Actualizar" : "Registrar"}
                    </GlassButton>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    select option {
        background: #1a1a1a;
        color: white;
    }
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
</style>
