import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import * as fs from "node:fs";
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    const baseHost = (env.VITE_BASE_URL || '')
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');

    const baseUrl = env.VITE_BASE_URL || 'https://localhost:3000/';

    return {
        plugins: [
            react(),
            tailwindcss(),
            compression({ algorithm: 'brotliCompress', ext: '.br' }),
            {
                name: 'html-transform',
                transformIndexHtml(html) {
                    return html.replace(/%VITE_BASE_HOST%/g, baseHost);
                },
            },
            VitePWA({
                // 'prompt' keeps the new service worker in "waiting" state until
                // the user clicks our custom toast — see PwaUpdatePrompt.tsx.
                registerType: 'prompt',
                includeAssets: ['favicon.ico', 'images/*.webp', 'images/*.svg', 'audio/*.mp3', 'fonts/*.woff2'],
                manifest: {
                    name: 'UNE Unwrapped — Resumen anual del SEN de La Habana',
                    short_name: 'UNE Unwrapped',
                    description: 'Dashboard interactivo del Sistema Electroenergético Nacional en La Habana. Análisis anual de apagones, bloques, déficit y mensajes oficiales.',
                    theme_color: '#f97316',
                    background_color: '#ffffff',
                    display: 'standalone',
                    display_override: ['standalone', 'minimal-ui', 'browser'],
                    orientation: 'any',
                    scope: '/',
                    start_url: '/',
                    id: '/',
                    lang: 'es-CU',
                    dir: 'ltr',
                    categories: ['news', 'utilities', 'productivity', 'government'],
                    prefer_related_applications: false,
                    icons: [
                        {src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
                        {src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
                        {src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
                    ],
                    screenshots: [
                        {
                            src: 'banner.png',
                            sizes: '1731x909',
                            type: 'image/png',
                            form_factor: 'wide',
                            label: 'Vista general del dashboard UNE Unwrapped',
                        },
                    ],
                    shortcuts: [
                        {
                            name: 'Year Wrapped 2025',
                            short_name: 'Wrapped 2025',
                            description: 'Resumen anual del SEN en formato historia',
                            url: '/?year=2025#year-wrapped',
                            icons: [{src: 'pwa-192x192.png', sizes: '192x192'}],
                        },
                        {
                            name: 'Health Score',
                            short_name: 'Health',
                            description: 'Salud global del sistema en una sola métrica',
                            url: '/#health-score',
                            icons: [{src: 'pwa-192x192.png', sizes: '192x192'}],
                        },
                        {
                            name: 'Mapa de afectaciones',
                            short_name: 'Mapa',
                            description: 'Provincias y municipios más afectados',
                            url: '/#affected-zones',
                            icons: [{src: 'pwa-192x192.png', sizes: '192x192'}],
                        },
                    ],
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
                    cleanupOutdatedCaches: true,
                    navigateFallback: '/index.html',
                    navigateFallbackDenylist: [/^\/sitemap\.xml/, /^\/robots\.txt/, /^\/data\//],
                },
            }),
            {
                name: 'generate-robots-txt',
                closeBundle() {
                    const sitemapUrl = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`;
                    // Permissive but explicit — helps SEO crawlers index everything,
                    // while keeping the SW + workbox internals out of search results.
                    // Fully permissive — every bot gets unrestricted access.
                    // No disallows, no crawl-delays, no per-bot overrides.
                    const robotsContent = [
                        '# UNE Unwrapped — robots.txt',
                        '# Public dashboard. Everything is freely indexable by every bot.',
                        '',
                        'User-agent: *',
                        'Allow: /',
                        '',
                        `Sitemap: ${sitemapUrl}`,
                        '',
                    ].join('\n');
                    const outputPath = path.resolve(__dirname, 'dist/robots.txt');

                    if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
                        fs.writeFileSync(outputPath, robotsContent);
                    }
                }
            }
        ],
        define: {
            'import.meta.env.VITE_BASE_HOST': JSON.stringify(baseHost),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: (id) => {
                        if (id.includes('node_modules')) {
                            if (id.includes('recharts')) return 'vendor-charts';
                            if (id.includes('framer-motion')) return 'vendor-motion';
                            if (id.includes('lucide-react')) return 'vendor-icons';
                            // html-to-image is dynamically imported only on click —
                            // returning undefined lets Rollup put it in its own
                            // async chunk instead of forcing it into vendor-core.
                            if (id.includes('html-to-image')) return undefined;
                            // Vercel telemetry is also lazy-loaded after first paint.
                            if (id.includes('@vercel')) return undefined;
                            return 'vendor-core';
                        }
                    }
                }
            },
            chunkSizeWarningLimit: 600,
            reportCompressedSize: true
        },
    };
});