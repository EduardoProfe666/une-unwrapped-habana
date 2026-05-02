import {useEffect} from 'react';
import type {UneAnalysis} from '@/src/lib/types.ts';

const BASE_URL = (import.meta.env.VITE_BASE_URL ?? '').replace(/\/$/, '');
const DATASET_LDJSON_ID = 'ld-json-dataset-current-year';
const META_DESC_SELECTOR = 'meta[name="description"]';
const OG_TITLE_SELECTOR = 'meta[property="og:title"]';
const OG_DESC_SELECTOR = 'meta[property="og:description"]';
const TW_TITLE_SELECTOR = 'meta[name="twitter:title"]';
const TW_DESC_SELECTOR = 'meta[name="twitter:description"]';

const setMetaContent = (selector: string, content: string) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
};

/**
 * Updates document.title, the description meta family, and injects a
 * year-specific Dataset JSON-LD block. Lets crawlers and social cards pick up
 * a customized snippet per year even though it's a SPA.
 *
 * The Dataset block describes the *current* year's analysis so when the page
 * is shared, link previews and search results highlight the active dataset.
 */
export default function useSeo(year: number, data: UneAnalysis | null): void {
    useEffect(() => {
        const title = `UNE Unwrapped ${year} — Resumen del SEN en La Habana`;
        const description = data
            ? `${year}: ${data.total_messages.toLocaleString('es-ES')} mensajes oficiales analizados, ${data.sen_analysis?.total_failure_events ?? 0} desconexiones totales del SEN. Dashboard interactivo del Sistema Electroenergético en La Habana.`
            : `Resumen del Sistema Electroenergético Nacional en La Habana durante ${year}.`;

        document.title = title;
        setMetaContent(META_DESC_SELECTOR, description);
        setMetaContent(OG_TITLE_SELECTOR, title);
        setMetaContent(OG_DESC_SELECTOR, description);
        setMetaContent(TW_TITLE_SELECTOR, title);
        setMetaContent(TW_DESC_SELECTOR, description);

        // Year-specific Dataset JSON-LD
        if (!data) return;

        const dataset = {
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            '@id': `${BASE_URL}#dataset-${year}`,
            name: `UNE Unwrapped ${year} — Análisis anual del SEN en La Habana`,
            description,
            url: BASE_URL,
            inLanguage: 'es-CU',
            isAccessibleForFree: true,
            license: 'https://github.com/EduardoProfe666/une-unwrapped-habana/blob/main/LICENSE',
            creator: {'@id': `${BASE_URL}#publisher`},
            temporalCoverage: `${year}-01-01/${year}-12-31`,
            spatialCoverage: {
                '@type': 'Place',
                name: 'La Habana, Cuba',
                geo: {'@type': 'GeoCoordinates', latitude: 23.1136, longitude: -82.3666},
            },
            keywords: ['SEN', 'apagones', 'La Habana', 'Cuba', 'energía', 'bloques', 'déficit eléctrico', String(year)],
            distribution: [
                {
                    '@type': 'DataDownload',
                    encodingFormat: 'application/json',
                    contentUrl: `${BASE_URL}/data/analysis_data_${year}.json`,
                },
            ],
            variableMeasured: [
                {'@type': 'PropertyValue', name: 'total_messages', value: data.total_messages},
                {'@type': 'PropertyValue', name: 'total_views', value: data.total_views},
                {'@type': 'PropertyValue', name: 'total_reactions', value: data.total_reactions},
                ...(data.sen_analysis?.total_failure_events != null ? [{
                    '@type': 'PropertyValue',
                    name: 'sen_total_failure_events',
                    value: data.sen_analysis.total_failure_events,
                }] : []),
                ...(data.health_score != null ? [{
                    '@type': 'PropertyValue',
                    name: 'health_score',
                    minValue: 0,
                    maxValue: 100,
                    value: data.health_score,
                }] : []),
            ],
        };

        let scriptEl = document.getElementById(DATASET_LDJSON_ID) as HTMLScriptElement | null;
        if (!scriptEl) {
            scriptEl = document.createElement('script');
            scriptEl.id = DATASET_LDJSON_ID;
            scriptEl.type = 'application/ld+json';
            document.head.appendChild(scriptEl);
        }
        scriptEl.textContent = JSON.stringify(dataset);
    }, [year, data]);
}
