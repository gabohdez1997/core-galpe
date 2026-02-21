<script lang="ts">
    import { X, Save, User, Mail, Phone, Building } from "lucide-svelte";
    import GlassButton from "./GlassButton.svelte";
    import { supabase } from "$lib/supabase/client";
    import type { Personnel, Department } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let {
        isOpen,
        person = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        person?: Personnel | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let departments = $state<Department[]>([]);

    let formData = $state({
        full_name: "",
        email: "",
        phone: "",
        department_id: "",
    });

    $effect(() => {
        if (person) {
            formData = {
                full_name: person.full_name,
                email: person.email || "",
                phone: person.phone || "",
                department_id: person.department_id || "",
            };
        } else {
            formData = {
                full_name: "",
                email: "",
                phone: "",
                department_id: "",
            };
        }
    });

    onMount(async () => {
        const { data } = await supabase
            .from("departments")
            .select("*, locations(name)");
        if (data) departments = data as any;
    });

    async function handleSubmit() {
        try {
            loading = true;
            const dataToSave = {
                ...formData,
                email: formData.email || null,
                phone: formData.phone || null,
                department_id: formData.department_id || null,
            };

            if (person) {
                const { error } = await supabase
                    .from("personnel")
                    .update(dataToSave)
                    .eq("id", person.id);
                if (error) throw error;
                toast.success("Personal actualizado correctamente");
            } else {
                const { error } = await supabase
                    .from("personnel")
                    .insert(dataToSave);
                if (error) throw error;
                toast.success("Personal registrado correctamente");
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
                    <User class="text-galpe-green" size={24} />
                    {person ? "Editar Personal" : "Nuevo Personal"}
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
                class="p-6 space-y-4"
            >
                <div class="space-y-1">
                    <label
                        for="full_name"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Nombre Completo</label
                    >
                    <div class="relative group">
                        <User
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                            size={18}
                        />
                        <input
                            id="full_name"
                            type="text"
                            bind:value={formData.full_name}
                            required
                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-medium"
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label
                            for="email"
                            class="text-xs font-semibold uppercase text-white/40 ml-1"
                            >Correo Electrónico</label
                        >
                        <div class="relative group">
                            <Mail
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                                size={18}
                            />
                            <input
                                id="email"
                                type="email"
                                bind:value={formData.email}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                placeholder="juan@galpe.com"
                            />
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label
                            for="phone"
                            class="text-xs font-semibold uppercase text-white/40 ml-1"
                            >Teléfono</label
                        >
                        <div class="relative group">
                            <Phone
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-galpe-green transition-colors"
                                size={18}
                            />
                            <input
                                id="phone"
                                type="tel"
                                bind:value={formData.phone}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                placeholder="+58 412..."
                            />
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
                        {person ? "Actualizar" : "Registrar"}
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
</style>
