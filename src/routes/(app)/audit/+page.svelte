<script lang="ts">
    import { History, User, Database, AlertCircle } from "lucide-svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabase/client";
    import type { AuditLog } from "$lib/types/database";
    import { toast } from "svelte-sonner";

    let logs = $state<AuditLog[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    async function fetchLogs() {
        try {
            loading = true;
            error = null;

            const { data, error: sbError } = await supabase
                .from("audit_logs")
                .select(
                    `
                    *,
                    profiles (
                        full_name,
                        email
                    )
                `,
                )
                .order("created_at", { ascending: false })
                .limit(50);

            if (sbError) throw sbError;
            logs = (data as any) || [];
        } catch (e: any) {
            console.error(e);
            error =
                "No se pudieron cargar los registros. Verifica tu configuración.";
            toast.error(error);
        } finally {
            loading = false;
        }
    }

    onMount(fetchLogs);

    const getActionColor = (action: string) => {
        switch (action) {
            case "INSERT":
                return "text-galpe-green";
            case "UPDATE":
                return "text-galpe-orange";
            case "DELETE":
                return "text-galpe-red";
            default:
                return "text-white/50";
        }
    };

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSecs < 60) return "Hace un momento";
        if (diffInSecs < 3600) return `Hace ${Math.floor(diffInSecs / 60)}m`;
        if (diffInSecs < 86400) return `Hace ${Math.floor(diffInSecs / 3600)}h`;
        return date.toLocaleDateString();
    };
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
    <header>
        <h1 class="text-3xl font-bold text-white/90">Registros de Auditoría</h1>
        <p class="text-white/50">Historial completo de cambios en el sistema</p>
    </header>

    <div class="space-y-4">
        {#if error}
            <div
                class="flex flex-col items-center justify-center py-20 text-galpe-red/70 glass rounded-2xl border-galpe-red/10"
            >
                <AlertCircle size={48} class="mb-4 opacity-50" />
                <p>Error al cargar registros</p>
                <button
                    onclick={fetchLogs}
                    class="text-xs underline mt-2 hover:text-white transition-colors"
                    >Reintentar</button
                >
            </div>
        {:else if loading}
            <div class="animate-pulse space-y-4">
                {#each [1, 2, 3, 4] as i}
                    <div class="h-20 bg-white/5 rounded-2xl w-full"></div>
                {/each}
            </div>
        {:else if logs.length === 0}
            <div class="text-center py-20 text-white/20">
                Sin actividad registrada.
            </div>
        {:else}
            {#each logs as log}
                <GlassCard class="p-0 overflow-hidden">
                    <div class="flex items-center p-4 gap-4">
                        <div
                            class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30"
                        >
                            <History size={20} />
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start">
                                <p class="text-white/80 text-sm">
                                    <span class="font-bold text-white"
                                        >{log.profiles?.full_name ||
                                            log.profiles?.email ||
                                            "Sistema"}</span
                                    >
                                    realizó
                                    <span
                                        class="font-mono {getActionColor(
                                            log.action,
                                        )}">{log.action}</span
                                    >
                                    en
                                    <span class="text-white/60"
                                        >{log.table_name}</span
                                    >
                                </p>
                                <span
                                    class="text-[10px] text-white/30 uppercase font-bold"
                                    >{formatRelativeTime(log.created_at)}</span
                                >
                            </div>
                            <p class="text-xs text-white/40 mt-1">
                                ID de registro: <span
                                    class="font-mono text-[10px] text-white/20"
                                    >{log.record_id}</span
                                >
                            </p>
                        </div>
                    </div>
                </GlassCard>
            {/each}
        {/if}
    </div>

    <div
        class="bg-galpe-orange/10 border border-galpe-orange/20 rounded-2xl p-4 flex gap-3 text-sm text-galpe-orange/80"
    >
        <AlertCircle size={20} />
        <p>
            Los registros de auditoría son inmutables y se generan
            automáticamente mediante triggers de base de datos.
        </p>
    </div>
</div>
