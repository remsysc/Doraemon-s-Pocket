import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react({
            include: /\.(tsx|jsx)$/,
        }),
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.tsx'],
            refresh: ['resources/views/**'],
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        tailwindcss(),
    ],
    server: {
        // '0.0.0.0' makes Vite reachable from outside the container (host browser → port 5173)
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            // Tell the browser to connect HMR websocket to localhost, not 0.0.0.0
            host: 'localhost',
        },
        watch: {
            // Use polling inside Docker — inotify doesn't work reliably on bind mounts
            usePolling: true,
            ignored: ['**/storage/framework/views/**'],
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-dev-runtime'],
    },
});
