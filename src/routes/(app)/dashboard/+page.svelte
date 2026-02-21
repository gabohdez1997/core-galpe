<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import {
        LayoutDashboard,
        Laptop,
        History,
        AlertCircle,
        Ticket,
        CheckCircle2,
        Wrench,
        ClipboardCheck,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import { onMount } from "svelte";
    import type { Equipment, AuditLog } from "$lib/types/database";

    let stats = $state({
        openTickets: 0,
        resolvedTickets: 0,
        pendingMaintenance: 0,
        completedMaintenance: 0,
    });
    let recentEquipment = $state<Equipment[]>([]);
    let recentLogs = $state<any[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    async function fetchDashboardData() {
        try {
            loading = true;
            error = null;

            // Get current month start and end dates
            const now = new Date();
            const startOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
            ).toISOString();
            const endOfMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            ).toISOString();

            // Parallelizing counts and fetches
            const [
                { count: openTickets },
                { count: resolvedTickets },
                { count: pendingMaintenance },
                { count: completedMaintenance },
                { data: equip },
                { data: logs },
            ] = await Promise.all([
                // Open Tickets
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .in("status", ["abierto", "en_proceso"])
                    .gte("created_at", startOfMonth)
                    .lte("created_at", endOfMonth),

                // Resolved Tickets
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .in("status", ["resuelto", "cerrado"])
                    .gte("created_at", startOfMonth)
                    .lte("created_at", endOfMonth),

                // Pending Maintenance
                supabase
                    .from("maintenance_records")
                    .select("*", { count: "exact", head: true })
                    .in("status", ["scheduled", "in_progress"])
                    .gte("created_at", startOfMonth)
                    .lte("created_at", endOfMonth),

                // Completed Maintenance
                supabase
                    .from("maintenance_records")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "completed")
                    .gte("created_at", startOfMonth)
                    .lte("created_at", endOfMonth),

                supabase
                    .from("equipment")
                    .select("*")
                    .limit(3)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("audit_logs")
                    .select(
                        `
                    *,
                    profiles (full_name, email)
                `,
                    )
                    .limit(4)
                    .order("created_at", { ascending: false }),
            ]);

            stats = {
                openTickets: openTickets || 0,
                resolvedTickets: resolvedTickets || 0,
                pendingMaintenance: pendingMaintenance || 0,
                completedMaintenance: completedMaintenance || 0,
            };
            recentEquipment = (equip as any) || [];
            recentLogs = (logs as any) || [];
        } catch (e: any) {
            console.error(e);
            error =
                e.message ||
                "No se pudieron cargar las estadísticas. Verifica tu conexión.";
        } finally {
            loading = false;
        }
    }

    onMount(fetchDashboardData);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };
</script>

