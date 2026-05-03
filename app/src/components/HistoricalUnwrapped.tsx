import React, {memo, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {AnimatePresence, m} from 'framer-motion';
import {
    Activity,
    Award,
    Building2,
    ChevronRight,
    Crown,
    Factory,
    History,
    Layers,
    Leaf,
    Loader2,
    MapPinned,
    MessageSquare,
    Minus,
    Scale,
    Skull,
    Sparkles,
    Timer,
    TrendingDown,
    TrendingUp,
    Trophy,
    X,
    Zap,
} from 'lucide-react';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';
import useAllYearsAnalysis, {type AllYearsAggregate, type YearSummary} from '@/src/hooks/use-all-years-analysis.ts';
import {formatNumber} from '@/src/lib/utils.ts';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const compactDuration = (sec: number): string => {
    if (sec <= 0) return '0';
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    if (days >= 1) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    if (hours >= 1) return `${hours}h`;
    return `${Math.max(1, Math.floor(sec / 60))}m`;
};

const formatDateLong = (s: string | undefined | null): string => {
    if (!s) return '—';
    try {
        return new Date(s).toLocaleDateString('es-CU', {day: '2-digit', month: 'long', year: 'numeric'}).toUpperCase();
    } catch {
        return s;
    }
};

// ─────────────────────────────────────────────────────────────────────────
// Skeleton loader — shown while years are still being fetched
// ─────────────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{className?: string; delay?: number}> = ({className = '', delay = 0}) => (
    <m.div
        animate={{opacity: [0.55, 0.95, 0.55]}}
        transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay}}
        className={`bg-gray-300 border-4 border-black ${className}`}
    />
);

