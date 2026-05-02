import React, {memo, useMemo} from 'react';
import {m} from 'framer-motion';
import {AlertOctagon, Award, Bolt, Building2, Crown, MapPinned, Skull, Trophy} from 'lucide-react';
import type {AffectedZone, BlockAnalysis, UneAnalysis} from '@/src/lib/types';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    data: UneAnalysis;
    primaryColorClass: string;
}

interface RecordEntry {
    label: string;
    value: string | number;
    sub: string;
    Icon: React.FC<{size?: number; strokeWidth?: number; className?: string}>;
    bg: string;
    text: string;
    medal: 'gold' | 'silver' | 'bronze' | 'red' | 'blue' | 'green';
}

const MEDAL_BG: Record<string, string> = {
    gold:   'bg-yellow-300',
    silver: 'bg-gray-200',
    bronze: 'bg-amber-700',
    red:    'bg-red-500',
    blue:   'bg-blue-400',
    green:  'bg-green-400',
};

const MEDAL_TEXT: Record<string, string> = {
    gold: 'text-black',
    silver: 'text-black',
    bronze: 'text-white',
    red: 'text-white',
    blue: 'text-black',
    green: 'text-black',
};

const HallOfFame: React.FC<Props> = ({data, primaryColorClass}) => {
    const records = useMemo<RecordEntry[]>(() => {
        const out: RecordEntry[] = [];

        // 1. Day with most critical events
        if (data.worst_day) {
            const date = new Date(data.worst_day.date);
            const dateLabel = date.toLocaleDateString('es-CU', {day: '2-digit', month: 'short'}).toUpperCase();
            out.push({
                label: 'PEOR DÍA',
                value: `${data.worst_day.critical_events + data.worst_day.high_events}`,
                sub: `${dateLabel} · ${data.worst_day.critical_events} críticos`,
                Icon: Skull,
                bg: 'bg-red-600',
                text: 'text-white',
                medal: 'red',
            });
        }

        // 2. Peak deficit
        const peakDeficit = data.power_timeline?.reduce((max, p) => Math.max(max, p.deficit ?? 0), 0) ?? 0;
        const peakPoint = data.power_timeline?.find(p => p.deficit === peakDeficit && peakDeficit > 0);
        if (peakDeficit > 0 && peakPoint) {
            out.push({
                label: 'MAYOR DÉFICIT',
                value: peakDeficit,
                sub: `${peakPoint.date.slice(0, 10)} · MW`,
                Icon: Bolt,
                bg: 'bg-orange-400',
                text: 'text-black',
                medal: 'gold',
            });
        }

        // 3. Longest clean streak
        const streak = data.year_records?.longest_clean_streak_days ?? 0;
        if (streak > 0) {
            out.push({
                label: 'RACHA LIMPIA',
                value: streak,
                sub: `días sin eventos altos`,
                Icon: Trophy,
                bg: 'bg-green-400',
                text: 'text-black',
                medal: 'green',
            });
        }

        // 4. Most affected block
        const blocks = data.blocks_analysis ?? [];
        const peakBlock = blocks.reduce<BlockAnalysis | null>(
            (acc, b) => (acc == null || b.declared_affectations > acc.declared_affectations ? b : acc),
            null
        );
        if (peakBlock) {
            out.push({
                label: 'BLOQUE MÁS GOLPEADO',
                value: peakBlock.declared_affectations,
                sub: `Bloque ${peakBlock.number} · afectaciones`,
                Icon: AlertOctagon,
                bg: 'bg-yellow-400',
                text: 'text-black',
                medal: 'silver',
            });
        }

        // 5. Most mentioned municipality
        const munis = (data.affected_zones ?? []).filter((z: AffectedZone) => z.kind === 'municipality');
        const peakMuni = munis.reduce<AffectedZone | null>(
            (acc, m) => (acc == null || m.affectations > acc.affectations ? m : acc),
            null
        );
        if (peakMuni) {
            out.push({
                label: 'MUNICIPIO TOP',
                value: peakMuni.affectations,
                sub: peakMuni.name.toUpperCase(),
                Icon: Building2,
                bg: 'bg-rose-400',
                text: 'text-black',
                medal: 'bronze',
            });
        }

        // 6. SEN failures count
        const senFails = data.sen_analysis?.total_failure_events ?? 0;
        out.push({
            label: 'CAÍDAS DEL SEN',
            value: senFails,
            sub: senFails === 0 ? 'sin desconexiones totales' : 'desconexiones totales',
            Icon: senFails > 0 ? AlertOctagon : Crown,
            bg: senFails > 0 ? 'bg-red-700' : 'bg-emerald-500',
            text: 'text-white',
            medal: senFails > 0 ? 'red' : 'green',
        });

        // 7. Most affected province (top province by mentions)
        const provs = (data.affected_zones ?? []).filter((z: AffectedZone) => z.kind === 'province');
        const peakProv = provs.reduce<AffectedZone | null>(
            (acc, p) => (acc == null || p.mentions > acc.mentions ? p : acc),
            null
        );
        if (peakProv) {
            out.push({
                label: 'PROVINCIA TOP',
                value: peakProv.mentions,
                sub: peakProv.name.toUpperCase(),
                Icon: MapPinned,
                bg: 'bg-blue-400',
                text: 'text-black',
                medal: 'blue',
            });
        }

        // 8. Longest SEN failure (single event duration)
        const longestFailure = (data.sen_analysis?.failure_events ?? []).reduce<number>(
            (max, e) => Math.max(max, e.estimated_duration_seconds ?? 0),
            0
        );
        if (longestFailure > 0) {
            const hours = Math.round(longestFailure / 3600);
            out.push({
                label: 'APAGÓN MÁS LARGO',
                value: `${hours}h`,
                sub: 'desconexión más larga',
                Icon: Skull,
                bg: 'bg-black',
                text: 'text-yellow-300',
                medal: 'red',
            });
        }

        return out;
    }, [data]);

    if (records.length === 0) return null;

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            {/* Decorative trophy bg */}
            <m.div
                className="absolute -top-6 -right-4 opacity-[0.05] pointer-events-none"
                animate={{rotate: [0, 4, 0, -4, 0]}}
                transition={{duration: 12, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Trophy size={220} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{rotate: [0, -8, 8, 0], scale: [1, 1.1, 1]}}
                            transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut'}}
                            className="inline-block text-yellow-500"
                        >
                            <Trophy size={28} strokeWidth={3}/>
                        </m.span>
                        Hall of Fame
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Los récords del año — para bien o para mal
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_HOF</div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10">
                {records.map((r, idx) => {
                    const isFirst = idx === 0;
                    return (
                        <m.div
                            key={r.label}
                            initial={{opacity: 0, y: 24, rotate: -2}}
                            whileInView={{opacity: 1, y: 0, rotate: 0}}
                            viewport={{once: true, amount: 0.2}}
                            transition={{delay: idx * 0.06, type: 'spring', stiffness: 220, damping: 22}}
                            whileHover={{y: -4, rotate: idx % 2 === 0 ? -1.5 : 1.5}}
                            className="relative group cursor-default"
                        >
                            {/* Card body — overflow-hidden lives here so animated stripes get clipped */}
                            <div className={`${r.bg} ${r.text} border-4 border-black p-4 shadow-[5px_5px_0px_0px_black] group-hover:shadow-[8px_8px_0px_0px_black] transition-shadow relative overflow-hidden`}>
                                {/* Crítico glow if it's the worst day */}
                                {isFirst && (
                                    <m.div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage:
                                                'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 10px)',
                                        }}
                                        animate={{backgroundPositionX: ['0px', '20px']}}
                                        transition={{duration: 3, repeat: Infinity, ease: 'linear'}}
                                    />
                                )}

                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-3 mt-2">
                                        <r.Icon size={16} strokeWidth={3}/>
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-90">
                                            {r.label}
                                        </span>
                                    </div>
                                    <div className="font-black text-4xl md:text-5xl italic leading-none mb-2">
                                        {typeof r.value === 'number'
                                            ? <AnimatedCounter value={r.value}/>
                                            : r.value}
                                    </div>
                                    <div className="text-[9px] font-mono opacity-80 uppercase tracking-widest truncate">
                                        {r.sub}
                                    </div>
                                </div>
                            </div>

                            {/* Medal ribbon — sits OUTSIDE the overflow-hidden card so the corner peek isn't clipped */}
                            <m.div
                                initial={{rotate: 6}}
                                whileHover={{rotate: [-3, 10, -3], scale: 1.15}}
                                transition={{type: 'spring', stiffness: 300}}
                                className={`absolute -top-3 -right-3 ${MEDAL_BG[r.medal]} ${MEDAL_TEXT[r.medal]} border-2 border-black px-2 py-1.5 flex items-center gap-1 shadow-[2px_2px_0px_0px_black] z-20`}
                            >
                                <Award size={11} strokeWidth={3}/>
                                <span className="text-[11px] font-black leading-none italic">#{idx + 1}</span>
                            </m.div>
                        </m.div>
                    );
                })}
            </div>
        </section>
    );
};

export default memo(HallOfFame);
