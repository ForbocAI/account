import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./src/__tests__/integration/setup.ts'],
        include: ['src/__tests__/integration/**/*.test.ts'],
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
});
