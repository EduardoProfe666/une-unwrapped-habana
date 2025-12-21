import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import * as fs from "node:fs";
import { VitePWA } from 'vite-plugin-pwa';

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
            {
                name: 'html-transform',
                transformIndexHtml(html) {
                    return html.replace(/%VITE_BASE_HOST%/g, baseHost);
                },
            },
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'apple-touch-icon.webp', 'logo.webp', 'banner.webp', 'fonts/*.woff2'],
                manifest: {
                    name: 'UNE Unwrapped',
                    short_name: 'UNE Unwrapped',
                    description: 'Estadísticas anuales del estado del SEN capitalino',
                    theme_color: '#f97316',
                    background_color: '#ffffff',
                    display: 'standalone',
                    scope: '/',
                    start_url: '/',
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable'
                        }
                    ]
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
                    cleanupOutdatedCaches: true,
                }
            }),
            {
                name: 'generate-robots-txt',
                closeBundle() {
                    const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml`;
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
        }
    };
});