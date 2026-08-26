import { defaultExclude, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        exclude: [...defaultExclude, 'src/__tests__/integration/**'],
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
});
