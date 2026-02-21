<script lang="ts">
    import GlassButton from "./GlassButton.svelte";
    import {
        X,
        Save,
        Boxes,
        Tag,
        Hash,
        Layout,
        FileText,
        AlertTriangle,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { toast } from "svelte-sonner";
    import type { Consumable } from "$lib/types/database";

    let {
        isOpen,
        consumable = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        consumable?: Consumable | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let formData = $state({
        name: "",
        category: "",
        unit: "unidades",
        stock_quantity: 0,
        min_stock: 0,
        description: "",
    });

    $effect(() => {
        if (isOpen) {
            if (consumable) {
                formData = {
                    name: consumable.name,
                    category: consumable.category,
                    unit: consumable.unit,
                    stock_quantity: consumable.stock_quantity,
                    min_stock: consumable.min_stock,
                    description: consumable.description || "",
                };
            } else {
                formData = {
                    name: "",
                    category: "",
                    unit: "unidades",
                    stock_quantity: 0,
                    min_stock: 0,
                    description: "",
                };
            }
        }
    });

    async function handleSubmit() {
        if (!formData.name || !formData.category) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }

        loading = true;
        try {
            if (consumable) {
                const { error } = await supabase
                    .from("consumables")
                    .update(formData)
                    .eq("id", consumable.id);
                if (error) throw error;
                toast.success("Insumo actualizado");
            } else {
                const { error } = await supabase
                    .from("consumables")
                    .insert(formData);
                if (error) throw error;
                toast.success("Insumo registrado");
            }
            onSave();
            onClose();
        } catch (e: any) {
            toast.error("Error al guardar: " + e.message);
        } finally {
            loading = false;
        }
    }

    const categories = [
        "Impresión (Tóner/Tinta)",
        "Hardware (Pasta térmica/Pilas)",
        "Limpieza",
        "Redes (Conectores/Cables)",
        "Otros",
    ];
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
        <div
            class="glass w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
        >
            <!-- Header -->
            <div
                class="p-6 border-b border-white/10 flex justify-between items-center bg-white/5"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-galpe-green/20 rounded-xl text-galpe-green">
                        <Boxes size={24} />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white">
                            {consumable ? "Editar Insumo" : "Nuevo Insumo"}
                        </h2>
                        <p
                            class="text-xs text-white/40 uppercase tracking-widest font-bold"
                        >
                            Inventario de Insumos
                        </p>
                    </div>
                </div>
                <button
                    onclick={onClose}
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                    <X size={24} />
                </button>
            </div>

            <div
                class="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
                <!-- Basic Info Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label
                            for="name"
                            class="text-[10px] font-bold uppercase text-white/30 ml-1"
                            >Nombre del Insumo *</label
                        >
                        <div class="relative">
                            <Tag
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                size={16}
                            />
                            <input
                                id="name"
                                type="text"
                                bind:value={formData.name}
                                placeholder="Ej: Tóner HP 85A"
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/30"
                            />
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label
                            for="category"
                            class="text-[10px] font-bold uppercase text-white/30 ml-1"
                            >Categoría *</label
                        >
                        <div class="relative">
                            <Layout
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                size={16}
                            />
                            <select
                                id="category"
                                bind:value={formData.category}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/30 appearance-none cursor-pointer"
                            >
                                <option value="" disabled
                                    >Selecciona una categoría</option
                                >
                                {#each categories as cat}
                                    <option value={cat}>{cat}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Stock Info Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="space-y-1">
                        <label
                            for="unit"
                            class="text-[10px] font-bold uppercase text-white/30 ml-1"
                            >Unidad de Medida</label
                        >
                        <input
                            id="unit"
                            type="text"
                            bind:value={formData.unit}
                            placeholder="unidades, metros, etc."
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/30"
                        />
                    </div>

                    <div class="space-y-1">
                        <label
                            for="stock"
                            class="text-[10px] font-bold uppercase text-white/30 ml-1"
                            >Stock Actual</label
                        >
                        <div class="relative">
                            <Hash
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                size={16}
                            />
                            <input
                                id="stock"
                                type="number"
                                bind:value={formData.stock_quantity}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/30"
                            />
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label
                            for="min_stock"
                            class="text-[10px] font-bold uppercase text-white/30 ml-1"
                            >Stock Mínimo (Alerta)</label
                        >
                        <div class="relative">
                            <AlertTriangle
                                class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                size={16}
                            />
                            <input
                                id="min_stock"
                                type="number"
                                bind:value={formData.min_stock}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/30"
                            />
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="space-y-1">
                    <label
                        for="description"
                        class="text-[10px] font-bold uppercase text-white/30 ml-1"
                        >Descripción / Notas</label
                    >
                    <div class="relative">
                        <FileText
                            class="absolute left-3 top-3 text-white/20"
                            size={16}
                        />
                        <textarea
                            id="description"
                            bind:value={formData.description}
                            rows="3"
                            placeholder="Detalles adicionales sobre el insumo..."
                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/30"
                        ></textarea>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-6 border-t border-white/5 flex gap-3 bg-white/5">
                <GlassButton
                    variant="secondary"
                    class="flex-1"
                    onclick={onClose}>Cancelar</GlassButton
                >
                <GlassButton
                    variant="primary"
                    class="flex-1"
                    onclick={handleSubmit}
                    {loading}
                >
                    <Save size={18} class="mr-2" />
                    {consumable ? "Guardar Cambios" : "Registrar Insumo"}
                </GlassButton>
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    select option {
        background: #1a1a1a;
        color: white;
    }
</style>
