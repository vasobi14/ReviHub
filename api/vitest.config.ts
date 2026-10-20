import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globalSetup: ['./tests/setup.ts'],
        fileParallelism: false,
        hookTimeout: 120_000,
        testTimeout: 30_000,
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
    },
});
