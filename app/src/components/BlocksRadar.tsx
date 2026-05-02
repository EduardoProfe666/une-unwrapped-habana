import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, m, useInView, useMotionValue, useMotionValueEvent, useSpring} from 'framer-motion';
import {Hexagon, Layers} from 'lucide-react';
import type {BlockAnalysis} from '@/src/lib/types';

interface Props {
    blocks: BlockAnalysis[];
    primaryColorClass: string;
}

const AXES = [
    {key: 'mentions',                   label: 'Menciones'},
    {key: 'declared_affectations',      label: 'Afectaciones'},
    {key: 'declared_recoveries',        label: 'Recuperaciones'},
    {key: 'declared_emergencies',       label: 'Emergencias'},
    {key: 'estimated_affected_seconds', label: 'Tiempo afectado'},
    {key: 'avg_deficit_mw',             label: 'Déficit medio'},
] as const;

const BLOCK_COLORS = [
    {fill: 'fill-red-500',     text: 'text-red-600',     stroke: '#dc2626'},
    {fill: 'fill-orange-500',  text: 'text-orange-600',  stroke: '#f97316'},
    {fill: 'fill-yellow-400',  text: 'text-yellow-700',  stroke: '#eab308'},
    {fill: 'fill-green-500',   text: 'text-green-700',   stroke: '#22c55e'},
    {fill: 'fill-blue-500',    text: 'text-blue-600',    stroke: '#3b82f6'},
    {fill: 'fill-purple-500',  text: 'text-purple-600',  stroke: '#a855f7'},
];

// SVG geometry constants (shared)
const CX = 200;
const CY = 200;
const R = 130;
const angleAt = (i: number, total: number) => (i / total) * Math.PI * 2 - Math.PI / 2;
const polar = (a: number, dist: number) => ({x: CX + Math.cos(a) * dist, y: CY + Math.sin(a) * dist});

// ───────────────────────────────────────────────────────────────────────────
// Block polygon — morphs from center outward via spring-driven progress (0→1)
// instead of CSS scale, so vertices grow toward their actual values like radar.
// ───────────────────────────────────────────────────────────────────────────
interface BlockPolygonProps {
    block: BlockAnalysis;
    blockIdx: number;
    enabled: boolean;
    hoveredNumber: number | null;
    inView: boolean;
    maxByAxis: Record<string, number>;
}

