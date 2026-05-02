import React, {memo, useMemo} from 'react';
import {m} from 'framer-motion';
import {AlertOctagon, ExternalLink, Layers, Skull, TrendingDown, Zap} from 'lucide-react';
import type {WorstDay} from '@/src/lib/types';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    worstDay?: WorstDay | null;
    channelUsername?: string;
}

const WorstDayHero: React.FC<Props> = ({worstDay, channelUsername = 'EmpresaElectricaDeLaHabana'}) => {
    if (!worstDay || (!worstDay.critical_events && worstDay.high_events < 3)) return null;

    const formattedDate = useMemo(() => {
        try {
            const d = new Date(worstDay.date);
            return d.toLocaleDateString('es-CU', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).toUpperCase();
        } catch {
            return worstDay.date;
        }
    }, [worstDay.date]);

    const dayName = formattedDate.split(',')[0]?.trim() || '';
    const dateRest = formattedDate.includes(',') ? formattedDate.split(',').slice(1).join(',').trim() : formattedDate;

    return (
        <m.section
            initial={{opacity: 0, scale: 0.95, y: 30}}
            whileInView={{opacity: 1, scale: 1, y: 0}}
            viewport={{once: true, amount: 0.2}}
            transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
            className="relative bg-red-600 border-4 border-black p-6 md:p-12 shadow-[16px_16px_0px_0px_black] overflow-hidden group"
        >
            {/* Animated diagonal stripe overlay */}
            <m.div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, transparent, transparent 18px, #000 18px, #000 22px)',
                    backgroundSize: '40px 40px',
                }}
                animate={{backgroundPositionX: ['0px', '40px']}}
                transition={{duration: 4, repeat: Infinity, ease: 'linear'}}
            />

            {/* Pulsing glow border */}
            <m.div
                className="absolute inset-0 border-4 border-yellow-300 pointer-events-none"
                animate={{opacity: [0, 0.3, 0]}}
                transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut'}}
            />

            {/* Skull background — wobbles slowly */}
            <m.div
                className="absolute -top-6 -right-6 opacity-10 text-black pointer-events-none"
                animate={{rotate: [0, -3, 0, 3, 0], scale: [1, 1.04, 1]}}
                transition={{duration: 6, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Skull size={240} strokeWidth={1.5}/>
            </m.div>

            {/* Top tag */}
            <div className="relative z-10 flex flex-wrap items-center gap-2 mb-4">
                <m.span
                    initial={{opacity: 0, x: -10}}
                    whileInView={{opacity: 1, x: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.1}}
                    className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-white shadow-[3px_3px_0px_0px_white] flex items-center gap-1.5"
                >
                    <m.span
                        className="w-2 h-2 bg-yellow-300 border border-white rounded-full"
                        animate={{opacity: [1, 0.3, 1]}}
                        transition={{duration: 1, repeat: Infinity}}
                    />
                    EL_PEOR_DÍA
                </m.span>
                <span className="text-white/70 font-mono text-[10px] uppercase">/ WORST_DAY_OF_THE_YEAR</span>
                <span className="text-yellow-300 font-mono text-[10px] uppercase ml-auto hidden md:inline">
                    ALERTA_MÁXIMA · NIVEL 5
                </span>
            </div>

            {/* Big date */}
            <div className="relative z-10 mb-2">
                {dayName && (
                    <m.div
                        initial={{opacity: 0, x: -20}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.15}}
                        className="text-yellow-300 font-mono text-sm md:text-base font-black uppercase tracking-widest mb-2"
                    >
                        » {dayName}
                    </m.div>
                )}
                <m.h2
                    initial={{opacity: 0, scale: 0.92}}
                    whileInView={{opacity: 1, scale: 1}}
                    viewport={{once: true}}
                    transition={{delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
                    className="text-white font-black text-3xl md:text-7xl lg:text-8xl uppercase tracking-tighter italic leading-[0.9] mb-4"
                >
                    {dateRest}
                </m.h2>
            </div>

            {/* Summary */}
            {worstDay.sample_summary && (
                <m.div
                    initial={{opacity: 0, y: 10}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.3}}
                    className="relative z-10 inline-block bg-black/80 border-2 border-yellow-300 text-yellow-300 px-3 py-2 mb-6 font-mono text-xs md:text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
                >
                    <span className="opacity-50">»</span> {worstDay.sample_summary}
                </m.div>
            )}

            {/* Stats grid */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    {
                        label: 'CRÍTICOS',
                        value: worstDay.critical_events,
                        Icon: AlertOctagon,
                        color: 'text-red-600',
                        bgPulse: worstDay.critical_events > 0,
                    },
                    {
                        label: 'ALTOS',
                        value: worstDay.high_events,
                        Icon: Zap,
                        color: 'text-orange-600',
                        bgPulse: false,
                    },
                    {
                        label: 'BLOQUES',
                        value: worstDay.affected_blocks_count,
                        Icon: Layers,
                        color: 'text-black',
                        bgPulse: false,
                    },
                    {
                        label: worstDay.deficit_mw != null ? 'DÉFICIT MW' : 'DÉFICIT',
                        value: worstDay.deficit_mw,
                        Icon: TrendingDown,
                        color: 'text-black',
                        bgPulse: false,
                    },
                ].map((stat, idx) => (
                    <m.div
                        key={stat.label}
                        initial={{opacity: 0, y: 14, scale: 0.94}}
                        whileInView={{opacity: 1, y: 0, scale: 1}}
                        viewport={{once: true}}
                        transition={{delay: 0.35 + idx * 0.07, type: 'spring', stiffness: 200, damping: 18}}
                        whileHover={{y: -3, rotate: idx % 2 === 0 ? -1 : 1, transition: {type: 'spring', stiffness: 400}}}
                        className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_black] hover:shadow-[7px_7px_0px_0px_black] transition-shadow relative overflow-hidden cursor-default"
                    >
                        {stat.bgPulse && (
                            <m.div
                                className="absolute inset-0 bg-red-100 pointer-events-none"
                                animate={{opacity: [0, 0.6, 0]}}
                                transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                            />
                        )}
                        <div className="text-[10px] font-black uppercase opacity-60 tracking-widest flex items-center gap-1 relative">
                            <stat.Icon size={10} strokeWidth={3}/> {stat.label}
                        </div>
                        <div className={`font-black text-3xl md:text-4xl italic ${stat.color} leading-none mt-1 relative`}>
                            {stat.value != null ? <AnimatedCounter value={stat.value}/> : '—'}
                        </div>
                    </m.div>
                ))}
            </div>

            {/* Footer link — uses the project's standard "press" hover */}
            {worstDay.sample_message_id > 0 && (
                <m.a
                    initial={{opacity: 0, y: 10}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.7}}
                    href={`https://t.me/${channelUsername}/${worstDay.sample_message_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 inline-flex items-center gap-2 bg-black text-white border-2 border-white px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_white] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                    Ver mensaje de referencia <ExternalLink size={12}/>
                </m.a>
            )}

            {/* Bottom-right log */}
            <div className="absolute bottom-3 right-4 z-10 hidden md:flex items-center gap-2 text-white/40 font-mono text-[9px] uppercase tracking-widest">
                <m.span
                    className="w-1.5 h-1.5 bg-red-300 rounded-full"
                    animate={{opacity: [0.3, 1, 0.3]}}
                    transition={{duration: 1.5, repeat: Infinity}}
                />
                LOG_CRIT_001
            </div>
        </m.section>
    );
};

export default memo(WorstDayHero);
