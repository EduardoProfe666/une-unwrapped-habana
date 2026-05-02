import React, {memo, useEffect, useRef, useState} from 'react';
import {m, useInView, useMotionValue, useMotionValueEvent, useSpring} from 'framer-motion';
import {AlertTriangle, Cpu, Sparkles, Zap} from 'lucide-react';

interface Props {
    probability?: number;
}

interface Verdict {
    label: string;
    sub: string;
    bg: string;
    text: string;
}

const verdict = (p: number): Verdict => {
    if (p >= 80) return {label: 'CASI SEGURO',       sub: 'prepara la vela',     bg: 'bg-red-600',      text: 'text-white'};
    if (p >= 60) return {label: 'MUY PROBABLE',      sub: 'carga el portátil',   bg: 'bg-orange-500',   text: 'text-black'};
    if (p >= 40) return {label: 'PROBABLE',          sub: 'algo va a pasar',     bg: 'bg-yellow-300',   text: 'text-black'};
    if (p >= 20) return {label: 'POCO PROBABLE',     sub: 'crucemos los dedos',  bg: 'bg-lime-300',     text: 'text-black'};
    return                {label: 'MUY POCO PROBABLE', sub: 'disfruta',            bg: 'bg-emerald-500',  text: 'text-white'};
};

const BlackoutPredictor: React.FC<Props> = ({probability = 0}) => {
    // ── Needle: spring-smoothed angle, rendered via SVG transform attribute (deterministic pivot)
    const angleTarget = useMotionValue(-90);
    const angleSpring = useSpring(angleTarget, {stiffness: 90, damping: 12, mass: 0.8});
    const [renderAngle, setRenderAngle] = useState(-90);
    useMotionValueEvent(angleSpring, 'change', setRenderAngle);

    // ── Big % count-up
    const pctMV = useMotionValue(0);
    const pctSpring = useSpring(pctMV, {stiffness: 60, damping: 18, mass: 0.8});
    const [renderPct, setRenderPct] = useState(0);
    useMotionValueEvent(pctSpring, 'change', (v) => setRenderPct(Math.round(v)));

    const sectionRef = useRef<HTMLElement | null>(null);
    const inView = useInView(sectionRef, {once: true, amount: 0.25});

    useEffect(() => {
        if (!inView) return;
        // Wobble cadence — settles on target with a few overshoots
        const target = -90 + (probability / 100) * 180;
        const wobbles = [target - 32, target + 22, target - 12, target + 6, target];
        let i = 0;
        const t = setInterval(() => {
            angleTarget.set(wobbles[i]);
            i++;
            if (i >= wobbles.length) clearInterval(t);
        }, 220);

        // start % count-up after a short delay
        const pctTimer = setTimeout(() => pctMV.set(probability), 380);

        return () => {
            clearInterval(t);
            clearTimeout(pctTimer);
        };
    }, [inView, probability, angleTarget, pctMV]);

    const v = verdict(probability);

    // SVG geometry
    const cx = 150;
    const cy = 150;
    const r = 100;

    // Coloured zones (5 segments)
    const zones = [
        {from: -90, to: -54, color: '#10b981'},  // 0-20
        {from: -54, to: -18, color: '#a3e635'},  // 20-40
        {from: -18, to: 18,  color: '#facc15'},  // 40-60
        {from: 18,  to: 54,  color: '#f97316'},  // 60-80
        {from: 54,  to: 90,  color: '#dc2626'},  // 80-100
    ];

    const polar = (deg: number, dist: number) => {
        const rad = (deg * Math.PI) / 180;
        return {x: cx + Math.cos(rad - Math.PI / 2) * dist, y: cy + Math.sin(rad - Math.PI / 2) * dist};
    };

    const arcPath = (a1: number, a2: number, rad: number) => {
        const p1 = polar(a1, rad);
        const p2 = polar(a2, rad);
        const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
        return `M ${p1.x} ${p1.y} A ${rad} ${rad} 0 ${large} 1 ${p2.x} ${p2.y}`;
    };

    return (
        <section ref={sectionRef} className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Decorative bg cpu */}
            <m.div
                className="absolute -top-6 -right-4 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, 10, 0, -10, 0]}}
                transition={{duration: 8, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Cpu size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{
                                scale: [1, 1.2, 1, 1.1, 1],
                                rotate: [0, 12, -12, 8, 0],
                            }}
                            transition={{
                                duration: 2.4,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                repeatDelay: 0.4,
                            }}
                            className="inline-block text-fuchsia-500"
                            style={{filter: 'drop-shadow(0 0 6px rgba(217,70,239,0.4))'}}
                        >
                            <Sparkles size={28} strokeWidth={2.5}/>
                        </m.span>
                        Apagómetro
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Probabilidad histórica de evento crítico en este día y hora
                    </p>
                </div>
                <m.div
                    initial={{opacity: 0, y: -8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    whileHover={{rotate: [-1, 1, -1]}}
                    transition={{duration: 0.4}}
                    className="bg-yellow-200 border-2 border-black px-3 py-1 text-[10px] font-mono font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_black] flex items-center gap-1.5 cursor-default"
                >
                    <m.span
                        animate={{rotate: [0, -8, 8, 0]}}
                        transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1}}
                        className="inline-block"
                    >
                        <AlertTriangle size={11} strokeWidth={3}/>
                    </m.span>
                    SOLO ENTRETENIMIENTO
                </m.div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center relative z-10">
                {/* Gauge */}
                <div className="lg:col-span-3 flex justify-center relative">
                    <m.svg
                        initial={{opacity: 0, scale: 0.85}}
                        whileInView={{opacity: 1, scale: 1}}
                        viewport={{once: true, amount: 0.3}}
                        transition={{duration: 0.6}}
                        viewBox="0 0 300 200"
                        className="w-full max-w-md h-auto relative"
                    >
                        {/* Coloured zones — drawn in sequence with pathLength */}
                        {zones.map((z, i) => (
                            <m.path
                                key={i}
                                d={arcPath(z.from, z.to, r)}
                                fill="none"
                                stroke={z.color}
                                strokeWidth="20"
                                strokeLinecap="butt"
                                initial={{pathLength: 0}}
                                whileInView={{pathLength: 1}}
                                viewport={{once: true}}
                                transition={{duration: 0.4, delay: 0.1 + i * 0.08, ease: 'easeOut'}}
                            />
                        ))}

                        {/* Major tick marks + numbers at 0/25/50/75/100 — staggered */}
                        {[0, 25, 50, 75, 100].map((p, i) => {
                            const a = -90 + (p / 100) * 180;
                            const inner = polar(a, r - 18);
                            const outer = polar(a, r + 8);
                            return (
                                <m.g
                                    key={i}
                                    initial={{opacity: 0, scale: 0.6}}
                                    whileInView={{opacity: 1, scale: 1}}
                                    viewport={{once: true}}
                                    transition={{delay: 0.5 + i * 0.06, type: 'spring', stiffness: 320, damping: 18}}
                                    style={{transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box'}}
                                >
                                    <line
                                        x1={inner.x} y1={inner.y}
                                        x2={outer.x} y2={outer.y}
                                        stroke="#000" strokeWidth="2"
                                    />
                                    <text
                                        x={polar(a, r + 22).x}
                                        y={polar(a, r + 22).y + 4}
                                        textAnchor="middle"
                                        fontSize="11"
                                        fontFamily="monospace"
                                        fontWeight="900"
                                        fill="#000"
                                    >
                                        {p}
                                    </text>
                                </m.g>
                            );
                        })}

                        {/* Needle — SVG transform attribute keeps pivot exact at (cx, cy) */}
                        <g transform={`rotate(${renderAngle.toFixed(2)} ${cx} ${cy})`}>
                            <line
                                x1={cx} y1={cy}
                                x2={cx} y2={cy - (r - 15)}
                                stroke="#000"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <circle cx={cx} cy={cy - (r - 15)} r={5} fill="#000"/>
                        </g>

                        {/* Hub */}
                        <m.circle
                            cx={cx} cy={cy} r={12}
                            fill="#000"
                            initial={{scale: 0}}
                            whileInView={{scale: 1}}
                            viewport={{once: true}}
                            transition={{delay: 0.8, type: 'spring', stiffness: 300, damping: 18}}
                            style={{transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box'}}
                        />
                        <circle cx={cx} cy={cy} r={5} fill="#fff"/>

                        {/* Big label — count-up driven by spring */}
                        <text
                            x={cx} y={cy + 50}
                            textAnchor="middle"
                            fontSize="36"
                            fontWeight="900"
                            fontStyle="italic"
                            fontFamily="monospace"
                            fill="#000"
                        >
                            {renderPct}<tspan fontSize="14" opacity="0.6">%</tspan>
                        </text>
                    </m.svg>
                </div>

                {/* Verdict */}
                <div className="lg:col-span-2 space-y-3">
                    <m.div
                        initial={{opacity: 0, x: 20, rotate: -2}}
                        whileInView={{opacity: 1, x: 0, rotate: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.3, type: 'spring', stiffness: 220, damping: 18}}
                        whileHover={{y: -2}}
                        className={`${v.bg} ${v.text} border-4 border-black p-4 shadow-[5px_5px_0px_0px_black] hover:shadow-[8px_8px_0px_0px_black] relative overflow-hidden transition-shadow cursor-default`}
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

                        {/* Shimmer sweep across veredict */}
                        <m.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
                            }}
                            animate={{x: ['-100%', '200%']}}
                            transition={{duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 2.5}}
                        />

                        <div className="relative">
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none flex items-center gap-1">
                                <m.span
                                    animate={{rotate: [0, -12, 12, 0]}}
                                    transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8}}
                                    className="inline-block"
                                >
                                    <Zap size={11} strokeWidth={3}/>
                                </m.span>
                                VEREDICTO
                            </div>
                            <m.div
                                initial={{opacity: 0, y: 8}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{delay: 0.5, type: 'spring', stiffness: 280, damping: 18}}
                                className="font-black text-2xl italic mt-1 tracking-tighter"
                            >
                                {v.label}
                            </m.div>
                            <m.div
                                initial={{opacity: 0}}
                                whileInView={{opacity: 0.8}}
                                viewport={{once: true}}
                                transition={{delay: 0.7}}
                                className="text-[10px] font-mono mt-1"
                            >
                                {v.sub}
                            </m.div>
                            <div className="font-black text-4xl italic mt-2 leading-none">
                                {renderPct}
                                <span className="text-base ml-1 opacity-60">%</span>
                            </div>
                        </div>
                    </m.div>

                    <m.div
                        initial={{opacity: 0, y: 8}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.5}}
                        className="bg-black text-white border-2 border-black p-3 text-[10px] font-mono font-black uppercase tracking-widest"
                    >
                        <div className="opacity-70 mb-1 flex items-center gap-1">
                            <m.span
                                className="inline-block w-1.5 h-1.5 bg-yellow-300 rounded-full"
                                animate={{opacity: [1, 0.2, 1]}}
                                transition={{duration: 1.4, repeat: Infinity}}
                            />
                            NOTA TÉCNICA:
                        </div>
                        <p className="text-[10px] font-mono normal-case opacity-80 leading-snug">
                            Calculada del histórico de este año, no es predicción real.
                            Si el SEN está en buen estado: ignora.
                            Si está mal: bueno, ya lo sabes.
                        </p>
                    </m.div>
                </div>
            </div>
        </section>
    );
};

export default memo(BlackoutPredictor);
