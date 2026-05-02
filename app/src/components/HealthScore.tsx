import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {m, useInView, useMotionValue, useMotionValueEvent, useSpring} from 'framer-motion';
import {Activity, AlertOctagon, CheckCircle2, Circle, HeartPulse, ShieldCheck, Skull} from 'lucide-react';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    score: number;
    breakdown?: Record<string, number>;
}

const COMPONENT_LABELS: Record<string, {label: string; sub: string; weight: number}> = {
    clean_pct:       {label: 'Días limpios',       sub: 'sin eventos altos/críticos',     weight: 30},
    recovery_ratio:  {label: 'Recuperaciones',     sub: 'ratio recoveries/affectations',  weight: 25},
    sen_penalty:     {label: 'Estabilidad SEN',    sub: 'menos desconexiones totales',    weight: 25},
    sentiment_score: {label: 'Sentimiento',        sub: 'reacciones positivas vs negativas', weight: 20},
};

interface ScoreMeta {
    label: string;
    color: string;
    bg: string;
    Icon: React.FC<{size?: number; strokeWidth?: number; className?: string}>;
}

const scoreLabel = (s: number): ScoreMeta => {
    if (s >= 80) return {label: 'EXCELENTE', color: 'text-emerald-700', bg: 'bg-emerald-400', Icon: CheckCircle2};
    if (s >= 60) return {label: 'BUENO',     color: 'text-lime-700',    bg: 'bg-lime-400',    Icon: Activity};
    if (s >= 40) return {label: 'REGULAR',   color: 'text-amber-700',   bg: 'bg-amber-400',   Icon: Circle};
    if (s >= 20) return {label: 'CRÍTICO',   color: 'text-orange-700',  bg: 'bg-orange-500',  Icon: AlertOctagon};
    return                {label: 'COLAPSO',   color: 'text-red-700',     bg: 'bg-red-600',     Icon: Skull};
};

