<script lang="ts">
    import GlassButton from "./GlassButton.svelte";
    import {
        X,
        Save,
        Wrench,
        Calendar,
        User,
        DollarSign,
        FileText,
        Plus,
        Trash2,
        Boxes,
        Monitor,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { toast } from "svelte-sonner";
    import type {
        MaintenanceRecord,
        Equipment,
        Personnel,
        Consumable,
    } from "$lib/types/database";

    let {
        isOpen,
        record = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        record?: MaintenanceRecord | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let equipmentList = $state<Equipment[]>([]);
    let personnelList = $state<Personnel[]>([]);
    let allConsumables = $state<Consumable[]>([]);

    let activeTab = $state("general");

    let formData = $state({
        equipment_id: "",
        type: "preventative" as "preventative" | "corrective",
        status: "scheduled" as any,
        title: "",
        description: "",
        scheduled_date: new Date().toISOString().slice(0, 16),
        performed_at: "" as string,
        performed_by: "",
        cost: 0 as number | null,
        notes: "",
    });

    let selectedConsumables = $state<
        { consumable_id: string; quantity: number }[]
    >([]);

    async function fetchData() {
        const [eqRes, perRes, conRes] = await Promise.all([
            supabase
                .from("equipment")
                .select("id, name, asset_tag")
                .order("name"),
            supabase
                .from("personnel")
                .select("id, full_name")
                .order("full_name"),
            supabase.from("consumables").select("*").order("name"),
        ]);

        if (eqRes.data) equipmentList = eqRes.data as any;
        if (perRes.data) personnelList = perRes.data as any;
        if (conRes.data) allConsumables = conRes.data as any;
    }

    $effect(() => {
        if (isOpen) {
            fetchData();
            if (record) {
                formData = {
                    equipment_id: record.equipment_id,
                    type: record.type,
                    status: record.status,
                    title: record.title,
                    description: record.description || "",
                    scheduled_date: record.scheduled_date
                        ? new Date(record.scheduled_date)
                              .toISOString()
                              .slice(0, 16)
                        : "",
                    performed_at: record.performed_at
                        ? new Date(record.performed_at)
                              .toISOString()
                              .slice(0, 16)
                        : "",
                    performed_by: record.performed_by || "",
                    cost: record.cost,
                    notes: record.notes || "",
                };
                // Fetch existing consumables for this record
                fetchMaintenaceConsumables(record.id);
            } else {
                formData = {
                    equipment_id: "",
                    type: "preventative",
                    status: "scheduled",
                    title: "",
                    description: "",
                    scheduled_date: new Date().toISOString().slice(0, 16),
                    performed_at: "",
                    performed_by: "",
                    cost: null,
                    notes: "",
                };
                selectedConsumables = [];
            }
        }
    });

    async function fetchMaintenaceConsumables(maintId: string) {
        const { data } = await supabase
            .from("maintenance_consumables")
            .select("consumable_id, quantity_used")
            .eq("maintenance_id", maintId);
        if (data) {
            selectedConsumables = data.map((d) => ({
                consumable_id: d.consumable_id,
                quantity: d.quantity_used,
            }));
        }
    }

    function addConsumableRow() {
        selectedConsumables = [
            ...selectedConsumables,
            { consumable_id: "", quantity: 1 },
        ];
    }

    function removeConsumableRow(index: number) {
        selectedConsumables = selectedConsumables.filter((_, i) => i !== index);
    }

    async function handleSubmit() {
        if (
            !formData.equipment_id ||
            !formData.title ||
            !formData.scheduled_date
        ) {
            toast.error("Completa los campos obligatorios");
            return;
        }

        loading = true;
        try {
            let maintId = record?.id;

            if (record) {
                const { error } = await supabase
                    .from("maintenance_records")
                    .update({
                        ...formData,
                        performed_at: formData.performed_at || null,
                        cost: formData.cost || null,
                    })
                    .eq("id", record.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from("maintenance_records")
                    .insert([
                        {
                            ...formData,
                            performed_at: formData.performed_at || null,
                            cost: formData.cost || null,
                        },
                    ])
                    .select();
                if (error) throw error;
                maintId = data[0].id;
            }

            // Update consumables
            // First delete old ones
            await supabase
                .from("maintenance_consumables")
                .delete()
                .eq("maintenance_id", maintId);

            // Insert new ones (filter out empty selections)
            const toInsert = selectedConsumables
                .filter((c) => c.consumable_id && c.quantity > 0)
                .map((c) => ({
                    maintenance_id: maintId,
                    consumable_id: c.consumable_id,
                    quantity_used: c.quantity,
                }));

            if (toInsert.length > 0) {
                const { error: conError } = await supabase
                    .from("maintenance_consumables")
                    .insert(toInsert);
                if (conError) throw conError;
            }

            toast.success(
                record
                    ? "Mantenimiento actualizado"
                    : "Mantenimiento programado",
            );
            onSave();
            onClose();
        } catch (e: any) {
            toast.error("Error: " + e.message);
        } finally {
            loading = false;
        }
    }
    const tabs = [
        { id: "general", label: "Planificación", icon: Calendar },
        { id: "execution", label: "Ejecución y Costos", icon: Wrench },
        { id: "consumables", label: "Insumos Usados", icon: Boxes },
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
                    <div class="p-2 bg-galpe-red/20 rounded-xl text-galpe-red">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white">
                            {record
                                ? "Editar Mantenimiento"
                                : "Nuevo Mantenimiento"}
                        </h2>
                        <p
                            class="text-xs text-white/40 uppercase tracking-widest font-bold"
                        >
                            Registro Técnico
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

            <!-- Tabs Navigation -->
            <div class="flex border-b border-white/10 bg-black/20 p-1">
                {#each tabs as tab}
                    <button
                        onclick={() => (activeTab = tab.id)}
                        class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all rounded-xl
                        {activeTab === tab.id
                            ? 'bg-white/10 text-white shadow-lg'
                            : 'text-white/40 hover:text-white/60 hover:bg-white/5'}"
                    >
                        <tab.icon size={18} />
                        <span class="hidden md:inline">{tab.label}</span>
                    </button>
                {/each}
            </div>

            <div class="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {#if activeTab === "general"}
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label
                                    for="eq"
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Equipo *</label
                                >
                                <div class="relative">
                                    <Monitor
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                        size={16}
                                    />
                                    <select
                                        id="eq"
                                        bind:value={formData.equipment_id}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-galpe-red/30"
                                    >
                                        <option value="" disabled
                                            >Selecciona un equipo</option
                                        >
                                        {#each equipmentList as eq}
                                            <option value={eq.id}
                                                >{eq.name} ({eq.asset_tag ||
                                                    "S/C"})</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label
                                    for="type"
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Tipo de Mantenimiento</label
                                >
                                <select
                                    id="type"
                                    bind:value={formData.type}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                >
                                    <option value="preventative"
                                        >Preventivo</option
                                    >
                                    <option value="corrective"
                                        >Correctivo</option
                                    >
                                </select>
                            </div>
                        </div>

                        <div class="space-y-1">
                            <label
                                for="title"
                                class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                >Título / Actividad *</label
                            >
                            <input
                                id="title"
                                type="text"
                                bind:value={formData.title}
                                placeholder="Ej: Limpieza interna y cambio de pasta"
                                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label
                                    for="date"
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Fecha Programada *</label
                                >
                                <input
                                    id="date"
                                    type="datetime-local"
                                    bind:value={formData.scheduled_date}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                />
                            </div>
                            <div class="space-y-1">
                                <label
                                    for="status"
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Estado</label
                                >
                                <select
                                    id="status"
                                    bind:value={formData.status}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                >
                                    <option value="scheduled">Programado</option
                                    >
                                    <option value="in_progress"
                                        >En Proceso</option
                                    >
                                    <option value="completed">Completado</option
                                    >
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <div class="space-y-1">
                            <label
                                for="desc"
                                class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                >Descripción del Problema/Tarea</label
                            >
                            <textarea
                                id="desc"
                                bind:value={formData.description}
                                rows="3"
                                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                placeholder="Detalles sobre lo que se requiere hacer..."
                            ></textarea>
                        </div>
                    </div>
                {:else if activeTab === "execution"}
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label
                                    for="perf_by"
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Realizado Por</label
                                >
                                <div class="relative">
                                    <User
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                        size={16}
                                    />
                                    <select
                                        id="perf_by"
                                        bind:value={formData.performed_by}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white appearance-none cursor-pointer"
                                    >
                                        <option value="">Sin asignar</option>
                                        {#each personnelList as p}
                                            <option value={p.id}
                                                >{p.full_name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label
                                    for="perf_at"
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Fecha de Finalización</label
                                >
                                <input
                                    id="perf_at"
                                    type="datetime-local"
                                    bind:value={formData.performed_at}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                />
                            </div>
                        </div>

                        <div class="space-y-1">
                            <label
                                for="cost"
                                class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                >Costo de Mantenimiento ($)</label
                            >
                            <div class="relative">
                                <DollarSign
                                    class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                    size={16}
                                />
                                <input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    bind:value={formData.cost}
                                    placeholder="0.00"
                                    class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white"
                                />
                            </div>
                        </div>

                        <div class="space-y-1">
                            <label
                                for="notes"
                                class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                >Notas Técnicas Extra</label
                            >
                            <div class="relative">
                                <FileText
                                    class="absolute left-3 top-3 text-white/20"
                                    size={16}
                                />
                                <textarea
                                    id="notes"
                                    bind:value={formData.notes}
                                    rows="4"
                                    class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white"
                                    placeholder="Observaciones durante el mantenimiento, piezas cambiadas, etc."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                {:else if activeTab === "consumables"}
                    <div class="space-y-4">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center gap-2">
                                <Boxes size={16} class="text-white/40" />
                                <h3 class="text-sm font-bold text-white/70">
                                    Asignar Repuestos / Insumos
                                </h3>
                            </div>
                            <GlassButton
                                variant="secondary"
                                class="h-8 text-[11px]"
                                onclick={addConsumableRow}
                            >
                                <Plus size={14} class="mr-1" /> Agregar Fila
                            </GlassButton>
                        </div>

                        {#if selectedConsumables.length === 0}
                            <div
                                class="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl text-white/20 italic text-sm"
                            >
                                No se han registrado insumos para este
                                mantenimiento.
                            </div>
                        {:else}
                            {#each selectedConsumables as item, i}
                                <div
                                    class="flex gap-3 items-end bg-white/5 p-4 rounded-2xl border border-white/10 animate-in slide-in-from-left-2 duration-200"
                                >
                                    <div class="flex-1 space-y-1">
                                        <label
                                            class="text-[9px] font-bold uppercase text-white/20 ml-1"
                                            >Insumo</label
                                        >
                                        <select
                                            bind:value={item.consumable_id}
                                            class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-galpe-red/30"
                                        >
                                            <option value="" disabled
                                                >Seleccionar...</option
                                            >
                                            {#each allConsumables as c}
                                                <option value={c.id}
                                                    >{c.name} (Stock: {c.stock_quantity})</option
                                                >
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="w-24 space-y-1">
                                        <label
                                            class="text-[9px] font-bold uppercase text-white/20 ml-1"
                                            >Cant.</label
                                        >
                                        <input
                                            type="number"
                                            bind:value={item.quantity}
                                            min="1"
                                            class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                                        />
                                    </div>
                                    <button
                                        onclick={() => removeConsumableRow(i)}
                                        class="p-2.5 text-galpe-red/40 hover:text-galpe-red hover:bg-galpe-red/10 rounded-xl transition-all mb-0.5"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            {/each}
                        {/if}
                    </div>
                {/if}
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
                    {record ? "Guardar Cambios" : "Programar Tarea"}
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
