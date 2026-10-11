import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './resources/js/test/setup.ts',
        include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
    },
});