const BlockPolygon: React.FC<BlockPolygonProps> = ({block, blockIdx, enabled, hoveredNumber, inView, maxByAxis}) => {
    const progressMV = useMotionValue(0);
    const progressSpring = useSpring(progressMV, {stiffness: 70, damping: 16, mass: 0.85});
    const [progress, setProgress] = useState(0);
    useMotionValueEvent(progressSpring, 'change', setProgress);

    useEffect(() => {
        if (!enabled) {
            progressMV.set(0);
            return;
        }
        if (!inView) return;
        const t = setTimeout(() => progressMV.set(1), 380 + blockIdx * 110);
        return () => clearTimeout(t);
    }, [inView, enabled, blockIdx, progressMV]);

    const isHovered = hoveredNumber === block.number;
    const isOtherHovered = hoveredNumber != null && hoveredNumber !== block.number;
    const color = BLOCK_COLORS[blockIdx];

    const points = AXES.map((ax, i) => {
        const value = Number((block as unknown as Record<string, number>)[ax.key] ?? 0);
        const target = value / maxByAxis[ax.key];
        const pct = target * progress;
        const p = polar(angleAt(i, AXES.length), R * pct);
        return `${p.x},${p.y}`;
    }).join(' ');

    return (
        <polygon
            points={points}
            fill={color.stroke}
            fillOpacity={!enabled ? 0 : isOtherHovered ? 0.05 : isHovered ? 0.45 : 0.15}
            stroke={color.stroke}
            strokeWidth={isHovered ? 3 : 2}
            strokeOpacity={!enabled ? 0 : isOtherHovered ? 0.2 : 1}
            strokeLinejoin="round"
            style={{transition: 'fill-opacity 0.3s ease, stroke-opacity 0.3s ease, stroke-width 0.2s ease'}}
        />
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Vertex dots + value chips for the hovered block
// ───────────────────────────────────────────────────────────────────────────
interface VertexDotsProps {
    block: BlockAnalysis;
    blockIdx: number;
    maxByAxis: Record<string, number>;
}

const VertexDots: React.FC<VertexDotsProps> = ({block, blockIdx, maxByAxis}) => {
    const color = BLOCK_COLORS[blockIdx];
    return (
        <g>
            {AXES.map((ax, i) => {
                const value = Number((block as unknown as Record<string, number>)[ax.key] ?? 0);
                const pct = value / maxByAxis[ax.key];
                const p = polar(angleAt(i, AXES.length), R * pct);
                return (
                    <g key={i}>
                        {/* Pulsing ping ring */}
                        <m.circle
                            cx={p.x} cy={p.y}
                            r={5}
                            fill="none"
                            stroke={color.stroke}
                            strokeWidth={2}
                            initial={{r: 5, opacity: 0.85}}
                            animate={{r: [5, 16], opacity: [0.85, 0]}}
                            transition={{duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: i * 0.07}}
                        />
                        {/* Solid vertex dot */}
                        <m.circle
                            cx={p.x} cy={p.y}
                            r={5}
                            fill={color.stroke}
                            stroke="#000"
                            strokeWidth={2}
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            exit={{scale: 0}}
                            transition={{type: 'spring', stiffness: 320, damping: 18, delay: i * 0.04}}
                            style={{transformOrigin: `${p.x}px ${p.y}px`, transformBox: 'fill-box'}}
                        />
                    </g>
                );
            })}
        </g>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────────────────────────
const BlocksRadar: React.FC<Props> = ({blocks}) => {
    const [enabled, setEnabled] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));
    const [hovered, setHovered] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const inView = useInView(svgRef, {once: true, amount: 0.25});

    const ordered = useMemo(
        () => [1, 2, 3, 4, 5, 6].map(n => blocks.find(b => b.number === n)).filter(Boolean) as BlockAnalysis[],
        [blocks]
    );

    const maxByAxis = useMemo(() => {
        const max: Record<string, number> = {};
        for (const ax of AXES) {
            max[ax.key] = Math.max(1, ...ordered.map(b => Number((b as unknown as Record<string, number>)[ax.key] ?? 0)));
        }
        return max;
    }, [ordered]);

    const toggle = (n: number) => {
        setEnabled(prev => {
            const next = new Set(prev);
            if (next.has(n)) next.delete(n); else next.add(n);
            return next;
        });
    };

    if (!ordered.length) return null;

    const hoveredBlockIdx = hovered != null ? ordered.findIndex(b => b.number === hovered) : -1;
    const hoveredBlock = hoveredBlockIdx >= 0 ? ordered[hoveredBlockIdx] : null;

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Slow spinning hexagon decoration */}
            <m.div
                className="absolute -top-4 -right-4 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, 360]}}
                transition={{duration: 90, repeat: Infinity, ease: 'linear'}}
            >
                <Hexagon size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{rotate: [0, 60, 120, 60, 0], scale: [1, 1.1, 1, 1.1, 1]}}
                            transition={{duration: 6, repeat: Infinity, ease: 'easeInOut'}}
                            className="inline-block text-emerald-600"
                            style={{filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.3))'}}
                        >
                            <Hexagon size={28} strokeWidth={3}/>
                        </m.span>
                        Radar de Bloques
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Comparativa de los 6 bloques en {AXES.length} dimensiones, normalizada al máximo del año
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_RADAR</div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center relative z-10">
                {/* Radar SVG */}
                <div className="lg:col-span-2 flex justify-center">
                    <m.svg
                        ref={svgRef}
                        initial={{opacity: 0, rotate: -8, scale: 0.92}}
                        whileInView={{opacity: 1, rotate: 0, scale: 1}}
                        viewport={{once: true, amount: 0.3}}
                        transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                        viewBox="0 0 400 400"
                        className="w-full max-w-md h-auto"
                    >
                        {/* Concentric polygons — staggered fade in from inside out */}
                        {[0.25, 0.5, 0.75, 1].map((scale, idx) => {
                            const points = AXES.map((_, i) => {
                                const p = polar(angleAt(i, AXES.length), R * scale);
                                return `${p.x},${p.y}`;
                            }).join(' ');
                            return (
                                <m.polygon
                                    key={idx}
                                    points={points}
                                    fill="none"
                                    stroke="#000"
                                    strokeWidth={idx === 3 ? 2 : 1}
                                    strokeDasharray={idx === 3 ? '0' : '2 4'}
                                    initial={{opacity: 0, scale: 0.5}}
                                    whileInView={{opacity: idx === 3 ? 0.5 : 0.15, scale: 1}}
                                    viewport={{once: true}}
                                    transition={{delay: 0.1 + idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1]}}
                                    style={{transformOrigin: `${CX}px ${CY}px`, transformBox: 'fill-box'}}
                                />
                            );
                        })}

                        {/* Axis lines — drawn from center outward */}
                        {AXES.map((_, i) => {
                            const p = polar(angleAt(i, AXES.length), R);
                            return (
                                <m.line
                                    key={i}
                                    x1={CX} y1={CY}
                                    x2={p.x} y2={p.y}
                                    stroke="#000"
                                    strokeOpacity={0.2}
                                    strokeWidth={1}
                                    initial={{pathLength: 0}}
                                    whileInView={{pathLength: 1}}
                                    viewport={{once: true}}
                                    transition={{delay: 0.4 + i * 0.05, duration: 0.4, ease: 'easeOut'}}
                                />
                            );
                        })}

                        {/* Axis labels — pop in around the perimeter */}
                        {AXES.map((ax, i) => {
                            const labelR = R + 26;
                            const p = polar(angleAt(i, AXES.length), labelR);
                            return (
                                <m.text
                                    key={ax.key}
                                    x={p.x}
                                    y={p.y + 3}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontFamily="monospace"
                                    fontWeight="900"
                                    fill="rgba(0,0,0,0.7)"
                                    initial={{opacity: 0, y: p.y + 13}}
                                    whileInView={{opacity: 1, y: p.y + 3}}
                                    viewport={{once: true}}
                                    transition={{delay: 0.6 + i * 0.06, duration: 0.4}}
                                >
                                    {ax.label}
                                </m.text>
                            );
                        })}

                        {/* Block polygons (animated morph from center) */}
                        {ordered.map((block, blockIdx) => (
                            <BlockPolygon
                                key={block.number}
                                block={block}
                                blockIdx={blockIdx}
                                enabled={enabled.has(block.number)}
                                hoveredNumber={hovered}
                                inView={inView}
                                maxByAxis={maxByAxis}
                            />
                        ))}

                        {/* Hovered block: vertex dots with ping rings */}
                        <AnimatePresence>
                            {hoveredBlock && enabled.has(hoveredBlock.number) && (
                                <VertexDots
                                    key={hoveredBlock.number}
                                    block={hoveredBlock}
                                    blockIdx={hoveredBlockIdx}
                                    maxByAxis={maxByAxis}
                                />
                            )}
                        </AnimatePresence>

                        {/* Center hub: pulsing dot + ping ring */}
                        <m.circle
                            cx={CX} cy={CY}
                            r={4}
                            fill="#000"
                            initial={{scale: 0}}
                            whileInView={{scale: 1}}
                            viewport={{once: true}}
                            transition={{delay: 0.9, type: 'spring', stiffness: 320, damping: 18}}
                            style={{transformOrigin: `${CX}px ${CY}px`, transformBox: 'fill-box'}}
                        />
                        <m.circle
                            cx={CX} cy={CY}
                            r={4}
                            fill="none"
                            stroke="#000"
                            strokeWidth={1.5}
                            initial={{r: 4, opacity: 0.6}}
                            animate={{r: [4, 28], opacity: [0.6, 0]}}
                            transition={{duration: 2.6, repeat: Infinity, ease: 'easeOut'}}
                        />

                        {/* Center text */}
                        <text x={CX} y={CY - 10} textAnchor="middle" fontSize="9" fontWeight="900" fontFamily="monospace" fill="rgba(0,0,0,0.4)">
                            BLOQUES
                        </text>
                        <text x={CX} y={CY + 18} textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="monospace" fill="rgba(0,0,0,0.55)">
                            1—6
                        </text>
                    </m.svg>
                </div>

                {/* Legend / toggles */}
                <div className="space-y-2">
                    <m.div
                        initial={{opacity: 0, y: -4}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2 flex items-center gap-1.5"
                    >
                        <m.span
                            animate={{rotate: [0, 360]}}
                            transition={{duration: 8, repeat: Infinity, ease: 'linear'}}
                            className="inline-block"
                        >
                            <Layers size={11} strokeWidth={3}/>
                        </m.span>
                        Toggle bloques
                    </m.div>
                    {ordered.map((b, idx) => {
                        const color = BLOCK_COLORS[idx];
                        const active = enabled.has(b.number);
                        const isHovered = hovered === b.number;
                        return (
                            <m.button
                                key={b.number}
                                onClick={() => toggle(b.number)}
                                onMouseEnter={() => setHovered(b.number)}
                                onMouseLeave={() => setHovered(null)}
                                initial={{opacity: 0, x: 10}}
                                whileInView={{opacity: 1, x: 0}}
                                viewport={{once: true}}
                                transition={{delay: 0.5 + idx * 0.05, type: 'spring', stiffness: 260, damping: 20}}
                                whileHover={active ? {x: -2, y: -1} : {x: 1}}
                                whileTap={{scale: 0.97}}
                                className={`w-full border-2 border-black px-3 py-2 cursor-pointer transition-all flex items-center gap-2 group relative overflow-hidden
                                    ${active ? 'bg-white shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black]' : 'bg-gray-100 opacity-50 shadow-none'}
                                    ${isHovered && active ? 'ring-2 ring-yellow-300 ring-offset-1' : ''}`}
                            >
                                {/* Subtle scan line over the active button */}
                                {active && (
                                    <m.span
                                        className="absolute inset-y-0 w-8 pointer-events-none"
                                        style={{
                                            background: `linear-gradient(90deg, transparent 0%, ${color.stroke}33 50%, transparent 100%)`,
                                        }}
                                        animate={{x: ['-100%', '600%']}}
                                        transition={{duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 4 + idx * 0.6}}
                                    />
                                )}

                                {/* Color swatch — pulses gently when active */}
                                <m.span
                                    animate={active ? {scale: [1, 1.12, 1]} : {scale: 1}}
                                    transition={active
                                        ? {duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.15}
                                        : undefined
                                    }
                                    className="w-4 h-4 border-2 border-black flex-shrink-0 relative z-10"
                                    style={{background: active ? color.stroke : 'transparent'}}
                                />
                                <span className="text-[11px] font-black uppercase tracking-tight flex-1 text-left relative z-10">
                                    Bloque {b.number}
                                </span>

                                {/* ON/OFF LED */}
                                <span className="text-[9px] font-mono opacity-60 flex items-center gap-1 relative z-10">
                                    {active ? (
                                        <>
                                            <m.span
                                                className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"
                                                animate={{opacity: [1, 0.3, 1]}}
                                                transition={{duration: 1.4, repeat: Infinity, ease: 'easeInOut'}}
                                            />
                                            ON
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"/>
                                            OFF
                                        </>
                                    )}
                                </span>
                            </m.button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default memo(BlocksRadar);
