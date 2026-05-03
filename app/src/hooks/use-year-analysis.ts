import {useEffect, useState} from "react";
import {UneAnalysis} from "@/src/lib/types.ts";

// In-memory cache keyed by year. Avoids re-fetching + re-parsing the JSON
// when the user toggles back to a year they already loaded. Yearly JSONs
// are immutable per session (refreshed by the hourly sync workflow), so
// keeping them in memory for the lifetime of the page is safe.
const cache = new Map<number, UneAnalysis>();
// Track in-flight requests so concurrent prefetch + fetch share the promise
const inflight = new Map<number, Promise<UneAnalysis>>();

// IMPORTANT: this fetch is NOT abortable on purpose.
//
// The cache is process-wide; multiple consumers (StrictMode double-mount,
// prefetch on hover, the hook itself) may share the same in-flight promise.
// If one consumer aborts the underlying fetch, every other consumer sees
// AbortError too — including the one that's still mounted and waiting for
// data. That's exactly what was making the dev page hang on "CARGANDO…":
// StrictMode's first cleanup aborted the fetch before the second effect
// could re-subscribe to it.
//
// Letting the fetch run to completion is cheap (one JSON, ~150 KB), and
// consumers handle staleness via a closure-scoped `cancelled` flag.
const fetchYear = (year: number): Promise<UneAnalysis> => {
    const cached = cache.get(year);
    if (cached) return Promise.resolve(cached);

    const existing = inflight.get(year);
    if (existing) return existing;

    const promise = fetch(`/data/analysis_data_${year}.json`)
        .then(r => {
            if (!r.ok) throw new Error(`Failed to fetch year ${year}: ${r.status}`);
            return r.json() as Promise<UneAnalysis>;
        })
        .then(data => {
            cache.set(year, data);
            inflight.delete(year);
            return data;
        })
        .catch(err => {
            inflight.delete(year);
            throw err;
        });

    inflight.set(year, promise);
    return promise;
};

/** Warm the cache without subscribing to the data — useful on hover/focus. */
export function prefetchYearAnalysis(year: number): void {
    if (cache.has(year) || inflight.has(year)) return;
    fetchYear(year).catch(() => {/* silent */});
}

/**
 * Imperative getter for one year's analysis. Returns the cached value if
 * present, otherwise kicks off a fetch (deduplicated via the inflight map)
 * and returns its promise. Used by the all-years aggregator hook so it
 * shares the same cache as the per-year hook.
 */
export function getYearAnalysis(year: number): Promise<UneAnalysis> {
    return fetchYear(year);
}

export default function useYearAnalysis(selectedYear: number) {
    // Synchronous initial state when cache is warm — avoids a render with null data
    const [data, setData] = useState<UneAnalysis | null>(() => cache.get(selectedYear) ?? null);
    const [loading, setLoading] = useState(() => !cache.has(selectedYear));

    useEffect(() => {
        const cached = cache.get(selectedYear);
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetchYear(selectedYear)
            .then(d => {
                if (!cancelled) setData(d);
            })
            .catch(err => {
                if (!cancelled) console.error(err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        // Don't abort the underlying fetch — see the comment on fetchYear.
        // We just ignore the result if the consumer unmounted/changed year.
        return () => {
            cancelled = true;
        };
    }, [selectedYear]);

    return {data, loading};
}
