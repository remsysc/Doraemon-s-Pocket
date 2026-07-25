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
        host: 'localhost',
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-dev-runtime'],
    },
});
