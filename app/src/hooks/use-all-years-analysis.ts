import {useEffect, useMemo, useState} from 'react';
import {AVAILABLE_YEARS} from '@/src/lib/constants.ts';
import type {AffectedZone, BlockAnalysis, ThermalPlantStats, UneAnalysis} from '@/src/lib/types.ts';
import {getYearAnalysis} from './use-year-analysis.ts';

// ─────────────────────────────────────────────────────────────────────────
// Aggregate type — everything the historical view needs in one shape
// ─────────────────────────────────────────────────────────────────────────

export interface YearSummary {
    year: number;
    totalMessages: number;
    totalReactions: number;
    totalViews: number;
    totalSenFailures: number;
    totalEstimatedDowntimeSeconds: number;
    healthScore: number | null;
    criticalEvents: number;
    highEvents: number;
    longestCleanStreakDays: number;
}

export interface AllYearsAggregate {
    yearsAnalyzed: number[];                                    // sorted asc
    totalMessages: number;
    totalReactions: number;
    totalViews: number;
    totalSenFailures: number;
    totalEstimatedDowntimeSeconds: number;
    perYear: YearSummary[];

    // Year-level extremes
    bestYear: YearSummary | null;                               // highest health score
    worstYear: YearSummary | null;                              // lowest health score
    yearWithMostMessages: YearSummary | null;
    yearWithMostFailures: YearSummary | null;
    yearWithLongestStreak: YearSummary | null;

    // All-time records (cross-year)
    worstDayEver: {date: string; year: number; criticalEvents: number; highEvents: number} | null;
    longestBlackoutEver: {seconds: number; year: number; startDate: string} | null;
    longestStreakEver: {days: number; year: number; start: string; end: string} | null;

