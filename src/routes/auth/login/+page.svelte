<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import GlassButton from "$lib/components/ui/GlassButton.svelte";
    import { supabase } from "$lib/supabase/client";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);

    async function handleLogin() {
        loading = true;
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Bienvenido de nuevo");
            goto("/dashboard");
        }
        loading = false;
    }
</script>

<div class="min-h-screen flex items-center justify-center p-4">
    <GlassCard class="w-full max-w-md p-8" title="">
        <div class="flex justify-center mb-4">
            <span
                style="font-size: 12rem;"
                class="icon icon-core-galpe text-galpe-green text-6xl drop-shadow-[0_0_20px_rgba(45,115,62,0.5)]"
            ></span>
        </div>
        <!-- <p class="text-white/50 text-sm mb-8 text-center">
            Acceso al Sistema de Gestion Interna
        </p> -->

        <form
            onsubmit={(e) => {
                e.preventDefault();
                handleLogin();
            }}
            class="space-y-6"
        >
            <div class="space-y-2">
                <label for="email" class="text-sm font-medium text-white/70"
                    >Correo Electronico</label
                >
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    placeholder="usuario@galpe.com"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-galpe-green/30 transition-all font-sans"
                    required
                />
            </div>

            <div class="space-y-2">
                <label for="password" class="text-sm font-medium text-white/70"
                    >Contraseña</label
                >
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    placeholder="••••••••"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-galpe-green/30 transition-all font-sans"
                    required
                />
            </div>

            <GlassButton
                variant="primary"
                class="w-full py-4 text-lg font-bold bg-galpe-green hover:bg-green-700 mt-4 disabled:opacity-50"
                onclick={handleLogin}
            >
                {loading ? "Iniciando sesión..." : "Entrar"}
            </GlassButton>
        </form>

        <div class="mt-8 text-center pt-8 border-t border-white/10">
            <p class="text-xs text-white/30 uppercase tracking-widest">
                Todos los derechos reservados (2026)
            </p>
        </div>
    </GlassCard>
</div>
