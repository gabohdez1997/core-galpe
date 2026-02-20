import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
        SvelteKitPWA({
            manifest: {
                name: 'CORE by Galpe',
                short_name: 'CORE',
                description: 'Sistema de Gestión Interna - CORE by Galpe',
                theme_color: '#0a0a0a',
                background_color: '#0a0a0a',
                display: 'standalone',
                icons: [
                    {
                        src: 'favicon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'favicon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ]
            }
        })
    ]
});
