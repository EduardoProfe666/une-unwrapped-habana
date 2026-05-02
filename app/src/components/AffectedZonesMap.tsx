import React, {memo, useMemo, useState} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {AlertTriangle, Building2, Crown, ExternalLink, MapPinned, Network, Radar} from 'lucide-react';
import type {AffectedZone} from '@/src/lib/types';
import {CUBA_PROVINCES_GEOM, HAVANA_MUNICIPALITIES_ORDER} from '@/src/lib/constants';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    zones?: AffectedZone[];
    primaryColorClass: string;
}

type Metric = 'mentions' | 'affectations' | 'recoveries';

const METRIC_LABELS: Record<Metric, string> = {
    mentions: 'MENCIONES',
    affectations: 'AFECTACIONES',
    recoveries: 'RECUPERACIONES',
};

const METRIC_HEX: Record<Metric, string[]> = {
    // 6 hex steps from light to dark per metric (used in SVG fills)
    mentions:     ['#fff', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'],
    affectations: ['#fff', '#fee2e2', '#fecaca', '#f87171', '#dc2626', '#7f1d1d'],
    recoveries:   ['#fff', '#dcfce7', '#bbf7d0', '#4ade80', '#16a34a', '#14532d'],
};

const METRIC_TAILWIND: Record<Metric, string[]> = {
    mentions:     ['bg-white', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-blue-800'],
    affectations: ['bg-white', 'bg-red-100', 'bg-red-200', 'bg-red-400', 'bg-red-600', 'bg-red-800'],
    recoveries:   ['bg-white', 'bg-green-100', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'],
};

const intensityIndex = (value: number, max: number): number => {
    if (max === 0 || value === 0) return 0;
    const ratio = value / max;
    if (ratio < 0.1) return 1;
    if (ratio < 0.3) return 2;
    if (ratio < 0.55) return 3;
    if (ratio < 0.8) return 4;
    return 5;
};

const AffectedZonesMap: React.FC<Props> = ({zones, primaryColorClass}) => {
    const [metric, setMetric] = useState<Metric>('affectations');
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
    const [hoveredMuni, setHoveredMuni] = useState<string | null>(null);

    const provinces = useMemo(() => zones?.filter(z => z.kind === 'province') ?? [], [zones]);
    const municipalities = useMemo(() => zones?.filter(z => z.kind === 'municipality') ?? [], [zones]);
    const circuits = useMemo(() => zones?.filter(z => z.kind === 'circuit').slice(0, 12) ?? [], [zones]);

    const provinceMap = useMemo(() => {
        const m: Record<string, AffectedZone> = {};
        for (const z of provinces) m[z.name] = z;
        return m;
    }, [provinces]);

    const municipalityMap = useMemo(() => {
        const m: Record<string, AffectedZone> = {};
        for (const z of municipalities) m[z.name] = z;
        return m;
    }, [municipalities]);

    const provincesMaxValue = useMemo(
        () => Math.max(0, ...provinces.map(p => p[metric])),
        [provinces, metric]
    );
    const municipalitiesMaxValue = useMemo(
        () => Math.max(0, ...municipalities.map(p => p[metric])),
        [municipalities, metric]
    );

    const sortedProvinces = useMemo(
        () => [...provinces].sort((a, b) => b[metric] - a[metric]),
        [provinces, metric]
    );
    const sortedMunis = useMemo(
        () => [...municipalities].sort((a, b) => b[metric] - a[metric]),
        [municipalities, metric]
    );
    const topProvince = sortedProvinces[0];
    const topMuni = sortedMunis[0];

    // Province with hover info / fallback to top
    const focusedProvince = hoveredProvince
        ? provinceMap[hoveredProvince]
        : topProvince;

    if (!zones || zones.length === 0) return null;

    const palette = METRIC_HEX[metric];
    const tw = METRIC_TAILWIND[metric];

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Decorative bg icon */}
            <m.div
                className="absolute -top-6 -right-4 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, 6, 0, -6, 0]}}
                transition={{duration: 16, repeat: Infinity, ease: 'easeInOut'}}
            >
                <MapPinned size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-4 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{y: [0, -4, 0]}}
                            transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut'}}
                            className="inline-block"
                        >
                            <MapPinned size={28} strokeWidth={3}/>
                        </m.span>
                        Mapa de Afectaciones
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Provincias y municipios mencionados por la IA en cada mensaje
                    </p>
                </div>

                {/* Metric toggle */}
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(METRIC_LABELS) as Metric[]).map((mk, idx) => {
                        const active = metric === mk;
                        return (
                            <m.button
                                key={mk}
                                onClick={() => setMetric(mk)}
                                initial={{opacity: 0, y: 10}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{delay: 0.05 * idx}}
                                whileTap={{scale: 0.96}}
                                className={`relative px-3 py-1.5 cursor-pointer text-[10px] font-black uppercase tracking-widest border-2 border-black transition-all
                                    ${active
                                        ? `${primaryColorClass} text-white shadow-[1px_1px_0px_0px_black] translate-x-0.5 translate-y-0.5`
                                        : 'bg-white text-black shadow-[3px_3px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'}
                                    duration-150`}
                            >
                                {METRIC_LABELS[mk]}
                                {active && (
                                    <m.span
                                        layoutId="metric-active-bar"
                                        className="absolute -bottom-1 left-1 right-1 h-1 bg-yellow-300 border-x-2 border-b-2 border-black"
                                    />
                                )}
                            </m.button>
                        );
                    })}
                </div>
            </header>

            {/* Scope disclaimer — explains data only covers the Havana UNE Telegram channel */}
            <m.a
                href="https://t.me/EmpresaElectricaDeLaHabana"
                target="_blank"
                rel="noopener noreferrer"
                initial={{opacity: 0, x: -10}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                transition={{delay: 0.1}}
                className="group relative block bg-yellow-200 border-2 border-black px-3 py-2 mb-6 shadow-[3px_3px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden z-10"
            >
                {/* Animated stripes background */}
                <m.div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(45deg, transparent, transparent 8px, #000 8px, #000 9px)',
                    }}
                    animate={{backgroundPositionX: ['0px', '17px']}}
                    transition={{duration: 4, repeat: Infinity, ease: 'linear'}}
                />
                <div className="relative flex items-start gap-2">
                    <m.span
                        animate={{rotate: [0, -8, 8, 0]}}
                        transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut'}}
                        className="flex-shrink-0 mt-0.5"
                    >
                        <AlertTriangle size={14} strokeWidth={3}/>
                    </m.span>
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-widest leading-tight">
                            Alcance de los datos
                        </div>
                        <div className="text-[10px] md:text-[11px] font-bold leading-snug mt-0.5">
                            Solo se analizan los mensajes del canal de Telegram de la <span className="bg-black text-yellow-300 px-1 font-mono uppercase">Empresa Eléctrica de La Habana</span>.
                            Las afectaciones del resto del país solo aparecen cuando el canal habanero las menciona.
                        </div>
                    </div>
                    <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-widest border-2 border-black bg-black text-yellow-300 px-2 py-1 group-hover:bg-yellow-300 group-hover:text-black transition-colors flex-shrink-0">
                        @EmpresaElectricaDeLaHabana <ExternalLink size={10}/>
                    </span>
                </div>
            </m.a>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Cuba SVG map */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-50 border-4 border-black p-4 shadow-[6px_6px_0px_0px_black] relative">
                        <span className="absolute -top-3 left-4 bg-black text-white text-[10px] font-black px-2 py-0.5 tracking-widest uppercase">
                            CUBA
                        </span>

                        {/* Floating tooltip on top of map */}
                        <AnimatePresence>
                            {focusedProvince && (
                                <m.div
                                    key={focusedProvince.name + metric}
                                    initial={{opacity: 0, y: -4}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -4}}
                                    transition={{duration: 0.15}}
                                    className="absolute top-3 right-3 bg-black text-white px-3 py-1.5 border-2 border-white shadow-[3px_3px_0px_0px_black] z-10"
                                >
                                    <div className="text-[9px] font-mono opacity-60 uppercase tracking-widest leading-none flex items-center gap-1.5">
                                        {hoveredProvince ? <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full"/> : <Crown size={10}/>}
                                        {hoveredProvince ? 'HOVER' : 'TOP'}
                                    </div>
                                    <div className="font-black text-sm mt-0.5">{focusedProvince.name}</div>
                                    <div className="text-[10px] font-mono opacity-80">
                                        {focusedProvince[metric]} {METRIC_LABELS[metric].toLowerCase()}
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>

                        <m.svg
                            initial={{opacity: 0, scale: 0.95}}
                            whileInView={{opacity: 1, scale: 1}}
                            viewport={{once: true, amount: 0.3}}
                            transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
                            viewBox="0 0 100 40"
                            className="w-full h-auto"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <defs>
                                <pattern id="dots" width="2" height="2" patternUnits="userSpaceOnUse">
                                    <circle cx="1" cy="1" r="0.2" fill="rgba(0,0,0,0.15)"/>
                                </pattern>
                            </defs>
                            <rect x="0" y="0" width="100" height="40" fill="url(#dots)"/>

                            {CUBA_PROVINCES_GEOM.map((p, idx) => {
                                const z = provinceMap[p.canonical];
                                const value = z?.[metric] ?? 0;
                                const intensityIdx = intensityIndex(value, provincesMaxValue);
                                const fill = palette[intensityIdx];
                                const isHovered = hoveredProvince === p.canonical;
                                const isTop = topProvince?.name === p.canonical && value > 0;
                                const showLight = intensityIdx >= 4; // text white on dark fills

                                return (
                                    <m.g
                                        key={p.canonical}
                                        initial={{opacity: 0, scale: 0.6}}
                                        whileInView={{opacity: 1, scale: 1}}
                                        viewport={{once: true, amount: 0.3}}
                                        transition={{delay: 0.1 + idx * 0.025, type: 'spring', stiffness: 300, damping: 22}}
                                        onMouseEnter={() => setHoveredProvince(p.canonical)}
                                        onMouseLeave={() => setHoveredProvince(null)}
                                        style={{cursor: 'pointer', transformOrigin: `${p.x + p.w / 2}px ${p.y + p.h / 2}px`}}
                                    >
                                        <m.rect
                                            x={p.x}
                                            y={p.y}
                                            width={p.w}
                                            height={p.h}
                                            fill={fill}
                                            stroke={isHovered || isTop ? '#000' : '#1f2937'}
                                            strokeWidth={isHovered || isTop ? 0.6 : 0.35}
                                            animate={isHovered ? {scale: 1.06} : {scale: 1}}
                                            style={{transformOrigin: `${p.x + p.w / 2}px ${p.y + p.h / 2}px`}}
                                            transition={{type: 'spring', stiffness: 300, damping: 18}}
                                        />
                                        {isTop && value > 0 && (
                                            <m.circle
                                                cx={p.x + p.w - 1}
                                                cy={p.y + 1}
                                                r={0.7}
                                                fill="#fde047"
                                                stroke="#000"
                                                strokeWidth={0.2}
                                                animate={{scale: [1, 1.4, 1]}}
                                                transition={{duration: 1.4, repeat: Infinity}}
                                            />
                                        )}
                                        <text
                                            x={p.x + p.w / 2}
                                            y={p.y + p.h / 2 + 0.6}
                                            textAnchor="middle"
                                            fontSize="2.2"
                                            fontWeight="900"
                                            fill={showLight ? '#fff' : '#000'}
                                            className="font-mono pointer-events-none select-none"
                                        >
                                            {p.label}
                                        </text>
                                        <title>{`${p.canonical}: ${value} ${METRIC_LABELS[metric].toLowerCase()}`}</title>
                                    </m.g>
                                );
                            })}
                        </m.svg>

                        {/* Intensity legend */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono font-black uppercase opacity-50">menos</span>
                            <div className="flex gap-0 border-2 border-black shadow-[2px_2px_0_0_black]">
                                {palette.map((c, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-3"
                                        style={{background: c}}
                                        title={`Intensidad ${i}/${palette.length - 1}`}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] font-mono font-black uppercase opacity-50">más</span>
                            <div className="ml-auto text-[9px] font-mono opacity-50 hidden sm:block">
                                escala relativa por <span className="text-black font-black uppercase">{METRIC_LABELS[metric].toLowerCase()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top province ranking */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sortedProvinces.slice(0, 6).map((p, idx) => {
                            const isTop = idx === 0;
                            return (
                                <m.div
                                    key={p.name}
                                    initial={{opacity: 0, y: 8}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{delay: 0.05 * idx}}
                                    whileHover={{y: -2, rotate: idx % 2 === 0 ? -1 : 1}}
                                    onMouseEnter={() => setHoveredProvince(p.name)}
                                    onMouseLeave={() => setHoveredProvince(null)}
                                    className={`border-2 border-black p-2 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] transition-shadow cursor-default relative ${isTop ? 'bg-yellow-100 ring-2 ring-yellow-500 ring-offset-1 ring-offset-white' : 'bg-gray-50'}`}
                                >
                                    {isTop && (
                                        <m.span
                                            className="absolute -top-2 -right-2 bg-yellow-300 text-black text-[8px] font-black uppercase px-1.5 py-0.5 border-2 border-black flex items-center gap-0.5"
                                            animate={{rotate: [0, -4, 4, 0]}}
                                            transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                                        >
                                            <Crown size={8} strokeWidth={3}/> TOP
                                        </m.span>
                                    )}
                                    <div className="text-[9px] font-mono uppercase opacity-50 tracking-wider truncate flex items-center gap-1">
                                        <span className="font-black">#{idx + 1}</span> {p.name}
                                    </div>
                                    <div className="font-black text-xl italic leading-none mt-0.5">
                                        <AnimatedCounter value={p[metric]}/>
                                    </div>
                                    <div className="text-[8px] font-bold opacity-40 uppercase">
                                        {METRIC_LABELS[metric]}
                                    </div>
                                </m.div>
                            );
                        })}
                    </div>
                </div>

                {/* Havana municipalities grid */}
                <div className="space-y-4">
                    <div className="bg-gray-50 border-4 border-black p-4 shadow-[6px_6px_0px_0px_black] relative">
                        <span className="absolute -top-3 left-4 bg-black text-white text-[10px] font-black px-2 py-0.5 tracking-widest uppercase">
                            LA HABANA · MUNI
                        </span>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {HAVANA_MUNICIPALITIES_ORDER.map((name, idx) => {
                                const z = municipalityMap[name];
                                const value = z?.[metric] ?? 0;
                                const intensityIdx = intensityIndex(value, municipalitiesMaxValue);
                                const cls = tw[intensityIdx];
                                const isTop = topMuni?.name === name && value > 0;
                                const showLight = intensityIdx >= 4;

                                return (
                                    <m.div
                                        key={name}
                                        initial={{opacity: 0, scale: 0.8}}
                                        whileInView={{opacity: 1, scale: 1}}
                                        viewport={{once: true}}
                                        transition={{delay: 0.05 + idx * 0.03, type: 'spring', stiffness: 300, damping: 20}}
                                        whileHover={{scale: 1.08, zIndex: 10}}
                                        onMouseEnter={() => setHoveredMuni(name)}
                                        onMouseLeave={() => setHoveredMuni(null)}
                                        className={`border-2 border-black aspect-square ${cls} relative group cursor-pointer flex flex-col items-center justify-center p-1 transition-shadow shadow-[2px_2px_0px_0px_black] hover:shadow-[3px_3px_0px_0px_black] ${isTop ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-50' : ''}`}
                                    >
                                        {isTop && (
                                            <m.span
                                                className="absolute -top-2 -right-2 bg-yellow-300 text-black text-[7px] font-black uppercase px-1 py-0.5 border-2 border-black z-10"
                                                animate={{rotate: [0, -6, 6, 0]}}
                                                transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                                            >
                                                ★
                                            </m.span>
                                        )}

                                        <div className={`font-black text-[8px] uppercase text-center leading-tight tracking-tight ${showLight ? 'text-white' : 'text-black'}`}>
                                            {name}
                                        </div>
                                        <div className={`font-black text-[11px] mt-0.5 italic ${showLight ? 'text-white' : 'text-black'}`}>
                                            {value > 0 ? value.toLocaleString() : '–'}
                                        </div>

                                        <AnimatePresence>
                                            {hoveredMuni === name && (
                                                <m.div
                                                    initial={{opacity: 0, scale: 0.92}}
                                                    animate={{opacity: 1, scale: 1}}
                                                    exit={{opacity: 0, scale: 0.92}}
                                                    transition={{duration: 0.12}}
                                                    className="absolute inset-0 bg-black text-white flex flex-col items-center justify-center p-1 z-20 pointer-events-none"
                                                >
                                                    <div className="font-black text-[9px] uppercase text-center leading-tight">{name}</div>
                                                    <div className="text-[10px] font-mono mt-0.5 font-black">
                                                        {value} {METRIC_LABELS[metric].slice(0, 4).toLowerCase()}
                                                    </div>
                                                </m.div>
                                            )}
                                        </AnimatePresence>
                                    </m.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Circuits as horizontal bars */}
                    {circuits.length > 0 && (
                        <div className="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_black] relative">
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-3 flex items-center gap-1.5">
                                <Network size={11} strokeWidth={3}/> Repartos / circuitos top
                            </div>
                            <div className="space-y-1.5">
                                {[...circuits].sort((a, b) => b[metric] - a[metric]).slice(0, 6).map((c, idx) => {
                                    const max = Math.max(1, ...circuits.map(x => x[metric]));
                                    const pct = (c[metric] / max) * 100;
                                    const isFirst = idx === 0;
                                    return (
                                        <m.div
                                            key={c.name}
                                            initial={{opacity: 0, x: -10}}
                                            whileInView={{opacity: 1, x: 0}}
                                            viewport={{once: true}}
                                            transition={{delay: 0.1 + idx * 0.05}}
                                            whileHover={{x: 2}}
                                            className="group cursor-default"
                                        >
                                            <div className="flex justify-between text-[10px] font-mono mb-0.5">
                                                <span className="font-black flex items-center gap-1">
                                                    <span className={`text-[8px] px-1 py-0.5 border ${isFirst ? 'bg-yellow-300 text-black border-black' : 'bg-white/10 text-white border-white/20'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="uppercase tracking-tight">{c.name}</span>
                                                </span>
                                                <span className={`font-black ${isFirst ? 'text-yellow-300' : 'opacity-80'}`}>
                                                    {c[metric]}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/15 border border-white/20 overflow-hidden">
                                                <m.div
                                                    initial={{width: 0}}
                                                    whileInView={{width: `${pct}%`}}
                                                    viewport={{once: true}}
                                                    transition={{duration: 0.7, delay: 0.15 + idx * 0.05, ease: [0.22, 1, 0.36, 1]}}
                                                    className={`h-full ${isFirst ? 'bg-yellow-300' : 'bg-white'} group-hover:brightness-110 transition-[filter]`}
                                                />
                                            </div>
                                        </m.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom stats — 4 cards consistent with the rest of the project */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.3}}
                    whileHover={{y: -3, rotate: -1}}
                    className="bg-blue-100 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <MapPinned size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Provincias
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">con datos en {METRIC_LABELS[metric].toLowerCase()}</div>
                    <div className="font-black text-2xl leading-tight italic mt-2 text-blue-700">
                        <AnimatedCounter value={provinces.filter(p => p[metric] > 0).length}/>
                    </div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.36}}
                    whileHover={{y: -3, rotate: 1}}
                    className="bg-yellow-100 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow ring-2 ring-yellow-400 ring-offset-2 ring-offset-white relative"
                >
                    <m.span
                        className="absolute -top-2 -right-2 bg-yellow-300 text-black text-[8px] font-black uppercase px-1.5 py-0.5 border-2 border-black flex items-center gap-0.5"
                        animate={{rotate: [0, -4, 4, 0]}}
                        transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                    >
                        <Crown size={8} strokeWidth={3}/> TOP
                    </m.span>
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Crown size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Provincia top
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">{topProvince?.name ?? '—'}</div>
                    <div className="font-black text-2xl leading-tight italic mt-2 text-amber-700">
                        {topProvince ? <AnimatedCounter value={topProvince[metric]}/> : '—'}
                    </div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.42}}
                    whileHover={{y: -3, rotate: -1}}
                    className="bg-rose-100 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Building2 size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Municipio top
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">{topMuni?.name ?? '—'}</div>
                    <div className="font-black text-2xl leading-tight italic mt-2 text-rose-700">
                        {topMuni ? <AnimatedCounter value={topMuni[metric]}/> : '—'}
                    </div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.48}}
                    whileHover={{y: -3, rotate: 1}}
                    className="bg-purple-100 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Radar size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Zonas mapeadas
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">prov + muni + circ</div>
                    <div className="font-black text-2xl leading-tight italic mt-2 text-purple-700">
                        <AnimatedCounter value={provinces.length + municipalities.length + circuits.length}/>
                    </div>
                </m.div>
            </div>
        </section>
    );
};

export default memo(AffectedZonesMap);
