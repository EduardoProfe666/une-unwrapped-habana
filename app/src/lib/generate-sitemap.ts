import {readdirSync, statSync, writeFileSync} from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve(process.cwd(), '.env')});
const host = process.env.VITE_BASE_URL;

if (!host) {
    console.error('VITE_BASE_URL is required to generate the sitemap');
    process.exit(1);
}

const baseUrl = host.replace(/\/$/, '');

// Use the most recent mtime among the analysis JSONs as the site's lastmod —
// they're the source of truth for "what changed" since the cron updates them.
const dataDir = path.resolve(process.cwd(), 'public/data');
let mostRecentMs = Date.now();
try {
    const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
        mostRecentMs = Math.max(
            ...files.map(f => statSync(path.join(dataDir, f)).mtimeMs)
        );
    }
} catch {
    /* fall back to "now" */
}
const lastmod = new Date(mostRecentMs).toISOString();

const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

interface UrlEntry {
    loc: string;
    lastmod: string;
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
    images?: Array<{loc: string; title?: string; caption?: string}>;
}

const urls: UrlEntry[] = [
    {
        loc: `${baseUrl}/`,
        lastmod,
        changefreq: 'hourly',
        priority: 1.0,
        images: [
            {
                loc: `${baseUrl}/banner.webp`,
                title: 'UNE Unwrapped',
                caption: 'Dashboard del Sistema Electroenergético Nacional en La Habana',
            },
        ],
    },
];

const renderUrl = (u: UrlEntry): string => {
    const images = (u.images ?? []).map(img => `
        <image:image>
            <image:loc>${escapeXml(img.loc)}</image:loc>${img.title ? `
            <image:title>${escapeXml(img.title)}</image:title>` : ''}${img.caption ? `
            <image:caption>${escapeXml(img.caption)}</image:caption>` : ''}
        </image:image>`).join('');

    return `    <url>
        <loc>${escapeXml(u.loc)}</loc>
        <lastmod>${u.lastmod}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority.toFixed(1)}</priority>${images}
    </url>`;
};

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(renderUrl).join('\n')}
</urlset>
`;

writeFileSync('./public/sitemap.xml', xml);
console.log(`✓ sitemap.xml generated (${urls.length} URLs, lastmod: ${lastmod})`);
