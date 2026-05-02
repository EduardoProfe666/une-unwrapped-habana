import React, {memo, useMemo, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {AlertOctagon, Calendar, Clock, Compass, Layers, MapPin, Network, TrendingDown, Zap} from 'lucide-react';
import type {BlockAnalysis, Severity} from '@/src/lib/types';
import {SEVERITY_BG, SEVERITY_LABEL} from '@/src/lib/constants';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';
import {formatDuration} from '@/src/lib/utils.ts';

interface Props {
    blocks: BlockAnalysis[];
    primaryColorClass: string;
    secondaryColorClass: string;
}

const MONTH_LETTERS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const HOUR_LABELS = Array.from({length: 24}, (_, h) => h);
const SEVERITIES_ORDER: Severity[] = ['low', 'medium', 'high', 'critical'];

const formatDayString = (s?: string): string => {
    if (!s) return '—';
    try {
        const d = new Date(s);
        return d.toLocaleDateString('es-CU', {weekday: 'short', day: '2-digit', month: 'short'}).toUpperCase();
    } catch {
        return s;
    }
};

// ----------------------- Mini bar charts ----------------------- //

// Bar chart using absolute positioning + animated height in pixels (rock-solid).
const Bars: React.FC<{
    values: number[];
    labels: string[];
    fullLabels?: string[];
    chartHeightPx: number;
    showXAxisTicks?: (idx: number) => boolean;
    barLabel: (idx: number, value: number) => string;
}> = memo(({values, labels, fullLabels, chartHeightPx, showXAxisTicks, barLabel}) => {
    const max = Math.max(1, ...values);
    const peakIdx = values.findIndex(v => v === max && v > 0);
    const [hovered, setHovered] = useState<number | null>(null);

    // Reserve a small gap between top of tallest bar and the top of the chart.
    const usable = chartHeightPx - 8;

    return (
        <div className="relative">
            {/* Y-axis ticks */}
            <div className="absolute left-0 top-0 text-[9px] font-mono font-black text-gray-500 leading-none">{max}</div>
            <div className="absolute left-0" style={{bottom: 26}}>
                <span className="text-[9px] font-mono font-black text-gray-500 leading-none">0</span>
            </div>

            {/* Chart frame */}
            <div
                className="relative ml-7 border-l-2 border-b-4 border-black"
                style={{height: chartHeightPx}}
            >
                {/* Horizontal helper line at half */}
                <div className="absolute left-0 right-0 border-t border-dashed border-black/15" style={{top: chartHeightPx / 2}}/>

                {values.map((v, i) => {
                    const heightPx = max > 0 ? Math.max(v > 0 ? 4 : 0, (v / max) * usable) : 0;
                    const isPeak = i === peakIdx && v > 0;
                    const isHovered = hovered === i;
                    const widthPct = 100 / values.length;
                    const leftPct = i * widthPct;
                    const lbl = fullLabels?.[i] ?? labels[i];
                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            className="absolute bottom-0 cursor-pointer flex justify-center"
                            style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                height: chartHeightPx,
                            }}
                        >
                            {/* Tooltip */}
                            {isHovered && v > 0 && (
                                <m.div
                                    initial={{opacity: 0, y: 6, scale: 0.92}}
                                    animate={{opacity: 1, y: 0, scale: 1}}
                                    transition={{type: 'spring', stiffness: 500, damping: 24}}
                                    className="absolute -top-9 z-30 bg-black text-white text-[10px] font-mono font-black px-2 py-1 border-2 border-white shadow-[2px_2px_0px_0px_black] whitespace-nowrap pointer-events-none"
                                >
                                    {barLabel(i, v)}
                                </m.div>
                            )}

                            {/* Bar (animated growth from bottom) */}
                            <m.div
                                initial={{height: 0}}
                                animate={{height: heightPx}}
                                transition={{duration: 0.5, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1]}}
                                className={`absolute bottom-0 border-2 border-black transition-colors ${
                                    v === 0 ? 'opacity-0' : ''
                                } ${
                                    isPeak ? 'bg-red-600' : isHovered ? 'bg-orange-500' : 'bg-black'
                                }`}
                                style={{
                                    width: 'calc(100% - 4px)',
                                    left: 2,
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* X-axis labels */}
            <div className="ml-7 flex relative mt-1.5">
                {values.map((_, i) => {
                    const isPeak = i === peakIdx;
                    const isHovered = hovered === i;
                    const show = !showXAxisTicks || showXAxisTicks(i);
                    return (
                        <div
                            key={i}
                            className="text-center"
                            style={{width: `${100 / values.length}%`}}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span
                                className={`text-[10px] font-mono leading-none transition-colors ${
                                    isPeak ? 'text-red-600 font-black' : isHovered ? 'text-black font-black' : 'text-gray-500'
                                }`}
                            >
                                {show ? labels[i] : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});


const MonthlyBars: React.FC<{data: Record<string, number>}> = memo(({data}) => {
    const values = useMemo(
        () => Array.from({length: 12}, (_, i) => data[String(i + 1)] ?? 0),
        [data]
    );
    const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);
    const max = Math.max(1, ...values);
    const peakIdx = values.findIndex(v => v === max && v > 0);

    // Stats cards (mirror the hourly buckets layout)
    const firstActiveIdx = values.findIndex(v => v > 0);
    const lastActiveIdx = values.length - 1 - [...values].reverse().findIndex(v => v > 0);
    const monthsWithActivity = values.filter(v => v > 0).length;
    const avgPerActiveMonth = monthsWithActivity > 0 ? Math.round(total / monthsWithActivity) : 0;

    // Half-year split (H1 vs H2) for richer comparison
    const h1 = values.slice(0, 6).reduce((a, b) => a + b, 0);
    const h2 = values.slice(6, 12).reduce((a, b) => a + b, 0);
    const dominantHalf = h1 > h2 ? 'H1' : h2 > h1 ? 'H2' : null;

    const cards = [
        {
            label: 'TOTAL AÑO',
            sub: '12 meses',
            value: total.toLocaleString(),
            color: 'bg-gray-100',
            valueClass: 'text-black',
            isPeak: false,
        },
        {
            label: 'PICO',
            sub: peakIdx >= 0 && values[peakIdx] > 0 ? MONTH_FULL[peakIdx].toLowerCase() : '—',
            value: peakIdx >= 0 && values[peakIdx] > 0 ? values[peakIdx].toLocaleString() : '—',
            color: 'bg-red-100',
            valueClass: 'text-red-700',
            isPeak: true,
        },
        {
            label: 'MESES ACTIVOS',
            sub: firstActiveIdx >= 0 && lastActiveIdx >= 0 && firstActiveIdx !== lastActiveIdx
                ? `${MONTH_LETTERS[firstActiveIdx]} → ${MONTH_LETTERS[lastActiveIdx]}`
                : 'sin actividad',
            value: `${monthsWithActivity}/12`,
            color: 'bg-emerald-100',
            valueClass: 'text-emerald-700',
            isPeak: false,
        },
        {
            label: 'PROMEDIO/MES',
            sub: dominantHalf === 'H1' ? '+1ª mitad año' : dominantHalf === 'H2' ? '+2ª mitad año' : 'equilibrado',
            value: avgPerActiveMonth.toLocaleString(),
            color: 'bg-amber-100',
            valueClass: 'text-amber-700',
            isPeak: false,
        },
    ];

    return (
        <div>
            <Bars
                values={values}
                labels={MONTH_LETTERS}
                fullLabels={MONTH_FULL}
                chartHeightPx={160}
                barLabel={(i, v) => `${MONTH_FULL[i]}: ${v}`}
            />

            {/* Stats cards (replaces the trim cards) */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {cards.map((c, idx) => (
                    <m.div
                        key={c.label}
                        initial={{opacity: 0, y: 8}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.4 + idx * 0.05}}
                        whileHover={{y: -3, rotate: idx % 2 === 0 ? -1 : 1}}
                        className={`${c.color} border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow relative ${c.isPeak && peakIdx >= 0 && values[peakIdx] > 0 ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-gray-50' : ''}`}
                    >
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">{c.label}</div>
                        <div className="text-[9px] font-mono opacity-50 leading-none mt-1 truncate">{c.sub}</div>
                        <div className={`font-black text-2xl leading-tight italic mt-2 ${c.valueClass}`}>{c.value}</div>
                    </m.div>
                ))}
            </div>
        </div>
    );
});


const HourlyBars: React.FC<{data: Record<string, number>}> = memo(({data}) => {
    const values = useMemo(
        () => HOUR_LABELS.map(h => data[String(h)] ?? 0),
        [data]
    );

    const buckets = useMemo(() => {
        const slots = [
            {label: 'MADRUGADA', sub: '00-05h', range: [0, 5], color: 'bg-indigo-200'},
            {label: 'MAÑANA',    sub: '06-11h', range: [6, 11], color: 'bg-yellow-200'},
            {label: 'TARDE',     sub: '12-17h', range: [12, 17], color: 'bg-orange-300'},
            {label: 'NOCHE',     sub: '18-23h', range: [18, 23], color: 'bg-purple-300'},
        ];
        return slots.map(s => ({
            ...s,
            count: values.slice(s.range[0], s.range[1] + 1).reduce((a, b) => a + b, 0),
        }));
    }, [values]);

    const peakBucketIdx = buckets.reduce((maxI, b, i, arr) => (b.count > arr[maxI].count ? i : maxI), 0);

    return (
        <div>
            <Bars
                values={values}
                labels={HOUR_LABELS.map(h => `${String(h).padStart(2, '0')}`)}
                fullLabels={HOUR_LABELS.map(h => `${String(h).padStart(2, '0')}:00`)}
                chartHeightPx={140}
                showXAxisTicks={(i) => i % 4 === 0}
                barLabel={(i, v) => `${String(i).padStart(2, '0')}:00 → ${v}`}
            />

            {/* Day buckets summary */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {buckets.map((b, idx) => {
                    const isPeak = idx === peakBucketIdx && b.count > 0;
                    return (
                        <m.div
                            key={b.label}
                            initial={{opacity: 0, y: 8}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.4 + idx * 0.05}}
                            whileHover={{y: -3, rotate: idx % 2 === 0 ? -1 : 1}}
                            className={`${b.color} border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow relative ${isPeak ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-gray-50' : ''}`}
                        >
                            {isPeak && (
                                <m.span
                                    className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 border-2 border-black"
                                    animate={{rotate: [0, -4, 4, 0]}}
                                    transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                                >
                                    PICO
                                </m.span>
                            )}
                            <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">{b.label}</div>
                            <div className="text-[9px] font-mono opacity-50 leading-none mt-1 truncate">{b.sub}</div>
                            <div className="font-black text-2xl leading-tight italic mt-2">{b.count}</div>
                        </m.div>
                    );
                })}
            </div>
        </div>
    );
});

// ----------------------- Co-occurrences chart ----------------------- //

const CoOccurrences: React.FC<{
    data: Record<string, number>;
    currentBlock: number;
}> = memo(({data, currentBlock}) => {
    const others = useMemo(() => {
        return [1, 2, 3, 4, 5, 6]
            .filter(b => b !== currentBlock)
            .map(b => ({block: b, count: data[String(b)] ?? 0}))
            .sort((a, b) => b.count - a.count);
    }, [data, currentBlock]);
    const max = Math.max(1, ...others.map(o => o.count));
    const total = others.reduce((s, o) => s + o.count, 0);

    if (total === 0) {
        return (
            <div className="text-[10px] font-mono text-gray-400 italic py-4 text-center">
                Este bloque no aparece junto a ningún otro en los mensajes analizados.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {others.map((o, idx) => {
                const ratio = max > 0 ? (o.count / max) : 0;
                const pctOfTotal = total > 0 ? (o.count / total) * 100 : 0;
                const intensity =
                    o.count === 0 ? 'bg-gray-200' :
                    ratio < 0.25 ? 'bg-orange-300' :
                    ratio < 0.55 ? 'bg-orange-500' :
                    ratio < 0.85 ? 'bg-red-500' :
                    'bg-red-700';
                const isTop = idx === 0 && o.count > 0;

                return (
                    <m.div
                        key={o.block}
                        initial={{opacity: 0, x: -16}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: idx * 0.07, type: 'spring', stiffness: 220, damping: 22}}
                        whileHover={{x: 4}}
                        className="flex items-stretch gap-2 group cursor-default"
                    >
                        {/* Block tag — bigger, more prominent */}
                        <div className="flex-shrink-0 w-20 sm:w-24 border-4 border-black bg-black text-white flex items-center justify-center shadow-[3px_3px_0px_0px_black] group-hover:shadow-[5px_5px_0px_0px_black] transition-shadow">
                            <div className="text-center px-2 py-1">
                                <div className="text-[9px] font-mono font-black uppercase opacity-60 leading-none tracking-widest">BLOQUE</div>
                                <div className="font-black text-2xl italic leading-none mt-1">{o.block}</div>
                            </div>
                        </div>

                        {/* Bar with overlaid label */}
                        <div className="flex-1 border-4 border-black bg-gray-100 relative h-14 overflow-hidden shadow-[3px_3px_0px_0px_black] group-hover:shadow-[5px_5px_0px_0px_black] transition-shadow">
                            <m.div
                                initial={{width: 0}}
                                animate={{width: `${ratio * 100}%`}}
                                transition={{duration: 0.7, delay: 0.1 + idx * 0.07, ease: [0.22, 1, 0.36, 1]}}
                                className={`h-full ${intensity} group-hover:brightness-110 relative transition-[filter] overflow-hidden`}
                            >
                                {isTop && (
                                    <m.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage:
                                                'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.22) 6px, rgba(255,255,255,0.22) 8px)',
                                        }}
                                        animate={{backgroundPositionX: ['0px', '20px']}}
                                        transition={{duration: 2, repeat: Infinity, ease: 'linear'}}
                                    />
                                )}
                            </m.div>

                            {/* Label overlay (always black on light bg, plus white badge over the bar) */}
                            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                                <span className="text-[11px] font-black uppercase tracking-tight text-black bg-white/90 border-2 border-black px-2 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,0.4)]">
                                    {o.count.toLocaleString()} co-ocurrencias
                                </span>
                                <span className="text-[11px] font-black tracking-tight text-black bg-yellow-300 border-2 border-black px-2 py-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,0.4)]">
                                    {pctOfTotal.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </m.div>
                );
            })}

            {/* Footer hint */}
            <div className="pt-3 mt-3 border-t-2 border-dashed border-black/20 text-[10px] font-mono opacity-50 flex justify-between">
                <span>Total co-ocurrencias del bloque {currentBlock}: <span className="font-black text-black opacity-100">{total.toLocaleString()}</span></span>
                {others[0]?.count > 0 && (
                    <span>Mayor afinidad: <span className="font-black text-red-600 opacity-100">Bloque {others[0].block}</span></span>
                )}
            </div>
        </div>
    );
});

// ----------------------- Severity bar ----------------------- //

const SeverityBar: React.FC<{data: Record<string, number>}> = memo(({data}) => {
    const total = SEVERITIES_ORDER.reduce((s, sev) => s + (data[sev] ?? 0), 0);
    if (total === 0) {
        return <div className="text-[10px] font-mono text-gray-400">Sin datos de severidad para este bloque.</div>;
    }
    return (
        <div>
            <div className="flex h-8 border-2 border-black overflow-hidden shadow-[3px_3px_0px_0px_black]">
                {SEVERITIES_ORDER.map((sev, idx) => {
                    const v = data[sev] ?? 0;
                    const pct = (v / total) * 100;
                    if (pct === 0) return null;
                    return (
                        <m.div
                            key={sev}
                            initial={{width: 0}}
                            animate={{width: `${pct}%`}}
                            transition={{duration: 0.7, delay: 0.1 * idx, ease: 'easeOut'}}
                            className={`${SEVERITY_BG[sev]} border-r-2 border-black last:border-r-0 flex items-center justify-center group relative cursor-pointer`}
                        >
                            <span className="text-[10px] font-black uppercase text-white px-1 whitespace-nowrap drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
                                {pct >= 8 ? `${pct.toFixed(0)}%` : ''}
                            </span>
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-mono font-black px-1.5 py-1 border-2 border-white shadow-[2px_2px_0px_0px_black] whitespace-nowrap z-30">
                                {SEVERITY_LABEL[sev]}: {v}
                            </div>
                        </m.div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono">
                {SEVERITIES_ORDER.map(sev => (
                    <span key={sev} className="flex items-center gap-1">
                        <span className={`inline-block w-2 h-2 ${SEVERITY_BG[sev]} border border-black`}/>
                        <span className="font-black uppercase">{SEVERITY_LABEL[sev]}</span>
                        <span className="opacity-60">{data[sev] ?? 0}</span>
                    </span>
                ))}
            </div>
        </div>
    );
});

// ----------------------- Top zones list ----------------------- //

const TopZonesList: React.FC<{
    items: Array<{name: string; count: number}>;
    color: string;
    emptyMsg: string;
}> = memo(({items, color, emptyMsg}) => {
    if (!items.length) {
        return <div className="text-[10px] font-mono text-gray-400 italic py-2">{emptyMsg}</div>;
    }
    const max = Math.max(1, ...items.map(i => i.count));
    const total = items.reduce((s, i) => s + i.count, 0);

    return (
        <ul className="space-y-3">
            {items.map((item, idx) => {
                const pct = (item.count / max) * 100;
                const pctOfTotal = total > 0 ? (item.count / total) * 100 : 0;
                const isTop = idx === 0;
                return (
                    <m.li
                        key={item.name}
                        initial={{opacity: 0, x: -16}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: idx * 0.06, type: 'spring', stiffness: 240, damping: 22}}
                        whileHover={{x: 4}}
                        className="group cursor-default"
                    >
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[11px] font-black uppercase tracking-tight flex items-center gap-2">
                                <m.span
                                    whileHover={{rotate: -6, scale: 1.15}}
                                    className={`inline-block ${isTop ? 'bg-red-600 text-white' : 'bg-black text-white'} font-mono text-[9px] px-1.5 py-0.5 border-2 border-black leading-none`}
                                >
                                    #{idx + 1}
                                </m.span>
                                <span className="group-hover:underline decoration-2 underline-offset-2 transition-all">
                                    {item.name}
                                </span>
                            </span>
                            <span className="text-[10px] font-mono flex items-center gap-2">
                                <span className="opacity-40">{pctOfTotal.toFixed(0)}%</span>
                                <span className={`font-black ${isTop ? 'text-red-600' : 'text-black'}`}>
                                    {item.count.toLocaleString()}
                                </span>
                            </span>
                        </div>
                        <div className="h-3 border-2 border-black bg-gray-50 relative overflow-hidden shadow-[2px_2px_0px_0px_black] group-hover:shadow-[3px_3px_0px_0px_black] transition-shadow">
                            <m.div
                                initial={{width: 0}}
                                animate={{width: `${pct}%`}}
                                transition={{duration: 0.7, delay: 0.08 + idx * 0.06, ease: [0.22, 1, 0.36, 1]}}
                                className={`h-full ${color} transition-[filter,transform] group-hover:brightness-110 origin-left group-hover:scale-x-[1.01] relative overflow-hidden`}
                            >
                                {isTop && (
                                    <m.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage:
                                                'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.25) 5px, rgba(255,255,255,0.25) 7px)',
                                        }}
                                        animate={{backgroundPositionX: ['0px', '20px']}}
                                        transition={{duration: 2.4, repeat: Infinity, ease: 'linear'}}
                                    />
                                )}
                            </m.div>
                        </div>
                    </m.li>
                );
            })}
        </ul>
    );
});

// ----------------------- Main component ----------------------- //

const BlockExplorer: React.FC<Props> = ({blocks, primaryColorClass, secondaryColorClass}) => {
    const [selectedNumber, setSelectedNumber] = useState<number>(1);
    const ordered = useMemo(() => [1, 2, 3, 4, 5, 6].map(n => blocks.find(b => b.number === n)).filter(Boolean) as BlockAnalysis[], [blocks]);
    const block = useMemo(() => ordered.find(b => b.number === selectedNumber), [ordered, selectedNumber]);

    if (!block) return null;

    const totalAffectations = block.declared_affectations;
    const totalRecoveries = block.declared_recoveries;
    const recoveryRatio = totalAffectations > 0 ? Math.round((totalRecoveries / totalAffectations) * 100) : null;

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Decorative compass */}
            <m.div
                className="absolute -top-4 -right-4 opacity-[0.05] pointer-events-none"
                animate={{rotate: [0, 360]}}
                transition={{duration: 60, repeat: Infinity, ease: 'linear'}}
            >
                <Compass size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Compass size={28} strokeWidth={3}/>
                        Explorador de Bloques
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Selecciona un bloque para ver métricas detalladas derivadas por la IA
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">
                    REF_INT_BLK_EXPLORE
                </div>
            </header>

            {/* Block selector */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 mb-8 mt-4 relative z-10">
                {ordered.map((b, idx) => {
                    const active = b.number === selectedNumber;
                    const affTotal = b.declared_affectations;
                    return (
                        <m.button
                            key={b.number}
                            onClick={() => setSelectedNumber(b.number)}
                            initial={{opacity: 0, y: 12}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: idx * 0.04, type: 'spring', stiffness: 320, damping: 22}}
                            whileTap={{scale: 0.96}}
                            className={`group relative cursor-pointer border-4 border-black p-3 md:p-4 text-left
                                ${active
                                    ? `${primaryColorClass} text-white shadow-[2px_2px_0px_0px_black] translate-x-1 translate-y-1`
                                    : 'bg-white text-black shadow-[5px_5px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1'} transition-all duration-150`}
                        >
                            {/* Active indicator dot — anchored to top-right with explicit inline style */}
                            <AnimatePresence>
                                {active && (
                                    <m.div
                                        initial={{scale: 0, opacity: 0, rotate: -45}}
                                        animate={{scale: 1, opacity: 1, rotate: 0}}
                                        exit={{scale: 0, opacity: 0, rotate: 45}}
                                        transition={{type: 'spring', stiffness: 500, damping: 22}}
                                        style={{top: -10, right: -10}}
                                        className="absolute w-6 h-6 bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_black] z-20"
                                    >
                                        <m.span
                                            className="text-xs font-black leading-none"
                                            animate={{scale: [1, 1.25, 1]}}
                                            transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut'}}
                                        >●</m.span>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <div className="relative">
                                <div className={`text-[9px] font-mono font-black uppercase tracking-widest ${active ? 'opacity-90' : 'opacity-60'}`}>
                                    BLOQUE
                                </div>
                                <div className={`font-black text-3xl md:text-4xl italic leading-none mt-0.5 transition-transform ${
                                    active ? '' : 'group-hover:-translate-y-0.5'
                                }`}>
                                    {b.number}
                                </div>
                                <div className={`text-[10px] font-mono mt-1.5 leading-tight ${active ? 'text-white/95' : 'text-black/70'}`}>
                                    <span className="font-black">{affTotal}</span> af · <span className="font-black">{b.declared_recoveries}</span> rec
                                </div>
                            </div>
                        </m.button>
                    );
                })}
            </div>

            {/* Detail panel — animated transition between blocks */}
            <AnimatePresence mode="wait">
                <m.div
                    key={block.number}
                    initial={{opacity: 0, y: 16}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -16}}
                    transition={{duration: 0.3, ease: [0.22, 1, 0.36, 1]}}
                    className="space-y-8 relative z-10"
                >
                    {/* Top KPI strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <m.div whileHover={{y: -2, scale: 1.02}} transition={{type: 'spring', stiffness: 400}}
                               className="border-4 border-black bg-gray-50 p-3 shadow-[4px_4px_0px_0px_black]">
                            <div className="text-[9px] font-black uppercase opacity-60 tracking-widest flex items-center gap-1">
                                <AlertOctagon size={10}/> Afectaciones
                            </div>
                            <div className="font-black text-3xl italic mt-1">
                                <AnimatedCounter value={totalAffectations}/>
                            </div>
                        </m.div>
                        <m.div whileHover={{y: -2, scale: 1.02}} transition={{type: 'spring', stiffness: 400}}
                               className="border-4 border-black bg-green-100 p-3 shadow-[4px_4px_0px_0px_black]">
                            <div className="text-[9px] font-black uppercase opacity-60 tracking-widest">Recuperaciones</div>
                            <div className="font-black text-3xl italic mt-1 text-green-700">
                                <AnimatedCounter value={totalRecoveries}/>
                            </div>
                        </m.div>
                        <m.div whileHover={{y: -2, scale: 1.02}} transition={{type: 'spring', stiffness: 400}}
                               className="border-4 border-black bg-yellow-100 p-3 shadow-[4px_4px_0px_0px_black]">
                            <div className="text-[9px] font-black uppercase opacity-60 tracking-widest flex items-center gap-1">
                                <Clock size={10}/> Tiempo afectado
                            </div>
                            <div className="font-black text-lg italic mt-1 leading-tight break-words">
                                {formatDuration(block.estimated_affected_seconds)}
                            </div>
                        </m.div>
                        <m.div whileHover={{y: -2, scale: 1.02}} transition={{type: 'spring', stiffness: 400}}
                               className="border-4 border-black bg-red-100 p-3 shadow-[4px_4px_0px_0px_black]">
                            <div className="text-[9px] font-black uppercase opacity-60 tracking-widest flex items-center gap-1">
                                <TrendingDown size={10}/> Déficit medio
                            </div>
                            <div className="font-black text-3xl italic mt-1 text-red-700">
                                {block.avg_deficit_mw != null ? (
                                    <><AnimatedCounter value={block.avg_deficit_mw}/> <span className="text-base">MW</span></>
                                ) : '—'}
                            </div>
                        </m.div>
                    </div>

                    {/* Worst day + emergency count */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="border-4 border-black bg-black text-white p-4 shadow-[4px_4px_0px_0px_black] flex items-center justify-between">
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-yellow-300 flex items-center gap-1.5">
                                    <Calendar size={10}/> Día con más afectaciones
                                </div>
                                <div className="font-black text-xl mt-1 italic">
                                    {formatDayString(block.worst_day_date)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-black uppercase opacity-60">eventos</div>
                                <div className="font-black text-4xl text-yellow-300 italic leading-none">
                                    <AnimatedCounter value={block.worst_day_events ?? 0}/>
                                </div>
                            </div>
                        </div>
                        <div className="border-4 border-black bg-red-600 text-white p-4 shadow-[4px_4px_0px_0px_black] flex items-center justify-between">
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                                    <Zap size={10}/> Emergencias declaradas
                                </div>
                                <div className="font-black text-sm mt-1 opacity-80">eventos críticos del bloque {block.number}</div>
                            </div>
                            <div className="font-black text-5xl italic leading-none">
                                <AnimatedCounter value={block.declared_emergencies}/>
                            </div>
                        </div>
                    </div>

                    {/* Severity breakdown */}
                    <div className="border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_black]">
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-3 h-3 ${primaryColorClass} border-2 border-black`}/>
                            <h3 className="text-xs font-black uppercase tracking-widest">Severidad de eventos</h3>
                        </div>
                        <SeverityBar data={block.severity_breakdown ?? {}}/>
                    </div>

                    {/* Two columns: monthly + hourly */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_black]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={12}/> Distribución mensual
                                </h3>
                                <span className="text-[9px] font-mono opacity-50 uppercase">
                                    afectaciones / mes
                                </span>
                            </div>
                            {block.monthly_affectations
                                ? <MonthlyBars data={block.monthly_affectations}/>
                                : <div className="text-[10px] font-mono text-gray-400">Sin datos mensuales.</div>}
                        </div>

                        <div className="border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_black]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12}/> Patrón horario
                                </h3>
                                <span className="text-[9px] font-mono opacity-50 uppercase">
                                    afectaciones / hora
                                </span>
                            </div>
                            {block.hourly_affectations
                                ? <HourlyBars data={block.hourly_affectations}/>
                                : <div className="text-[10px] font-mono text-gray-400">Sin datos horarios.</div>}
                        </div>
                    </div>

                    {/* Co-occurrence */}
                    <div className="border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_black]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Network size={12}/> Bloques que caen junto al {block.number}
                            </h3>
                            <span className="text-[9px] font-mono opacity-50 uppercase">co-ocurrencias en mismo mensaje</span>
                        </div>
                        <CoOccurrences
                            data={block.co_occurrences ?? {}}
                            currentBlock={block.number}
                        />
                    </div>

                    {/* Top municipalities + circuits */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_black]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12}/> Municipios más golpeados
                                </h3>
                            </div>
                            <TopZonesList
                                items={block.top_municipalities ?? []}
                                color={primaryColorClass}
                                emptyMsg="Sin municipios detectados para este bloque."
                            />
                        </div>

                        <div className="border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0px_0px_black]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={12}/> Repartos / circuitos top
                                </h3>
                            </div>
                            <TopZonesList
                                items={block.top_circuits ?? []}
                                color={secondaryColorClass}
                                emptyMsg="Sin circuitos detectados para este bloque."
                            />
                        </div>
                    </div>

                    {/* Recovery ratio bar */}
                    {recoveryRatio != null && (
                        <m.div
                            whileHover={{y: -2}}
                            transition={{type: 'spring', stiffness: 400, damping: 22}}
                            className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black uppercase tracking-widest">Ratio de recuperación</h3>
                                <span className={`font-black text-2xl italic ${recoveryRatio >= 50 ? 'text-green-600' : recoveryRatio >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    <AnimatedCounter value={recoveryRatio} suffix="%"/>
                                </span>
                            </div>
                            <div className="h-4 border-2 border-black bg-gray-100 relative overflow-hidden shadow-[2px_2px_0px_0px_black]">
                                <m.div
                                    initial={{width: 0}}
                                    animate={{width: `${Math.min(100, recoveryRatio)}%`}}
                                    transition={{duration: 1.1, ease: [0.22, 1, 0.36, 1]}}
                                    className={`h-full relative ${recoveryRatio >= 50 ? 'bg-green-500' : recoveryRatio >= 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                >
                                    <m.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage:
                                                'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.18) 6px, rgba(255,255,255,0.18) 8px)',
                                        }}
                                        animate={{backgroundPositionX: ['0px', '20px']}}
                                        transition={{duration: 2.4, repeat: Infinity, ease: 'linear'}}
                                    />
                                </m.div>
                            </div>
                            <div className="text-[10px] font-mono mt-2 opacity-60">
                                {totalRecoveries.toLocaleString()} recuperaciones de {totalAffectations.toLocaleString()} afectaciones
                            </div>
                        </m.div>
                    )}
                </m.div>
            </AnimatePresence>
        </section>
    );
};

export default memo(BlockExplorer);