{#if error}
    <div
        class="flex flex-col items-center justify-center min-h-[60vh] text-galpe-green/70"
    >
        <AlertCircle size={64} class="mb-4 opacity-50" />
        <h2 class="text-2xl font-bold">Error de Conexión</h2>
        <p class="mt-2 text-white/40">
            Asegúrate de haber configurado las variables de entorno en el
            archivo .env
        </p>
        <GlassButton
            variant="secondary"
            onclick={fetchDashboardData}
            class="mt-8">Intentar de nuevo</GlassButton
        >
    </div>
{:else}
    <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <header class="flex justify-between items-center">
            <div>
                <h1
                    class="text-4xl font-bold tracking-tight flex items-center gap-4"
                >
                    <LayoutDashboard size={36} class="text-galpe-green" />
                    <span
                        class="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50"
                        >Dashboard</span
                    >
                </h1>
                <p class="text-white/50 mt-1">Resumen del mes actual</p>
            </div>
            <!-- <div class="flex gap-4">
                <GlassButton
                    variant="secondary"
                    onclick={() => window.location.reload()}
                >
                    <Settings size={18} class="mr-2" />
                    Actualizar
                </GlassButton>
            </div> -->
        </header>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard
                title="Tickets Abiertos"
                class="flex flex-col items-center justify-center py-8 text-center text-sm text-white/60"
            >
                {#if loading}
                    <div
                        class="h-8 w-16 bg-white/5 animate-pulse rounded"
                    ></div>
                {:else}
                    <span class="text-3xl font-bold text-white"
                        >{stats.openTickets}</span
                    >
                {/if}
                <Ticket size={32} class="text-galpe-green mt-2" />
            </GlassCard>
            <GlassCard
                title="Tickets Resueltos"
                class="flex flex-col items-center justify-center py-8 text-center text-sm text-white/60"
            >
                {#if loading}
                    <div
                        class="h-8 w-16 bg-white/5 animate-pulse rounded"
                    ></div>
                {:else}
                    <span class="text-3xl font-bold text-white"
                        >{stats.resolvedTickets}</span
                    >
                {/if}
                <CheckCircle2 size={32} class="text-galpe-green mt-2" />
            </GlassCard>
            <GlassCard
                title="Mant. Pendientes"
                class="flex flex-col items-center justify-center py-8 text-center text-sm text-white/60"
            >
                {#if loading}
                    <div
                        class="h-8 w-16 bg-white/5 animate-pulse rounded"
                    ></div>
                {:else}
                    <span class="text-3xl font-bold text-white"
                        >{stats.pendingMaintenance}</span
                    >
                {/if}
                <Wrench size={32} class="text-galpe-orange mt-2" />
            </GlassCard>
            <GlassCard
                title="Mant. Completados"
                class="flex flex-col items-center justify-center py-8 text-center text-sm text-white/60"
            >
                {#if loading}
                    <div
                        class="h-8 w-16 bg-white/5 animate-pulse rounded"
                    ></div>
                {:else}
                    <span class="text-3xl font-bold text-white"
                        >{stats.completedMaintenance}</span
                    >
                {/if}
                <ClipboardCheck size={32} class="text-[#3b82f6] mt-2" />
            </GlassCard>
        </div>

        <!-- Main Content Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <GlassCard title="Inventario Reciente" class="lg:col-span-2">
                <div class="space-y-4">
                    {#if loading}
                        {#each [1, 2, 3] as _}
                            <div
                                class="h-16 bg-white/5 animate-pulse rounded-xl"
                            ></div>
                        {/each}
                    {:else if recentEquipment.length === 0}
                        <p class="text-center py-10 text-white/20">
                            Sin equipos registrados
                        </p>
                    {:else}
                        {#each recentEquipment as item}
                            <div
                                class="flex items-center justify-between p-4 border-b border-white/10 last:border-0"
                            >
                                <div class="flex items-center gap-4">
                                    <div
                                        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                                    >
                                        <Laptop size={20} />
                                    </div>
                                    <div>
                                        <p class="font-medium text-white/90">
                                            {item.name}
                                        </p>
                                        <p class="text-xs text-white/40">
                                            S# {item.serial_number || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    class="px-2 py-1 text-[10px] rounded-full uppercase font-bold text-galpe-green border border-galpe-green/30 bg-galpe-green/10"
                                >
                                    {item.status}
                                </span>
                            </div>
                        {/each}
                    {/if}
                </div>
                <GlassButton
                    variant="secondary"
                    class="w-full mt-6"
                    onclick={() => (window.location.href = "/inventory")}
                >
                    Ver Todo el Inventario
                </GlassButton>
            </GlassCard>

            <GlassCard title="Auditoría">
                <div class="space-y-4">
                    {#if loading}
                        {#each [1, 2, 3, 4] as _}
                            <div
                                class="h-12 bg-white/5 animate-pulse rounded-xl"
                            ></div>
                        {/each}
                    {:else if recentLogs.length === 0}
                        <p class="text-center py-10 text-white/20">
                            Sin actividad
                        </p>
                    {:else}
                        {#each recentLogs as log}
                            <div class="flex items-start gap-3">
                                <div class="mt-1">
                                    <History size={16} class="text-white/30" />
                                </div>
                                <div class="text-sm">
                                    <p class="text-white/80 line-clamp-2">
                                        <span class="font-bold"
                                            >{log.profiles?.full_name ||
                                                "Sistema"}</span
                                        >
                                        {log.action.toLowerCase()} en {log.table_name}
                                    </p>
                                    <p
                                        class="text-[10px] text-white/40 uppercase mt-0.5"
                                    >
                                        {formatTime(log.created_at)}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <GlassButton
                    variant="secondary"
                    class="w-full mt-6 text-sm"
                    onclick={() => (window.location.href = "/audit")}
                >
                    Ver Logs
                </GlassButton>
            </GlassCard>
        </div>
    </div>
{/if}
