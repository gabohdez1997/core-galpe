<script lang="ts">
    import {
        X,
        Check,
        Trash2,
        Laptop,
        Cpu,
        HardDrive,
        Network,
        User,
        Building,
        AlertCircle,
        ArrowRight,
        Monitor,
        MonitorPlay,
        Keyboard,
        Mouse,
        Plus,
    } from "lucide-svelte";
    import GlassButton from "./GlassButton.svelte";
    import GlassCard from "./GlassCard.svelte";
    import { supabase } from "$lib/supabase/client";
    import { toast } from "svelte-sonner";
    import { onMount, untrack } from "svelte";
    import type {
        DiskInfo,
        EquipmentSpecifications,
    } from "$lib/types/database";

    let {
        isOpen,
        scans = [],
        onImport,
        onClose,
    } = $props<{
        isOpen: boolean;
        scans: any[];
        onImport: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let departments = $state<any[]>([]);
    let personnel = $state<any[]>([]);
    let selectedScanIndex = $state(0);

    // Form fields
    let selectedDeptId = $state("");
    let selectedPersonnelId = $state("");
    let disks = $state<DiskInfo[]>([]);
    let monitor = $state({ model: "", serial: "", size: "" });
    let peripherals = $state({ keyboard: "", mouse: "", ups: "" });
    let printers = $state("");

    // Department creation state
    let isCreatingDept = $state(false);
    let newDeptName = $state("");
    let newLocationName = $state("");

    // Fetch data when modal opens
    $effect(() => {
        if (isOpen) {
            untrack(() => {
                fetchStaticData();
            });
        }
    });

    async function fetchStaticData() {
        try {
            const [deptsRes, personnelRes] = await Promise.all([
                supabase.from("departments").select("*, locations(name)"),
                supabase.from("personnel").select("*"),
            ]);

            if (deptsRes.data) departments = deptsRes.data;
            if (personnelRes.data) personnel = personnelRes.data;
        } catch (e) {
            console.error("Error fetching data:", e);
        }
    }

    const currentScan = $derived(scans[selectedScanIndex]);

    // Reset/Parse fields when current scan changes
    $effect(() => {
        if (currentScan) {
            untrack(() => {
                disks = [];
                if (currentScan.disks) {
                    const diskParts = currentScan.disks.split("|");
                    diskParts.forEach((p: string) => {
                        const trimmed = p.trim();
                        if (trimmed) {
                            disks.push({ type: "SSD", capacity: trimmed });
                        }
                    });
                }
                if (disks.length === 0) {
                    disks = [{ type: "SSD", capacity: "" }];
                }

                selectedDeptId = "";
                selectedPersonnelId = "";
                monitor = {
                    model: currentScan.monitor_model || "",
                    serial: currentScan.monitor_serial || "",
                    size: "",
                };
                peripherals = { keyboard: "", mouse: "", ups: "" };
                printers = currentScan.printer_info || "";

                // Intento de auto-match de personal por correo
                if (
                    currentScan.responsible_email &&
                    currentScan.responsible_email !== "N/A"
                ) {
                    const matched = personnel.find(
                        (p) =>
                            p.email?.toLowerCase() ===
                            currentScan.responsible_email.toLowerCase(),
                    );
                    if (matched) {
                        selectedPersonnelId = matched.id;
                    }
                }
            });
        }
    });

    function addDisk() {
        disks = [...disks, { type: "SSD", capacity: "" }];
    }

    function removeDisk(index: number) {
        disks = disks.filter((_, i) => i !== index);
    }

    async function handleImport() {
        if (!currentScan) return;
        if (!isCreatingDept && !selectedDeptId) {
            toast.error("Por favor selecciona un departamento");
            return;
        }

        try {
            loading = true;

            let finalDeptId = selectedDeptId;

            // Lógica de creación automática de Departamento/Sede si es nuevo
            if (isCreatingDept) {
                if (!newDeptName || !newLocationName) {
                    toast.error("Ingresa el nombre del departamento y la sede");
                    loading = false;
                    return;
                }

                // 1. Resolver/Crear Sede
                const { data: locData } = await supabase
                    .from("locations")
                    .select("id")
                    .eq("name", newLocationName.trim())
                    .maybeSingle();

                let locationId;
                if (locData) {
                    locationId = locData.id;
                } else {
                    const { data: newLoc, error: locError } = await supabase
                        .from("locations")
                        .insert({ name: newLocationName.trim() })
                        .select()
                        .single();
                    if (locError) throw locError;
                    locationId = newLoc.id;
                }

                // 2. Resolver/Crear Departamento
                const { data: deptData } = await supabase
                    .from("departments")
                    .select("id")
                    .eq("name", newDeptName.trim())
                    .eq("location_id", locationId)
                    .maybeSingle();

                if (deptData) {
                    finalDeptId = deptData.id;
                } else {
                    const { data: newDept, error: deptError } = await supabase
                        .from("departments")
                        .insert({
                            name: newDeptName.trim(),
                            location_id: locationId,
                        })
                        .select()
                        .single();
                    if (deptError) throw deptError;
                    finalDeptId = newDept.id;
                }
            }

            const specs: EquipmentSpecifications = {
                cpu: currentScan.cpu,
                ram: currentScan.ram_gb + " GB",
                disks: disks,
                os: "",
                ip_address: currentScan.ip_address,
                mac_address: currentScan.mac_address,
                monitor_model: monitor.model,
                monitor_serial: monitor.serial,
                monitor_size: monitor.size,
                keyboard_brand: peripherals.keyboard,
                mouse_brand: peripherals.mouse,
                connected_printers: printers,
                ups_brand: peripherals.ups,
                additional_notes:
                    "Importado automáticamente desde PC Scanner (" +
                    currentScan.scanner_user_email +
                    "). Raw: " +
                    currentScan.disks,
            };

            // Lógica de creación automática de personal si no existe y tenemos correo
            let finalPersonnelId = selectedPersonnelId;
            if (
                !finalPersonnelId &&
                currentScan.responsible_name &&
                currentScan.responsible_name !== "N/A" &&
                currentScan.responsible_email &&
                currentScan.responsible_email !== "N/A"
            ) {
                const { data: newPerson, error: personError } = await supabase
                    .from("personnel")
                    .insert({
                        full_name: currentScan.responsible_name,
                        email: currentScan.responsible_email,
                        department_id: finalDeptId,
                    })
                    .select()
                    .single();

                if (!personError && newPerson) {
                    finalPersonnelId = newPerson.id;
                }
            }

            const equipmentPayload = {
                name: currentScan.hostname,
                type: "computer",
                serial_number: currentScan.serial_number,
                asset_tag:
                    currentScan.asset_tag !== "N/A"
                        ? currentScan.asset_tag
                        : null,
                status: "active",
                department_id: finalDeptId,
                responsible_id: finalPersonnelId || null,
                specifications: specs,
            };

            const { error: equipError } = await supabase
                .from("equipment")
                .insert(equipmentPayload);

            if (equipError) throw equipError;

            const { error: scanError } = await supabase
                .from("inventory_scans")
                .update({ status: "imported" })
                .eq("id", currentScan.id);

            if (scanError) throw scanError;

            toast.success("Equipo importado correctamente");

            // Refrescar datos estáticos por si se crearon departamentos/personal
            await fetchStaticData();

            if (selectedScanIndex < scans.length - 1) {
                selectedScanIndex++;
                isCreatingDept = false;
                newDeptName = "";
                newLocationName = "";
            } else {
                onImport();
                onClose();
            }
        } catch (e: any) {
            toast.error("Error al importar: " + e.message);
        } finally {
            loading = false;
        }
    }

    async function handleDiscard() {
        if (!currentScan) return;
        if (!confirm("¿Estás seguro de descartar este escaneo?")) return;

        try {
            loading = true;
            const { error } = await supabase
                .from("inventory_scans")
                .update({ status: "discarded" })
                .eq("id", currentScan.id);

            if (error) throw error;
            toast.success("Escaneo descartado");

            if (selectedScanIndex < scans.length - 1) {
                selectedScanIndex++;
            } else {
                onImport();
                onClose();
            }
        } catch (e: any) {
            toast.error("Error: " + e.message);
        } finally {
            loading = false;
        }
    }
</script>

{#if isOpen && currentScan}
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
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white">
                            Revisar e Importar PC
                        </h2>
                        <p
                            class="text-xs text-white/40 uppercase tracking-widest font-bold"
                        >
                            Equipo {selectedScanIndex + 1} de {scans.length}
                        </p>
                    </div>
                </div>
                <button
                    onclick={onClose}
                    class="text-white/40 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <div class="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                <!-- Info Section -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Left: Technical Data -->
                    <div class="space-y-6">
                        <h3
                            class="text-sm font-bold text-white flex items-center gap-2 border-l-4 border-galpe-red pl-3 uppercase tracking-tighter"
                        >
                            <Cpu size={16} /> Datos Técnicos Detectados
                        </h3>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <span
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Hostname</span
                                >
                                <div
                                    class="p-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs truncate"
                                >
                                    {currentScan.hostname}
                                </div>
                            </div>
                            <div class="space-y-1">
                                <span
                                    class="text-[10px] font-bold uppercase text-white/30 ml-1"
                                    >Serial</span
                                >
                                <div
                                    class="p-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs truncate"
                                >
                                    {currentScan.serial_number}
                                </div>
                            </div>
                        </div>

                        <div
                            class="p-4 bg-black/40 border border-white/5 rounded-2xl grid grid-cols-2 gap-4"
                        >
                            <div class="space-y-1">
                                <span
                                    class="text-white/30 text-[10px] uppercase font-bold"
                                    >CPU</span
                                >
                                <p class="text-xs text-white line-clamp-2">
                                    {currentScan.cpu}
                                </p>
                            </div>
                            <div class="space-y-1">
                                <span
                                    class="text-white/30 text-[10px] uppercase font-bold"
                                    >Memoria RAM</span
                                >
                                <p class="text-xs text-white">
                                    {currentScan.ram_gb} GB
                                </p>
                            </div>
                        </div>

                        <!-- Formal Storage Section -->
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h4 class="text-xs font-bold text-white/60">
                                    Unidades de Almacenamiento
                                </h4>
                                <button
                                    onclick={addDisk}
                                    class="text-[10px] font-bold bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 text-white flex items-center gap-1"
                                >
                                    <Plus size={12} /> Agregar
                                </button>
                            </div>
                            <div class="space-y-2">
                                {#each disks as disk, i}
                                    <div class="flex gap-2">
                                        <select
                                            bind:value={disk.type}
                                            class="bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                                        >
                                            <option value="SSD">SSD</option>
                                            <option value="HDD">HDD</option>
                                            <option value="NVMe">NVMe</option>
                                        </select>
                                        <input
                                            bind:value={disk.capacity}
                                            class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                                            placeholder="Capacidad (ej: 480GB)"
                                        />
                                        <button
                                            onclick={() => removeDisk(i)}
                                            class="text-white/20 hover:text-galpe-red transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <!-- Right: Assignment & Peripherals -->
                    <div class="space-y-8">
                        <!-- Assignment -->
                        <div class="space-y-4">
                            <h3
                                class="text-sm font-bold text-white flex items-center gap-2 border-l-4 border-galpe-red pl-3 uppercase tracking-tighter"
                            >
                                <Building size={16} /> Asignación Formal
                            </h3>

                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <label
                                            class="text-[10px] font-bold text-white/40 ml-1 uppercase"
                                            >Ubicación (Dpto / Sede)</label
                                        >
                                        <button
                                            onclick={() =>
                                                (isCreatingDept =
                                                    !isCreatingDept)}
                                            class="text-[10px] font-bold text-galpe-red hover:text-white transition-colors"
                                        >
                                            {isCreatingDept
                                                ? "CANCELAR"
                                                : "+ NUEVA"}
                                        </button>
                                    </div>

                                    {#if isCreatingDept}
                                        <div
                                            class="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2"
                                        >
                                            <input
                                                bind:value={newDeptName}
                                                placeholder="Nombre Depto"
                                                class="bg-white/5 border border-white/20 rounded-xl p-3 text-sm text-white outline-none focus:ring-1 focus:ring-galpe-red"
                                            />
                                            <input
                                                bind:value={newLocationName}
                                                placeholder="Sede/Edificio"
                                                class="bg-white/5 border border-white/20 rounded-xl p-3 text-sm text-white outline-none focus:ring-1 focus:ring-galpe-red"
                                            />
                                        </div>
                                    {:else}
                                        <select
                                            bind:value={selectedDeptId}
                                            class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-galpe-red/40 outline-none"
                                        >
                                            <option value="" class="bg-black"
                                                >Seleccionar ubicación...</option
                                            >
                                            {#each departments as dept}
                                                <option
                                                    value={dept.id}
                                                    class="bg-black text-white"
                                                    >{dept.name} ({dept
                                                        .locations
                                                        ?.name})</option
                                                >
                                            {/each}
                                        </select>
                                    {/if}
                                </div>
                                {#if currentScan.responsible_name && currentScan.responsible_name !== "N/A"}
                                    <div
                                        class="p-3 bg-galpe-red/10 border border-galpe-red/20 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-2"
                                    >
                                        <p
                                            class="text-[10px] font-bold text-galpe-red uppercase tracking-wider"
                                        >
                                            Responsable Detectado
                                        </p>
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <div>
                                                <p
                                                    class="text-xs text-white font-bold"
                                                >
                                                    {currentScan.responsible_name}
                                                </p>
                                                <p
                                                    class="text-[10px] text-white/40"
                                                >
                                                    {currentScan.responsible_email}
                                                </p>
                                            </div>
                                            {#if !selectedPersonnelId}
                                                <span
                                                    class="text-[9px] bg-galpe-red/20 text-galpe-red px-2 py-0.5 rounded-full font-bold"
                                                    >NUEVO - SE CREARÁ</span
                                                >
                                            {:else}
                                                <span
                                                    class="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold"
                                                    >VINCULADO</span
                                                >
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                                <div class="space-y-1">
                                    <label
                                        class="text-[10px] font-bold text-white/40 ml-1 uppercase"
                                        >Responsable (Personal)</label
                                    >
                                    <select
                                        bind:value={selectedPersonnelId}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-galpe-red/40 outline-none"
                                    >
                                        <option value="" class="bg-black"
                                            >Seleccionar responsable...</option
                                        >
                                        {#each personnel as p}
                                            <option
                                                value={p.id}
                                                class="bg-black text-white"
                                                >{p.full_name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Peripherals -->
                        <div class="space-y-4">
                            <h3
                                class="text-sm font-bold text-white flex items-center gap-2 border-l-4 border-galpe-red pl-3 uppercase tracking-tighter"
                            >
                                <Monitor size={16} /> Monitor y Periféricos
                            </h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label
                                        class="text-[10px] text-white/40 ml-1 font-bold uppercase"
                                        >Modelo Monitor</label
                                    >
                                    <input
                                        bind:value={monitor.model}
                                        class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-[10px] text-white/40 ml-1 font-bold uppercase"
                                        >Tamaño (Pulgadas)</label
                                    >
                                    <input
                                        bind:value={monitor.size}
                                        placeholder="ej: 24''"
                                        class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-[10px] text-white/40 ml-1 font-bold uppercase"
                                        >Serial Monitor</label
                                    >
                                    <input
                                        bind:value={monitor.serial}
                                        class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-[10px] text-white/40 ml-1 font-bold uppercase"
                                        >Teclado</label
                                    >
                                    <input
                                        bind:value={peripherals.keyboard}
                                        class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-[10px] text-white/40 ml-1 font-bold uppercase"
                                        >Mouse</label
                                    >
                                    <input
                                        bind:value={peripherals.mouse}
                                        class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                                    />
                                </div>
                                <div class="space-y-1 col-span-full">
                                    <label
                                        class="text-[10px] text-white/40 ml-1 font-bold uppercase"
                                        >Impresoras Detectadas</label
                                    >
                                    <textarea
                                        bind:value={printers}
                                        class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none min-h-[50px] resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-6 bg-white/5 border-t border-white/10 flex justify-between gap-3"
            >
                <GlassButton
                    variant="secondary"
                    onclick={handleDiscard}
                    disabled={loading}
                >
                    <Trash2 size={18} class="mr-2" /> Descartar Escaneo
                </GlassButton>
                <div class="flex gap-3">
                    <GlassButton variant="secondary" onclick={onClose}>
                        Cerrar
                    </GlassButton>
                    <GlassButton
                        variant="primary"
                        onclick={handleImport}
                        disabled={loading ||
                            (!isCreatingDept && !selectedDeptId)}
                    >
                        {#if loading}
                            Cargando...
                        {:else}
                            <Check size={18} class="mr-2" /> Confirmar e Importar
                            {scans.length > 1 ? "(1/" + scans.length + ")" : ""}
                        {/if}
                    </GlassButton>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
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
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    /* Forzar fondo oscuro en opciones para evitar blanco sobre blanco */
    option {
        background-color: #1a1a1a;
        color: white;
    }
</style>
