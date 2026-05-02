import React, {memo, useMemo, useState} from 'react';
import {m} from 'framer-motion';
import {AlertTriangle, Bolt, Factory, Flame, RefreshCcw, TrendingDown, TrendingUp} from 'lucide-react';
import type {SenStatus, ThermalPlantStats} from '@/src/lib/types';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    units?: ThermalPlantStats[];
    primaryColorClass: string;
}

const STATUS_LABEL: Record<SenStatus, string> = {
    normal: 'NORMAL',
    active_failure: 'EN_FALLO',
    recovering: 'RECUPERANDO',
    unknown: 'DESCONOCIDO',
};

const STATUS_DOT: Record<SenStatus, string> = {
    normal: 'bg-green-500',
    active_failure: 'bg-red-500',
    recovering: 'bg-yellow-400',
    unknown: 'bg-gray-300',
};

const RANK_COLORS = [
    'bg-yellow-400', // #1 oro
    'bg-gray-300',   // #2 plata
    'bg-amber-700',  // #3 bronce
];

const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_SHORT = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

// ----------------------- Mini Monthly Chart ------------------------ //

const MiniMonthly: React.FC<{ data: number[] }> = memo(({data}) => {
    const max = Math.max(1, ...data);
    const peakMonthIdx = data.findIndex(v => v === max);
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="relative">
            <div className="flex items-end gap-0.5 h-14 border-b-2 border-black px-0.5">
                {data.map((v, i) => {
                    const isPeak = i === peakMonthIdx && v > 0;
                    const isHovered = hovered === i;
                    const heightPct = max > 0 ? (v / max) * 100 : 0;
                    const minH = v > 0 ? 3 : 0;

                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {/* Tooltip */}
                            {isHovered && v > 0 && (
                                <m.div
                                    initial={{opacity: 0, y: 4, scale: 0.92}}
                                    animate={{opacity: 1, y: 0, scale: 1}}
                                    transition={{type: 'spring', stiffness: 500, damping: 24}}
                                    className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 bg-black text-white text-[9px] font-mono font-black px-1.5 py-1 border-2 border-white shadow-[2px_2px_0px_0px_black] whitespace-nowrap"
                                >
                                    {MONTHS_FULL[i]}: {v}
                                </m.div>
                            )}

                            <m.div
                                initial={{height: 0}}
                                whileInView={{height: `${heightPct}%`}}
                                viewport={{once: true, amount: 0.4}}
                                transition={{duration: 0.6, delay: 0.04 * i, ease: 'easeOut'}}
                                animate={isHovered ? {scaleY: 1.06} : {scaleY: 1}}
                                style={{
                                    minHeight: `${minH}px`,
                                    transformOrigin: 'bottom',
                                }}
                                className={`w-full border-r border-white/30 transition-colors ${
                                    isPeak
                                        ? 'bg-red-600'
                                        : isHovered
                                            ? 'bg-orange-500'
                                            : 'bg-black'
                                }`}
                            />
                            <span
                                className={`text-[7px] font-mono leading-none mt-0.5 transition-all ${
                                    isPeak ? 'text-red-600 font-black' : isHovered ? 'text-black font-black' : 'text-gray-400'
                                }`}
                            >
                                {MONTHS_SHORT[i]}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

// ----------------------- Plant Card ------------------------ //

const PlantCard: React.FC<{
    unit: ThermalPlantStats;
    idx: number;
    primaryColorClass: string;
}> = memo(({unit, idx, primaryColorClass}) => {
    const status = (unit.last_status || 'unknown') as SenStatus;
    const isFailing = status === 'active_failure';
    const isUnrecovered = unit.failures > 0 && unit.recoveries === 0;

    const recoveryRatio = unit.failures > 0
        ? Math.round((unit.recoveries / unit.failures) * 100)
        : null;

    const rankBg = idx < 3 ? RANK_COLORS[idx] : primaryColorClass;
    const rankTextColor = idx === 1 ? 'text-black' : idx === 2 ? 'text-white' : idx === 0 ? 'text-black' : 'text-white';

    return (
        <m.div
            initial={{opacity: 0, y: 28}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.2}}
            transition={{delay: idx * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1]}}
            whileHover={{y: -4, transition: {type: 'spring', stiffness: 400, damping: 20}}}
            className="group bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] hover:shadow-[12px_12px_0px_0px_black] p-4 relative transition-shadow"
        >
            {/* Subtle dotted texture in background */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                 style={{
                     backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                     backgroundSize: '12px 12px',
                 }}
            />

            {/* Failure red border pulse */}
            {isFailing && (
                <m.div
                    className="absolute inset-0 border-4 border-red-500 pointer-events-none"
                    animate={{opacity: [0.25, 0.6, 0.25]}}
                    transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut'}}
                />
            )}

            {/* Rank badge */}
            <m.div
                whileHover={{rotate: idx < 3 ? [-2, 4, -2] : 4, scale: 1.08}}
                transition={{type: 'spring', stiffness: 300, damping: 15}}
                className={`absolute -top-3 -left-3 w-10 h-10 ${rankBg} border-4 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_black] z-10`}
            >
                <span className={`font-black text-sm tracking-tight ${rankTextColor}`}>#{idx + 1}</span>
            </m.div>

            {/* Top-right status pill */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_black]">
                <m.span
                    className={`w-2 h-2 ${STATUS_DOT[status]} border border-black rounded-full`}
                    animate={isFailing ? {scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7]} : {}}
                    transition={{duration: 1.2, repeat: Infinity, ease: 'easeInOut'}}
                />
                <span className="text-[9px] font-mono font-black tracking-tight">{STATUS_LABEL[status]}</span>
            </div>

            {/* Title row */}
            <div className="mt-4 mb-3 relative">
                <div className="flex items-start gap-2">
                    <m.div
                        className="mt-0.5 flex-shrink-0"
                        whileHover={{rotate: [0, -8, 8, -4, 0]}}
                        transition={{duration: 0.6}}
                    >
                        <Bolt size={20} strokeWidth={3} className="text-black"/>
                    </m.div>
                    <h3 className="font-black uppercase tracking-tight text-base leading-tight pr-2">
                        {unit.canonical}
                    </h3>
                </div>
                <div className="text-[10px] font-mono opacity-50 mt-1 ml-7 uppercase tracking-widest">
                    {unit.city || 'Sin datos'}
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-1.5 mb-4 relative">
                <m.div
                    whileHover={{y: -2, scale: 1.04}}
                    transition={{type: 'spring', stiffness: 400, damping: 18}}
                    className="border-2 border-black bg-gray-50 p-2 text-center cursor-default shadow-[2px_2px_0px_0px_black]"
                >
                    <div className="text-[8px] font-black uppercase opacity-50 tracking-widest">Menc.</div>
                    <div className="font-black text-lg leading-none mt-1">
                        <AnimatedCounter value={unit.mentions}/>
                    </div>
                </m.div>
                <m.div
                    whileHover={{y: -2, scale: 1.04}}
                    transition={{type: 'spring', stiffness: 400, damping: 18}}
                    className="border-2 border-black bg-red-100 p-2 text-center cursor-default shadow-[2px_2px_0px_0px_black]"
                >
                    <div className="text-[8px] font-black uppercase opacity-60 tracking-widest flex items-center justify-center gap-0.5">
                        <Flame size={9}/> Fallo
                    </div>
                    <div className="font-black text-lg leading-none mt-1 text-red-700">
                        <AnimatedCounter value={unit.failures}/>
                    </div>
                </m.div>
                <m.div
                    whileHover={{y: -2, scale: 1.04}}
                    transition={{type: 'spring', stiffness: 400, damping: 18}}
                    className="border-2 border-black bg-green-100 p-2 text-center cursor-default shadow-[2px_2px_0px_0px_black]"
                >
                    <div className="text-[8px] font-black uppercase opacity-60 tracking-widest flex items-center justify-center gap-0.5">
                        <RefreshCcw size={9}/> Rec.
                    </div>
                    <div className="font-black text-lg leading-none mt-1 text-green-700">
                        <AnimatedCounter value={unit.recoveries}/>
                    </div>
                </m.div>
            </div>

            {/* Recovery ratio */}
            {recoveryRatio != null && (
                <div className="border-2 border-black bg-white p-2 mb-4 flex items-center gap-2 shadow-[2px_2px_0px_0px_black]">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Ratio rec.</span>
                    <div className="flex-1 h-2 bg-gray-100 border border-black relative overflow-hidden">
                        <m.div
                            initial={{width: 0}}
                            whileInView={{width: `${Math.min(100, recoveryRatio)}%`}}
                            viewport={{once: true}}
                            transition={{duration: 0.9, delay: 0.3 + idx * 0.05, ease: 'easeOut'}}
                            className={`h-full ${recoveryRatio >= 50 ? 'bg-green-500' : recoveryRatio >= 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                        />
                    </div>
                    <span className={`font-black text-xs ${recoveryRatio >= 50 ? 'text-green-700' : recoveryRatio >= 20 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {recoveryRatio}%
                    </span>
                </div>
            )}

            {/* Critical flag */}
            {isUnrecovered && (
                <m.div
                    initial={{opacity: 0, x: -8}}
                    whileInView={{opacity: 1, x: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.4 + idx * 0.05}}
                    className="mb-3 flex items-center gap-1.5 bg-red-200 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_black]"
                >
                    <AlertTriangle size={12} strokeWidth={3}/>
                    <span className="text-[9px] font-black uppercase tracking-widest">Sin recuperaciones reportadas</span>
                </m.div>
            )}

            {/* Monthly activity chart */}
            {unit.monthly_activity?.length === 12 && (
                <div className="mt-3 pt-2 border-t-2 border-black relative">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">Actividad mensual</span>
                        <span className="text-[9px] font-mono opacity-30 uppercase">{unit.monthly_activity.reduce((a, b) => a + b, 0)} EVT</span>
                    </div>
                    <MiniMonthly data={unit.monthly_activity}/>
                </div>
            )}
        </m.div>
    );
});

// ----------------------- Main component ------------------------ //

const ThermalPlantsRanking: React.FC<Props> = ({units, primaryColorClass}) => {
    const sorted = useMemo(
        () => (units ?? []).slice().sort((a, b) => (b.failures + b.recoveries) - (a.failures + a.recoveries)),
        [units]
    );

    if (!units || units.length === 0) return null;

    const totalFailures = sorted.reduce((s, u) => s + u.failures, 0);
    const totalRecoveries = sorted.reduce((s, u) => s + u.recoveries, 0);
    const totalMentions = sorted.reduce((s, u) => s + u.mentions, 0);
    const failingCount = sorted.filter(u => u.last_status === 'active_failure').length;

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Decorative big factory icon */}
            <m.div
                className="absolute -top-4 -right-4 opacity-[0.05] pointer-events-none"
                animate={{rotate: [0, 1.5, 0, -1.5, 0]}}
                transition={{duration: 12, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Factory size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Centrales Termoeléctricas</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Salidas y sincronizaciones por CTE detectadas en los mensajes
                    </p>
                </div>

                {/* Top-right counters */}
                <div className="flex flex-wrap gap-2">
                    <m.div
                        whileHover={{y: -2, rotate: -1}}
                        transition={{type: 'spring', stiffness: 400, damping: 18}}
                        className="border-2 border-black bg-red-200 px-3 py-1.5 shadow-[3px_3px_0px_0px_black] flex items-center gap-2"
                    >
                        <Flame size={14} strokeWidth={3}/>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block leading-none">Fallos</span>
                            <span className="font-black text-xl leading-none italic">
                                <AnimatedCounter value={totalFailures}/>
                            </span>
                        </div>
                    </m.div>
                    <m.div
                        whileHover={{y: -2, rotate: 1}}
                        transition={{type: 'spring', stiffness: 400, damping: 18}}
                        className="border-2 border-black bg-green-200 px-3 py-1.5 shadow-[3px_3px_0px_0px_black] flex items-center gap-2"
                    >
                        <RefreshCcw size={14} strokeWidth={3}/>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block leading-none">Recuperaciones</span>
                            <span className="font-black text-xl leading-none italic">
                                <AnimatedCounter value={totalRecoveries}/>
                            </span>
                        </div>
                    </m.div>
                </div>
            </header>

            {/* Mini KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 relative z-10">
                <div className="border-2 border-black bg-gray-50 px-3 py-2 shadow-[2px_2px_0px_0px_black]">
                    <div className="text-[9px] font-black uppercase opacity-60 tracking-widest">Total CTEs</div>
                    <div className="font-black text-2xl italic">{sorted.length}</div>
                </div>
                <div className="border-2 border-black bg-gray-50 px-3 py-2 shadow-[2px_2px_0px_0px_black]">
                    <div className="text-[9px] font-black uppercase opacity-60 tracking-widest flex items-center gap-1">
                        <TrendingDown size={9}/> En fallo
                    </div>
                    <div className={`font-black text-2xl italic ${failingCount > 0 ? 'text-red-600' : ''}`}>{failingCount}</div>
                </div>
                <div className="border-2 border-black bg-gray-50 px-3 py-2 shadow-[2px_2px_0px_0px_black]">
                    <div className="text-[9px] font-black uppercase opacity-60 tracking-widest">Total menciones</div>
                    <div className="font-black text-2xl italic">
                        <AnimatedCounter value={totalMentions}/>
                    </div>
                </div>
                <div className="border-2 border-black bg-gray-50 px-3 py-2 shadow-[2px_2px_0px_0px_black]">
                    <div className="text-[9px] font-black uppercase opacity-60 tracking-widest flex items-center gap-1">
                        <TrendingUp size={9}/> Ratio Rec/Fallo
                    </div>
                    <div className="font-black text-2xl italic">
                        {totalFailures > 0 ? `${Math.round((totalRecoveries / totalFailures) * 100)}%` : '—'}
                    </div>
                </div>
            </div>

            {/* Plant cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {sorted.map((unit, idx) => (
                    <PlantCard
                        key={unit.canonical}
                        unit={unit}
                        idx={idx}
                        primaryColorClass={primaryColorClass}
                    />
                ))}
            </div>
        </section>
    );
};

export default memo(ThermalPlantsRanking);
