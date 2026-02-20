<script lang="ts">
    import {
        X,
        User,
        Laptop,
        AlertCircle,
        Clock,
        CheckCircle2,
        MessageSquare,
        History,
    } from "lucide-svelte";
    import { supabase } from "$lib/supabase/client";
    import type { Ticket, TicketHistory } from "$lib/types/database";
    import { onMount } from "svelte";
    import GlassButton from "./GlassButton.svelte";
    import { toast } from "svelte-sonner";

    let { isOpen, ticket, onClose } = $props<{
        isOpen: boolean;
        ticket: Ticket | null;
        onClose: () => void;
    }>();

    let history = $state<TicketHistory[]>([]);
    let loading = $state(false);
    let newComment = $state("");

    async function fetchHistory() {
        if (!ticket) return;
        try {
            loading = true;
            const { data, error } = await supabase
                .from("ticket_history")
                .select(
                    `
                    *,
                    profiles (id, full_name)
                `,
                )
                .eq("ticket_id", ticket.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            history = (data as any) || [];
        } catch (e: any) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        if (isOpen && ticket) {
            fetchHistory();
        }
    });

    async function addComment() {
        if (!newComment.trim() || !ticket) return;

        try {
            const { error } = await supabase.from("ticket_history").insert({
                ticket_id: ticket.id,
                comment: newComment,
                user_id: (await supabase.auth.getUser()).data.user?.id,
            });

            if (error) throw error;
            newComment = "";
            fetchHistory();
            toast.success("Comentario añadido");
        } catch (e: any) {
            toast.error("Error al comentar: " + e.message);
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    const priorityColors = {
        baja: "text-blue-400 bg-blue-400/10",
        media: "text-yellow-400 bg-yellow-400/10",
        alta: "text-orange-400 bg-orange-400/10",
        critica: "text-red-500 bg-red-500/10",
    };
</script>

{#if isOpen && ticket}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <div
            class="glass w-full max-w-3xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"
        >
            <div
                class="p-6 border-b border-white/10 flex justify-between items-start bg-white/5"
            >
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <span
                            class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded {priorityColors[
                                ticket.priority
                            ]}"
                        >
                            {ticket.priority}
                        </span>
                        <span class="text-white/20 text-xs font-mono"
                            >#{ticket.id.slice(0, 8)}</span
                        >
                    </div>
                    <h2 class="text-2xl font-bold text-white leading-tight">
                        {ticket.title}
                    </h2>
                </div>
                <button
                    onclick={onClose}
                    class="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                >
                    <X size={24} />
                </button>
            </div>

            <div
                class="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10"
            >
                <!-- Left: Info -->
                <div class="flex-1 p-6 space-y-8">
                    <section class="space-y-4">
                        <h4
                            class="text-xs font-bold uppercase text-white/20 tracking-widest flex items-center gap-2"
                        >
                            <AlertCircle size={14} /> Descripción del Caso
                        </h4>
                        <div
                            class="p-4 rounded-2xl bg-white/5 text-white/80 text-sm leading-relaxed border border-white/5 whitespace-pre-wrap"
                        >
                            {ticket.description ||
                                "Sin descripción proporcionada."}
                        </div>
                    </section>

                    <div class="grid grid-cols-2 gap-4">
                        <GlassCard class="p-4 border-white/5">
                            <h4
                                class="text-[10px] font-bold uppercase text-white/20 mb-2"
                            >
                                Usuario afectado
                            </h4>
                            <div class="flex items-center gap-2 text-white/90">
                                <User size={16} class="text-galpe-red" />
                                <span class="font-medium"
                                    >{ticket.personnel?.full_name ||
                                        "Desconocido"}</span
                                >
                            </div>
                        </GlassCard>
                        <GlassCard class="p-4 border-white/5">
                            <h4
                                class="text-[10px] font-bold uppercase text-white/20 mb-2"
                            >
                                Equipo
                            </h4>
                            <div class="flex items-center gap-2 text-white/90">
                                <Laptop size={16} class="text-white/40" />
                                <span class="font-medium truncate"
                                    >{ticket.equipment?.name ||
                                        "No asociado"}</span
                                >
                            </div>
                        </GlassCard>
                        <GlassCard class="p-4 border-white/5">
                            <h4
                                class="text-[10px] font-bold uppercase text-white/20 mb-2"
                            >
                                Categoría
                            </h4>
                            <div class="flex items-center gap-2 text-white/90">
                                <div
                                    class="w-3 h-3 rounded-full"
                                    style="background: {ticket.ticket_categories
                                        ?.color}"
                                ></div>
                                <span class="font-medium"
                                    >{ticket.ticket_categories?.name ||
                                        "Sin categoria"}</span
                                >
                            </div>
                        </GlassCard>
                        <GlassCard class="p-4 border-white/5">
                            <h4
                                class="text-[10px] font-bold uppercase text-white/20 mb-2"
                            >
                                Técnico
                            </h4>
                            <div class="flex items-center gap-2 text-white/90">
                                <Clock size={16} class="text-white/40" />
                                <span class="font-medium italic"
                                    >{ticket.profiles?.full_name ||
                                        "PENDIENTE"}</span
                                >
                            </div>
                        </GlassCard>
                    </div>
                </div>

                <!-- Right: Timeline/History -->
                <div
                    class="w-full md:w-[320px] bg-black/20 p-6 flex flex-col gap-6 h-full"
                >
                    <h4
                        class="text-xs font-bold uppercase text-white/20 tracking-widest flex items-center gap-2"
                    >
                        <History size={14} /> Historial de Seguimiento
                    </h4>

                    <div
                        class="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar-thin"
                    >
                        {#each history as event}
                            <div
                                class="relative pl-6 pb-2 border-l border-white/10 last:pb-0"
                            >
                                <div
                                    class="absolute left-[-5px] top-1 w-2 h-2 rounded-full {event.new_status
                                        ? 'bg-galpe-red'
                                        : 'bg-white/20'}"
                                ></div>
                                <div class="text-[10px] text-white/30 mb-1">
                                    {formatDate(event.created_at)}
                                </div>

                                {#if event.new_status}
                                    <div class="text-xs text-white/60 mb-1">
                                        Estado: <span
                                            class="text-white font-bold italic"
                                            >{event.previous_status || "INICIO"}
                                            → {event.new_status}</span
                                        >
                                    </div>
                                {/if}

                                {#if event.comment}
                                    <div
                                        class="p-2 rounded-lg bg-white/5 text-[11px] text-white/80 border border-white/5"
                                    >
                                        {event.comment}
                                        <div
                                            class="text-[9px] text-white/30 text-right mt-1"
                                        >
                                            — {event.profiles?.full_name ||
                                                "Sistema"}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>

                    <div class="pt-4 border-t border-white/10 space-y-2">
                        <textarea
                            bind:value={newComment}
                            placeholder="Escribe un comentario o nota técnica..."
                            class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-galpe-red/40 min-h-[60px] resize-none"
                        ></textarea>
                        <GlassButton
                            variant="primary"
                            class="w-full py-2 text-xs rounded-xl"
                            onclick={addComment}
                            disabled={!newComment.trim()}
                        >
                            <MessageSquare size={14} class="mr-2" /> Comentar
                        </GlassButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar-thin::-webkit-scrollbar {
        width: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb,
    .custom-scrollbar-thin::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
</style>
