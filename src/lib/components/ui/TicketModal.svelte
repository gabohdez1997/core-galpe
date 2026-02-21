<script lang="ts">
    import {
        X,
        Save,
        Ticket as TicketIcon,
        User,
        Laptop,
        AlertCircle,
        ChevronDown,
        Clock,
        UserCheck,
        Plus,
        Building,
        Mail,
    } from "lucide-svelte";
    import GlassButton from "./GlassButton.svelte";
    import { supabase } from "$lib/supabase/client";
    import type {
        Ticket,
        TicketCategory,
        Personnel,
        Equipment,
        Profile,
        Department,
    } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    let {
        isOpen,
        ticket = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        ticket?: Ticket | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let categories = $state<TicketCategory[]>([]);
    let personnel = $state<Personnel[]>([]);
    let equipment = $state<Equipment[]>([]);
    let technicians = $state<Profile[]>([]);
    let departments = $state<Department[]>([]);

    // Personnel on-the-fly state
    let isCreatingPerson = $state(false);
    let newPerson = $state({
        full_name: "",
        email: "",
        department_id: "",
    });

    let formData = $state({
        title: "",
        description: "",
        category_id: "",
        personnel_id: "",
        equipment_id: "",
        assigned_to: "",
        priority: "media" as any,
        status: "abierto" as any,
    });

    $effect(() => {
        if (ticket) {
            formData = {
                title: ticket.title,
                description: ticket.description || "",
                category_id: ticket.category_id || "",
                personnel_id: ticket.personnel_id || "",
                equipment_id: ticket.equipment_id || "",
                assigned_to: ticket.assigned_to || "",
                priority: ticket.priority,
                status: ticket.status,
            };
            isCreatingPerson = false;
        } else {
            formData = {
                title: "",
                description: "",
                category_id: "",
                personnel_id: "",
                equipment_id: "",
                assigned_to: "",
                priority: "media",
                status: "abierto",
            };
        }
    });

    async function fetchData() {
        const [catRes, perRes, eqRes, techRes, deptRes] = await Promise.all([
            supabase.from("ticket_categories").select("*").order("name"),
            supabase.from("personnel").select("*").order("full_name"),
            supabase
                .from("equipment")
                .select("id, name, asset_tag")
                .order("name"),
            supabase.from("profiles").select("*").order("full_name"),
            supabase
                .from("departments")
                .select("*, locations(name)")
                .order("name"),
        ]);

        if (catRes.data) categories = catRes.data;
        if (perRes.data) personnel = perRes.data;
        if (eqRes.data) equipment = eqRes.data;
        // Solo perfiles que no estén eliminados y preferiblemente con roles altos (opcional)
        if (techRes.data)
            technicians = techRes.data.filter((p) => !p.deleted_at);
        if (deptRes.data) departments = deptRes.data;
    }

    onMount(fetchData);

    async function handleSubmit() {
        try {
            loading = true;
            let finalPersonnelId = formData.personnel_id;

            // Lógica de creación automática de personal si se activa el toggle
            if (isCreatingPerson) {
                if (!newPerson.full_name || !newPerson.department_id) {
                    toast.error(
                        "Nombre y Departamento son obligatorios para el nuevo personal.",
                    );
                    loading = false;
                    return;
                }

                const { data: createdPerson, error: personError } =
                    await supabase
                        .from("personnel")
                        .insert({
                            full_name: newPerson.full_name,
                            email: newPerson.email || null,
                            department_id: newPerson.department_id,
                        })
                        .select()
                        .single();

                if (personError) throw personError;
                finalPersonnelId = createdPerson.id;
            }

            const dataToSave = {
                title: formData.title,
                description: formData.description,
                category_id: formData.category_id || null,
                personnel_id: finalPersonnelId || null,
                equipment_id: formData.equipment_id || null,
                assigned_to: formData.assigned_to || null,
                priority: formData.priority,
                status: formData.status,
                updated_at: new Date().toISOString(),
            };

            if (ticket) {
                const { error } = await supabase
                    .from("tickets")
                    .update(dataToSave)
                    .eq("id", ticket.id);
                if (error) throw error;

                if (ticket.status !== formData.status) {
                    await supabase.from("ticket_history").insert({
                        ticket_id: ticket.id,
                        previous_status: ticket.status,
                        new_status: formData.status,
                        comment: "Estado actualizado manualmente",
                    });
                }
                toast.success("Ticket actualizado");
            } else {
                const { data, error } = await supabase
                    .from("tickets")
                    .insert(dataToSave)
                    .select()
                    .single();
                if (error) throw error;

                await supabase.from("ticket_history").insert({
                    ticket_id: data.id,
                    new_status: formData.status,
                    comment: "Ticket creado",
                });

                toast.success("Ticket creado correctamente");
            }
            onSave();
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error("Error: " + e.message);
        } finally {
            loading = false;
        }
    }

    const priorities = [
        { id: "baja", label: "Baja", color: "text-blue-400 bg-blue-400/10" },
        {
            id: "media",
            label: "Media",
            color: "text-yellow-400 bg-yellow-400/10",
        },
        {
            id: "alta",
            label: "Alta",
            color: "text-orange-400 bg-orange-400/10",
        },
        {
            id: "critica",
            label: "Crítica",
            color: "text-red-500 bg-red-500/10",
        },
    ];

    const statuses = [
        { id: "abierto", label: "Abierto" },
        { id: "en_proceso", label: "En Proceso" },
        { id: "resuelto", label: "Resuelto" },
        { id: "cerrado", label: "Cerrado" },
    ];
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <div
            class="glass w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"
        >
            <div
                class="p-6 border-b border-white/10 flex justify-between items-center bg-white/5"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-galpe-green/20 rounded-xl">
                        <TicketIcon class="text-galpe-green" size={24} />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white">
                            {ticket
                                ? "Editar Ticket"
                                : "Nueva Solicitud de Soporte"}
                        </h2>
                        <p
                            class="text-xs text-white/40 uppercase tracking-widest font-bold"
                        >
                            #{ticket ? ticket.id.slice(0, 8) : "NUEVO"}
                        </p>
                    </div>
                </div>
                <button
                    onclick={onClose}
                    class="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                >
                    <X size={24} />
                </button>
            </div>

            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                class="p-8 space-y-6 overflow-y-auto custom-scrollbar"
            >
                <div class="space-y-1">
                    <label
                        for="title"
                        class="text-[10px] font-bold uppercase text-white/40 ml-1"
                        >Título del Problema</label
                    >
                    <input
                        id="title"
                        type="text"
                        bind:value={formData.title}
                        required
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-medium text-lg"
                        placeholder="Ej: La impresora no conecta / Windows lento"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-1">
                        <label
                            for="cat"
                            class="text-[10px] font-bold uppercase text-white/40 ml-1"
                            >Categoría de Falla</label
                        >
                        <div class="relative group">
                            <AlertCircle
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                size={18}
                            />
                            <select
                                id="cat"
                                bind:value={formData.category_id}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                            >
                                <option value="">Seleccionar falla...</option>
                                {#each categories as cat}
                                    <option value={cat.id}>{cat.name}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label
                            class="text-[10px] font-bold uppercase text-white/40 ml-1"
                            >Prioridad</label
                        >
                        <div class="flex gap-2">
                            {#each priorities as p}
                                <button
                                    type="button"
                                    onclick={() => (formData.priority = p.id)}
                                    class="flex-1 py-3 text-xs font-bold rounded-xl transition-all border {formData.priority ===
                                    p.id
                                        ? p.color + ' border-current'
                                        : 'text-white/20 bg-white/5 border-transparent'}"
                                >
                                    {p.label}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>

                <div class="space-y-4 pt-2">
                    <div class="flex items-center justify-between px-1">
                        <label
                            class="text-[10px] font-bold uppercase text-white/40"
                            >Reportado Por (Usuario)</label
                        >
                        <button
                            type="button"
                            class="text-[10px] font-black italic tracking-tighter px-2 py-0.5 rounded-lg transition-all {isCreatingPerson
                                ? 'bg-galpe-green text-white'
                                : 'bg-white/5 text-white/40 hover:bg-white/10'}"
                            onclick={() =>
                                (isCreatingPerson = !isCreatingPerson)}
                        >
                            {isCreatingPerson ? "CANCELAR" : "+ NUEVO PERSONAL"}
                        </button>
                    </div>

                    {#if isCreatingPerson}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-galpe-green/5 border border-galpe-green/10 animate-in slide-in-from-top-2"
                        >
                            <div class="space-y-1">
                                <label
                                    class="text-[9px] uppercase font-bold text-white/30 ml-1"
                                    >Nombre Completo</label
                                >
                                <div class="relative">
                                    <User
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                        size={14}
                                    />
                                    <input
                                        type="text"
                                        bind:value={newPerson.full_name}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-galpe-green transition-all"
                                        placeholder="Nombre..."
                                    />
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label
                                    class="text-[9px] uppercase font-bold text-white/30 ml-1"
                                    >Departamento</label
                                >
                                <div class="relative">
                                    <Building
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                        size={14}
                                    />
                                    <select
                                        bind:value={newPerson.department_id}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 text-sm text-white appearance-none"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {#each departments as dept}
                                            <option value={dept.id}
                                                >{dept.name} ({dept.locations
                                                    ?.name})</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                            </div>
                            <div class="space-y-1 md:col-span-2">
                                <label
                                    class="text-[9px] uppercase font-bold text-white/30 ml-1"
                                    >Correo Electrónico (Opcional)</label
                                >
                                <div class="relative">
                                    <Mail
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                                        size={14}
                                    />
                                    <input
                                        type="email"
                                        bind:value={newPerson.email}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-3 py-2 text-sm text-white transition-all"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div class="relative group">
                            <User
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                size={18}
                            />
                            <select
                                bind:value={formData.personnel_id}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                            >
                                <option value="">Seleccionar personal...</option
                                >
                                {#each personnel as per}
                                    <option value={per.id}
                                        >{per.full_name}</option
                                    >
                                {/each}
                            </select>
                        </div>
                    {/if}
                </div>

                <div class="space-y-1">
                    <label
                        for="eq"
                        class="text-[10px] font-bold uppercase text-white/40 ml-1"
                        >Equipo Afectado (Opcional)</label
                    >
                    <div class="relative group">
                        <Laptop
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                            size={18}
                        />
                        <select
                            id="eq"
                            bind:value={formData.equipment_id}
                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                        >
                            <option value="">Sin equipo asociado</option>
                            {#each equipment as eq}
                                <option value={eq.id}
                                    >{eq.name} ({eq.asset_tag || "S/N"})</option
                                >
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="space-y-1">
                    <label
                        for="desc"
                        class="text-[10px] font-bold uppercase text-white/40 ml-1"
                        >Descripción Detallada</label
                    >
                    <textarea
                        id="desc"
                        bind:value={formData.description}
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all min-h-[120px] resize-none"
                        placeholder="Describe el problema o los síntomas..."
                    ></textarea>
                </div>

                <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5"
                >
                    <div class="space-y-1">
                        <label
                            for="tech"
                            class="text-[10px] font-bold uppercase text-white/40 ml-1"
                            >Técnico Asignado (Admin/Editor)</label
                        >
                        <div class="relative group">
                            <UserCheck
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                size={18}
                            />
                            <select
                                id="tech"
                                bind:value={formData.assigned_to}
                                class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                            >
                                <option value="">Sin asignar aún</option>
                                {#each technicians as tech}
                                    <option value={tech.id}
                                        >{tech.full_name} ({tech.role})</option
                                    >
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label
                            for="stat"
                            class="text-[10px] font-bold uppercase text-white/40 ml-1"
                            >Estado del Ticket</label
                        >
                        <div class="relative group">
                            <Clock
                                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                size={18}
                            />
                            <select
                                id="stat"
                                bind:value={formData.status}
                                class="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none font-bold italic"
                            >
                                {#each statuses as s}
                                    <option value={s.id}
                                        >{s.label.toUpperCase()}</option
                                    >
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="pt-8 flex gap-4">
                    <GlassButton
                        variant="secondary"
                        class="flex-1 rounded-2xl py-4"
                        onclick={onClose}
                        type="button"
                    >
                        Cancelar
                    </GlassButton>
                    <GlassButton
                        variant="primary"
                        class="flex-1 rounded-2xl py-4"
                        type="submit"
                        {loading}
                    >
                        <Save size={18} class="mr-2" />
                        {ticket ? "Guardar Cambios" : "Crear Ticket"}
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
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
</style>
