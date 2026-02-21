<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        Users,
        Mail,
        Shield,
        Edit2,
        Loader2,
        Search,
        Calendar,
        Plus,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import type { Profile } from "$lib/types/database";
    import { onMount } from "svelte";
    import UserModal from "$lib/components/ui/UserModal.svelte";

    type Role = {
        slug: string;
        name: string;
    };

    let profiles = $state<Profile[]>([]);
    let roles = $state<Role[]>([]);
    let loading = $state(true);
    let searchQuery = $state("");
    let selectedRole = $state("all");

    // Modal state
    let isModalOpen = $state(false);
    let editingProfile = $state<Profile | null>(null);

    async function fetchProfiles() {
        try {
            loading = true;
            const { data, error } = await supabase
                .from("profiles")
                .select(
                    `
                    *,
                    departments(name, locations(name))
                `,
                )
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

            if (error) throw error;
            profiles = data || [];
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function fetchRoles() {
        const { data } = await supabase
            .from("roles")
            .select("slug, name")
            .order("is_system", { ascending: false })
            .order("name");
        if (data) roles = data;
    }

    let filteredProfiles = $derived(
        profiles.filter((p) => {
            const matchesSearch =
                p.full_name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                p.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole =
                selectedRole === "all" || p.role === selectedRole;
            return matchesSearch && matchesRole;
        }),
    );

    function openEditModal(profile: Profile) {
        editingProfile = profile;
        isModalOpen = true;
    }

    const getRoleLabel = (role: string) => {
        const foundRole = roles.find((r) => r.slug === role);
        return foundRole ? foundRole.name : role;
    };

    const getRoleColor = (role: string) => {
        // Colores para roles del sistema
        switch (role) {
            case "admin":
                return "text-galpe-green bg-galpe-green/10 border-galpe-green/20";
            case "editor":
                return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case "viewer":
                return "text-galpe-green bg-galpe-green/10 border-galpe-green/20";
            default:
                // Color genérico para roles personalizados
                return "text-purple-400 bg-purple-400/10 border-purple-400/20";
        }
    };

    onMount(() => {
        fetchProfiles();
        fetchRoles();
    });
</script>

<div class="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                <Users size={32} class="text-galpe-green" />
                Gestión de Usuarios
            </h1>
            <p class="text-white/50">Control de accesos y roles del sistema</p>
        </div>
        <!-- <button
            onclick={() => {
                editingProfile = null;
                isModalOpen = true;
            }}
            class="flex items-center gap-2 px-4 py-2 bg-galpe-green hover:bg-galpe-green/80 text-white rounded-xl transition-all active:scale-95"
        >
            <Plus size={20} />
            Nuevo Usuario
        </button> -->

        <GlassButton
            variant="primary"
            onclick={() => {
                editingProfile = null;
                isModalOpen = true;
            }}
        >
            <Plus size={18} class="mr-2" />
            Nuevo Usuario
        </GlassButton>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2 relative">
            <Search
                class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                size={20}
            />
            <input
                type="text"
                bind:value={searchQuery}
                placeholder="Buscar por nombre o email..."
                class="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-galpe-green focus:outline-none transition-all"
            />
        </div>
        <div>
            <select
                bind:value={selectedRole}
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-galpe-green focus:outline-none transition-all appearance-none"
            >
                <option value="all">Todos los roles</option>
                {#each roles as role}
                    <option value={role.slug}>{role.name}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#if loading}
            {#each [1, 2, 3, 4, 5, 6] as i}
                <div class="h-48 glass animate-pulse rounded-3xl"></div>
            {/each}
        {:else if filteredProfiles.length === 0}
            <div
                class="col-span-full py-20 text-center text-white/20 glass rounded-3xl"
            >
                No se encontraron usuarios.
            </div>
        {:else}
            {#each filteredProfiles as profile}
                <GlassCard class="relative group overflow-hidden">
                    <div class="flex flex-col h-full space-y-4">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-bold text-white/40"
                                >
                                    {profile.full_name
                                        ? profile.full_name[0]
                                        : profile.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <p class="font-bold text-white">
                                        {profile.full_name || "Sin nombre"}
                                    </p>
                                    <p
                                        class="text-xs text-white/40 flex items-center gap-1"
                                    >
                                        <Mail size={12} />
                                        {profile.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onclick={() => openEditModal(profile)}
                                class="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="Editar Usuario"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <span
                                class="px-3 py-1 rounded-full text-[10px] font-bold uppercase border {getRoleColor(
                                    profile.role,
                                )}"
                            >
                                <Shield size={10} class="inline mr-1" />
                                {getRoleLabel(profile.role)}
                            </span>
                            {#if profile.departments}
                                <span
                                    class="px-3 py-1 rounded-full text-[10px] text-white/40 bg-white/5 border border-white/10"
                                >
                                    {profile.departments.name}
                                </span>
                            {/if}
                        </div>

                        <div
                            class="text-xs text-white/20 flex items-center gap-1"
                        >
                            <Calendar size={12} />
                            <span
                                >Desde: {new Date(
                                    profile.created_at,
                                ).toLocaleDateString()}</span
                            >
                        </div>
                    </div>
                </GlassCard>
            {/each}
        {/if}
    </div>
</div>

<UserModal
    isOpen={isModalOpen}
    profile={editingProfile}
    onSave={fetchProfiles}
    onClose={() => (isModalOpen = false)}
/>

<style>
    select option {
        background: #1a1a1a;
        color: white;
    }
</style>
