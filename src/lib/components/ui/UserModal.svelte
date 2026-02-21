<script lang="ts">
    import {
        X,
        Save,
        Shield,
        Mail,
        User as UserIcon,
        Plus,
        Trash2,
    } from "lucide-svelte";
    import GlassButton from "./GlassButton.svelte";
    import { supabase } from "$lib/supabase/client";
    import type { Profile, Department } from "$lib/types/database";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    type Role = {
        slug: string;
        name: string;
        description: string | null;
    };

    let {
        isOpen,
        profile = null,
        onSave,
        onClose,
    } = $props<{
        isOpen: boolean;
        profile?: Profile | null;
        onSave: () => void;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let departments = $state<Department[]>([]);
    let roles = $state<Role[]>([]);

    let formData = $state({
        email: "",
        password: "",
        full_name: "",
        role: "viewer",
        department_id: "",
    });

    const isCreating = $derived(profile === null);

    $effect(() => {
        if (profile) {
            formData = {
                email: profile.email,
                password: "",
                full_name: profile.full_name || "",
                role: profile.role,
                department_id: profile.department_id || "",
            };
        } else {
            // Reset form for creating new user
            formData = {
                email: "",
                password: "",
                full_name: "",
                role: "viewer",
                department_id: "",
            };
        }
    });

    onMount(async () => {
        // Cargar departamentos
        const { data: deptData } = await supabase
            .from("departments")
            .select("*, locations(name)");
        if (deptData) departments = deptData as any;

        // Cargar roles dinámicamente
        const { data: rolesData } = await supabase
            .from("roles")
            .select("slug, name, description")
            .order("is_system", { ascending: false })
            .order("name");
        if (rolesData) roles = rolesData;
    });

    let isConfirmingDelete = $state(false);
    let adminPassword = $state("");

    async function handleSubmit() {
        try {
            loading = true;

            if (isCreating) {
                // Crear nuevo usuario
                if (!formData.email || !formData.password) {
                    toast.error("Email y contraseña son obligatorios");
                    return;
                }

                // Paso 1: Crear usuario en auth.users usando signUp
                const { data: authData, error: authError } =
                    await supabase.auth.signUp({
                        email: formData.email,
                        password: formData.password,
                        options: {
                            data: {
                                full_name: formData.full_name,
                            },
                            emailRedirectTo: undefined, // No enviar email de confirmación
                        },
                    });

                if (authError) throw authError;
                if (!authData.user)
                    throw new Error("No se pudo crear el usuario");

                // Paso 2: Actualizar el perfil con rol y departamento
                // El trigger ya creó el perfil, solo actualizamos
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar a que el trigger cree el perfil

                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        department_id: formData.department_id || null,
                    })
                    .eq("id", authData.user.id);

                if (profileError) {
                    console.warn("Error al actualizar perfil:", profileError);
                    // No lanzar error, el usuario fue creado exitosamente
                }

                toast.success("Usuario creado exitosamente");
            } else {
                // Actualizar usuario existente
                const { error } = await supabase
                    .from("profiles")
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        department_id: formData.department_id || null,
                    })
                    .eq("id", profile!.id);

                if (error) throw error;
                toast.success("Perfil actualizado correctamente");
            }

            onSave();
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error("Error: " + (e.message || "Desconocido"));
        } finally {
            loading = false;
        }
    }

    async function handleSoftDelete() {
        if (!adminPassword) {
            toast.error("Por favor ingresa tu contraseña para confirmar");
            return;
        }

        try {
            loading = true;

            // 1. Verificar la contraseña del administrador actual
            const {
                data: { user: adminUser },
            } = await supabase.auth.getUser();
            if (!adminUser?.email)
                throw new Error("No se pudo verificar el usuario actual");

            const { error: authError } = await supabase.auth.signInWithPassword(
                {
                    email: adminUser.email,
                    password: adminPassword,
                },
            );

            if (authError) {
                throw new Error(
                    "Contraseña incorrecta. No se puede proceder con la eliminación.",
                );
            }

            // 2. Realizar eliminación lógica (soft delete)
            const { error: deleteError } = await supabase
                .from("profiles")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", profile!.id);

            if (deleteError) throw deleteError;

            toast.success("Usuario eliminado lógicamente");
            onSave();
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Error al eliminar usuario");
        } finally {
            loading = false;
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="button"
        tabindex="-1"
        onclick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
        onkeydown={(e) => {
            if (e.key === "Escape") onClose();
        }}
    >
        <div
            class="glass w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        >
            <div
                class="p-6 border-b border-white/10 flex justify-between items-center"
            >
                <h2
                    class="text-xl font-bold text-white flex items-center gap-2"
                >
                    <Shield size={20} class="text-galpe-green" />
                    {isCreating ? "Crear Usuario" : "Editar Usuario"}
                </h2>
                <button
                    onclick={onClose}
                    class="text-white/40 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {#if profile}
                <div class="px-6 py-4 bg-white/5 border-b border-white/10">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 font-bold"
                        >
                            {profile.full_name
                                ? profile.full_name[0]
                                : profile.email[0].toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm font-medium text-white">
                                {profile.full_name || "Sin nombre"}
                            </p>
                            <p class="text-xs text-white/40">{profile.email}</p>
                        </div>
                    </div>
                </div>
            {/if}

            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                class="p-6 space-y-4"
            >
                {#if isCreating}
                    <div class="space-y-1">
                        <label
                            for="email"
                            class="text-xs font-semibold uppercase text-white/40 ml-1"
                            >Email</label
                        >
                        <input
                            id="email"
                            type="email"
                            bind:value={formData.email}
                            required
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                            placeholder="usuario@ejemplo.com"
                        />
                    </div>

                    <div class="space-y-1">
                        <label
                            for="password"
                            class="text-xs font-semibold uppercase text-white/40 ml-1"
                            >Contraseña</label
                        >
                        <input
                            id="password"
                            type="password"
                            bind:value={formData.password}
                            required
                            minlength="6"
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                {/if}

                <div class="space-y-1">
                    <label
                        for="full_name"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Nombre Completo</label
                    >
                    <input
                        id="full_name"
                        type="text"
                        bind:value={formData.full_name}
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all"
                        placeholder="Ej: Juan Pérez"
                    />
                </div>

                <div class="space-y-1">
                    <label
                        for="role"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Rol de Acceso</label
                    >
                    <select
                        id="role"
                        bind:value={formData.role}
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                    >
                        {#each roles as role}
                            <option value={role.slug}>
                                {role.name}
                                {#if role.description}
                                    - {role.description}
                                {/if}
                            </option>
                        {/each}
                    </select>
                </div>

                <div class="space-y-1">
                    <label
                        for="dept"
                        class="text-xs font-semibold uppercase text-white/40 ml-1"
                        >Departamento</label
                    >
                    <select
                        id="dept"
                        bind:value={formData.department_id}
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-galpe-green/40 transition-all appearance-none"
                    >
                        <option value="">Sin asignar</option>
                        {#each departments as dept}
                            <option value={dept.id}
                                >{dept.name} ({dept.locations?.name})</option
                            >
                        {/each}
                    </select>
                </div>

                <div class="pt-4 space-y-4">
                    {#if !isCreating}
                        {#if !isConfirmingDelete}
                            <GlassButton
                                variant="secondary"
                                class="w-full text-galpe-green border-galpe-green/20 hover:bg-galpe-green/10"
                                onclick={() => (isConfirmingDelete = true)}
                                type="button"
                            >
                                <Trash2 size={18} class="mr-2" />
                                Eliminar Usuario
                            </GlassButton>
                        {:else}
                            <div
                                class="p-4 bg-galpe-green/10 border border-galpe-green/20 rounded-2xl space-y-3"
                            >
                                <p
                                    class="text-xs font-bold text-galpe-green uppercase tracking-wider flex items-center gap-2"
                                >
                                    <Shield size={14} />
                                    Confirmar Eliminación Logicá
                                </p>
                                <p class="text-xs text-white/60">
                                    Ingresa tu contraseña de administrador para
                                    confirmar esta acción.
                                </p>
                                <input
                                    type="password"
                                    bind:value={adminPassword}
                                    class="w-full bg-black/20 border border-galpe-green/30 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-galpe-green/50"
                                    placeholder="Tu contraseña"
                                    required
                                />
                                <div class="flex gap-2">
                                    <GlassButton
                                        variant="secondary"
                                        class="flex-1 text-xs"
                                        onclick={() => {
                                            isConfirmingDelete = false;
                                            adminPassword = "";
                                        }}
                                        type="button"
                                    >
                                        Cancelar
                                    </GlassButton>
                                    <GlassButton
                                        variant="primary"
                                        class="flex-1 text-xs !bg-galpe-green"
                                        onclick={handleSoftDelete}
                                        {loading}
                                        type="button"
                                    >
                                        Confirmar
                                    </GlassButton>
                                </div>
                            </div>
                        {/if}
                    {/if}

                    <div class="flex gap-4">
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
                            type="submit"
                            {loading}
                            disabled={isConfirmingDelete}
                        >
                            {#if isCreating}
                                <Plus size={18} class="mr-2" />
                                Crear
                            {:else}
                                <Save size={18} class="mr-2" />
                                Guardar
                            {/if}
                        </GlassButton>
                    </div>
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
