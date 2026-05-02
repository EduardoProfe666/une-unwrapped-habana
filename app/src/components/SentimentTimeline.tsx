import React, {memo, useMemo, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {Frown, Heart, Meh, Smile} from 'lucide-react';

interface Props {
    sentimentMonthly?: Record<string, number>;
    primaryColorClass: string;
}

const MONTHS_SHORT = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const moodIcon = (ratio: number) => {
    if (ratio === 0) return null;
    if (ratio < 0.3) return Smile;
    if (ratio < 0.6) return Meh;
    return Frown;
};

const SentimentTimeline: React.FC<Props> = ({sentimentMonthly}) => {
    const [hovered, setHovered] = useState<number | null>(null);

    const values = useMemo(() => {
        return Array.from({length: 12}, (_, i) => sentimentMonthly?.[String(i + 1)] ?? 0);
    }, [sentimentMonthly]);

    const validValues = values.filter(v => v > 0);
    const avg = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
    const peakIdx = values.findIndex(v => v === Math.max(...values, 0) && v > 0);
    const calmIdx = validValues.length > 0 ? values.findIndex(v => v === Math.min(...validValues)) : -1;

    if (!sentimentMonthly || validValues.length === 0) return null;

    // SVG coordinates for the curve
    const w = 600;
    const h = 180;
    const pad = {l: 30, r: 30, t: 20, b: 30};
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    const xAt = (i: number) => pad.l + (i / 11) * innerW;
    const yAt = (v: number) => pad.t + innerH * (1 - v); // 0..1 → top..bottom inverted

    // Path with smooth curves
    const pathPoints = values.map((v, i) => ({x: xAt(i), y: yAt(v)}));
    const linePath = pathPoints
        .map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)
        .join(' ');
    const areaPath = `${linePath} L ${xAt(11)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`;

    const PeakIcon = peakIdx >= 0 ? moodIcon(values[peakIdx]) : null;
    const CalmIcon = calmIdx >= 0 ? moodIcon(values[calmIdx]) : null;

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            <m.div
                className="absolute -top-4 -right-4 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, 6, 0, -6, 0], scale: [1, 1.05, 1]}}
                transition={{duration: 6, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Heart size={200} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{rotate: [0, -8, 8, -4, 4, 0]}}
                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                            className="inline-block"
                        >
                            🤬
                        </m.span>
                        Termómetro de Frustración
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        % de reacciones negativas (👎🤬😱😢) sobre el total mensual
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_SENT</div>
            </header>

            {/* SVG curve */}
            <div className="relative z-10 border-4 border-black bg-gray-50 p-3 shadow-[4px_4px_0px_0px_black]">
                <m.svg
                    initial={{opacity: 0, scale: 0.97}}
                    whileInView={{opacity: 1, scale: 1}}
                    viewport={{once: true, amount: 0.3}}
                    transition={{duration: 0.5}}
                    viewBox={`0 0 ${w} ${h}`}
                    className="w-full h-auto"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="sent-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.55}/>
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.05}/>
                        </linearGradient>
                    </defs>

                    {/* Horizontal grid lines at 25/50/75/100% */}
                    {[0.25, 0.5, 0.75, 1.0].map(p => (
                        <g key={p}>
                            <line
                                x1={pad.l}
                                y1={yAt(p)}
                                x2={w - pad.r}
                                y2={yAt(p)}
                                stroke="#000"
                                strokeOpacity={0.12}
                                strokeDasharray="2 4"
                            />
                            <text
                                x={pad.l - 4}
                                y={yAt(p) + 3}
                                textAnchor="end"
                                fontSize="9"
                                fontFamily="monospace"
                                fill="rgba(0,0,0,0.4)"
                                fontWeight="900"
                            >
                                {Math.round(p * 100)}%
                            </text>
                        </g>
                    ))}

                    {/* Average reference line */}
                    {avg > 0 && (
                        <>
                            <line
                                x1={pad.l}
                                y1={yAt(avg)}
                                x2={w - pad.r}
                                y2={yAt(avg)}
                                stroke="#000"
                                strokeOpacity={0.4}
                                strokeDasharray="6 4"
                            />
                            <text
                                x={w - pad.r}
                                y={yAt(avg) - 4}
                                textAnchor="end"
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="900"
                                fill="#000"
                            >
                                prom {Math.round(avg * 100)}%
                            </text>
                        </>
                    )}

                    {/* Filled area */}
                    <m.path
                        d={areaPath}
                        fill="url(#sent-grad)"
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.8, delay: 0.5}}
                    />

                    {/* Curve */}
                    <m.path
                        d={linePath}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="3"
                        initial={{pathLength: 0}}
                        whileInView={{pathLength: 1}}
                        viewport={{once: true}}
                        transition={{duration: 1.4, ease: [0.22, 1, 0.36, 1]}}
                    />

                    {/* Dots per month */}
                    {values.map((v, i) => {
                        if (v === 0) return null;
                        const isPeak = i === peakIdx;
                        const isCalm = i === calmIdx;
                        const isHovered = hovered === i;
                        return (
                            <g key={i}
                               onMouseEnter={() => setHovered(i)}
                               onMouseLeave={() => setHovered(null)}
                               style={{cursor: 'pointer'}}>
                                {/* Hit area */}
                                <rect
                                    x={xAt(i) - 12}
                                    y={pad.t}
                                    width={24}
                                    height={innerH}
                                    fill="transparent"
                                />
                                <m.circle
                                    cx={xAt(i)}
                                    cy={yAt(v)}
                                    r={isPeak ? 7 : isCalm ? 6 : 4}
                                    fill={isPeak ? '#dc2626' : isCalm ? '#16a34a' : '#000'}
                                    stroke="#000"
                                    strokeWidth="2"
                                    initial={{scale: 0}}
                                    whileInView={{scale: 1}}
                                    viewport={{once: true}}
                                    transition={{delay: 1.2 + i * 0.04, type: 'spring', stiffness: 300}}
                                    animate={isHovered ? {scale: 1.5} : {scale: 1}}
                                />
                                {/* Hover tooltip */}
                                {isHovered && (
                                    <foreignObject x={xAt(i) - 60} y={Math.max(2, yAt(v) - 56)} width={120} height={50}>
                                        <div className="bg-black text-white text-[10px] font-mono font-black px-2 py-1 border-2 border-white shadow-[2px_2px_0px_0px_black] inline-block">
                                            <div className="opacity-60">{MONTHS_FULL[i]}</div>
                                            <div className="text-base italic">{Math.round(v * 100)}%</div>
                                        </div>
                                    </foreignObject>
                                )}
                            </g>
                        );
                    })}

                    {/* Month labels */}
                    {values.map((_, i) => (
                        <text
                            key={i}
                            x={xAt(i)}
                            y={h - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="900"
                            fill={
                                i === peakIdx ? '#dc2626' :
                                i === calmIdx ? '#16a34a' :
                                'rgba(0,0,0,0.4)'
                            }
                        >
                            {MONTHS_SHORT[i]}
                        </text>
                    ))}
                </m.svg>
            </div>

            {/* Stats below */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.3}}
                    whileHover={{y: -2}}
                    className="border-2 border-black bg-gray-50 px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] transition-shadow text-center"
                >
                    <div className="text-[9px] font-black uppercase opacity-60 tracking-widest">Promedio anual</div>
                    <div className="font-black text-2xl italic mt-1">{Math.round(avg * 100)}%</div>
                    <div className="text-[9px] font-mono opacity-50 mt-0.5">% reacciones negativas</div>
                </m.div>

                {peakIdx >= 0 && (
                    <m.div
                        initial={{opacity: 0, y: 8}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.36}}
                        whileHover={{y: -2}}
                        className="border-2 border-black bg-red-100 px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] transition-shadow text-center relative ring-2 ring-red-600 ring-offset-2 ring-offset-white"
                    >
                        <m.span
                            className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 border-2 border-black"
                            animate={{rotate: [0, -4, 4, 0]}}
                            transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                        >
                            PICO
                        </m.span>
                        <div className="text-[9px] font-black uppercase opacity-60 tracking-widest flex items-center justify-center gap-1">
                            {PeakIcon && <PeakIcon size={10} strokeWidth={3}/>}
                            Mes más enojado
                        </div>
                        <div className="font-black text-2xl italic mt-1 text-red-700">{Math.round(values[peakIdx] * 100)}%</div>
                        <div className="text-[9px] font-mono opacity-50 mt-0.5">{MONTHS_FULL[peakIdx]}</div>
                    </m.div>
                )}

                {calmIdx >= 0 && (
                    <m.div
                        initial={{opacity: 0, y: 8}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.42}}
                        whileHover={{y: -2}}
                        className="border-2 border-black bg-emerald-100 px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] transition-shadow text-center"
                    >
                        <div className="text-[9px] font-black uppercase opacity-60 tracking-widest flex items-center justify-center gap-1">
                            {CalmIcon && <CalmIcon size={10} strokeWidth={3}/>}
                            Mes más calmo
                        </div>
                        <div className="font-black text-2xl italic mt-1 text-emerald-700">{Math.round(values[calmIdx] * 100)}%</div>
                        <div className="text-[9px] font-mono opacity-50 mt-0.5">{MONTHS_FULL[calmIdx]}</div>
                    </m.div>
                )}
            </div>
        </section>
    );
};

export default memo(SentimentTimeline);