const HealthScore: React.FC<Props> = ({score, breakdown}) => {
    const meta = useMemo(() => scoreLabel(score), [score]);

    // SVG arc geometry
    const cx = 100;
    const cy = 110;
    const radius = 80;
    const startAngle = -210;
    const endAngle = 30;
    const totalSweep = endAngle - startAngle;
    const valueAngle = startAngle + (score / 100) * totalSweep;
    const angleRange = valueAngle - startAngle;

    const polarPoint = (angleDeg: number, r: number) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
    };

    const arcPath = (a1: number, a2: number, r: number) => {
        const p1 = polarPoint(a1, r);
        const p2 = polarPoint(a2, r);
        const large = a2 - a1 > 180 ? 1 : 0;
        return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
    };

    // ── Animated needle (SVG transform attribute, pivot at cx,cy — reliable across browsers)
    const needleRot = useMotionValue(0);
    const needleSpring = useSpring(needleRot, {stiffness: 55, damping: 14, mass: 1});
    const [needleAngle, setNeedleAngle] = useState(0);
    useMotionValueEvent(needleSpring, 'change', setNeedleAngle);

    // ── Animated score number (count-up inside SVG <text>)
    const scoreMV = useMotionValue(0);
    const scoreSpring = useSpring(scoreMV, {stiffness: 60, damping: 18, mass: 0.8});
    const [renderScore, setRenderScore] = useState(0);
    useMotionValueEvent(scoreSpring, 'change', (v) => setRenderScore(Math.round(v)));

    const svgRef = useRef<SVGSVGElement | null>(null);
    const inView = useInView(svgRef, {once: true, amount: 0.3});

    useEffect(() => {
        if (!inView) return;
        const t1 = setTimeout(() => needleRot.set(angleRange), 280);
        const t2 = setTimeout(() => scoreMV.set(score), 320);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [inView, angleRange, needleRot, score, scoreMV]);

    const startTip = polarPoint(startAngle, radius - 22);

    const breakdownEntries = useMemo(
        () => breakdown
            ? Object.entries(breakdown).map(([k, v]) => ({
                key: k,
                value: v,
                meta: COMPONENT_LABELS[k] ?? {label: k, sub: '', weight: 0},
            }))
            : [],
        [breakdown]
    );

    // Stronger movement on the status pill icon when score is bad
    const isAlarming = score < 40;

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            <m.div
                className="absolute -top-6 -right-4 opacity-[0.04] pointer-events-none"
                animate={{scale: [1, 1.06, 1]}}
                transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
            >
                <HeartPulse size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        {/* Heart with realistic ECG pulse pattern: rest, lub-dub, rest */}
                        <m.span
                            animate={{scale: [1, 1, 1.32, 1, 1.18, 1, 1, 1]}}
                            transition={{
                                duration: 1.4,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                times: [0, 0.18, 0.26, 0.34, 0.42, 0.5, 0.7, 1],
                            }}
                            className="inline-block text-red-600"
                        >
                            <HeartPulse size={28} strokeWidth={3}/>
                        </m.span>
                        Health Score del SEN
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Salud global del sistema en una sola métrica del 0 al 100
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_HEALTH</div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center relative z-10">
                {/* Gauge */}
                <div className="lg:col-span-2 flex justify-center relative">
                    <m.svg
                        ref={svgRef}
                        initial={{opacity: 0, scale: 0.85}}
                        whileInView={{opacity: 1, scale: 1}}
                        viewport={{once: true, amount: 0.3}}
                        transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
                        viewBox="0 0 200 200"
                        className="w-full max-w-xs h-auto relative"
                    >
                        {/* Background arc (full track) */}
                        <path
                            d={arcPath(startAngle, endAngle, radius)}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="14"
                            strokeLinecap="butt"
                        />

                        {/* Tick marks (staggered fade-in) */}
                        {Array.from({length: 11}, (_, i) => {
                            const a = startAngle + (i / 10) * totalSweep;
                            const inner = polarPoint(a, radius - 14);
                            const outer = polarPoint(a, radius + 4);
                            return (
                                <m.line
                                    key={i}
                                    x1={inner.x}
                                    y1={inner.y}
                                    x2={outer.x}
                                    y2={outer.y}
                                    stroke="#000"
                                    strokeWidth={i === 0 || i === 10 || i === 5 ? 2 : 1}
                                    initial={{opacity: 0}}
                                    whileInView={{opacity: i % 2 === 0 ? 0.7 : 0.3}}
                                    viewport={{once: true}}
                                    transition={{delay: 0.3 + i * 0.04, duration: 0.25}}
                                />
                            );
                        })}

                        {/* Value arc — animated draw with pathLength */}
                        <m.path
                            d={arcPath(startAngle, valueAngle, radius)}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="14"
                            strokeLinecap="butt"
                            className={meta.color}
                            initial={{pathLength: 0}}
                            whileInView={{pathLength: 1}}
                            viewport={{once: true}}
                            transition={{duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.25}}
                        />


                        {/* Needle group — rotated via SVG transform attribute (pivots at cx,cy) */}
                        <g transform={`rotate(${needleAngle.toFixed(2)} ${cx} ${cy})`}>
                            <line
                                x1={cx}
                                y1={cy}
                                x2={startTip.x}
                                y2={startTip.y}
                                stroke="#000"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* Tip dot for personality */}
                            <circle cx={startTip.x} cy={startTip.y} r={3.5} fill="#000"/>
                        </g>

                        {/* Needle hub */}
                        <circle cx={cx} cy={cy} r={6} fill="#000"/>
                        <circle cx={cx} cy={cy} r={3} fill="#fff"/>

                        {/* Score value text (live count-up) */}
                        <text
                            x={cx} y={cy + 36}
                            textAnchor="middle"
                            fontSize="32"
                            fontWeight="900"
                            fontFamily="monospace"
                            fill="#000"
                        >
                            {renderScore}
                        </text>
                        <text x={cx} y={cy + 52} textAnchor="middle" fontSize="9" fontWeight="900" fill="rgba(0,0,0,0.5)" fontFamily="monospace" letterSpacing="2">
                            / 100
                        </text>

                        {/* Legend ticks */}
                        <text x={polarPoint(startAngle, radius + 18).x} y={polarPoint(startAngle, radius + 18).y} textAnchor="middle" fontSize="9" fontWeight="900" fontFamily="monospace" fill="#dc2626">0</text>
                        <text x={polarPoint(endAngle, radius + 18).x} y={polarPoint(endAngle, radius + 18).y} textAnchor="middle" fontSize="9" fontWeight="900" fontFamily="monospace" fill="#16a34a">100</text>
                    </m.svg>
                </div>

                {/* Score badge + breakdown */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Status pill */}
                    <m.div
                        initial={{opacity: 0, x: 20, rotate: -2}}
                        whileInView={{opacity: 1, x: 0, rotate: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.3, type: 'spring', stiffness: 220, damping: 18}}
                        whileHover={{y: -2}}
                        className={`${meta.bg} border-4 border-black px-4 py-3 shadow-[5px_5px_0px_0px_black] hover:shadow-[8px_8px_0px_0px_black] transition-shadow flex items-center justify-between gap-3 relative overflow-hidden cursor-default`}
                    >
                        {/* Diagonal stripes */}
                        <m.div
                            className="absolute inset-0 pointer-events-none opacity-15"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, currentColor 8px, currentColor 9px)',
                            }}
                            animate={{backgroundPositionX: ['0px', '17px']}}
                            transition={{duration: 5, repeat: Infinity, ease: 'linear'}}
                        />

                        {/* Shimmer sweep — only when alarming */}
                        {isAlarming && (
                            <m.div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)',
                                }}
                                animate={{x: ['-100%', '200%']}}
                                transition={{duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1.6}}
                            />
                        )}

                        <div className="relative flex items-center gap-3">
                            <m.div
                                animate={isAlarming
                                    ? {rotate: [0, -8, 8, 0], scale: [1, 1.15, 1]}
                                    : {scale: [1, 1.06, 1]}
                                }
                                transition={{
                                    duration: isAlarming ? 1.2 : 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="flex items-center"
                            >
                                <meta.Icon size={28} strokeWidth={3}/>
                            </m.div>
                            <div>
                                <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">Estado del año</div>
                                <div className="font-black text-2xl italic mt-0.5 tracking-tighter leading-none">{meta.label}</div>
                            </div>
                        </div>
                        <div className="relative font-black text-4xl italic">
                            <AnimatedCounter value={score}/>
                            <span className="text-base ml-1 opacity-60">/100</span>
                        </div>
                    </m.div>

                    {/* Breakdown */}
                    {breakdownEntries.length > 0 && (
                        <div className="bg-gray-50 border-2 border-black p-4 shadow-[3px_3px_0px_0px_black]">
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-3 flex items-center gap-1.5">
                                <m.span
                                    animate={{rotate: [0, 360]}}
                                    transition={{duration: 8, repeat: Infinity, ease: 'linear'}}
                                    className="inline-block"
                                >
                                    <Activity size={11} strokeWidth={3}/>
                                </m.span>
                                Componentes del score
                            </div>
                            <div className="space-y-3">
                                {breakdownEntries.map((entry, idx) => {
                                    const pct = Math.max(0, Math.min(100, entry.value));
                                    const barColor =
                                        pct >= 70 ? 'bg-emerald-500' :
                                        pct >= 40 ? 'bg-yellow-400' :
                                        'bg-red-500';
                                    return (
                                        <m.div
                                            key={entry.key}
                                            initial={{opacity: 0, x: -10}}
                                            whileInView={{opacity: 1, x: 0}}
                                            viewport={{once: true}}
                                            transition={{delay: 0.4 + idx * 0.06}}
                                            whileHover={{x: 2}}
                                            className="group cursor-default"
                                        >
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-[11px] font-black uppercase tracking-tight">
                                                    {entry.meta.label}
                                                    <span className="text-[9px] font-mono ml-1.5 opacity-50">({entry.meta.weight}%)</span>
                                                </span>
                                                <span className="text-[10px] font-mono">
                                                    <span className="font-black text-black">
                                                        <AnimatedCounter value={pct}/>
                                                    </span>
                                                    <span className="opacity-50">/100</span>
                                                </span>
                                            </div>
                                            <div className="h-2.5 border-2 border-black bg-white relative overflow-hidden shadow-[1px_1px_0_0_black]">
                                                <m.div
                                                    initial={{width: 0}}
                                                    whileInView={{width: `${pct}%`}}
                                                    viewport={{once: true}}
                                                    transition={{duration: 0.9, delay: 0.5 + idx * 0.06, ease: [0.22, 1, 0.36, 1]}}
                                                    className={`h-full ${barColor} group-hover:brightness-110 transition-[filter] relative overflow-hidden`}
                                                >
                                                    {/* Gleam sweep across the bar after fill */}
                                                    <m.div
                                                        className="absolute inset-0"
                                                        style={{
                                                            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)',
                                                        }}
                                                        initial={{x: '-100%'}}
                                                        whileInView={{x: '200%'}}
                                                        viewport={{once: true}}
                                                        transition={{duration: 1.0, delay: 1.4 + idx * 0.08, ease: 'easeOut'}}
                                                    />
                                                    {/* Tip pulse — small bright edge once filled */}
                                                    <m.div
                                                        className="absolute right-0 top-0 bottom-0 w-1 bg-white/80"
                                                        initial={{opacity: 0}}
                                                        whileInView={{opacity: [0, 1, 0]}}
                                                        viewport={{once: true}}
                                                        transition={{duration: 0.6, delay: 1.4 + idx * 0.08, ease: 'easeOut'}}
                                                    />
                                                </m.div>
                                            </div>
                                            <div className="text-[9px] font-mono opacity-50 mt-0.5 group-hover:opacity-90 transition-opacity">
                                                {entry.meta.sub}
                                            </div>
                                        </m.div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-3 border-t-2 border-dashed border-black/20 text-[9px] font-mono opacity-60 flex items-start gap-1.5">
                                <ShieldCheck size={11} strokeWidth={3} className="mt-0.5 flex-shrink-0"/>
                                <span>
                                    Score calculado a partir de afectaciones, recuperaciones, desconexiones del SEN y reacciones del público.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default memo(HealthScore);
