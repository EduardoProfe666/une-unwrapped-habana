import React, {memo, useMemo, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {Calendar, Crosshair, Flame, MousePointer2} from 'lucide-react';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    weeklyHourlySeverity?: Record<string, number>;
    primaryColorClass: string;
}

const WEEKDAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const WEEKDAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const intensityClass = (v: number, max: number): string => {
    if (max === 0 || v === 0) return 'bg-white';
    const r = v / max;
    if (r < 0.15) return 'bg-orange-100';
    if (r < 0.35) return 'bg-orange-200';
    if (r < 0.55) return 'bg-orange-400';
    if (r < 0.75) return 'bg-orange-500';
    if (r < 0.9)  return 'bg-red-500';
    return 'bg-red-700';
};

const WeeklyHeatmap: React.FC<Props> = ({weeklyHourlySeverity}) => {
    const [hovered, setHovered] = useState<{wd: number; hr: number; v: number} | null>(null);

    const grid = useMemo(() => {
        const rows: number[][] = Array.from({length: 7}, () => Array(24).fill(0));
        if (weeklyHourlySeverity) {
            for (const [k, v] of Object.entries(weeklyHourlySeverity)) {
                const [wd, hr] = k.split('-').map(Number);
                if (wd >= 0 && wd <= 6 && hr >= 0 && hr <= 23) {
                    rows[wd][hr] = v;
                }
            }
        }
        return rows;
    }, [weeklyHourlySeverity]);

    const max = useMemo(() => Math.max(0, ...grid.flat()), [grid]);
    const total = useMemo(() => grid.flat().reduce((a, b) => a + b, 0), [grid]);

    const peak = useMemo(() => {
        let best = {wd: 0, hr: 0, v: 0};
        for (let wd = 0; wd < 7; wd++) {
            for (let hr = 0; hr < 24; hr++) {
                if (grid[wd][hr] > best.v) best = {wd, hr, v: grid[wd][hr]};
            }
        }
        return best;
    }, [grid]);

    const rowTotals = useMemo(() => grid.map(r => r.reduce((a, b) => a + b, 0)), [grid]);
    const colTotals = useMemo(() => {
        const cols = Array(24).fill(0);
        for (let wd = 0; wd < 7; wd++) for (let hr = 0; hr < 24; hr++) cols[hr] += grid[wd][hr];
        return cols;
    }, [grid]);

    if (!weeklyHourlySeverity || total === 0) return null;

    const peakRow = rowTotals.indexOf(Math.max(...rowTotals));
    const peakCol = colTotals.indexOf(Math.max(...colTotals));

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            <m.div
                className="absolute -top-4 -right-4 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, 4, 0, -4, 0]}}
                transition={{duration: 14, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Flame size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{
                                scale: [1, 1.18, 1, 1.1, 1],
                                rotate: [0, -8, 8, -4, 0],
                            }}
                            transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6}}
                            className="inline-block text-orange-500"
                            style={{filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.4))'}}
                        >
                            <Calendar size={28} strokeWidth={3}/>
                        </m.span>
                        Mapa Día × Hora
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        ¿Qué combinación de día y hora concentra más eventos altos / críticos?
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_DOWHEAT</div>
            </header>

            {/* Main row: heatmap (left) + always-visible side panel (right) */}
            <div className="flex flex-col lg:flex-row gap-5 items-start relative z-10">
                {/* Heatmap */}
                <div className="flex-1 min-w-0 overflow-x-auto pb-2">
                    <div className="inline-block min-w-fit relative">
                        {/* Hour axis on top */}
                        <div className="flex pl-12 pr-12">
                            {Array.from({length: 24}, (_, hr) => {
                                const isPeak = hr === peakCol;
                                const isHoveredCol = hovered?.hr === hr;
                                return (
                                    <m.div
                                        key={hr}
                                        className="text-center"
                                        style={{width: 28}}
                                        animate={{
                                            scale: isHoveredCol ? 1.15 : 1,
                                            y: isHoveredCol ? -2 : 0,
                                        }}
                                        transition={{duration: 0.15}}
                                    >
                                        <span className={`text-[9px] font-mono leading-none transition-colors ${
                                            isPeak ? 'text-red-600 font-black' : isHoveredCol ? 'text-black font-black' : 'text-gray-400'
                                        }`}>
                                            {hr % 3 === 0 ? String(hr).padStart(2, '0') : ''}
                                        </span>
                                    </m.div>
                                );
                            })}
                        </div>

                        {/* Grid rows */}
                        {grid.map((row, wd) => {
                            const isPeakRow = wd === peakRow;
                            const isHoveredRow = hovered?.wd === wd;
                            return (
                                <m.div
                                    key={wd}
                                    initial={{opacity: 0, x: -10}}
                                    whileInView={{opacity: 1, x: 0}}
                                    viewport={{once: true}}
                                    transition={{delay: 0.05 * wd, duration: 0.4}}
                                    className="flex items-center mt-1"
                                >
                                    {/* Weekday label */}
                                    <m.div
                                        animate={{
                                            scale: isHoveredRow ? 1.08 : 1,
                                            x: isHoveredRow ? -2 : 0,
                                        }}
                                        transition={{duration: 0.15}}
                                        className={`w-12 text-center font-black text-[10px] uppercase tracking-widest transition-colors ${
                                            isPeakRow ? 'text-red-600' : isHoveredRow ? 'text-black' : 'text-gray-500'
                                        }`}
                                    >
                                        {WEEKDAYS[wd]}
                                    </m.div>

                                    {/* Cells */}
                                    {row.map((v, hr) => {
                                        const isHovered = hovered?.wd === wd && hovered?.hr === hr;
                                        const isPeak = peak.wd === wd && peak.hr === hr && v > 0;
                                        return (
                                            <m.div
                                                key={hr}
                                                initial={{opacity: 0, scale: 0}}
                                                whileInView={{opacity: 1, scale: 1}}
                                                viewport={{once: true}}
                                                transition={{
                                                    delay: 0.05 * wd + 0.012 * hr,
                                                    type: 'spring',
                                                    stiffness: 320,
                                                    damping: 22,
                                                }}
                                                onMouseEnter={() => setHovered({wd, hr, v})}
                                                onMouseLeave={() => setHovered(null)}
                                                animate={{
                                                    scale: isHovered ? 1.3 : 1,
                                                    y: isHovered ? -2 : 0,
                                                }}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    marginRight: 0,
                                                    zIndex: isHovered ? 30 : isPeak ? 10 : 1,
                                                    boxShadow: isHovered ? '0 6px 12px rgba(0,0,0,0.35)' : 'none',
                                                }}
                                                className={`relative border-2 border-black ${intensityClass(v, max)} cursor-pointer transition-shadow ${
                                                    isPeak ? 'ring-2 ring-yellow-300 ring-offset-1 ring-offset-white' : ''
                                                } ${isHovered ? 'ring-2 ring-black ring-offset-1 ring-offset-white' : ''}`}
                                            >
                                                {isPeak && (
                                                    <>
                                                        {/* Pulsing yellow dot */}
                                                        <m.span
                                                            className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 border border-black rounded-full z-10"
                                                            animate={{scale: [1, 1.6, 1]}}
                                                            transition={{duration: 1.4, repeat: Infinity}}
                                                        />
                                                        {/* Soft expanding ping ring around peak cell */}
                                                        <m.span
                                                            className="absolute inset-[-2px] border-2 border-yellow-400 pointer-events-none"
                                                            animate={{
                                                                scale: [1, 1.6],
                                                                opacity: [0.7, 0],
                                                            }}
                                                            transition={{
                                                                duration: 1.8,
                                                                repeat: Infinity,
                                                                ease: 'easeOut',
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </m.div>
                                        );
                                    })}

                                    {/* Row total */}
                                    <m.div
                                        initial={{opacity: 0, x: -6}}
                                        whileInView={{opacity: 1, x: 0}}
                                        viewport={{once: true}}
                                        transition={{delay: 0.4 + 0.05 * wd}}
                                        className="w-10 text-right ml-2"
                                    >
                                        <span className={`text-[10px] font-mono ${isPeakRow ? 'font-black text-red-600' : 'text-gray-500'}`}>
                                            <AnimatedCounter value={rowTotals[wd]}/>
                                        </span>
                                    </m.div>
                                </m.div>
                            );
                        })}
                    </div>
                </div>

                {/* Side panel — always visible. Hover info + peak. NO layout shift. */}
                <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-3">
                    {/* Hover detail card — swaps idle/hover content via AnimatePresence */}
                    <m.div
                        initial={{opacity: 0, x: 10}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.4}}
                        className="bg-black text-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_black] relative overflow-hidden min-h-[120px]"
                    >
                        {/* Header line */}
                        <div className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-2 flex items-center gap-1.5">
                            <m.span
                                animate={hovered ? {rotate: [0, -8, 8, 0]} : {}}
                                transition={{duration: 0.6, repeat: Infinity, ease: 'easeInOut'}}
                                className="inline-block text-yellow-300"
                            >
                                {hovered ? <Crosshair size={11} strokeWidth={3}/> : <MousePointer2 size={11} strokeWidth={3}/>}
                            </m.span>
                            DETALLE
                        </div>

                        {/* Live shimmer when hovering */}
                        <AnimatePresence>
                            {hovered && (
                                <m.div
                                    key="hover-shimmer"
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(110deg, transparent 30%, rgba(252,211,77,0.18) 50%, transparent 70%)',
                                    }}
                                    initial={{x: '-100%'}}
                                    exit={{opacity: 0}}
                                    animate={{x: ['-100%', '200%']}}
                                    transition={{duration: 1.6, repeat: Infinity, ease: 'linear'}}
                                />
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="popLayout" initial={false}>
                            {hovered ? (
                                <m.div
                                    key={`${hovered.wd}-${hovered.hr}`}
                                    initial={{opacity: 0, y: 6}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -6}}
                                    transition={{duration: 0.18}}
                                    className="relative"
                                >
                                    <div className="font-mono text-[11px] font-black uppercase tracking-tight">
                                        {WEEKDAYS_FULL[hovered.wd]}
                                    </div>
                                    <div className="text-[10px] font-mono opacity-60">
                                        {String(hovered.hr).padStart(2, '0')}:00 — {String((hovered.hr + 1) % 24).padStart(2, '0')}:00
                                    </div>
                                    <div className="font-black text-3xl italic mt-2 leading-none">
                                        <AnimatedCounter value={hovered.v}/>
                                        <span className="text-[10px] font-mono opacity-60 ml-1.5">eventos</span>
                                    </div>
                                </m.div>
                            ) : (
                                <m.div
                                    key="idle"
                                    initial={{opacity: 0, y: 6}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -6}}
                                    transition={{duration: 0.18}}
                                    className="relative"
                                >
                                    <div className="font-mono text-[11px] font-black uppercase tracking-tight opacity-80">
                                        Pasa el cursor
                                    </div>
                                    <div className="text-[10px] font-mono opacity-50 mt-1 leading-snug">
                                        sobre cualquier celda para ver el día, hora y total de eventos.
                                    </div>
                                    <div className="mt-3 text-[9px] font-mono opacity-40 flex items-center gap-1.5">
                                        <m.span
                                            className="w-1.5 h-1.5 bg-green-500 rounded-full"
                                            animate={{opacity: [1, 0.2, 1]}}
                                            transition={{duration: 1.4, repeat: Infinity}}
                                        />
                                        7 días × 24h = 168 celdas
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </m.div>

                    {/* PEOR COMBINACIÓN — static peak summary */}
                    <m.div
                        initial={{opacity: 0, x: 10}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.5}}
                        whileHover={{y: -2}}
                        className="border-2 border-black bg-red-100 px-4 py-3 shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] transition-shadow ring-2 ring-red-600 ring-offset-2 ring-offset-white relative overflow-hidden cursor-default"
                    >
                        {/* PICO badge */}
                        <m.div
                            className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 border-2 border-black z-10 shadow-[2px_2px_0px_0px_black]"
                            initial={{rotate: 8}}
                            animate={{rotate: [8, 4, 12, 8]}}
                            transition={{duration: 2.2, repeat: Infinity, ease: 'easeInOut'}}
                        >
                            PICO
                        </m.div>

                        {/* Shimmer sweep across the panel */}
                        <m.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
                            }}
                            animate={{x: ['-100%', '200%']}}
                            transition={{duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 3}}
                        />

                        <div className="relative">
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                                Peor combinación
                            </div>
                            <div className="font-mono font-black text-sm">
                                {WEEKDAYS_FULL[peak.wd]} · {String(peak.hr).padStart(2, '0')}h
                            </div>
                            <div className="font-black text-2xl italic mt-1 text-red-700 leading-none">
                                <AnimatedCounter value={peak.v}/>
                                <span className="text-[10px] font-mono ml-1.5 opacity-70">eventos</span>
                            </div>
                        </div>
                    </m.div>
                </div>
            </div>

            {/* Bottom: just the legend */}
            <m.div
                initial={{opacity: 0, y: 8}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{delay: 0.6}}
                className="mt-6 border-2 border-black bg-gray-50 px-3 py-2 shadow-[2px_2px_0px_0px_black] flex items-center gap-3 relative z-10 max-w-md"
            >
                <span className="text-[9px] font-black uppercase opacity-70 tracking-widest">menos</span>
                <div className="flex border-2 border-black">
                    {['bg-white','bg-orange-100','bg-orange-200','bg-orange-400','bg-orange-500','bg-red-500','bg-red-700'].map((c, i) => (
                        <m.div
                            key={c}
                            initial={{opacity: 0, scaleY: 0.4}}
                            whileInView={{opacity: 1, scaleY: 1}}
                            viewport={{once: true}}
                            transition={{delay: 0.7 + i * 0.05, duration: 0.3}}
                            className={`w-5 h-3 ${c}`}
                        />
                    ))}
                </div>
                <span className="text-[9px] font-black uppercase opacity-70 tracking-widest">más</span>
            </m.div>
        </section>
    );
};

export default memo(WeeklyHeatmap);
