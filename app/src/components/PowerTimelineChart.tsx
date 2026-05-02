import React, {memo, useMemo} from 'react';
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {m} from 'framer-motion';
import {Activity, Bolt, Calendar, CheckCircle2, Gauge, TrendingDown, Zap} from 'lucide-react';
import type {PowerPoint} from '@/src/lib/types';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    powerTimeline?: PowerPoint[];
    primaryColorClass: string;
}

const MONTH_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Custom tooltip with neobrutal styling
const NeoTooltip = ({active, payload, label}: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border-4 border-black px-3 py-2 shadow-[4px_4px_0px_0px_black] font-mono text-[11px]">
            <div className="font-black uppercase tracking-widest text-[10px] mb-1.5 border-b-2 border-black pb-1">{label}</div>
            <div className="space-y-0.5">
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center gap-2">
                        <span className={`w-2 h-2 border border-black inline-block`} style={{background: p.color}}/>
                        <span className="font-black uppercase opacity-70 w-20">{p.name}</span>
                        <span className="font-black">
                            {p.value != null ? `${p.value} MW` : '—'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PowerTimelineChart: React.FC<Props> = ({powerTimeline}) => {
    const data = useMemo(() => {
        if (!powerTimeline?.length) return [];
        const byDay: Record<string, {date: string; demand: number | null; availability: number | null; deficit: number | null}> = {};
        for (const p of powerTimeline) {
            const day = (p.date || '').slice(0, 10);
            if (!day) continue;
            const cur = byDay[day] ?? {date: day, demand: null, availability: null, deficit: null};
            const pick = (a: number | null, b: number | null) => (b == null ? a : a == null ? b : Math.max(a, b));
            cur.demand = pick(cur.demand, p.demand);
            cur.availability = pick(cur.availability, p.availability);
            cur.deficit = pick(cur.deficit, p.deficit);
            byDay[day] = cur;
        }
        return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
    }, [powerTimeline]);

    const stats = useMemo(() => {
        const filteredDeficit = data.filter(d => d.deficit != null);
        const avgDeficit = filteredDeficit.length
            ? Math.round(filteredDeficit.reduce((a, b) => a + (b.deficit ?? 0), 0) / filteredDeficit.length)
            : 0;
        const peakDeficit = Math.max(0, ...data.map(d => d.deficit ?? 0));
        const peakDay = data.find(d => d.deficit === peakDeficit && peakDeficit > 0);
        const minDeficit = filteredDeficit.length
            ? Math.min(...filteredDeficit.map(d => d.deficit ?? 0))
            : 0;
        const bestDay = filteredDeficit.find(d => d.deficit === minDeficit);

        // High-deficit and no-deficit day counts
        const highDays = filteredDeficit.filter(d => (d.deficit ?? 0) >= 1000).length;
        const lowDays = filteredDeficit.filter(d => (d.deficit ?? 0) < 200).length;

        // Monthly aggregation
        const monthly: Record<number, {total: number; n: number}> = {};
        for (const d of filteredDeficit) {
            const m = parseInt(d.date.slice(5, 7), 10);
            if (!monthly[m]) monthly[m] = {total: 0, n: 0};
            monthly[m].total += d.deficit ?? 0;
            monthly[m].n += 1;
        }
        const monthlyAvg = Object.entries(monthly).map(([m, v]) => ({
            month: parseInt(m, 10),
            avg: Math.round(v.total / v.n),
        }));
        monthlyAvg.sort((a, b) => b.avg - a.avg);
        const worstMonth = monthlyAvg[0];
        const bestMonth = monthlyAvg[monthlyAvg.length - 1];

        return {
            avgDeficit,
            peakDeficit,
            peakDay,
            daysWithData: data.length,
            highDays,
            lowDays,
            bestDay,
            worstMonth,
            bestMonth,
        };
    }, [data]);

    if (!powerTimeline || data.length === 0) {
        return null;
    }

    const peakDateLabel = stats.peakDay ? stats.peakDay.date : '';

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Decorative big icon */}
            <m.div
                className="absolute -top-6 -right-6 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, 8, 0, -8, 0]}}
                transition={{duration: 14, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Bolt size={240} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{scale: [1, 1.15, 1], rotate: [0, -8, 0, 8, 0]}}
                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                            className="inline-block text-yellow-500"
                        >
                            <Bolt size={28} strokeWidth={3} fill="currentColor"/>
                        </m.span>
                        Demanda vs Disponibilidad
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Series del SEN según resúmenes y pronósticos diarios
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_PWR_MW</div>
            </header>

            {/* Top stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
                <m.div
                    initial={{opacity: 0, y: 12}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.05}}
                    whileHover={{y: -2, rotate: -0.5}}
                    className="border-4 border-black bg-gray-50 p-3 shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] transition-shadow"
                >
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70">
                        <Gauge size={12} strokeWidth={3}/> Días con datos
                    </div>
                    <div className="font-black text-3xl italic mt-1">
                        <AnimatedCounter value={stats.daysWithData}/>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 mt-0.5">resúmenes + pronósticos</div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 12}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.12}}
                    whileHover={{y: -2}}
                    className="border-4 border-black bg-orange-100 p-3 shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] transition-shadow relative overflow-hidden"
                >
                    <m.div
                        className="absolute inset-0 pointer-events-none opacity-15"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #f97316 6px, #f97316 8px)',
                        }}
                        animate={{backgroundPositionX: ['0px', '20px']}}
                        transition={{duration: 3, repeat: Infinity, ease: 'linear'}}
                    />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70">
                            <TrendingDown size={12} strokeWidth={3}/> Déficit promedio
                        </div>
                        <div className="font-black text-3xl italic mt-1 text-orange-700">
                            <AnimatedCounter value={stats.avgDeficit}/> <span className="text-xs">MW</span>
                        </div>
                        <div className="text-[9px] font-mono opacity-50 mt-0.5">
                            promedio del año reportado
                        </div>
                    </div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 12}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.19}}
                    whileHover={{y: -2, rotate: 0.5}}
                    className="border-4 border-black bg-red-100 p-3 shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] transition-shadow relative ring-2 ring-red-600 ring-offset-2 ring-offset-white overflow-hidden"
                >
                    <m.span
                        className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 border-2 border-black z-10"
                        animate={{rotate: [0, -4, 4, 0]}}
                        transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                    >
                        PICO
                    </m.span>
                    <div className="relative">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70">
                            <m.span
                                animate={{opacity: [1, 0.4, 1]}}
                                transition={{duration: 1.5, repeat: Infinity}}
                            ><Bolt size={12} strokeWidth={3} fill="#dc2626" className="text-red-600"/></m.span>
                            Pico
                        </div>
                        <div className="font-black text-3xl italic mt-1 text-red-700">
                            <AnimatedCounter value={stats.peakDeficit}/> <span className="text-xs">MW</span>
                        </div>
                        {peakDateLabel && (
                            <div className="text-[9px] font-mono opacity-60 mt-0.5">{peakDateLabel}</div>
                        )}
                    </div>
                </m.div>
            </div>

            {/* Chart */}
            <m.div
                initial={{opacity: 0, scale: 0.97}}
                whileInView={{opacity: 1, scale: 1}}
                viewport={{once: true, amount: 0.2}}
                transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
                className="border-4 border-black bg-gray-50 p-2 shadow-[6px_6px_0px_0px_black] relative z-10"
            >
                <div className="w-full h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{top: 16, right: 24, left: 0, bottom: 8}}>
                            <defs>
                                <linearGradient id="grad-demand" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#000" stopOpacity={0.18}/>
                                    <stop offset="100%" stopColor="#000" stopOpacity={0.05}/>
                                </linearGradient>
                                <linearGradient id="grad-availability" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.4}/>
                                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.08}/>
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.18)"/>
                            <XAxis
                                dataKey="date"
                                tick={{fontSize: 10, fontFamily: 'monospace', fill: '#000'}}
                                stroke="#000"
                                strokeWidth={2}
                                tickFormatter={(s: string) => s.slice(5)}
                                minTickGap={28}
                            />
                            <YAxis
                                tick={{fontSize: 10, fontFamily: 'monospace', fill: '#000'}}
                                stroke="#000"
                                strokeWidth={2}
                                width={48}
                                label={{value: 'MW', angle: -90, position: 'insideLeft', offset: 14, fontSize: 10, fontWeight: 900}}
                            />
                            <Tooltip content={<NeoTooltip/>}/>
                            <Legend
                                wrapperStyle={{fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'}}
                                iconType="square"
                            />

                            {/* Reference line at avg deficit */}
                            {stats.avgDeficit > 0 && (
                                <ReferenceLine
                                    y={stats.avgDeficit}
                                    stroke="#dc2626"
                                    strokeDasharray="6 4"
                                    strokeWidth={1.5}
                                    label={{
                                        value: `prom ${stats.avgDeficit} MW`,
                                        position: 'insideTopRight',
                                        fontSize: 9,
                                        fontFamily: 'monospace',
                                        fontWeight: 900,
                                        fill: '#dc2626',
                                    }}
                                />
                            )}

                            <Area
                                type="monotone"
                                dataKey="demand"
                                name="Demanda"
                                stroke="#000"
                                strokeWidth={2.4}
                                fill="url(#grad-demand)"
                                fillOpacity={1}
                                isAnimationActive={true}
                                animationDuration={1200}
                                animationEasing="ease-out"
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey="availability"
                                name="Disponibilidad"
                                stroke="#16a34a"
                                strokeWidth={2.4}
                                fill="url(#grad-availability)"
                                isAnimationActive={true}
                                animationDuration={1400}
                                animationEasing="ease-out"
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="deficit"
                                name="Déficit"
                                stroke="#dc2626"
                                strokeWidth={3}
                                dot={false}
                                isAnimationActive={true}
                                animationDuration={1600}
                                animationEasing="ease-out"
                                connectNulls
                            />

                            {/* Peak deficit dot */}
                            {stats.peakDay && stats.peakDeficit > 0 && (
                                <ReferenceDot
                                    x={stats.peakDay.date}
                                    y={stats.peakDeficit}
                                    r={5}
                                    fill="#dc2626"
                                    stroke="#000"
                                    strokeWidth={2}
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </m.div>

            {/* Bottom stats row — same pattern as the clock and explorer */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.5}}
                    whileHover={{y: -3, rotate: -1}}
                    className="bg-red-200 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Días críticos
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">déficit ≥ 1000 MW</div>
                    <div className="font-black text-2xl leading-tight italic mt-2">
                        <AnimatedCounter value={stats.highDays}/>
                    </div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.56}}
                    whileHover={{y: -3, rotate: 1}}
                    className="bg-green-200 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Días tranquilos
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">déficit &lt; 200 MW</div>
                    <div className="font-black text-2xl leading-tight italic mt-2">
                        <AnimatedCounter value={stats.lowDays}/>
                    </div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.62}}
                    whileHover={{y: -3, rotate: -1}}
                    className="bg-orange-100 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Peor mes
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">
                        {stats.worstMonth ? MONTH_FULL[stats.worstMonth.month - 1] : '—'}
                    </div>
                    <div className="font-black text-2xl leading-tight italic mt-2 text-orange-700">
                        {stats.worstMonth ? <><AnimatedCounter value={stats.worstMonth.avg}/><span className="text-xs ml-1">MW</span></> : '—'}
                    </div>
                </m.div>

                <m.div
                    initial={{opacity: 0, y: 8}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.68}}
                    whileHover={{y: -3, rotate: 1}}
                    className="bg-emerald-100 border-2 border-black px-3 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] text-center cursor-default transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Activity size={12} strokeWidth={3}/>
                        <div className="text-[9px] font-black uppercase opacity-70 tracking-widest leading-none">
                            Mejor mes
                        </div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50 leading-none truncate">
                        {stats.bestMonth ? MONTH_FULL[stats.bestMonth.month - 1] : '—'}
                    </div>
                    <div className="font-black text-2xl leading-tight italic mt-2 text-emerald-700">
                        {stats.bestMonth ? <><AnimatedCounter value={stats.bestMonth.avg}/><span className="text-xs ml-1">MW</span></> : '—'}
                    </div>
                </m.div>
            </div>

            {/* Footer — source line */}
            <m.div
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                viewport={{once: true}}
                transition={{delay: 0.8}}
                className="mt-6 pt-4 border-t-2 border-dashed border-black/20 flex items-center gap-2 text-[10px] font-mono opacity-50 relative z-10"
            >
                <m.span
                    className="inline-block w-1.5 h-1.5 bg-yellow-400 border border-black"
                    animate={{opacity: [0.3, 1, 0.3]}}
                    transition={{duration: 1.6, repeat: Infinity}}
                />
                <span>
                    Fuente: extracción IA de cifras MW en mensajes{' '}
                    <span className="text-black font-black">daily_resume</span>{' '}y{' '}
                    <span className="text-black font-black">daily_forecast</span>
                </span>
            </m.div>
        </section>
    );
};

export default memo(PowerTimelineChart);
