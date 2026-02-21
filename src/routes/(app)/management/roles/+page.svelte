<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import { Shield, Plus, Trash2, Loader2, AlertCircle } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";

    type Role = {
        slug: string;
        name: string;
        description: string | null;
        is_system: boolean;
        created_at: string;
    };

    let roles = $state<Role[]>([]);
    let loading = $state(true);
    let showCreateModal = $state(false);
    let deleting = $state<string | null>(null);

    // Formulario de nuevo rol
    let newRole = $state({
        slug: "",
        name: "",
        description: "",
    });

    async function fetchRoles() {
        try {
            loading = true;
            const { data, error } = await supabase
                .from("roles")
                .select("*")
                .order("is_system", { ascending: false })
                .order("name");

            if (error) throw error;
            roles = data || [];
        } catch (e: any) {
            console.error(e);
            toast.error(
                "Error al cargar roles: " + (e.message || "Desconocido"),
            );
        } finally {
            loading = false;
        }
    }

    async function createRole() {
        if (!newRole.slug || !newRole.name) {
            toast.error("El slug y nombre son obligatorios");
            return;
        }

        // Validar slug (solo letras minúsculas, números y guiones)
        if (!/^[a-z0-9-]+$/.test(newRole.slug)) {
            toast.error(
                "El slug solo puede contener letras minúsculas, números y guiones",
            );
            return;
        }

        try {
            const { error } = await supabase.from("roles").insert({
                slug: newRole.slug,
                name: newRole.name,
                description: newRole.description || null,
                is_system: false,
            });

            if (error) throw error;

            toast.success(`Rol "${newRole.name}" creado exitosamente`);
            showCreateModal = false;
            newRole = { slug: "", name: "", description: "" };
            await fetchRoles();
        } catch (e: any) {
            console.error(e);
            toast.error("Error al crear rol: " + (e.message || "Desconocido"));
        }
    }

    async function deleteRole(slug: string, name: string) {
        if (
            !confirm(
                `¿Estás seguro de eliminar el rol "${name}"?\n\nEsto también eliminará todas las asignaciones de permisos asociadas.`,
            )
        ) {
            return;
        }

        try {
            deleting = slug;
            const { error } = await supabase
                .from("roles")
                .delete()
                .eq("slug", slug);

            if (error) throw error;

            toast.success(`Rol "${name}" eliminado`);
            await fetchRoles();
        } catch (e: any) {
            console.error(e);
            toast.error(
                "Error al eliminar rol: " + (e.message || "Desconocido"),
            );
        } finally {
            deleting = null;
        }
    }

    onMount(fetchRoles);
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
    <header class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                <Shield size={32} class="text-galpe-green" />
                Gestión de Roles
            </h1>
            <p class="text-white/50">
                Crea y administra roles personalizados para tu organización
            </p>
        </div>
        <!-- <button
            onclick={() => (showCreateModal = true)}
            class="flex items-center gap-2 px-4 py-2 bg-galpe-green hover:bg-galpe-green/80 text-white rounded-xl transition-all active:scale-95"
        >
            <Plus size={20} />
            Nuevo Rol
        </button> -->
        <GlassButton variant="primary" onclick={() => (showCreateModal = true)}>
            <Plus size={18} class="mr-2" />
            Nuevo Rol
        </GlassButton>
    </header>

    <GlassCard>
        {#if loading}
            <div class="flex items-center justify-center py-20">
                <Loader2 size={32} class="animate-spin text-galpe-green" />
            </div>
        {:else if roles.length === 0}
            <div class="text-center py-20 text-white/20">
                <Shield size={48} class="mx-auto mb-4 opacity-10" />
                <p>No hay roles definidos</p>
            </div>
        {:else}
            <div class="divide-y divide-white/5">
                {#each roles as role}
                    <div
                        class="p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                        <div class="flex-1">
                            <div class="flex items-center gap-3">
                                <h3 class="text-lg font-bold text-white">
                                    {role.name}
                                </h3>
                                {#if role.is_system}
                                    <span
                                        class="px-2 py-1 text-xs bg-galpe-green/20 text-galpe-green border border-galpe-green/30 rounded-lg"
                                    >
                                        Sistema
                                    </span>
                                {/if}
                            </div>
                            <p class="text-sm text-white/40 mt-1">
                                <code class="text-white/60">{role.slug}</code>
                                {#if role.description}
                                    · {role.description}
                                {/if}
                            </p>
                        </div>
                        {#if !role.is_system}
                            <button
                                onclick={() => deleteRole(role.slug, role.name)}
                                disabled={deleting === role.slug}
                                class="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                            >
                                {#if deleting === role.slug}
                                    <Loader2 size={20} class="animate-spin" />
                                {:else}
                                    <Trash2 size={20} />
                                {/if}
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </GlassCard>

    <div
        class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-sm text-blue-400"
    >
        <AlertCircle size={20} class="flex-shrink-0 mt-0.5" />
        <div>
            <p class="font-bold mb-1">Sobre los roles del sistema</p>
            <p class="text-blue-400/80">
                Los roles marcados como "Sistema" (admin, editor, viewer) no se
                pueden eliminar ya que son fundamentales para el funcionamiento
                de la aplicación.
            </p>
        </div>
    </div>
</div>

<!-- Modal Crear Rol -->
{#if showCreateModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onclick={(e) => {
            if (e.target === e.currentTarget) showCreateModal = false;
        }}
    >
        <GlassCard class="max-w-md w-full p-6 space-y-4">
            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                <Plus size={24} class="text-galpe-green" />
                Crear Nuevo Rol
            </h2>

            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-white/60 mb-2">
                        Slug (identificador único)
                    </label>
                    <input
                        type="text"
                        bind:value={newRole.slug}
                        placeholder="tecnico, supervisor, auditor..."
                        class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-galpe-green focus:outline-none"
                    />
                    <p class="text-xs text-white/40 mt-1">
                        Solo letras minúsculas, números y guiones
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-white/60 mb-2">
                        Nombre
                    </label>
                    <input
                        type="text"
                        bind:value={newRole.name}
                        placeholder="Técnico, Supervisor, Auditor..."
                        class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-galpe-green focus:outline-none"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-white/60 mb-2">
                        Descripción (opcional)
                    </label>
                    <textarea
                        bind:value={newRole.description}
                        placeholder="Descripción del rol..."
                        rows="3"
                        class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-galpe-green focus:outline-none resize-none"
                    ></textarea>
                </div>
            </div>

            <div class="flex gap-3 pt-4">
                <button
                    onclick={() => (showCreateModal = false)}
                    class="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                >
                    Cancelar
                </button>
                <button
                    onclick={createRole}
                    class="flex-1 px-4 py-2 bg-galpe-green hover:bg-galpe-green/80 text-white rounded-xl transition-all active:scale-95"
                >
                    Crear Rol
                </button>
            </div>
        </GlassCard>
    </div>
{/if}
