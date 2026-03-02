import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        nodePolyfills({
            include: ['buffer', 'crypto', 'stream', 'util', 'events', 'path'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
    ],
    resolve: {
        alias: {
            '@sdk': '/src/sdk',
            '@utils': '/src/utils',
        },
    },
    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    solana: ['@solana/web3.js'],
                    anchor: ['@coral-xyz/anchor'],
                },
            },
        },
    },
    define: {
        'process.env.BROWSER': true,
    },
});
