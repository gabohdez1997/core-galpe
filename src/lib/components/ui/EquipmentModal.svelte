<script lang="ts">
    import {
        X,
        Save,
        AlertCircle,
        Plus,
        Trash2,
        Monitor,
        Cpu,
        Network,
        Settings,
        Upload,
        Calendar,
        Shield,
        HardDrive,
        Info,
        Camera,
    } from "lucide-svelte";
    import GlassButton from "./GlassButton.svelte";
    import { supabase } from "$lib/supabase/client";
    import type {
        Equipment,
        Department,
        Personnel,
        EquipmentType,
        EquipmentStatus,
        EquipmentSpecifications,
        DiskInfo,
    } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import { onMount, untrack } from "svelte";

    let {
        isOpen,
        equipment = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        equipment?: Equipment | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let uploading = $state(false);
    let departments = $state<Department[]>([]);
    let personnel = $state<Personnel[]>([]);
    let activeTab = $state("general");

    const defaultSpecs: EquipmentSpecifications = {
        cpu: "",
        ram: "",
        disks: [],
        os: "",
        antivirus: "",
        ip_address: "",
        mac_address: "",
        monitor_model: "",
        monitor_serial: "",
        monitor_size: "",
        keyboard_brand: "",
        mouse_brand: "",
        connected_printers: "",
        ups_brand: "",
        ups_capacity: "",
        ups_status: "Batería Ok",
        vendor: "",
        purchase_date: "",
        warranty_expiry: "",
        cost: 0,
        location_detail: "",
        additional_notes: "",
    };

    let formData = $state({
        name: "",
        asset_tag: "",
        type: "computer" as EquipmentType,
        serial_number: "",
        status: "active" as EquipmentStatus,
        department_id: "",
        responsible_id: "",
        image_url: "",
        specifications: { ...defaultSpecs } as EquipmentSpecifications,
    });

    $effect(() => {
        // Trigger only when equipment prop changes or modal opens
        if (isOpen && equipment) {
            untrack(() => {
                formData = {
                    name: equipment.name,
                    asset_tag: equipment.asset_tag || "",
                    type: equipment.type,
                    serial_number: equipment.serial_number || "",
                    status: equipment.status,
                    department_id: equipment.department_id || "",
                    responsible_id: equipment.responsible_id || "",
                    image_url: equipment.image_url || "",
                    specifications: {
                        ...defaultSpecs,
                        ...(equipment.specifications || {}),
                    },
                };
            });
        } else if (isOpen && !equipment) {
            untrack(() => resetForm());
        }
    });

    function resetForm() {
        formData = {
            name: "",
            asset_tag: "",
            type: "computer",
            serial_number: "",
            status: "active",
            department_id: "",
            responsible_id: "",
            image_url: "",
            specifications: { ...defaultSpecs },
        };
        activeTab = "general";
    }

    onMount(async () => {
        const [deptsRes, personnelRes] = await Promise.all([
            supabase.from("departments").select("*, locations(name)"),
            supabase.from("personnel").select("*"),
        ]);

        if (deptsRes.data) departments = deptsRes.data as any;
        if (personnelRes.data) personnel = personnelRes.data as any;
    });

    function addDisk() {
        formData.specifications.disks = [
            ...(formData.specifications.disks || []),
            { type: "SSD", capacity: "" },
        ];
    }

    function removeDisk(index: number) {
        formData.specifications.disks = formData.specifications.disks?.filter(
            (_, i) => i !== index,
        );
    }

    async function handleFileUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        try {
            uploading = true;
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `equipment/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("equipment_images")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from("equipment_images")
                .getPublicUrl(filePath);

            formData.image_url = data.publicUrl;
            toast.success("Imagen subida correctamente");
        } catch (e: any) {
            console.error(e);
            toast.error("Error al subir imagen: " + e.message);
        } finally {
            uploading = false;
        }
    }

    async function handleSubmit() {
        try {
            loading = true;
            // Limpiar campos vacíos o nulos en specifications si fuera necesario
            const finalAssetTag =
                formData.asset_tag && formData.asset_tag.trim() !== ""
                    ? formData.asset_tag.trim()
                    : `S/N-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            const payload = {
                ...formData,
                asset_tag: finalAssetTag,
                serial_number: formData.serial_number || null,
                image_url: formData.image_url || null,
            };

            if (equipment) {
                const { error } = await supabase
                    .from("equipment")
                    .update(payload)
                    .eq("id", equipment.id);
                if (error) throw error;
                toast.success("Equipo actualizado correctamente");
            } else {
                const { error } = await supabase
                    .from("equipment")
                    .insert(payload);
                if (error) throw error;
                toast.success("Equipo registrado correctamente");
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

    const tabs = [
        { id: "general", label: "General", icon: Info },
        { id: "specs", label: "Especificaciones", icon: Cpu },
        { id: "network", label: "Red y Periféricos", icon: Network },
        { id: "management", label: "Gestión", icon: Settings },
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
                    <div
                        class="p-2 bg-galpe-green/20 rounded-xl text-galpe-green"
                    >
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white">
                            {equipment
                                ? "Editar Ficha Técnica"
                                : "Nueva Ficha de Equipo"}
                        </h2>
                        <p
                            class="text-xs text-white/40 uppercase tracking-widest font-bold"
                        >
                            Inventario de TI
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

            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
            >
                {#if activeTab === "general"}
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                        <div class="space-y-6">
                            <div class="space-y-1">
                                <label
                                    for="image-upload"
                                    class="text-xs font-bold uppercase text-white/40 ml-1"
                                    >Imagen del Equipo</label
                                >
                                <div
                                    class="relative group aspect-video rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center"
                                >
                                    {#if formData.image_url}
                                        <img
                                            src={formData.image_url}
                                            alt="Equipo"
                                            class="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div
                                            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <label
                                                class="cursor-pointer p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
                                            >
                                                <Camera size={24} />
                                                <input
                                                    id="image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onchange={handleFileUpload}
                                                    class="hidden"
                                                />
                                            </label>
                                        </div>
                                    {:else}
                                        <label
                                            class="cursor-pointer flex flex-col items-center gap-3 text-white/20 hover:text-white/40 transition-colors"
                                        >
                                            {#if uploading}
                                                <div
                                                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-white"
                                                ></div>
                                                <span class="text-xs font-bold"
                                                    >Subiendo...</span
                                                >
                                            {:else}
                                                <Upload size={48} />
                                                <span class="text-xs font-bold"
                                                    >Subir Imagen</span
                                                >
                                            {/if}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onchange={handleFileUpload}
                                                class="hidden"
                                            />
                                        </label>
                                    {/if}
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label
                                        for="asset_tag"
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Código Activo</label
                                    >
                                    <input
                                        id="asset_tag"
                                        type="text"
                                        bind:value={formData.asset_tag}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-mono"
                                        placeholder="GAL-001"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        for="status"
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Estado</label
                                    >
                                    <select
                                        id="status"
                                        bind:value={formData.status}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="active">Activo</option>
                                        <option value="maintenance"
                                            >Mantenimiento</option
                                        >
                                        <option value="in_stock"
                                            >En Stock</option
                                        >
                                        <option value="retired">Retirado</option
                                        >
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <div class="space-y-1">
                                <label
                                    for="name"
                                    class="text-xs font-bold uppercase text-white/40 ml-1"
                                    >Nombre / Modelo</label
                                >
                                <input
                                    id="name"
                                    type="text"
                                    bind:value={formData.name}
                                    required
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                    placeholder="Ej: HP ProBook 450 G8"
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label
                                        for="type"
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Tipo de Equipo</label
                                    >
                                    <select
                                        id="type"
                                        bind:value={formData.type}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="computer"
                                            >Computadora</option
                                        >
                                        <option value="server">Servidor</option>
                                        <option value="printer"
                                            >Impresora</option
                                        >
                                        <option value="router">Router</option>
                                        <option value="other">Otro</option>
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label
                                        for="serial"
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Nº Serial</label
                                    >
                                    <input
                                        id="serial"
                                        type="text"
                                        bind:value={formData.serial_number}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-mono"
                                        placeholder="SN-XXXXX"
                                    />
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label
                                    for="dept"
                                    class="text-xs font-bold uppercase text-white/40 ml-1"
                                    >Ubicación (Dpto / Sede)</label
                                >
                                <select
                                    id="dept"
                                    bind:value={formData.department_id}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
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

                            <div class="space-y-1">
                                <label
                                    for="responsible"
                                    class="text-xs font-bold uppercase text-white/40 ml-1"
                                    >Responsable Actual</label
                                >
                                <select
                                    id="responsible"
                                    bind:value={formData.responsible_id}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                                >
                                    <option value="">Sin asignar</option>
                                    {#each personnel as p}
                                        <option value={p.id}
                                            >{p.full_name}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                        </div>
                    </div>
                {/if}

                {#if activeTab === "specs"}
                    <div
                        class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="space-y-1">
                                <label
                                    class="text-xs font-bold uppercase text-white/40 ml-1"
                                    >Procesador (Modelo)</label
                                >
                                <div class="relative">
                                    <Cpu
                                        size={18}
                                        class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                    />
                                    <input
                                        type="text"
                                        bind:value={formData.specifications.cpu}
                                        class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="Intel Core i7-1185G7"
                                    />
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label
                                    class="text-xs font-bold uppercase text-white/40 ml-1"
                                    >Memoria RAM</label
                                >
                                <input
                                    type="text"
                                    bind:value={formData.specifications.ram}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                    placeholder="16GB DDR4 3200MHz"
                                />
                            </div>
                            <div class="space-y-1">
                                <label
                                    class="text-xs font-bold uppercase text-white/40 ml-1"
                                    >Sistema Operativo</label
                                >
                                <input
                                    type="text"
                                    bind:value={formData.specifications.os}
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                    placeholder="Windows 11 Pro"
                                />
                            </div>
                        </div>

                        <!-- Discos Dinámicos -->
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h3
                                    class="text-sm font-bold text-white flex items-center gap-2"
                                >
                                    <HardDrive
                                        size={18}
                                        class="text-galpe-green"
                                    />
                                    Unidades de Almacenamiento
                                </h3>
                                <button
                                    type="button"
                                    onclick={addDisk}
                                    class="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-1"
                                >
                                    <Plus size={14} /> Agregar Disco
                                </button>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {#each formData.specifications.disks || [] as disk, i}
                                    <div
                                        class="flex gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl animate-in slide-in-from-right-4 duration-300"
                                    >
                                        <select
                                            bind:value={disk.type}
                                            class="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                        >
                                            <option value="SSD">SSD</option>
                                            <option value="NVMe">NVMe</option>
                                            <option value="HDD">HDD</option>
                                            <option value="Other">Otro</option>
                                        </select>
                                        <input
                                            type="text"
                                            bind:value={disk.capacity}
                                            class="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                                            placeholder="Capacidad (ej: 512GB)"
                                        />
                                        <button
                                            type="button"
                                            onclick={() => removeDisk(i)}
                                            class="text-white/20 hover:text-galpe-green transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                {/each}
                                {#if (formData.specifications.disks || []).length === 0}
                                    <div
                                        class="col-span-full py-8 text-center border-2 border-dashed border-white/5 rounded-2xl text-white/20"
                                    >
                                        <p class="text-sm">
                                            No hay discos registrados
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="space-y-1">
                            <label
                                class="text-xs font-bold uppercase text-white/40 ml-1"
                                >Comentarios / Software Adicional</label
                            >
                            <textarea
                                bind:value={
                                    formData.specifications.additional_notes
                                }
                                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all min-h-[100px] resize-none"
                                placeholder="Ej: Office 2021, AutoCAD, Licencia de..."
                            ></textarea>
                        </div>
                    </div>
                {/if}

                {#if activeTab === "network"}
                    <div
                        class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                        <section class="space-y-4">
                            <h3
                                class="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-galpe-green pl-3"
                            >
                                Red
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Dirección IP</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications.ip_address
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-mono"
                                        placeholder="192.168.1.100"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Dirección MAC</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications.mac_address
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-mono"
                                        placeholder="00:1A:2B:3C:4D:5E"
                                    />
                                </div>
                            </div>
                        </section>

                        <section class="space-y-4">
                            <h3
                                class="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-galpe-green pl-3"
                            >
                                Periféricos (Monitor)
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="space-y-1 col-span-1 md:col-span-2">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Marca / Modelo del Monitor</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications
                                                .monitor_model
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="Dell UltraSharp U2723QE"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Tamaño (Pulgadas)</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications.monitor_size
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="27 pulgadas"
                                    />
                                </div>
                                <div class="space-y-1 col-span-full">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Serial del Monitor</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications
                                                .monitor_serial
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all font-mono"
                                        placeholder="CN-0XXXX-..."
                                    />
                                </div>
                            </div>
                        </section>

                        <section class="space-y-4">
                            <h3
                                class="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-galpe-green pl-3"
                            >
                                Otros Periféricos
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Teclado (Marca/Modelo)</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications
                                                .keyboard_brand
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="Logitech MX Keys"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Mouse (Marca/Modelo)</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications.mouse_brand
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="Logitech MX Master 3S"
                                    />
                                </div>
                                <div class="space-y-1 col-span-full">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Impresoras Conectadas</label
                                    >
                                    <textarea
                                        bind:value={
                                            formData.specifications
                                                .connected_printers
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all min-h-[60px] resize-none"
                                        placeholder="Ej: HP LaserJet Pro (Local), Brother HL (Red)"
                                    ></textarea>
                                </div>
                            </div>
                        </section>
                    </div>
                {/if}

                {#if activeTab === "management"}
                    <div
                        class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                        <section class="space-y-4">
                            <h3
                                class="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-galpe-green pl-3"
                            >
                                Compra y Garantía
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Proveedor / Tienda</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications.vendor
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="Dell Store / Amazon"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Costo de Adquisición</label
                                    >
                                    <div class="relative">
                                        <span
                                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                            >$</span
                                        >
                                        <input
                                            type="number"
                                            bind:value={
                                                formData.specifications.cost
                                            }
                                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Fecha de Compra</label
                                    >
                                    <div class="relative">
                                        <Calendar
                                            size={18}
                                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                        />
                                        <input
                                            type="date"
                                            bind:value={
                                                formData.specifications
                                                    .purchase_date
                                            }
                                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        />
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Vencimiento Garantía</label
                                    >
                                    <div class="relative">
                                        <Calendar
                                            size={18}
                                            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                                        />
                                        <input
                                            type="date"
                                            bind:value={
                                                formData.specifications
                                                    .warranty_expiry
                                            }
                                            class="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="space-y-4">
                            <h3
                                class="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-galpe-green pl-3"
                            >
                                Respaldo (UPS)
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Marca / Modelo UPS</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications.ups_brand
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="APC Back-UPS"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Capacidad (VA/W)</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={
                                            formData.specifications.ups_capacity
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                                        placeholder="750VA / 450W"
                                    />
                                </div>
                                <div class="space-y-1">
                                    <label
                                        class="text-xs font-bold uppercase text-white/40 ml-1"
                                        >Estado UPS</label
                                    >
                                    <select
                                        bind:value={
                                            formData.specifications.ups_status
                                        }
                                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="Batería Ok"
                                            >Batería Ok</option
                                        >
                                        <option value="Cambio Necearío"
                                            >Cambio Necesario</option
                                        >
                                        <option value="Falla Circuito"
                                            >Falla Circuito</option
                                        >
                                        <option value="Desconectado"
                                            >Desconectado</option
                                        >
                                    </select>
                                </div>
                            </div>
                        </section>
                    </div>
                {/if}
            </form>

            <!-- Sticky Footer -->
            <div class="p-6 border-t border-white/10 bg-black/40 flex gap-4">
                <GlassButton
                    variant="secondary"
                    class="flex-1"
                    onclick={onClose}
                    type="button"
                >
                    Cancelar
                </GlassButton>
                <GlassButton
                    variant="primary"
                    class="flex-1"
                    onclick={handleSubmit}
                    {loading}
                >
                    {#if loading}
                        <div
                            class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                        ></div>
                        Guardando...
                    {:else}
                        <Save size={18} class="mr-2" />
                        Guardar Cambios
                    {/if}
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

    /* Custom Scrollbar */
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
</style>
