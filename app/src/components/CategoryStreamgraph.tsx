import React, {memo, useMemo, useState} from 'react';
import {m} from 'framer-motion';
import {Layers, Waves} from 'lucide-react';
import {AI_CATEGORY_BG_COLORS, AI_CATEGORY_LABELS} from '@/src/lib/constants';

interface Props {
    categoriesMonthly?: Record<string, number[]>;
}

const MONTHS_LETTERS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Convert tailwind bg class to a hex/rgb for SVG fill
const TAILWIND_TO_HEX: Record<string, string> = {
    'bg-red-600': '#dc2626',
    'bg-emerald-500': '#10b981',
    'bg-orange-500': '#f97316',
    'bg-lime-500': '#84cc16',
    'bg-amber-500': '#f59e0b',
    'bg-yellow-500': '#eab308',
    'bg-teal-400': '#2dd4bf',
    'bg-sky-400': '#38bdf8',
    'bg-indigo-400': '#818cf8',
    'bg-fuchsia-500': '#d946ef',
    'bg-violet-500': '#8b5cf6',
    'bg-cyan-400': '#22d3ee',
    'bg-blue-400': '#60a5fa',
    'bg-pink-300': '#f9a8d4',
    'bg-gray-300': '#d1d5db',
};

const CategoryStreamgraph: React.FC<Props> = ({categoriesMonthly}) => {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

    const data = useMemo(() => {
        if (!categoriesMonthly) return [];
        return Object.entries(categoriesMonthly)
            .map(([cat, monthly]) => {
                const total = monthly.reduce((a, b) => a + b, 0);
                return {
                    cat,
                    label: AI_CATEGORY_LABELS[cat] ?? cat,
                    color: TAILWIND_TO_HEX[AI_CATEGORY_BG_COLORS[cat] ?? 'bg-gray-300'] ?? '#d1d5db',
                    monthly,
                    total,
                };
            })
            .filter(c => c.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [categoriesMonthly]);

    if (data.length === 0) return null;

    const w = 800;
    const h = 280;
    const pad = {l: 30, r: 20, t: 20, b: 30};
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    // Compute stacked values per month
    const monthTotals = useMemo(() => {
        return Array.from({length: 12}, (_, i) => data.reduce((s, c) => s + c.monthly[i], 0));
    }, [data]);
    const maxTotal = Math.max(1, ...monthTotals);

    const xAt = (i: number) => pad.l + (i / 11) * innerW;
    const yAt = (v: number) => pad.t + innerH * (1 - v / maxTotal);

    // Build cumulative paths (stacked area)
    const stackedPaths = useMemo(() => {
        const cum = Array(12).fill(0);
        return data.map((c) => {
            const lower = [...cum];
            const upper = cum.map((v, i) => v + c.monthly[i]);
            // Update cum for next category
            for (let i = 0; i < 12; i++) cum[i] = upper[i];

            const upperPts = upper.map((v, i) => `${xAt(i)},${yAt(v)}`);
            const lowerPts = lower.map((v, i) => `${xAt(i)},${yAt(v)}`).reverse();
            return {
                cat: c.cat,
                color: c.color,
                label: c.label,
                total: c.total,
                d: `M ${upperPts.join(' L ')} L ${lowerPts.join(' L ')} Z`,
            };
        });
    }, [data, maxTotal]);

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            <m.div
                className="absolute -top-4 -right-4 opacity-[0.04] pointer-events-none"
                animate={{x: [0, 6, 0, -6, 0]}}
                transition={{duration: 10, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Waves size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{x: [0, 4, 0, -4, 0]}}
                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                            className="inline-block"
                        >
                            <Waves size={28} strokeWidth={3}/>
                        </m.span>
                        Marea de Categorías
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Cómo evoluciona la mezcla de las {data.length} categorías IA mes a mes
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_STREAM</div>
            </header>

            {/* Streamgraph SVG */}
            <div className="border-4 border-black bg-gray-50 p-3 shadow-[4px_4px_0px_0px_black] relative z-10 overflow-x-auto">
                <m.svg
                    initial={{opacity: 0, scale: 0.97}}
                    whileInView={{opacity: 1, scale: 1}}
                    viewport={{once: true, amount: 0.3}}
                    transition={{duration: 0.6}}
                    viewBox={`0 0 ${w} ${h}`}
                    className="w-full h-auto"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Grid */}
                    {[0.25, 0.5, 0.75, 1].map(p => (
                        <line
                            key={p}
                            x1={pad.l}
                            y1={pad.t + innerH * (1 - p)}
                            x2={w - pad.r}
                            y2={pad.t + innerH * (1 - p)}
                            stroke="#000"
                            strokeOpacity={0.1}
                            strokeDasharray="2 4"
                        />
                    ))}

                    {/* Hovered month vertical line */}
                    {hoveredMonth != null && (
                        <line
                            x1={xAt(hoveredMonth)}
                            y1={pad.t}
                            x2={xAt(hoveredMonth)}
                            y2={h - pad.b}
                            stroke="#000"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            opacity={0.5}
                        />
                    )}

                    {/* Stacked areas */}
                    {stackedPaths.map((path, idx) => {
                        const isHovered = hoveredCategory === path.cat;
                        const isOtherHovered = hoveredCategory != null && !isHovered;
                        return (
                            <m.path
                                key={path.cat}
                                d={path.d}
                                fill={path.color}
                                stroke="#000"
                                strokeWidth={1}
                                fillOpacity={isOtherHovered ? 0.15 : isHovered ? 1 : 0.85}
                                initial={{opacity: 0, y: 20}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{
                                    delay: 0.3 + idx * 0.04,
                                    duration: 0.7,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                onMouseEnter={() => setHoveredCategory(path.cat)}
                                onMouseLeave={() => setHoveredCategory(null)}
                                style={{cursor: 'pointer', transition: 'fill-opacity 0.2s ease'}}
                            />
                        );
                    })}

                    {/* Month labels */}
                    {MONTHS_LETTERS.map((m, i) => (
                        <text
                            key={i}
                            x={xAt(i)}
                            y={h - 8}
                            textAnchor="middle"
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="900"
                            fill={hoveredMonth === i ? '#000' : 'rgba(0,0,0,0.5)'}
                        >
                            {m}
                        </text>
                    ))}

                    {/* Y axis ticks */}
                    {[0, 0.5, 1].map(p => (
                        <text
                            key={p}
                            x={pad.l - 4}
                            y={pad.t + innerH * (1 - p) + 3}
                            textAnchor="end"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="900"
                            fill="rgba(0,0,0,0.4)"
                        >
                            {Math.round(maxTotal * p)}
                        </text>
                    ))}

                    {/* Invisible month hit areas */}
                    {Array.from({length: 12}, (_, i) => (
                        <rect
                            key={i}
                            x={xAt(i) - innerW / 24}
                            y={pad.t}
                            width={innerW / 12}
                            height={innerH}
                            fill="transparent"
                            onMouseEnter={() => setHoveredMonth(i)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            style={{cursor: 'crosshair'}}
                        />
                    ))}
                </m.svg>
            </div>

            {/* Hovered month tooltip */}
            {hoveredMonth != null && (
                <m.div
                    initial={{opacity: 0, y: 4}}
                    animate={{opacity: 1, y: 0}}
                    className="mt-4 bg-black text-white p-3 border-2 border-black shadow-[3px_3px_0px_0px_black] inline-block relative z-10"
                >
                    <div className="text-[10px] font-mono font-black uppercase tracking-widest opacity-70 mb-2">
                        {MONTHS_FULL[hoveredMonth]} · {monthTotals[hoveredMonth]} mensajes
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {data
                            .map(c => ({...c, value: c.monthly[hoveredMonth]}))
                            .filter(c => c.value > 0)
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 6)
                            .map(c => (
                                <div key={c.cat} className="flex items-center gap-1.5 text-[10px] font-mono">
                                    <span className="w-2 h-2 border border-white/40 inline-block" style={{background: c.color}}/>
                                    <span className="font-black uppercase tracking-tight truncate">{c.label}</span>
                                    <span className="ml-auto opacity-80">{c.value}</span>
                                </div>
                            ))}
                    </div>
                </m.div>
            )}

            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-1.5 relative z-10">
                <div className="text-[10px] font-black uppercase opacity-60 tracking-widest col-span-full mb-1 flex items-center gap-1.5">
                    <Layers size={11} strokeWidth={3}/> Categorías ({data.length})
                </div>
                {data.map((c, idx) => {
                    const isHovered = hoveredCategory === c.cat;
                    return (
                        <m.button
                            key={c.cat}
                            initial={{opacity: 0, x: -6}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true}}
                            transition={{delay: 0.05 * idx}}
                            onMouseEnter={() => setHoveredCategory(c.cat)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className={`flex items-center gap-2 border-2 border-black px-2 py-1 cursor-pointer transition-all ${
                                isHovered ? 'bg-black text-white shadow-[3px_3px_0px_0px_black]' : 'bg-white shadow-[2px_2px_0px_0px_black] hover:shadow-[3px_3px_0px_0px_black]'
                            }`}
                        >
                            <span
                                className="w-3 h-3 border border-black flex-shrink-0"
                                style={{background: c.color}}
                            />
                            <span className="text-[10px] font-black uppercase tracking-tight truncate flex-1 text-left">
                                {c.label}
                            </span>
                            <span className="text-[9px] font-mono opacity-60">{c.total}</span>
                        </m.button>
                    );
                })}
            </div>
        </section>
    );
};

export default memo(CategoryStreamgraph);
