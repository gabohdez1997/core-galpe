<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import {
        Shield,
        Check,
        X,
        ShieldAlert,
        Loader2,
        ChevronDown,
        ChevronRight,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";

    type Permission = {
        slug: string;
        description: string;
    };

    type Role = {
        slug: string;
        name: string;
    };

    type PermissionGroup = {
        entity: string;
        label: string;
        permissions: Permission[];
        expanded: boolean;
    };

    type Section = {
        name: string;
        groups: PermissionGroup[];
    };

    let permissions = $state<Permission[]>([]);
    let roles = $state<Role[]>([]);
    let roleMappings = $state<any[]>([]);
    let loading = $state(true);
    let saving = $state<string | null>(null);
    let error = $state<string | null>(null);

    // Agrupar permisos por sección y entidad
    let sections = $derived<Section[]>(groupPermissions(permissions));

    function groupPermissions(perms: Permission[]): Section[] {
        const groups: Record<string, Permission[]> = {};

        perms.forEach((perm) => {
            const [entity] = perm.slug.split(":");
            if (!groups[entity]) groups[entity] = [];
            groups[entity].push(perm);
        });

        const sectionMap = [
            {
                name: "Inventario",
                entities: [
                    "equipment",
                    "tools",
                    "locations",
                    "departments",
                    "personnel",
                ],
            },
            {
                name: "Soporte Técnico",
                entities: ["maintenance", "consumables"],
            },
            {
                name: "Sistema",
                entities: ["users", "roles", "permissions", "audit"],
            },
        ];

        const entityLabels: Record<string, string> = {
            equipment: "Equipos",
            tools: "Herramientas",
            maintenance: "Mantenimientos",
            consumables: "Consumibles",
            locations: "Ubicaciones",
            departments: "Departamentos",
            personnel: "Personal",
            users: "Usuarios",
            roles: "Roles",
            permissions: "Matriz de Permisos",
            audit: "Seguridad (Auditoría)",
        };

        return sectionMap
            .map((section) => ({
                name: section.name,
                groups: section.entities
                    .filter((ent) => groups[ent])
                    .map((ent) => ({
                        entity: ent,
                        label: entityLabels[ent] || ent,
                        permissions: groups[ent].sort((a, b) => {
                            const order = [
                                "create",
                                "read",
                                "update",
                                "delete",
                                "manage",
                            ];
                            const aAction = a.slug.split(":")[1];
                            const bAction = b.slug.split(":")[1];
                            return (
                                order.indexOf(aAction) - order.indexOf(bAction)
                            );
                        }),
                        expanded: true,
                    })),
            }))
            .filter((s) => s.groups.length > 0);
    }

    async function fetchData() {
        try {
            loading = true;
            error = null;
            const [permRes, rolesRes, mapRes] = await Promise.all([
                supabase.from("permissions").select("*").order("slug"),
                supabase
                    .from("roles")
                    .select("slug, name")
                    .order("is_system", { ascending: false })
                    .order("name"),
                supabase.from("role_permissions").select("*"),
            ]);

            if (permRes.error) throw permRes.error;
            if (rolesRes.error) throw rolesRes.error;
            if (mapRes.error) throw mapRes.error;

            permissions = permRes.data || [];
            roles = rolesRes.data || [];
            roleMappings = mapRes.data || [];
        } catch (e: any) {
            console.error(e);
            error = e.message;
            toast.error(
                "Error al cargar datos: " + (e.message || "Desconocido"),
            );
        } finally {
            loading = false;
        }
    }

    function hasPermission(role: string, slug: string) {
        return roleMappings.some(
            (m) => m.role === role && m.permission_slug === slug,
        );
    }

    async function togglePermission(role: string, slug: string) {
        const active = hasPermission(role, slug);
        const key = `${role}-${slug}`;
        saving = key;

        try {
            if (active) {
                const { error } = await supabase
                    .from("role_permissions")
                    .delete()
                    .eq("role", role)
                    .eq("permission_slug", slug);
                if (error) throw error;
                roleMappings = roleMappings.filter(
                    (m) => !(m.role === role && m.permission_slug === slug),
                );
                toast.success(`Permiso revocado para ${role}`);
            } else {
                const { error } = await supabase
                    .from("role_permissions")
                    .insert({ role, permission_slug: slug });
                if (error) throw error;
                roleMappings = [
                    ...roleMappings,
                    { role, permission_slug: slug },
                ];
                toast.success(`Permiso otorgado para ${role}`);
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            saving = null;
        }
    }

    let expandedGroups = $state<Record<string, boolean>>({});

    function isGroupExpanded(entity: string) {
        if (expandedGroups[entity] === undefined) return true; // Expandido por defecto
        return expandedGroups[entity];
    }

    function toggleGroup(entity: string) {
        expandedGroups[entity] = !isGroupExpanded(entity);
    }

    function getActionLabel(slug: string): string {
        const action = slug.split(":")[1];
        const labels: Record<string, string> = {
            create: "Crear",
            read: "Ver",
            update: "Editar",
            delete: "Eliminar",
            manage: "Gestionar",
        };
        return labels[action] || action;
    }

    onMount(fetchData);
</script>

<div class="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <header>
        <h1 class="text-3xl font-bold text-white flex items-center gap-3">
            Matriz de Permisos
        </h1>
        <p class="text-white/50">
            En el mismo orden que tu menú de navegación. Configura qué acciones
            puede realizar cada rol.
        </p>
    </header>

    <GlassCard class="overflow-x-auto p-0">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-white/10">
                    <th
                        class="px-6 py-4 text-xs font-bold uppercase text-white/40 tracking-wider sticky left-0 bg-black/20 backdrop-blur-sm"
                    >
                        Módulo / Acción
                    </th>
                    {#each roles as role}
                        <th
                            class="px-6 py-4 text-xs font-bold uppercase text-white/40 tracking-wider text-center"
                        >
                            {role.name}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                {#if loading}
                    {#each [1, 2, 3, 4, 5, 6] as i}
                        <tr class="animate-pulse">
                            <td class="px-6 py-8">
                                <div class="h-4 bg-white/5 rounded w-48"></div>
                            </td>
                            {#each roles as r}
                                <td class="px-6 py-8">
                                    <div
                                        class="h-6 w-6 bg-white/5 rounded-full mx-auto"
                                    ></div>
                                </td>
                            {/each}
                        </tr>
                    {/each}
                {:else if sections.length === 0}
                    <tr>
                        <td
                            colspan={roles.length + 1}
                            class="px-6 py-20 text-center text-white/20"
                        >
                            <ShieldAlert
                                size={48}
                                class="mx-auto mb-4 opacity-10"
                            />
                            <p>
                                No se encontraron permisos definidos en la base
                                de datos.
                            </p>
                        </td>
                    </tr>
                {:else}
                    {#each sections as section}
                        <!-- Encabezado de Sección (Inventario / Sistema) -->
                        <tr class="bg-white/[0.02]">
                            <td
                                colspan={roles.length + 1}
                                class="px-6 py-4 border-b border-white/5"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="h-px w-4 bg-galpe-red/50"></div>
                                    <span
                                        class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30"
                                    >
                                        {section.name}
                                    </span>
                                    <div class="h-px flex-1 bg-white/5"></div>
                                </div>
                            </td>
                        </tr>

                        {#each section.groups as group}
                            <!-- Encabezado de grupo de entidad -->
                            <tr class="bg-white/5">
                                <td
                                    colspan={roles.length + 1}
                                    class="px-6 py-3"
                                >
                                    <button
                                        onclick={() =>
                                            toggleGroup(group.entity)}
                                        class="flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors w-full"
                                    >
                                        {#if isGroupExpanded(group.entity)}
                                            <ChevronDown size={16} />
                                        {:else}
                                            <ChevronRight size={16} />
                                        {/if}
                                        {group.label}
                                        <span class="text-white/40 text-xs"
                                            >({group.permissions.length})</span
                                        >
                                    </button>
                                </td>
                            </tr>

                            <!-- Permisos del grupo -->
                            {#if isGroupExpanded(group.entity)}
                                {#each group.permissions as perm}
                                    <tr
                                        class="hover:bg-white/5 transition-colors group"
                                    >
                                        <td
                                            class="px-6 py-4 sticky left-0 bg-black/20 backdrop-blur-sm border-l-2 border-transparent group-hover:border-galpe-red/30 transition-all"
                                        >
                                            <p
                                                class="text-sm font-bold text-white group-hover:text-galpe-red transition-colors"
                                            >
                                                {getActionLabel(perm.slug)}
                                            </p>
                                            <p class="text-xs text-white/40">
                                                {perm.description}
                                            </p>
                                        </td>
                                        {#each roles as role}
                                            <td class="px-6 py-4 text-center">
                                                <button
                                                    onclick={() =>
                                                        togglePermission(
                                                            role.slug,
                                                            perm.slug,
                                                        )}
                                                    disabled={saving !== null}
                                                    class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all active:scale-95 disabled:opacity-50
                                                    {hasPermission(
                                                        role.slug,
                                                        perm.slug,
                                                    )
                                                        ? 'bg-galpe-red/20 text-galpe-red border border-galpe-red/30 shadow-lg shadow-galpe-red/10'
                                                        : 'bg-white/5 text-white/20 border border-white/10 hover:border-white/20 hover:text-white/40'}"
                                                >
                                                    {#if saving === `${role.slug}-${perm.slug}`}
                                                        <Loader2
                                                            size={18}
                                                            class="animate-spin"
                                                        />
                                                    {:else if hasPermission(role.slug, perm.slug)}
                                                        <Check size={18} />
                                                    {:else}
                                                        <X size={18} />
                                                    {/if}
                                                </button>
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            {/if}
                        {/each}
                    {/each}
                {/if}
            </tbody>
        </table>
    </GlassCard>

    <div
        class="bg-galpe-red/10 border border-galpe-red/20 rounded-2xl p-4 flex gap-3 text-sm text-galpe-red/80"
    >
        <Shield size={20} />
        <p>
            Los cambios en la matriz se aplican **instantáneamente** a nivel de
            base de datos (RLS). Los usuarios verán los cambios en su próxima
            acción o al recargar la página.
        </p>
    </div>
</div>
