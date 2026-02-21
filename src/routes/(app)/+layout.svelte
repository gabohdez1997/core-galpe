<script lang="ts">
    import {
        LayoutDashboard,
        Laptop,
        History as HistoryIcon,
        LogOut,
        Menu,
        X,
        MapPin,
        Users,
        Shield,
        ShieldAlert,
        ChevronDown,
        Package,
        Settings,
        Wrench,
        UserCheck,
        ClipboardList,
        Boxes,
        Ticket,
        AlertCircle,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { Toaster } from "svelte-sonner";
    import { onMount } from "svelte";
    import { auth } from "$lib/auth.svelte";
    import { slide } from "svelte/transition";

    let { children } = $props();

    let isMobileMenuOpen = $state(false);
    let expanded = $state({
        inventory: false,
        support: false,
        system: false,
    });

    async function handleLogout() {
        await auth.logout();
        goto("/auth/login");
    }

    function isActive(path: string) {
        return page.url.pathname === path;
    }

    function toggleMenu(menu: "inventory" | "support" | "system") {
        expanded[menu] = !expanded[menu];
    }

    onMount(() => auth.init());
</script>

<div class="flex flex-col lg:flex-row min-h-screen">
    <!-- Sidebar Navigation (Desktop) -->
    <nav
        class="hidden lg:flex flex-col w-64 glass border-r border-white/10 p-6 space-y-8 h-screen sticky top-0"
    >
        <div class="flex flex-col items-center">
            <span
                style="font-size: 8rem;"
                class="icon icon-core-galpe text-galpe-green text-6xl drop-shadow-[0_0_15px_rgba(45,115,62,0.5)]"
            ></span>
            <!-- <div class="flex flex-col">
                <span
                    class="text-[10px] text-white/40 uppercase tracking-widest font-bold"
                    >Galpe</span
                >
            </div> -->
        </div>

        <div class="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            <!-- Dashboard -->
            <a
                href="/dashboard"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 {isActive(
                    '/dashboard',
                )
                    ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                    : 'text-white/40 hover:text-white hover:bg-white/5'}"
            >
                <LayoutDashboard size={20} />
                <span class="font-medium">Dashboard</span>
            </a>

            <!-- Group: Inventario -->
            <div class="space-y-1">
                <button
                    onclick={() => toggleMenu("inventory")}
                    class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                    <div class="flex items-center gap-3">
                        <Package
                            size={20}
                            class={expanded.inventory ? "text-galpe-green" : ""}
                        />
                        <span class="font-medium text-sm">Inventario</span>
                    </div>
                    <ChevronDown
                        size={14}
                        class="transition-transform duration-300 {expanded.inventory
                            ? 'rotate-180'
                            : ''}"
                    />
                </button>

                {#if expanded.inventory}
                    <div
                        class="pl-4 space-y-1"
                        transition:slide={{ duration: 200 }}
                    >
                        <a
                            href="/inventory"
                            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                '/inventory',
                            )
                                ? 'text-white bg-white/5'
                                : 'text-white/40 hover:text-white'}"
                        >
                            <Laptop size={16} />
                            <span>Equipos</span>
                        </a>
                        <a
                            href="/inventory/tools"
                            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                '/inventory/tools',
                            )
                                ? 'text-white bg-white/5'
                                : 'text-white/40 hover:text-white'}"
                        >
                            <Wrench size={16} />
                            <span>Herramientas</span>
                        </a>
                        <div
                            class="pt-2 px-4 text-[10px] font-bold uppercase tracking-widest text-white/20"
                        >
                            Organización
                        </div>
                        {#if auth.has("locations:read")}
                            <a
                                href="/management/locations"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/management/locations',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/40 hover:text-white'}"
                            >
                                <MapPin size={16} />
                                <span>Ubicaciones</span>
                            </a>
                        {/if}
                        {#if auth.has("departments:read")}
                            <a
                                href="/management/departments"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/management/departments',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/40 hover:text-white'}"
                            >
                                <Users size={16} />
                                <span>Departamentos</span>
                            </a>
                        {/if}
                        <a
                            href="/inventory/personnel"
                            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                '/inventory/personnel',
                            )
                                ? 'text-white bg-white/5'
                                : 'text-white/40 hover:text-white'}"
                        >
                            <UserCheck size={16} />
                            <span>Personal</span>
                        </a>
                    </div>
                {/if}
            </div>

            <!-- Group: Soporte Técnico -->
            {#if auth.has("maintenance:read") || auth.has("consumables:read")}
                <div class="space-y-1">
                    <button
                        onclick={() => toggleMenu("support")}
                        class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
                    >
                        <div class="flex items-center gap-3">
                            <ClipboardList
                                size={20}
                                class={expanded.support
                                    ? "text-galpe-green"
                                    : ""}
                            />
                            <span class="font-medium text-sm"
                                >Soporte Técnico</span
                            >
                        </div>
                        <ChevronDown
                            size={14}
                            class="transition-transform duration-300 {expanded.support
                                ? 'rotate-180'
                                : ''}"
                        />
                    </button>

                    {#if expanded.support}
                        <div
                            class="pl-4 space-y-1"
                            transition:slide={{ duration: 200 }}
                        >
                            {#if auth.has("maintenance:read")}
                                <a
                                    href="/maintenance"
                                    class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                        '/maintenance',
                                    )
                                        ? 'text-white bg-white/5'
                                        : 'text-white/40 hover:text-white'}"
                                >
                                    <Wrench size={16} />
                                    <span>Mantenimientos</span>
                                </a>
                            {/if}
                            {#if auth.has("consumables:read")}
                                <a
                                    href="/inventory/consumables"
                                    class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                        '/inventory/consumables',
                                    )
                                        ? 'text-white bg-white/5'
                                        : 'text-white/40 hover:text-white'}"
                                >
                                    <Boxes size={16} />
                                    <span>Consumibles</span>
                                </a>
                            {/if}
                            <div
                                class="pt-2 px-4 text-[10px] font-bold uppercase tracking-widest text-white/20"
                            >
                                Gestión de Tickets
                            </div>
                            <a
                                href="/support/tickets"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/support/tickets',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/40 hover:text-white'}"
                            >
                                <Ticket size={16} />
                                <span>Tickets</span>
                            </a>
                            <a
                                href="/support/categories"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/support/categories',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/40 hover:text-white'}"
                            >
                                <AlertCircle size={16} />
                                <span>Tipos de Fallas</span>
                            </a>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Group: Sistema -->
            <div class="space-y-1">
                <button
                    onclick={() => toggleMenu("system")}
                    class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                    <div class="flex items-center gap-3">
                        <Settings
                            size={20}
                            class={expanded.system ? "text-galpe-green" : ""}
                        />
                        <span class="font-medium text-sm">Sistema</span>
                    </div>
                    <ChevronDown
                        size={14}
                        class="transition-transform duration-300 {expanded.system
                            ? 'rotate-180'
                            : ''}"
                    />
                </button>

                {#if expanded.system}
                    <div
                        class="pl-4 space-y-1"
                        transition:slide={{ duration: 200 }}
                    >
                        {#if auth.has("users:read")}
                            <a
                                href="/management/users"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/management/users',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/50 hover:text-white'}"
                            >
                                <Users size={16} />
                                <span>Usuarios</span>
                            </a>
                        {/if}
                        {#if auth.has("permissions:manage")}
                            <a
                                href="/management/roles"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/management/roles',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/50 hover:text-white'}"
                            >
                                <Shield size={16} />
                                <span>Roles</span>
                            </a>
                            <a
                                href="/management/permissions"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/management/permissions',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/50 hover:text-white'}"
                            >
                                <ShieldAlert size={16} />
                                <span>Permisos</span>
                            </a>
                        {/if}

                        {#if auth.has("audit:read")}
                            <div
                                class="pt-2 px-4 text-[10px] font-bold uppercase tracking-widest text-white/20"
                            >
                                Seguridad
                            </div>
                            <a
                                href="/audit"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 {isActive(
                                    '/audit',
                                )
                                    ? 'text-white bg-white/5'
                                    : 'text-white/50 hover:text-white'}"
                            >
                                <HistoryIcon size={16} />
                                <span>Auditoría</span>
                            </a>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <div class="pt-6 border-t border-white/5">
            <button
                onclick={handleLogout}
                class="flex items-center gap-3 px-4 py-3 text-white/30 hover:text-galpe-orange transition-all duration-300 w-full rounded-xl hover:bg-galpe-orange/5 group"
            >
                <div
                    class="p-2 rounded-lg group-hover:bg-galpe-orange/10 transition-colors"
                >
                    <LogOut size={20} />
                </div>
                <span class="font-medium text-sm">Cerrar Sesión</span>
            </button>
        </div>
    </nav>

    <!-- Mobile Header -->
    <header
        class="lg:hidden flex items-center justify-between p-4 glass border-b border-white/10 sticky top-0 z-50"
    >
        <div class="flex items-center gap-2">
            <span
                class="icon icon-core-galpe text-galpe-green text-5xl drop-shadow-[0_0_10px_rgba(45,115,62,0.5)]"
            ></span>
        </div>
        <button
            onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
            class="p-2 text-white/70 hover:text-white transition-colors"
        >
            {#if isMobileMenuOpen}
                <X size={24} />
            {:else}
                <Menu size={24} />
            {/if}
        </button>
    </header>

    <!-- Mobile Menu Overlay -->
    {#if isMobileMenuOpen}
        <div
            class="lg:hidden fixed inset-0 z-40 bg-[#0a0a0b] pt-20 p-6 overflow-y-auto"
        >
            <div class="space-y-4">
                <a
                    href="/dashboard"
                    onclick={() => (isMobileMenuOpen = false)}
                    class="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all {isActive(
                        '/dashboard',
                    )
                        ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                        : 'text-white/50'}"
                >
                    <LayoutDashboard size={24} />
                    <span class="text-lg font-medium">Dashboard</span>
                </a>

                <!-- Mobile Inventario -->
                <div class="space-y-2">
                    <div
                        class="px-5 text-xs font-bold uppercase tracking-widest text-white/20"
                    >
                        Inventario
                    </div>
                    <div class="grid grid-cols-1 gap-1 pl-4">
                        <a
                            href="/inventory"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <Laptop size={20} /> <span>Equipos</span>
                        </a>
                        <a
                            href="/inventory/tools"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <Wrench size={20} /> <span>Herramientas</span>
                        </a>
                        <div
                            class="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/20"
                        >
                            Organización
                        </div>
                        <a
                            href="/management/locations"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <MapPin size={20} /> <span>Ubicaciones</span>
                        </a>
                        <a
                            href="/management/departments"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <Users size={20} /> <span>Departamentos</span>
                        </a>
                        <a
                            href="/inventory/personnel"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <UserCheck size={20} /> <span>Personal</span>
                        </a>
                    </div>
                </div>

                <!-- Mobile Soporte -->
                {#if auth.has("maintenance:read") || auth.has("consumables:read")}
                    <div class="space-y-2">
                        <div
                            class="px-5 text-xs font-bold uppercase tracking-widest text-white/20"
                        >
                            Soporte Técnico
                        </div>
                        <div class="grid grid-cols-1 gap-1 pl-4">
                            {#if auth.has("maintenance:read")}
                                <a
                                    href="/maintenance"
                                    onclick={() => (isMobileMenuOpen = false)}
                                    class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                                >
                                    <Wrench size={20} />
                                    <span>Mantenimientos</span>
                                </a>
                            {/if}
                            {#if auth.has("consumables:read")}
                                <a
                                    href="/inventory/consumables"
                                    onclick={() => (isMobileMenuOpen = false)}
                                    class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                                >
                                    <Boxes size={20} /> <span>Consumibles</span>
                                </a>
                            {/if}
                            <div
                                class="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/20"
                            >
                                Gestión de Tickets
                            </div>
                            <a
                                href="/support/tickets"
                                onclick={() => (isMobileMenuOpen = false)}
                                class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                            >
                                <Ticket size={20} /> <span>Tickets</span>
                            </a>
                            <a
                                href="/support/categories"
                                onclick={() => (isMobileMenuOpen = false)}
                                class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                            >
                                <AlertCircle size={20} />
                                <span>Tipos de Fallas</span>
                            </a>
                        </div>
                    </div>
                {/if}

                <!-- Mobile Sistema -->
                <div class="space-y-2">
                    <div
                        class="px-5 text-xs font-bold uppercase tracking-widest text-white/20"
                    >
                        Sistema
                    </div>
                    <div class="grid grid-cols-1 gap-1 pl-4">
                        <a
                            href="/management/users"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <Users size={20} /> <span>Usuarios</span>
                        </a>
                        <a
                            href="/management/roles"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <Shield size={20} /> <span>Roles</span>
                        </a>
                        <a
                            href="/management/permissions"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white"
                        >
                            <ShieldAlert size={20} /> <span>Permisos</span>
                        </a>
                        <a
                            href="/audit"
                            onclick={() => (isMobileMenuOpen = false)}
                            class="flex items-center gap-3 p-4 rounded-xl text-white/50 hover:text-white border-t border-white/5 mt-2 pt-4"
                        >
                            <HistoryIcon size={20} /> <span>Auditoría</span>
                        </a>
                    </div>
                </div>

                <button
                    onclick={handleLogout}
                    class="w-full flex items-center justify-center gap-3 px-5 py-5 rounded-2xl bg-galpe-orange/10 text-galpe-orange font-bold mt-8"
                >
                    <LogOut size={24} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    {/if}

    <main class="flex-1 overflow-y-auto bg-[#0a0a0b] relative">
        <div
            class="absolute inset-0 bg-gradient-to-br from-galpe-green/5 via-transparent to-transparent pointer-events-none"
        ></div>
        <div class="relative z-10 px-4 py-8 lg:px-12 lg:py-10">
            {@render children()}
        </div>
    </main>
</div>

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
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
