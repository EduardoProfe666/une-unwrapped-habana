import React, {memo, useMemo, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {Clock, Sunrise, Sun, Sunset, Moon} from 'lucide-react';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    hourOfDaySeverity?: Record<string, number>;
    primaryColorClass: string;
}

const FRANJAS = [
    {label: 'Madrugada', sub: '00-05h', range: [0, 5],   Icon: Moon,    color: 'bg-indigo-200'},
    {label: 'Mañana',    sub: '06-11h', range: [6, 11],  Icon: Sunrise, color: 'bg-yellow-200'},
    {label: 'Tarde',     sub: '12-17h', range: [12, 17], Icon: Sun,     color: 'bg-orange-300'},
    {label: 'Noche',     sub: '18-23h', range: [18, 23], Icon: Sunset,  color: 'bg-purple-300'},
] as const;

const HourOfDayClock: React.FC<Props> = ({hourOfDaySeverity, primaryColorClass}) => {
    const [hoveredHour, setHoveredHour] = useState<number | null>(null);

    const data = useMemo(() => {
        return Array.from({length: 24}, (_, h) => ({
            hour: h,
            count: hourOfDaySeverity?.[String(h)] ?? 0,
        }));
    }, [hourOfDaySeverity]);

    const maxCount = useMemo(() => Math.max(0, ...data.map(d => d.count)), [data]);
    const totalCount = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);
    const peakHour = useMemo(() => data.reduce((p, c) => (c.count > p.count ? c : p), data[0]), [data]);

    const top3 = useMemo(
        () => [...data].filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 3),
        [data]
    );

    const franjas = useMemo(
        () => FRANJAS.map(f => ({
            ...f,
            count: data.slice(f.range[0], f.range[1] + 1).reduce((a, b) => a + b.count, 0),
        })),
        [data]
    );
    const peakFranjaIdx = franjas.reduce(
        (maxI, f, i, arr) => (f.count > arr[maxI].count ? i : maxI), 0
    );

    if (!hourOfDaySeverity || totalCount === 0) return null;

    // SVG geometry
    const cx = 200;
    const cy = 200;
    const innerR = 64;
    const maxBarLen = 110;
    const labelR = innerR + maxBarLen + 18;
    const outerR = innerR + maxBarLen + 4;

    const colorClass = primaryColorClass.replace('bg-', 'stroke-');

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Decorative big clock icon (slow rotate) */}
            <m.div
                className="absolute -top-8 -right-8 opacity-[0.04] pointer-events-none"
                animate={{rotate: 360}}
                transition={{duration: 240, repeat: Infinity, ease: 'linear'}}
            >
                <Clock size={260} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{rotate: [0, 360]}}
                            transition={{duration: 60, repeat: Infinity, ease: 'linear'}}
                            className="inline-block"
                        >
                            <Clock size={28} strokeWidth={3}/>
                        </m.span>
                        Ritmo del Año
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        ¿A qué hora ocurren los eventos críticos?
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_24H</div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center relative z-10">
                {/* Polar chart */}
                <div className="lg:col-span-3 flex justify-center">
                    <m.svg
                        initial={{opacity: 0, scale: 0.85, rotate: -8}}
                        whileInView={{opacity: 1, scale: 1, rotate: 0}}
                        viewport={{once: true, amount: 0.3}}
                        transition={{duration: 0.8, ease: [0.22, 1, 0.36, 1]}}
                        viewBox="0 0 400 400"
                        className="w-full max-w-md h-auto"
                    >
                        <defs>
                            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#fff" stopOpacity="0.18"/>
                                <stop offset="100%" stopColor="#000" stopOpacity="0"/>
                            </radialGradient>
                        </defs>

                        {/* Concentric guide rings (dashed) */}
                        {[0.33, 0.66, 1].map((r, i) => (
                            <circle
                                key={i}
                                cx={cx}
                                cy={cy}
                                r={innerR + maxBarLen * r}
                                fill="none"
                                stroke="#000"
                                strokeOpacity="0.12"
                                strokeWidth="1"
                                strokeDasharray="2 4"
                            />
                        ))}

                        {/* Outer thick ring */}
                        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#000" strokeWidth="3"/>

                        {/* Tick marks: long for cardinal hours, short for the rest */}
                        {Array.from({length: 24}, (_, h) => {
                            const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
                            const isCardinal = h % 6 === 0;
                            const tickInner = outerR;
                            const tickOuter = outerR + (isCardinal ? 8 : 4);
                            const x1 = cx + Math.cos(angle) * tickInner;
                            const y1 = cy + Math.sin(angle) * tickInner;
                            const x2 = cx + Math.cos(angle) * tickOuter;
                            const y2 = cy + Math.sin(angle) * tickOuter;
                            return (
                                <line key={`tick-${h}`}
                                      x1={x1} y1={y1} x2={x2} y2={y2}
                                      stroke="#000"
                                      strokeWidth={isCardinal ? 2 : 1}
                                      strokeOpacity={isCardinal ? 1 : 0.5}/>
                            );
                        })}

                        {/* Bars */}
                        {data.map((d, idx) => {
                            const angle = (d.hour / 24) * Math.PI * 2 - Math.PI / 2;
                            const length = maxCount > 0 ? (d.count / maxCount) * maxBarLen : 0;
                            const isPeak = d.hour === peakHour.hour;
                            const isHovered = hoveredHour === d.hour;

                            // Hovered bars expand 1.15x; peak gets a small constant boost
                            const boost = isHovered ? 1.15 : (isPeak ? 1.06 : 1);
                            const visualLen = length * boost;

                            const x1 = cx + Math.cos(angle) * innerR;
                            const y1 = cy + Math.sin(angle) * innerR;
                            const x2 = cx + Math.cos(angle) * (innerR + visualLen);
                            const y2 = cy + Math.sin(angle) * (innerR + visualLen);

                            const lx = cx + Math.cos(angle) * labelR;
                            const ly = cy + Math.sin(angle) * labelR;

                            const stroke = isPeak ? '#dc2626' : isHovered ? '#f97316' : '#000';
                            const strokeWidth = isPeak ? 9 : isHovered ? 8 : 6;

                            return (
                                <g key={d.hour}
                                   onMouseEnter={() => setHoveredHour(d.hour)}
                                   onMouseLeave={() => setHoveredHour(null)}
                                   style={{cursor: 'pointer'}}>
                                    {/* Hit area (transparent thick line for easier hover) */}
                                    <line
                                        x1={cx + Math.cos(angle) * innerR}
                                        y1={cy + Math.sin(angle) * innerR}
                                        x2={cx + Math.cos(angle) * (innerR + maxBarLen + 14)}
                                        y2={cy + Math.sin(angle) * (innerR + maxBarLen + 14)}
                                        stroke="transparent"
                                        strokeWidth={16}
                                    />

                                    {/* Animated bar (length grows from 0) */}
                                    <m.line
                                        initial={{pathLength: 0, opacity: 0}}
                                        whileInView={{pathLength: 1, opacity: 1}}
                                        viewport={{once: true, amount: 0.3}}
                                        transition={{duration: 0.6, delay: 0.3 + idx * 0.025, ease: [0.22, 1, 0.36, 1]}}
                                        x1={x1} y1={y1}
                                        x2={x2} y2={y2}
                                        stroke={stroke}
                                        className={!isPeak && !isHovered ? colorClass : ''}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="butt"
                                        style={{transition: 'stroke 0.15s ease, stroke-width 0.15s ease'}}
                                    />

                                    {/* Peak marker dot at the tip */}
                                    {isPeak && (
                                        <m.circle
                                            cx={x2}
                                            cy={y2}
                                            r={5}
                                            fill="#dc2626"
                                            stroke="#000"
                                            strokeWidth="2"
                                            initial={{scale: 0}}
                                            whileInView={{scale: 1}}
                                            viewport={{once: true}}
                                            transition={{delay: 1, type: 'spring', stiffness: 400, damping: 16}}
                                        />
                                    )}

                                    {/* Hour label */}
                                    <text
                                        x={lx}
                                        y={ly + 3}
                                        textAnchor="middle"
                                        fontSize={isPeak || isHovered ? 11 : 9}
                                        fontWeight="900"
                                        fontFamily="monospace"
                                        fill={isPeak ? '#dc2626' : isHovered ? '#000' : 'rgba(0,0,0,0.55)'}
                                        style={{transition: 'all 0.15s ease'}}
                                    >
                                        {String(d.hour).padStart(2, '0')}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Center hub */}
                        <m.g
                            initial={{scale: 0, opacity: 0}}
                            whileInView={{scale: 1, opacity: 1}}
                            viewport={{once: true}}
                            transition={{delay: 0.2, type: 'spring', stiffness: 200, damping: 18}}
                        >
                            <circle cx={cx} cy={cy} r={innerR + 2} fill="#000"/>
                            <circle cx={cx} cy={cy} r={innerR} fill="url(#coreGlow)"/>
                            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#fff" strokeOpacity="0.15" strokeWidth="1"/>
                        </m.g>

                        {/* Center label — switches between PEAK / HOVERED */}
                        <g>
                            {hoveredHour != null ? (
                                <m.g
                                    key={`hover-${hoveredHour}`}
                                    initial={{opacity: 0, y: 4}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{duration: 0.15}}
                                >
                                    <text x={cx} y={cy - 12} textAnchor="middle" fontSize="11"
                                          fontWeight="900" fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                                        HORA
                                    </text>
                                    <text x={cx} y={cy + 12} textAnchor="middle" fontSize="26"
                                          fontWeight="900" fontStyle="italic" fill="white">
                                        {String(hoveredHour).padStart(2, '0')}h
                                    </text>
                                    <text x={cx} y={cy + 30} textAnchor="middle" fontSize="9"
                                          fontWeight="900" fill="rgba(255,255,255,0.7)" fontFamily="monospace">
                                        {data[hoveredHour].count} EVT
                                    </text>
                                </m.g>
                            ) : (
                                <m.g
                                    key="peak"
                                    initial={{opacity: 0, y: -4}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{duration: 0.15}}
                                >
                                    <text x={cx} y={cy - 12} textAnchor="middle" fontSize="11"
                                          fontWeight="900" fill="rgba(220,38,38,0.95)" fontFamily="monospace"
                                          letterSpacing="2">
                                        PEAK
                                    </text>
                                    <text x={cx} y={cy + 14} textAnchor="middle" fontSize="28"
                                          fontWeight="900" fontStyle="italic" fill="white">
                                        {String(peakHour.hour).padStart(2, '0')}h
                                    </text>
                                    <text x={cx} y={cy + 32} textAnchor="middle" fontSize="9"
                                          fontWeight="900" fill="rgba(255,255,255,0.7)" fontFamily="monospace">
                                        {peakHour.count} EVT
                                    </text>
                                </m.g>
                            )}
                        </g>

                        {/* Subtle pulsing ring around the core */}
                        <m.circle
                            cx={cx} cy={cy}
                            r={innerR}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth="2"
                            animate={{r: [innerR, innerR + 8], opacity: [0.5, 0]}}
                            transition={{duration: 2, repeat: Infinity, ease: 'easeOut'}}
                        />
                    </m.svg>
                </div>

                {/* Side panel */}
                <div className="lg:col-span-2 space-y-3">
                    {/* Hora pico */}
                    <m.div
                        initial={{opacity: 0, x: 20}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.4}}
                        whileHover={{y: -2}}
                        className="border-4 border-black bg-red-100 p-3 shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] transition-shadow relative overflow-hidden"
                    >
                        {/* Pulse stripes background */}
                        <m.div
                            className="absolute inset-0 pointer-events-none opacity-15"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #dc2626 6px, #dc2626 8px)',
                            }}
                            animate={{backgroundPositionX: ['0px', '20px']}}
                            transition={{duration: 2, repeat: Infinity, ease: 'linear'}}
                        />
                        <div className="relative">
                            <div className="text-[10px] font-black uppercase opacity-70 tracking-widest flex items-center gap-1.5">
                                <m.span
                                    className="w-2 h-2 bg-red-600 rounded-full inline-block"
                                    animate={{scale: [1, 1.4, 1], opacity: [1, 0.5, 1]}}
                                    transition={{duration: 1.4, repeat: Infinity}}
                                />
                                Hora pico
                            </div>
                            <div className="font-black text-3xl italic mt-1">
                                {String(peakHour.hour).padStart(2, '0')}<span className="opacity-60">:00</span>
                            </div>
                            <div className="text-[10px] font-mono mt-1 opacity-70">
                                <AnimatedCounter value={peakHour.count}/> eventos críticos / altos
                            </div>
                        </div>
                    </m.div>

                    {/* Total año */}
                    <m.div
                        initial={{opacity: 0, x: 20}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.5}}
                        whileHover={{y: -2}}
                        className="border-4 border-black bg-gray-50 p-3 shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] transition-shadow"
                    >
                        <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">Total año</div>
                        <div className="font-black text-3xl italic mt-1">
                            <AnimatedCounter value={totalCount}/>
                        </div>
                        <div className="text-[10px] font-mono opacity-60">eventos clasificados como alto/crítico</div>
                    </m.div>

                    {/* Top 3 horas */}
                    {top3.length > 0 && (
                        <m.div
                            initial={{opacity: 0, x: 20}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true}}
                            transition={{delay: 0.6}}
                            className="border-4 border-black bg-white p-3 shadow-[4px_4px_0px_0px_black]"
                        >
                            <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">
                                Top 3 horas
                            </div>
                            <div className="space-y-1.5">
                                {top3.map((t, idx) => {
                                    const pct = peakHour.count > 0 ? (t.count / peakHour.count) * 100 : 0;
                                    const isFirst = idx === 0;
                                    return (
                                        <m.div
                                            key={t.hour}
                                            initial={{opacity: 0, x: -10}}
                                            whileInView={{opacity: 1, x: 0}}
                                            viewport={{once: true}}
                                            transition={{delay: 0.7 + idx * 0.08}}
                                            whileHover={{x: 4}}
                                            onMouseEnter={() => setHoveredHour(t.hour)}
                                            onMouseLeave={() => setHoveredHour(null)}
                                            className="flex items-center gap-2 cursor-pointer group"
                                        >
                                            <span className={`text-[9px] font-mono px-1.5 py-0.5 border-2 border-black leading-none ${isFirst ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>
                                                #{idx + 1}
                                            </span>
                                            <span className="text-xs font-black tracking-tight w-10">
                                                {String(t.hour).padStart(2, '0')}h
                                            </span>
                                            <div className="flex-1 h-2 border-2 border-black bg-gray-50 overflow-hidden shadow-[1px_1px_0_0_black]">
                                                <m.div
                                                    initial={{width: 0}}
                                                    whileInView={{width: `${pct}%`}}
                                                    viewport={{once: true}}
                                                    transition={{duration: 0.7, delay: 0.8 + idx * 0.08, ease: [0.22, 1, 0.36, 1]}}
                                                    className={`h-full ${isFirst ? 'bg-red-600' : primaryColorClass} group-hover:brightness-110 transition-[filter]`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono font-black w-8 text-right">{t.count}</span>
                                        </m.div>
                                    );
                                })}
                            </div>
                        </m.div>
                    )}
                </div>
            </div>

            {/* Day-period breakdown — same visual rhythm as the explorer */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
                {franjas.map((f, idx) => {
                    const isPeak = idx === peakFranjaIdx && f.count > 0;
                    const pctOfTotal = totalCount > 0 ? (f.count / totalCount) * 100 : 0;
                    const Icon = f.Icon;
                    return (
                        <m.div
                            key={f.label}
                            initial={{opacity: 0, y: 8}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true}}
                            transition={{delay: 0.5 + idx * 0.06}}
                            whileHover={{y: -3, rotate: idx % 2 === 0 ? -1 : 1}}
                            className={`${f.color} border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow relative ${isPeak ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-white' : ''}`}
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
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Icon size={12} strokeWidth={3}/>
                                <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                                    {f.label}
                                </div>
                            </div>
                            <div className="text-[9px] font-mono opacity-50 leading-none truncate">{f.sub}</div>
                            <div className="font-black text-2xl leading-tight italic mt-2">
                                <AnimatedCounter value={f.count}/>
                            </div>
                            <div className="text-[8px] font-mono opacity-40 mt-0.5">
                                {pctOfTotal.toFixed(0)}% del total
                            </div>
                        </m.div>
                    );
                })}
            </div>
        </section>
    );
};

export default memo(HourOfDayClock);