const HistoricalSkeleton: React.FC<{loaded: number; total: number}> = ({loaded, total}) => {
    const pct = total > 0 ? Math.min(100, (loaded / total) * 100) : 0;
    return (
        <div className="space-y-6">
            {/* Progress header */}
            <div className="border-4 border-black bg-violet-100 text-black p-4 shadow-[5px_5px_0px_0px_black] flex items-center gap-4">
                <m.div
                    animate={{rotate: 360}}
                    transition={{duration: 1, repeat: Infinity, ease: 'linear'}}
                    className="flex-shrink-0 text-violet-700"
                >
                    <Loader2 size={28} strokeWidth={3}/>
                </m.div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-violet-900">
                        Descargando histórico
                    </div>
                    <div className="font-black text-xl italic mt-0.5 leading-none text-black">
                        <AnimatedCounter value={loaded}/> <span className="text-violet-700">/ {total}</span> años cargados
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-3 border-2 border-black bg-white shadow-[2px_2px_0_0_black] overflow-hidden relative">
                        <m.div
                            animate={{width: `${pct}%`}}
                            transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
                            className="h-full bg-violet-600 relative"
                        >
                            {/* Leading edge pulse */}
                            <m.div
                                className="absolute right-0 top-0 bottom-0 w-1 bg-white/80"
                                animate={{opacity: [1, 0.3, 1]}}
                                transition={{duration: 0.9, repeat: Infinity}}
                            />
                        </m.div>
                    </div>
                </div>
                <div className="font-mono text-2xl font-black italic text-violet-900 tabular-nums">
                    {Math.round(pct)}%
                </div>
            </div>

            {/* Hero stats placeholder (4 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[0, 1, 2, 3].map(i => (
                    <SkeletonBlock key={i} className="h-28 shadow-[5px_5px_0px_0px_black]" delay={i * 0.1}/>
                ))}
            </div>

            {/* Best vs worst placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonBlock className="h-44 shadow-[8px_8px_0px_0px_black]" delay={0.4}/>
                <SkeletonBlock className="h-44 shadow-[8px_8px_0px_0px_black]" delay={0.5}/>
            </div>

            {/* Year strip placeholder */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map(i => (
                    <SkeletonBlock key={i} className="h-24 shadow-[5px_5px_0px_0px_black]" delay={0.6 + i * 0.05}/>
                ))}
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonBlock className="h-40 shadow-[4px_4px_0px_0px_black]" delay={0.85}/>
                <SkeletonBlock className="h-40 shadow-[4px_4px_0px_0px_black]" delay={0.9}/>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// YearTile — compact per-year card with delta from previous year
// ─────────────────────────────────────────────────────────────────────────

// Maps a 0-100 health score to a neobrutalist color band.
const scoreBarColor = (score: number): string => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-lime-400';
    if (score >= 35) return 'bg-yellow-400';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
};

const YearTile: React.FC<{
    summary: YearSummary;
    prev: YearSummary | undefined;
    highlight: 'best' | 'worst' | null;
    idx: number;
}> = memo(({summary, prev, highlight, idx}) => {
    const bg = highlight === 'best'
        ? 'bg-emerald-300'
        : highlight === 'worst'
            ? 'bg-red-300'
            : 'bg-violet-100';

    // Year-over-year health score change
    const delta = (summary.healthScore != null && prev?.healthScore != null)
        ? summary.healthScore - prev.healthScore
        : null;
    const DeltaIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    const deltaBg = delta == null
        ? 'bg-gray-300 text-gray-800'
        : delta > 5 ? 'bg-emerald-400 text-emerald-950'
        : delta > 0 ? 'bg-lime-300 text-lime-950'
        : delta < -5 ? 'bg-red-500 text-white'
        : delta < 0 ? 'bg-orange-400 text-orange-950'
        : 'bg-gray-300 text-gray-800';

    const score = summary.healthScore;

    return (
        <m.div
            initial={{opacity: 0, y: 16, rotate: -2}}
            animate={{opacity: 1, y: 0, rotate: 0}}
            transition={{delay: 0.04 * idx, type: 'spring', stiffness: 220, damping: 22}}
            whileHover={{y: -3, rotate: idx % 2 === 0 ? -1.5 : 1.5}}
            className={`relative ${bg} text-black border-4 border-black p-3 shadow-[5px_5px_0px_0px_black] hover:shadow-[8px_8px_0px_0px_black] transition-shadow cursor-default`}
        >
            {highlight && (
                <m.div
                    initial={{rotate: -8, scale: 0}}
                    animate={{rotate: 6, scale: 1}}
                    transition={{delay: 0.04 * idx + 0.3, type: 'spring', stiffness: 320, damping: 16}}
                    className={`absolute -top-2 -right-2 ${highlight === 'best' ? 'bg-emerald-600' : 'bg-red-600'} text-white border-2 border-black text-[9px] font-black uppercase px-1.5 py-0.5 shadow-[2px_2px_0px_0px_black] z-10`}
                >
                    {highlight === 'best' ? 'MEJOR' : 'PEOR'}
                </m.div>
            )}

            {/* Year + delta */}
            <div className="flex items-start justify-between gap-1">
                <div className="font-black text-3xl italic leading-none tracking-tighter text-black">{summary.year}</div>
                {delta != null && (
                    <div className={`${deltaBg} border-2 border-black px-1.5 py-0.5 flex items-center gap-0.5 shadow-[2px_2px_0_0_black] text-[10px] font-black tabular-nums`}>
                        <DeltaIcon size={10} strokeWidth={3}/>
                        {delta > 0 ? '+' : ''}{delta}
                    </div>
                )}
            </div>

            {/* Health score bar visualization */}
            {score != null && (
                <div className="mt-3">
                    <div className="flex items-baseline justify-between text-[9px] font-mono uppercase tracking-widest mb-1">
                        <span className="font-black text-gray-700">Health</span>
                        <span className="font-black tabular-nums text-[12px] text-black not-italic">
                            {score}<span className="text-gray-600 text-[9px]">/100</span>
                        </span>
                    </div>
                    <div className="h-2.5 border-2 border-black bg-white shadow-[2px_2px_0_0_black] overflow-hidden">
                        <m.div
                            initial={{width: 0}}
                            animate={{width: `${Math.max(2, score)}%`}}
                            transition={{delay: 0.04 * idx + 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                            className={`h-full ${scoreBarColor(score)}`}
                        />
                    </div>
                </div>
            )}

            {/* Mini stats with icons */}
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono">
                <div className="flex items-center gap-1.5">
                    <MessageSquare size={11} strokeWidth={3} className="flex-shrink-0 text-gray-700"/>
                    <span className="font-black tabular-nums text-[11px] text-black truncate">
                        {formatNumber(summary.totalMessages)}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Zap size={11} strokeWidth={3} className={`flex-shrink-0 ${summary.totalSenFailures > 0 ? 'text-red-700' : 'text-gray-700'}`}/>
                    <span className={`font-black tabular-nums text-[11px] ${summary.totalSenFailures > 0 ? 'text-red-800' : 'text-gray-700'}`}>
                        {summary.totalSenFailures} <span className="text-[8px] opacity-70">SEN</span>
                    </span>
                </div>
            </div>
        </m.div>
    );
});
YearTile.displayName = 'YearTile';

// ─────────────────────────────────────────────────────────────────────────
// Trajectory section — shows year-over-year arrows
// ─────────────────────────────────────────────────────────────────────────

const TrajectorySection: React.FC<{perYear: YearSummary[]}> = memo(({perYear}) => {
    if (perYear.length < 2) return null;

    const yearsWithScore = perYear.filter(y => y.healthScore != null);
    const avgScore = yearsWithScore.length
        ? yearsWithScore.reduce((s, y) => s + (y.healthScore ?? 0), 0) / yearsWithScore.length
        : null;

    return (
        <div className="border-4 border-black bg-gray-100 text-black p-4 md:p-6 shadow-[5px_5px_0px_0px_black]">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-1.5">
                    <m.span
                        animate={{rotate: [0, -8, 8, 0], scale: [1, 1.15, 1]}}
                        transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5}}
                        className="inline-block"
                    >
                        <Activity size={13} strokeWidth={3}/>
                    </m.span>
                    Trayectoria del Health Score
                </div>
                {avgScore != null && (
                    <div className="text-[10px] font-mono text-gray-800 flex items-center gap-1.5">
                        <span className="uppercase tracking-widest">Promedio</span>
                        <span className={`font-black tabular-nums px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_0_black] ${scoreBarColor(avgScore)} text-black text-[11px]`}>
                            {avgScore.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Polaroid timeline: year cards connected by delta arrows */}
            <div className="flex items-stretch justify-between gap-1 md:gap-2 px-1">
                {perYear.map((y, i) => {
                    const score = y.healthScore;
                    const next = i < perYear.length - 1 ? perYear[i + 1] : null;
                    const delta = (next && score != null && next.healthScore != null)
                        ? next.healthScore - score
                        : null;

                    const tilt = i % 2 === 0 ? -1.5 : 1.5;
                    const cardBg = score != null ? scoreBarColor(score) : 'bg-gray-300';

                    const DeltaIcon = delta == null ? Minus
                        : delta > 0 ? TrendingUp
                        : delta < 0 ? TrendingDown : Minus;
                    const deltaCls = delta == null ? 'bg-gray-300 text-gray-800'
                        : delta > 5 ? 'bg-emerald-400 text-emerald-950'
                        : delta > 0 ? 'bg-lime-300 text-lime-950'
                        : delta < -5 ? 'bg-red-500 text-white'
                        : delta < 0 ? 'bg-orange-400 text-orange-950'
                        : 'bg-gray-300 text-gray-800';

                    return (
                        <React.Fragment key={y.year}>
                            {/* Polaroid year card */}
                            <m.div
                                initial={{opacity: 0, y: 24, rotate: tilt - 8}}
                                animate={{opacity: 1, y: 0, rotate: tilt}}
                                transition={{delay: 0.07 * i, type: 'spring', stiffness: 260, damping: 20}}
                                whileHover={{rotate: 0, y: -4, scale: 1.06}}
                                className={`${cardBg} text-black border-4 border-black shadow-[4px_4px_0_0_black] flex flex-col items-center justify-between flex-1 min-w-0 px-1.5 md:px-2 py-2.5 md:py-3 cursor-default`}
                            >
                                <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-widest font-black opacity-80 leading-none">
                                    AÑO
                                </div>
                                <div className="font-black text-lg md:text-xl italic leading-none tracking-tighter mt-0.5">
                                    {y.year}
                                </div>
                                <div className="border-t-2 border-black/40 w-full my-1.5"/>
                                <div className="font-black text-2xl md:text-3xl italic tabular-nums leading-none tracking-tighter">
                                    {score ?? '—'}
                                </div>
                                <div className="text-[8px] md:text-[9px] font-mono opacity-70 leading-none mt-0.5">
                                    /100
                                </div>
                            </m.div>

                            {/* Arrow + delta between cards */}
                            {i < perYear.length - 1 && (
                                <m.div
                                    initial={{opacity: 0, scale: 0}}
                                    animate={{opacity: 1, scale: 1}}
                                    transition={{delay: 0.07 * i + 0.25, type: 'spring', stiffness: 300, damping: 18}}
                                    className="flex flex-col items-center justify-center gap-1 flex-shrink-0 self-center"
                                >
                                    <m.div
                                        animate={{x: [0, 3, 0]}}
                                        transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15}}
                                        className="text-black"
                                    >
                                        <ChevronRight size={20} strokeWidth={3}/>
                                    </m.div>
                                    {delta != null && (
                                        <div className={`${deltaCls} border-2 border-black px-1.5 py-0.5 flex items-center gap-0.5 shadow-[2px_2px_0_0_black] text-[9px] md:text-[10px] font-black tabular-nums whitespace-nowrap`}>
                                            <DeltaIcon size={10} strokeWidth={3}/>
                                            {delta > 0 ? '+' : ''}{delta}
                                        </div>
                                    )}
                                </m.div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
});
TrajectorySection.displayName = 'TrajectorySection';

// ─────────────────────────────────────────────────────────────────────────
// Narrative summary — fun "equivalente a..." card
// ─────────────────────────────────────────────────────────────────────────

const NarrativeSummary: React.FC<{aggregate: AllYearsAggregate}> = memo(({aggregate}) => {
    const totalSec = aggregate.totalEstimatedDowntimeSeconds;
    const totalDays = totalSec / 86400;
    const equivalentYears = totalDays / 365.25;
    const equivalentMonths = totalDays / 30;

    // Picks the most concrete equivalent for the typical household figure.
    const equivText = (() => {
        if (equivalentYears >= 1) return `casi ${equivalentYears.toFixed(1)} años humanos sin luz`;
        if (totalDays >= 30) return `casi ${Math.round(equivalentMonths)} meses humanos sin luz`;
        return `unos ${Math.round(totalDays)} días sin luz`;
    })();

    // Year-over-year: compare the latest year against the prior one (downtime).
    const yoyDowntime = (() => {
        const yrs = aggregate.perYear;
        if (yrs.length < 2) return null;
        const last = yrs[yrs.length - 1];
        const prev = yrs[yrs.length - 2];
        if (prev.totalEstimatedDowntimeSeconds <= 0) return null;
        const pct = ((last.totalEstimatedDowntimeSeconds - prev.totalEstimatedDowntimeSeconds) / prev.totalEstimatedDowntimeSeconds) * 100;
        return {
            pct,
            lastYear: last.year,
            prevYear: prev.year,
            isWorse: pct > 0,
        };
    })();

    // Worst/Best ratio — shows just how lopsided the spread of years is.
    const ratio = (() => {
        if (!aggregate.bestYear || !aggregate.worstYear) return null;
        if (aggregate.bestYear.year === aggregate.worstYear.year) return null;
        const best = aggregate.bestYear.totalEstimatedDowntimeSeconds;
        const worst = aggregate.worstYear.totalEstimatedDowntimeSeconds;
        if (best <= 0) return null;
        return {
            multiplier: worst / best,
            bestYear: aggregate.bestYear.year,
            worstYear: aggregate.worstYear.year,
        };
    })();

    // Health-score trajectory: first vs last reported year.
    const healthTrend = (() => {
        const yrs = aggregate.perYear.filter(y => y.healthScore != null);
        if (yrs.length < 2) return null;
        const first = yrs[0];
        const last = yrs[yrs.length - 1];
        const delta = last.healthScore! - first.healthScore!;
        return {
            firstYear: first.year,
            lastYear: last.year,
            firstScore: first.healthScore!,
            lastScore: last.healthScore!,
            delta,
            verdict: Math.abs(delta) < 5
                ? 'estable'
                : delta > 0 ? 'mejorando' : 'empeorando',
        };
    })();

    // Total messages YoY delta — supplemental ruido del canal.
    const yoyMessages = (() => {
        const yrs = aggregate.perYear;
        if (yrs.length < 2) return null;
        const last = yrs[yrs.length - 1];
        const prev = yrs[yrs.length - 2];
        if (prev.totalMessages <= 0) return null;
        const pct = ((last.totalMessages - prev.totalMessages) / prev.totalMessages) * 100;
        return {pct, lastYear: last.year, prevYear: prev.year};
    })();

    return (
        <m.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.4, type: 'spring', stiffness: 200, damping: 20}}
            whileHover={{y: -2}}
            className="bg-black text-white border-4 border-black p-5 md:p-7 shadow-[8px_8px_0px_0px_black] hover:shadow-[12px_12px_0px_0px_black] transition-shadow relative overflow-hidden cursor-default"
        >
            {/* Decorative animated stripes */}
            <m.div
                className="absolute inset-0 pointer-events-none opacity-[0.07]"
                style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #fff 8px, #fff 10px)'}}
                animate={{backgroundPositionX: ['0px', '18px']}}
                transition={{duration: 6, repeat: Infinity, ease: 'linear'}}
            />

            <div className="relative space-y-5">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <m.span
                        animate={{rotate: [0, 12, -12, 0], scale: [1, 1.15, 1]}}
                        transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1}}
                        className="inline-block text-yellow-300"
                    >
                        <Sparkles size={14} strokeWidth={3}/>
                    </m.span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-yellow-200">
                        Resumen narrativo
                    </span>
                    <div className="flex-1 border-t-2 border-dashed border-white/30 ml-2"/>
                </div>

                {/* Headline stat */}
                <p className="font-bold text-base md:text-xl leading-relaxed">
                    En{' '}
                    <span className="text-yellow-300 font-black">
                        {aggregate.yearsAnalyzed.length} años
                    </span>{' '}
                    {aggregate.yearsAnalyzed.length === 1 ? 'analizado' : 'analizados'}, el habitante promedio aguantó{' '}
                    <m.span
                        whileHover={{scale: 1.04}}
                        className="inline-block bg-orange-400 text-black font-black italic px-2 py-0.5 border-2 border-black shadow-[3px_3px_0_0_white] mx-1"
                    >
                        {compactDuration(totalSec)}
                    </m.span>{' '}
                    sin servicio en bloques —{' '}
                    <span className="text-orange-200 font-black italic underline decoration-orange-300/60 decoration-2 underline-offset-4">
                        {equivText}
                    </span>.
                </p>

                {/* YoY downtime comparison */}
                {yoyDowntime && (
                    <m.div
                        initial={{opacity: 0, x: -10}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: 0.55}}
                        className="flex items-start gap-3 border-l-4 border-yellow-300 pl-3"
                    >
                        <m.span
                            animate={{y: yoyDowntime.isWorse ? [0, -3, 0] : [0, 3, 0]}}
                            transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut'}}
                            className={`inline-block flex-shrink-0 mt-1 ${yoyDowntime.isWorse ? 'text-red-300' : 'text-emerald-300'}`}
                        >
                            {yoyDowntime.isWorse
                                ? <TrendingUp size={18} strokeWidth={3}/>
                                : <TrendingDown size={18} strokeWidth={3}/>}
                        </m.span>
                        <p className="font-bold text-sm md:text-base leading-relaxed">
                            <span className="text-cyan-300 font-black">{yoyDowntime.lastYear}</span>{' '}
                            vs <span className="text-white/70">{yoyDowntime.prevYear}</span>:{' '}
                            <span className={`font-black italic px-1.5 py-0.5 border-2 border-black ${yoyDowntime.isWorse ? 'bg-red-500 text-white' : 'bg-emerald-400 text-black'}`}>
                                {yoyDowntime.pct > 0 ? '+' : ''}{yoyDowntime.pct.toFixed(0)}%
                            </span>{' '}
                            de tiempo sin servicio{' '}
                            {yoyDowntime.isWorse
                                ? <span className="text-red-300 font-black">(peor)</span>
                                : <span className="text-emerald-300 font-black">(mejor)</span>}.
                        </p>
                    </m.div>
                )}

                {/* Best vs Worst ratio */}
                {ratio && ratio.multiplier > 1 && (
                    <m.div
                        initial={{opacity: 0, x: -10}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: 0.65}}
                        className="flex items-start gap-3 border-l-4 border-red-400 pl-3"
                    >
                        <Skull size={18} strokeWidth={3} className="text-red-300 flex-shrink-0 mt-1"/>
                        <p className="font-bold text-sm md:text-base leading-relaxed">
                            El año{' '}
                            <span className="text-red-300 font-black">{ratio.worstYear}</span>{' '}
                            fue{' '}
                            <span className="bg-red-500 text-white font-black italic px-1.5 py-0.5 border-2 border-black">
                                ~{ratio.multiplier.toFixed(1)}× peor
                            </span>{' '}
                            que el año{' '}
                            <span className="text-emerald-300 font-black">{ratio.bestYear}</span>{' '}
                            en horas sin luz.
                        </p>
                    </m.div>
                )}

                {/* Health score trend */}
                {healthTrend && (
                    <m.div
                        initial={{opacity: 0, x: -10}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: 0.75}}
                        className={`flex items-start gap-3 border-l-4 ${healthTrend.delta < -5 ? 'border-red-400' : healthTrend.delta > 5 ? 'border-emerald-400' : 'border-yellow-300'} pl-3`}
                    >
                        <Activity size={18} strokeWidth={3} className={`flex-shrink-0 mt-1 ${healthTrend.delta < -5 ? 'text-red-300' : healthTrend.delta > 5 ? 'text-emerald-300' : 'text-yellow-300'}`}/>
                        <p className="font-bold text-sm md:text-base leading-relaxed">
                            Health Score: de{' '}
                            <span className="text-yellow-300 font-black tabular-nums">{healthTrend.firstScore}</span>
                            <span className="text-white/60 text-xs">/100</span>{' '}
                            en {healthTrend.firstYear} a{' '}
                            <span className={`font-black tabular-nums ${healthTrend.delta < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{healthTrend.lastScore}</span>
                            <span className="text-white/60 text-xs">/100</span>{' '}
                            en {healthTrend.lastYear}{' '}
                            <span className={`font-black italic px-1.5 py-0.5 border-2 border-black ${healthTrend.delta < -5 ? 'bg-red-500 text-white' : healthTrend.delta > 5 ? 'bg-emerald-400 text-black' : 'bg-yellow-300 text-black'}`}>
                                {healthTrend.delta > 0 ? '+' : ''}{healthTrend.delta} pts
                            </span>{' '}
                            <span className="text-white/70">({healthTrend.verdict})</span>.
                        </p>
                    </m.div>
                )}

                {/* SEN + ruido foot */}
                <m.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.85}}
                    className="pt-3 border-t-2 border-dashed border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm"
                >
                    <div className="font-bold leading-relaxed">
                        <span className="text-red-300 font-black tabular-nums">
                            {aggregate.totalSenFailures}
                        </span>{' '}
                        <span className="text-white/80">
                            {aggregate.totalSenFailures === 1 ? 'desconexión total' : 'desconexiones totales'} del SEN
                        </span>
                    </div>
                    <div className="font-bold leading-relaxed">
                        <span className="text-blue-300 font-black tabular-nums">
                            {formatNumber(aggregate.totalMessages)}
                        </span>{' '}
                        <span className="text-white/80">mensajes oficiales</span>
                        {yoyMessages && (
                            <span className={`ml-1 text-[11px] font-black tabular-nums ${yoyMessages.pct > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                                ({yoyMessages.pct > 0 ? '+' : ''}{yoyMessages.pct.toFixed(0)}% YoY)
                            </span>
                        )}
                    </div>
                </m.div>
            </div>
        </m.div>
    );
});
NarrativeSummary.displayName = 'NarrativeSummary';

// ─────────────────────────────────────────────────────────────────────────
// Trend chart — simple SVG bars
// ─────────────────────────────────────────────────────────────────────────

interface TrendChartProps {
    perYear: YearSummary[];
    metric: keyof YearSummary;
    color: string;
    label: string;
}

const TrendChart: React.FC<TrendChartProps> = memo(({perYear, metric, color, label}) => {
    const values = perYear.map(y => Number(y[metric] ?? 0));
    const max = Math.max(1, ...values);
    return (
        <div className="border-4 border-black bg-gray-100 text-black p-4 shadow-[4px_4px_0px_0px_black]">
            <div className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3">{label}</div>
            <div className="flex items-end gap-2 h-32">
                {perYear.map((y, i) => {
                    const v = Number(y[metric] ?? 0);
                    const h = max === 0 ? 0 : (v / max) * 100;
                    return (
                        <div key={y.year} className="flex-1 flex flex-col items-center gap-1 h-full">
                            <div className="flex-1 w-full flex items-end relative">
                                <m.div
                                    initial={{height: 0}}
                                    animate={{height: `${h}%`}}
                                    transition={{delay: 0.06 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
                                    className={`w-full ${color} border-2 border-black relative group cursor-default`}
                                >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] font-black px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
                                        {formatNumber(v)}
                                    </div>
                                </m.div>
                            </div>
                            <div className="text-[10px] font-mono font-black text-gray-800">{y.year}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
TrendChart.displayName = 'TrendChart';

// ─────────────────────────────────────────────────────────────────────────
// Records hall of fame
// ─────────────────────────────────────────────────────────────────────────

interface RecordEntry {
    label: string;
    value: string | number;
    sub: string;
    Icon: React.FC<{size?: number; strokeWidth?: number; className?: string}>;
    bg: string;
    text: string;
    medal: 'gold' | 'silver' | 'bronze' | 'red' | 'green' | 'blue';
}

const MEDAL_BG: Record<string, string> = {
    gold:   'bg-yellow-300',
    silver: 'bg-gray-200',
    bronze: 'bg-amber-700',
    red:    'bg-red-500',
    green:  'bg-green-400',
    blue:   'bg-blue-400',
};
const MEDAL_TEXT: Record<string, string> = {
    gold: 'text-black', silver: 'text-black', bronze: 'text-white',
    red: 'text-white', green: 'text-black', blue: 'text-black',
};

const RecordCard: React.FC<{r: RecordEntry; idx: number}> = memo(({r, idx}) => (
    <m.div
        initial={{opacity: 0, y: 24, rotate: -2}}
        animate={{opacity: 1, y: 0, rotate: 0}}
        transition={{delay: idx * 0.04, type: 'spring', stiffness: 220, damping: 22}}
        whileHover={{y: -4, rotate: idx % 2 === 0 ? -1.5 : 1.5}}
        className="relative group cursor-default"
    >
        <div className={`${r.bg} ${r.text} border-4 border-black p-4 shadow-[5px_5px_0px_0px_black] group-hover:shadow-[8px_8px_0px_0px_black] transition-shadow relative overflow-hidden`}>
            <div className="relative">
                <div className="flex items-center gap-2 mb-3 mt-2">
                    <r.Icon size={16} strokeWidth={3}/>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-90">
                        {r.label}
                    </span>
                </div>
                <div className="font-black text-3xl md:text-4xl italic leading-none mb-2">
                    {typeof r.value === 'number' ? <AnimatedCounter value={r.value}/> : r.value}
                </div>
                <div className="text-[9px] font-mono opacity-80 uppercase tracking-widest truncate">
                    {r.sub}
                </div>
            </div>
        </div>
        <m.div
            initial={{rotate: -8, scale: 0}}
            animate={{rotate: 6, scale: 1}}
            transition={{delay: idx * 0.04 + 0.3, type: 'spring', stiffness: 320, damping: 14}}
            whileHover={{rotate: [-3, 12, -3], scale: 1.15}}
            className={`absolute -top-3 -right-3 ${MEDAL_BG[r.medal]} ${MEDAL_TEXT[r.medal]} border-2 border-black px-2 py-1.5 flex items-center gap-1 shadow-[2px_2px_0px_0px_black] z-20`}
        >
            <Award size={11} strokeWidth={3}/>
            <span className="text-[11px] font-black leading-none italic">#{idx + 1}</span>
        </m.div>
    </m.div>
));
RecordCard.displayName = 'RecordCard';

// ─────────────────────────────────────────────────────────────────────────
// Hero stat block + Year verdict cards
// ─────────────────────────────────────────────────────────────────────────

const HeroStat: React.FC<{label: string; value: number | string; sub?: string; bg: string; Icon: React.FC<{size?: number; strokeWidth?: number; className?: string}>; idx: number}> = memo(({label, value, sub, bg, Icon, idx}) => (
    <m.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.05 * idx, type: 'spring', stiffness: 280, damping: 22}}
        whileHover={{y: -3}}
        className={`${bg} border-4 border-black p-4 shadow-[5px_5px_0px_0px_black] hover:shadow-[8px_8px_0px_0px_black] transition-shadow cursor-default`}
    >
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">
            <m.span
                animate={{rotate: [0, -12, 12, 0]}}
                transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 + idx * 0.2}}
                className="inline-block"
            >
                <Icon size={12} strokeWidth={3}/>
            </m.span>
            {label}
        </div>
        <div className="font-black text-3xl md:text-4xl italic leading-none tracking-tighter">
            {typeof value === 'number' ? <AnimatedCounter value={value}/> : value}
        </div>
        {sub && (
            <div className="text-[9px] font-mono opacity-70 mt-1.5 uppercase tracking-widest">
                {sub}
            </div>
        )}
    </m.div>
));
HeroStat.displayName = 'HeroStat';

const YearVerdictCard: React.FC<{kind: 'best' | 'worst'; summary: YearSummary; idx: number}> = memo(({kind, summary, idx}) => {
    const isBest = kind === 'best';
    const bg = isBest ? 'bg-emerald-500' : 'bg-red-700';
    const accent = isBest ? 'text-emerald-100' : 'text-red-100';
    return (
        <m.div
            initial={{opacity: 0, x: isBest ? -30 : 30}}
            animate={{opacity: 1, x: 0}}
            transition={{delay: 0.08 * idx, type: 'spring', stiffness: 220, damping: 22}}
            whileHover={{y: -4}}
            className={`${bg} text-white border-4 border-black p-5 md:p-6 shadow-[8px_8px_0px_0px_black] hover:shadow-[12px_12px_0px_0px_black] transition-shadow relative overflow-hidden cursor-default`}
        >
            <m.div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #fff 8px, #fff 10px)'}}
                animate={{backgroundPositionX: ['0px', '18px']}}
                transition={{duration: 5, repeat: Infinity, ease: 'linear'}}
            />
            <div className="relative">
                <div className={`text-[10px] font-black uppercase tracking-widest ${accent} flex items-center gap-1.5`}>
                    <m.span
                        animate={{scale: [1, 1.2, 1], rotate: [0, -8, 8, 0]}}
                        transition={{duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5}}
                        className="inline-block"
                    >
                        {isBest ? <Trophy size={12} strokeWidth={3}/> : <Skull size={12} strokeWidth={3}/>}
                    </m.span>
                    {isBest ? 'Mejor año' : 'Peor año'}
                </div>
                <m.div
                    initial={{scale: 0.7, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    transition={{delay: 0.08 * idx + 0.2, type: 'spring', stiffness: 200, damping: 18}}
                    className="font-black text-6xl md:text-7xl italic tracking-tighter leading-none mt-1"
                >
                    {summary.year}
                </m.div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                        <div className="text-[9px] font-mono opacity-70 uppercase">Health Score</div>
                        <div className="font-black text-2xl italic">
                            {summary.healthScore != null
                                ? <><AnimatedCounter value={summary.healthScore}/><span className="text-base opacity-70">/100</span></>
                                : '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] font-mono opacity-70 uppercase">Caídas SEN</div>
                        <div className="font-black text-2xl italic">
                            <AnimatedCounter value={summary.totalSenFailures}/>
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] font-mono opacity-70 uppercase">Mensajes</div>
                        <div className="font-black text-base font-mono">
                            {formatNumber(summary.totalMessages)}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] font-mono opacity-70 uppercase">Tiempo fuera</div>
                        <div className="font-black text-base font-mono">
                            {compactDuration(summary.totalEstimatedDowntimeSeconds)}
                        </div>
                    </div>
                </div>
            </div>
        </m.div>
    );
});
YearVerdictCard.displayName = 'YearVerdictCard';

// ─────────────────────────────────────────────────────────────────────────
// Records builder
// ─────────────────────────────────────────────────────────────────────────

function buildRecords(aggregate: AllYearsAggregate): RecordEntry[] {
    const records: RecordEntry[] = [];

    if (aggregate.worstDayEver) {
        records.push({
            label: 'PEOR DÍA HISTÓRICO',
            value: aggregate.worstDayEver.criticalEvents + aggregate.worstDayEver.highEvents,
            sub: `${formatDateLong(aggregate.worstDayEver.date)} · ${aggregate.worstDayEver.criticalEvents} críticos`,
            Icon: Skull,
            bg: 'bg-red-600',
            text: 'text-white',
            medal: 'red',
        });
    }
    if (aggregate.longestBlackoutEver) {
        records.push({
            label: 'APAGÓN MÁS LARGO',
            value: compactDuration(aggregate.longestBlackoutEver.seconds),
            sub: `${aggregate.longestBlackoutEver.startDate.slice(0, 10)} · desconexión total`,
            Icon: Zap,
            bg: 'bg-black',
            text: 'text-yellow-300',
            medal: 'red',
        });
    }
    if (aggregate.longestStreakEver) {
        records.push({
            label: 'RACHA LIMPIA RÉCORD',
            value: aggregate.longestStreakEver.days,
            sub: `${aggregate.longestStreakEver.start} → ${aggregate.longestStreakEver.end}`,
            Icon: Leaf,
            bg: 'bg-green-400',
            text: 'text-black',
            medal: 'green',
        });
    }
    if (aggregate.yearWithMostFailures && aggregate.yearWithMostFailures.totalSenFailures > 0) {
        records.push({
            label: 'AÑO CON MÁS APAGONES',
            value: aggregate.yearWithMostFailures.totalSenFailures,
            sub: `${aggregate.yearWithMostFailures.year} · caídas totales del SEN`,
            Icon: Skull,
            bg: 'bg-orange-500',
            text: 'text-black',
            medal: 'gold',
        });
    }
    if (aggregate.yearWithMostMessages) {
        records.push({
            label: 'AÑO CON MÁS RUIDO',
            value: aggregate.yearWithMostMessages.totalMessages,
            sub: `${aggregate.yearWithMostMessages.year} · mensajes oficiales`,
            Icon: MessageSquare,
            bg: 'bg-blue-400',
            text: 'text-black',
            medal: 'blue',
        });
    }
    if (aggregate.topBlock && aggregate.topBlock.totalSeconds > 0) {
        records.push({
            label: 'BLOQUE MÁS GOLPEADO',
            value: compactDuration(aggregate.topBlock.totalSeconds),
            sub: `Bloque ${aggregate.topBlock.number} · acumulado histórico`,
            Icon: Layers,
            bg: 'bg-yellow-400',
            text: 'text-black',
            medal: 'silver',
        });
    }
    if (aggregate.topMunicipality) {
        records.push({
            label: 'MUNICIPIO MÁS AFECTADO',
            value: aggregate.topMunicipality.affectations,
            sub: `${aggregate.topMunicipality.name.toUpperCase()} · histórico`,
            Icon: Building2,
            bg: 'bg-rose-400',
            text: 'text-black',
            medal: 'bronze',
        });
    }
    if (aggregate.topProvince) {
        records.push({
            label: 'PROVINCIA TOP',
            value: aggregate.topProvince.mentions,
            sub: aggregate.topProvince.name.toUpperCase(),
            Icon: MapPinned,
            bg: 'bg-cyan-400',
            text: 'text-black',
            medal: 'blue',
        });
    }
    if (aggregate.topThermalUnit) {
        records.push({
            label: 'CENTRAL MÁS MENCIONADA',
            value: aggregate.topThermalUnit.mentions,
            sub: aggregate.topThermalUnit.plant.toUpperCase(),
            Icon: Factory,
            bg: 'bg-fuchsia-400',
            text: 'text-black',
            medal: 'silver',
        });
    }

    return records;
}

// ─────────────────────────────────────────────────────────────────────────
// Modal body
// ─────────────────────────────────────────────────────────────────────────

const HistoricalModalBody: React.FC = memo(() => {
    const {aggregate, loading, loaded, total} = useAllYearsAnalysis();

    if (loading || !aggregate) {
        return <HistoricalSkeleton loaded={loaded} total={total}/>;
    }

    if (aggregate.yearsAnalyzed.length === 0) {
        return (
            <div className="text-center font-mono text-[11px] uppercase tracking-widest opacity-60 py-20">
                Sin datos suficientes para el histórico
            </div>
        );
    }

    const records = buildRecords(aggregate);

    return (
        <div className="space-y-8">
            {/* Hero stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <HeroStat
                    idx={0}
                    label="Años analizados"
                    value={aggregate.yearsAnalyzed.length}
                    sub={`${aggregate.yearsAnalyzed[0]} → ${aggregate.yearsAnalyzed[aggregate.yearsAnalyzed.length - 1]}`}
                    bg="bg-violet-300"
                    Icon={History}
                />
                <HeroStat
                    idx={1}
                    label="Mensajes totales"
                    value={aggregate.totalMessages}
                    sub="oficiales del canal"
                    bg="bg-blue-300"
                    Icon={MessageSquare}
                />
                <HeroStat
                    idx={2}
                    label="Caídas del SEN"
                    value={aggregate.totalSenFailures}
                    sub="desconexiones totales"
                    bg={aggregate.totalSenFailures > 0 ? 'bg-red-400' : 'bg-emerald-400'}
                    Icon={Zap}
                />
                <HeroStat
                    idx={3}
                    label="Tiempo fuera total"
                    value={compactDuration(aggregate.totalEstimatedDowntimeSeconds)}
                    sub="acumulado por bloques"
                    bg="bg-orange-400"
                    Icon={Timer}
                />
            </div>

            {/* Narrative summary */}
            <NarrativeSummary aggregate={aggregate}/>

            {/* Best vs Worst year duel */}
            {aggregate.bestYear && aggregate.worstYear && aggregate.bestYear.year !== aggregate.worstYear.year && (
                <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-1.5 border-l-4 border-black pl-2">
                        <Scale size={12} strokeWidth={3}/> Mejor año vs. peor año
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <YearVerdictCard kind="best" summary={aggregate.bestYear} idx={0}/>
                        <YearVerdictCard kind="worst" summary={aggregate.worstYear} idx={1}/>
                    </div>
                </div>
            )}

            {/* Trajectory (year-over-year arrows) */}
            <TrajectorySection perYear={aggregate.perYear}/>

            {/* Per-year strip */}
            <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-1.5 border-l-4 border-black pl-2">
                    <Sparkles size={12} strokeWidth={3}/> Año a año
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                    {aggregate.perYear.map((y, i) => (
                        <YearTile
                            key={y.year}
                            summary={y}
                            prev={i > 0 ? aggregate.perYear[i - 1] : undefined}
                            idx={i}
                            highlight={
                                aggregate.bestYear?.year === y.year ? 'best' :
                                aggregate.worstYear?.year === y.year ? 'worst' :
                                null
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Trend charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TrendChart
                    perYear={aggregate.perYear}
                    metric="totalMessages"
                    color="bg-blue-400"
                    label="Mensajes por año"
                />
                <TrendChart
                    perYear={aggregate.perYear}
                    metric="totalEstimatedDowntimeSeconds"
                    color="bg-orange-500"
                    label="Tiempo total fuera (seg)"
                />
            </div>

            {/* Records */}
            {records.length > 0 && (
                <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-1.5 border-l-4 border-black pl-2">
                        <Crown size={12} strokeWidth={3}/> Récords de todos los tiempos
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {records.map((r, idx) => (
                            <RecordCard key={r.label} r={r} idx={idx}/>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});
HistoricalModalBody.displayName = 'HistoricalModalBody';

// ─────────────────────────────────────────────────────────────────────────
// Main: trigger button + portaled modal
// ─────────────────────────────────────────────────────────────────────────

const HistoricalUnwrapped: React.FC = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <>
            {/* Trigger pill — neobrutalist hover (shadow disappears, button slides into shadow) */}
            <m.button
                id="historical-unwrapped"
                onClick={() => setOpen(true)}
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.25}}
                className="group relative inline-flex items-center gap-3 bg-violet-600 text-white border-4 border-black px-4 md:px-6 py-3 md:py-3.5 shadow-[5px_5px_0px_0px_black] hover:shadow-none hover:translate-x-[5px] hover:translate-y-[5px] active:shadow-none active:translate-x-[5px] active:translate-y-[5px] transition-all cursor-pointer overflow-hidden max-w-full"
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <m.div
                    className="absolute inset-0 pointer-events-none opacity-15"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 10px, #fff 10px, #fff 12px)',
                    }}
                    animate={{backgroundPositionX: ['0px', '22px']}}
                    transition={{duration: 4, repeat: Infinity, ease: 'linear'}}
                />

                <m.div
                    animate={{rotate: [0, -12, 12, -8, 8, 0]}}
                    transition={{duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6}}
                    className="relative flex-shrink-0"
                >
                    <History size={20} strokeWidth={3}/>
                </m.div>

                <div className="relative text-left min-w-0">
                    <div className="font-black text-sm md:text-base uppercase tracking-tighter italic leading-none">
                        Ver Histórico Global
                    </div>
                    <div className="text-[9px] font-mono opacity-80 mt-1 uppercase tracking-widest truncate">
                        Todos los años · récords cruzados
                    </div>
                </div>

                <m.span
                    animate={{x: [0, 4, 0]}}
                    transition={{duration: 1.4, repeat: Infinity, ease: 'easeInOut'}}
                    className="relative flex-shrink-0"
                >
                    <ChevronRight size={20} strokeWidth={3}/>
                </m.span>
            </m.button>

            {/* Modal — portaled to escape parent stacking context */}
            {createPortal(
                <AnimatePresence>
                    {open && (
                        <m.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.2}}
                            className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
                            onClick={(e) => {
                                if ((e.target as HTMLElement).dataset.overlay) setOpen(false);
                            }}
                            data-overlay="true"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="historical-modal-title"
                        >
                            <m.div
                                initial={{opacity: 0, scale: 0.95, y: 30}}
                                animate={{opacity: 1, scale: 1, y: 0}}
                                exit={{opacity: 0, scale: 0.95, y: 30}}
                                transition={{type: 'spring', stiffness: 240, damping: 24}}
                                className="bg-white border-4 border-black w-full max-w-6xl max-h-[92vh] flex flex-col shadow-[12px_12px_0px_0px_black] relative overflow-hidden"
                            >
                                {/* Header — fixed top */}
                                <div className="bg-violet-600 text-white border-b-4 border-black px-4 md:px-8 py-4 flex items-center justify-between gap-3 flex-shrink-0 relative overflow-hidden">
                                    {/* Animated stripes background on header */}
                                    <m.div
                                        className="absolute inset-0 pointer-events-none opacity-15"
                                        style={{backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 8px, #fff 8px, #fff 10px)'}}
                                        animate={{backgroundPositionX: ['0px', '18px']}}
                                        transition={{duration: 4, repeat: Infinity, ease: 'linear'}}
                                    />

                                    <div className="flex items-center gap-3 min-w-0 relative">
                                        <m.span
                                            animate={{rotate: [0, 360]}}
                                            transition={{duration: 30, repeat: Infinity, ease: 'linear'}}
                                            className="inline-block flex-shrink-0"
                                        >
                                            <History size={24} strokeWidth={3}/>
                                        </m.span>
                                        <div className="min-w-0">
                                            <h2 id="historical-modal-title" className="font-black text-xl md:text-3xl uppercase tracking-tighter italic leading-none truncate">
                                                Histórico Global
                                            </h2>
                                            <p className="text-[10px] font-mono opacity-80 mt-1 truncate">
                                                todos los años analizados juntos · récords y comparativas
                                            </p>
                                        </div>
                                    </div>
                                    <m.button
                                        onClick={() => setOpen(false)}
                                        whileHover={{scale: 1.08, rotate: 90}}
                                        whileTap={{scale: 0.95}}
                                        className="relative flex-shrink-0 cursor-pointer bg-white text-black w-10 h-10 flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black] transition-shadow"
                                        aria-label="Cerrar"
                                    >
                                        <X size={20} strokeWidth={3}/>
                                    </m.button>
                                </div>

                                {/* Body — flex-1 + overflow-y-auto means this is the only scrolling area */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                    <HistoricalModalBody/>
                                </div>

                                {/* Footer — bg-gray-100 + dark text + kbd-style key for visibility */}
                                <div className="px-4 md:px-8 py-3 border-t-4 border-black bg-gray-100 text-[11px] font-mono text-gray-800 text-center flex-shrink-0 flex items-center justify-center gap-2">
                                    <span>Pulsa</span>
                                    <kbd className="bg-white border-2 border-black px-2 py-0.5 font-black text-[10px] shadow-[2px_2px_0px_0px_black] text-black not-italic">ESC</kbd>
                                    <span>o haz click fuera para cerrar</span>
                                </div>
                            </m.div>
                        </m.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default memo(HistoricalUnwrapped);
