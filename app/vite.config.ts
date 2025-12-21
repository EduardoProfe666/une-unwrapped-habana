import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import * as fs from "node:fs";

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