    // Cumulative entity rankings
    topBlock: {number: number; totalSeconds: number} | null;
    topMunicipality: {name: string; affectations: number} | null;
    topProvince: {name: string; mentions: number} | null;
    topThermalUnit: {plant: string; mentions: number; failures: number} | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers — extract a single-year summary
// ─────────────────────────────────────────────────────────────────────────

function summarizeYear(year: number, d: UneAnalysis): YearSummary {
    const blocks = d.blocks_analysis ?? [];
    const summed = blocks.reduce(
        (s: number, b: BlockAnalysis) => s + (b.estimated_affected_seconds ?? 0),
        0
    );
    // Correction: blocks rotate the cuts across the population. Each block
    // represents ~1/N of households, so summing every block's downtime
    // double-counts (Block 1 being off and Block 2 being off rarely affect
    // the *same* household). The mean across blocks is the closest estimate
    // of "what the typical household lived through" — which is the figure we
    // surface in the narrative and the hero stat.
    const typicalHouseholdSeconds = blocks.length > 0 ? summed / blocks.length : 0;
    return {
        year,
        totalMessages: d.total_messages ?? 0,
        totalReactions: d.total_reactions ?? 0,
        totalViews: d.total_views ?? 0,
        totalSenFailures: d.sen_analysis?.total_failure_events ?? 0,
        totalEstimatedDowntimeSeconds: typicalHouseholdSeconds,
        healthScore: d.health_score ?? null,
        criticalEvents: d.worst_day?.critical_events ?? 0,
        highEvents: d.worst_day?.high_events ?? 0,
        longestCleanStreakDays: d.year_records?.longest_clean_streak_days ?? 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────
// Main aggregator
// ─────────────────────────────────────────────────────────────────────────

function buildAggregate(byYear: Record<number, UneAnalysis>): AllYearsAggregate {
    const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

    const perYear: YearSummary[] = years.map(y => summarizeYear(y, byYear[y]));

    const sum = (key: keyof YearSummary) =>
        perYear.reduce((s, y) => s + (typeof y[key] === 'number' ? (y[key] as number) : 0), 0);

    const totalMessages = sum('totalMessages');
    const totalReactions = sum('totalReactions');
    const totalViews = sum('totalViews');
    const totalSenFailures = sum('totalSenFailures');
    const totalEstimatedDowntimeSeconds = sum('totalEstimatedDowntimeSeconds');

    // Year-level extremes
    const yearsWithHealth = perYear.filter(y => y.healthScore != null);
    const bestYear = yearsWithHealth.length
        ? yearsWithHealth.reduce((a, b) => (a.healthScore! >= b.healthScore! ? a : b))
        : null;
    const worstYear = yearsWithHealth.length
        ? yearsWithHealth.reduce((a, b) => (a.healthScore! <= b.healthScore! ? a : b))
        : null;
    const yearWithMostMessages = perYear.length
        ? perYear.reduce((a, b) => (a.totalMessages >= b.totalMessages ? a : b))
        : null;
    const yearWithMostFailures = perYear.length
        ? perYear.reduce((a, b) => (a.totalSenFailures >= b.totalSenFailures ? a : b))
        : null;
    const yearWithLongestStreak = perYear.length
        ? perYear.reduce((a, b) => (a.longestCleanStreakDays >= b.longestCleanStreakDays ? a : b))
        : null;

    // Worst day across all years
    let worstDayEver: AllYearsAggregate['worstDayEver'] = null;
    for (const y of years) {
        const w = byYear[y].worst_day;
        if (!w) continue;
        const score = (w.critical_events ?? 0) * 3 + (w.high_events ?? 0);
        const prev = worstDayEver
            ? worstDayEver.criticalEvents * 3 + worstDayEver.highEvents
            : -1;
        if (score > prev) {
            worstDayEver = {
                date: w.date,
                year: y,
                criticalEvents: w.critical_events ?? 0,
                highEvents: w.high_events ?? 0,
            };
        }
    }

    // Longest single SEN blackout across all years
    let longestBlackoutEver: AllYearsAggregate['longestBlackoutEver'] = null;
    for (const y of years) {
        for (const ev of byYear[y].sen_analysis?.failure_events ?? []) {
            const sec = ev.estimated_duration_seconds ?? 0;
            if (sec > 0 && (longestBlackoutEver == null || sec > longestBlackoutEver.seconds)) {
                longestBlackoutEver = {seconds: sec, year: y, startDate: ev.start_date};
            }
        }
    }

    // Longest clean streak across years
    let longestStreakEver: AllYearsAggregate['longestStreakEver'] = null;
    for (const y of years) {
        const r = byYear[y].year_records;
        if (!r || (r.longest_clean_streak_days ?? 0) <= 0) continue;
        if (longestStreakEver == null || r.longest_clean_streak_days > longestStreakEver.days) {
            longestStreakEver = {
                days: r.longest_clean_streak_days,
                year: y,
                start: r.longest_clean_streak_start ?? '',
                end: r.longest_clean_streak_end ?? '',
            };
        }
    }

    // Most affected block (sum of estimated_affected_seconds across years)
    const blockTotals = new Map<number, number>();
    for (const y of years) {
        for (const b of byYear[y].blocks_analysis ?? []) {
            blockTotals.set(b.number, (blockTotals.get(b.number) ?? 0) + (b.estimated_affected_seconds ?? 0));
        }
    }
    let topBlock: AllYearsAggregate['topBlock'] = null;
    for (const [num, sec] of blockTotals.entries()) {
        if (topBlock == null || sec > topBlock.totalSeconds) {
            topBlock = {number: num, totalSeconds: sec};
        }
    }

    // Most affected municipality / province (cumulative mentions+affectations)
    const muniTotals = new Map<string, number>();
    const provTotals = new Map<string, number>();
    for (const y of years) {
        for (const z of (byYear[y].affected_zones ?? []) as AffectedZone[]) {
            if (z.kind === 'municipality') {
                muniTotals.set(z.name, (muniTotals.get(z.name) ?? 0) + (z.affectations ?? 0));
            } else if (z.kind === 'province') {
                provTotals.set(z.name, (provTotals.get(z.name) ?? 0) + (z.mentions ?? 0));
            }
        }
    }
    let topMunicipality: AllYearsAggregate['topMunicipality'] = null;
    for (const [name, n] of muniTotals.entries()) {
        if (topMunicipality == null || n > topMunicipality.affectations) {
            topMunicipality = {name, affectations: n};
        }
    }
    let topProvince: AllYearsAggregate['topProvince'] = null;
    for (const [name, n] of provTotals.entries()) {
        if (topProvince == null || n > topProvince.mentions) {
            topProvince = {name, mentions: n};
        }
    }

    // Most mentioned thermal plant across years (sum of mentions + failures)
    const plantTotals = new Map<string, {plant: string; mentions: number; failures: number}>();
    for (const y of years) {
        for (const u of (byYear[y].thermal_units ?? []) as ThermalPlantStats[]) {
            const prev = plantTotals.get(u.canonical) ?? {plant: u.canonical, mentions: 0, failures: 0};
            plantTotals.set(u.canonical, {
                plant: u.canonical,
                mentions: prev.mentions + (u.mentions ?? 0),
                failures: prev.failures + (u.failures ?? 0),
            });
        }
    }
    let topThermalUnit: AllYearsAggregate['topThermalUnit'] = null;
    for (const v of plantTotals.values()) {
        if (topThermalUnit == null || v.mentions > topThermalUnit.mentions) {
            topThermalUnit = v;
        }
    }

    return {
        yearsAnalyzed: years,
        totalMessages,
        totalReactions,
        totalViews,
        totalSenFailures,
        totalEstimatedDowntimeSeconds,
        perYear,
        bestYear,
        worstYear,
        yearWithMostMessages,
        yearWithMostFailures,
        yearWithLongestStreak,
        worstDayEver,
        longestBlackoutEver,
        longestStreakEver,
        topBlock,
        topMunicipality,
        topProvince,
        topThermalUnit,
    };
}

// ─────────────────────────────────────────────────────────────────────────
// The hook
// ─────────────────────────────────────────────────────────────────────────

interface State {
    byYear: Record<number, UneAnalysis> | null;
    loading: boolean;
    loaded: number;     // years already resolved (success or fail)
    total: number;      // total years being fetched
}

export default function useAllYearsAnalysis() {
    const [state, setState] = useState<State>({
        byYear: null,
        loading: true,
        loaded: 0,
        total: AVAILABLE_YEARS.length,
    });

    useEffect(() => {
        let cancelled = false;
        let loadedSoFar = 0;

        // Load all available years in parallel — small JSONs (~13 KB gz each).
        // Each promise bumps the loaded counter so the UI can show a real
        // progress bar while files arrive.
        const yearPromises = AVAILABLE_YEARS.map(year => {
            const tick = () => {
                if (cancelled) return;
                loadedSoFar += 1;
                setState(s => ({...s, loaded: loadedSoFar}));
            };
            return getYearAnalysis(year)
                .then<[number, UneAnalysis | null]>(d => {
                    tick();
                    return [year, d];
                })
                .catch<[number, UneAnalysis | null]>(() => {
                    tick();
                    return [year, null];
                });
        });

        Promise.all(yearPromises).then(results => {
            if (cancelled) return;
            const byYear: Record<number, UneAnalysis> = {};
            for (const [year, data] of results) {
                if (data) byYear[year] = data;
            }
            setState(s => ({...s, byYear, loading: false}));
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const aggregate = useMemo(
        () => (state.byYear ? buildAggregate(state.byYear) : null),
        [state.byYear]
    );

    return {
        aggregate,
        loading: state.loading,
        loaded: state.loaded,
        total: state.total,
    };
}
