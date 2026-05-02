import React, {memo, useMemo} from 'react';
import {m} from 'framer-motion';
import {ExternalLink, Leaf, Sparkles, Sun} from 'lucide-react';
import type {CalmestDay} from '@/src/lib/types';

interface Props {
    calmestDay?: CalmestDay | null;
    channelUsername?: string;
}

const CalmestDayHero: React.FC<Props> = ({calmestDay, channelUsername = 'EmpresaElectricaDeLaHabana'}) => {
    const formattedDate = useMemo(() => {
        if (!calmestDay?.date) return '';
        try {
            const d = new Date(calmestDay.date);
            return d.toLocaleDateString('es-CU', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).toUpperCase();
        } catch {
            return calmestDay.date;
        }
    }, [calmestDay]);

    if (!calmestDay) return null;

    const dayName = formattedDate.split(',')[0]?.trim() || '';
    const dateRest = formattedDate.includes(',') ? formattedDate.split(',').slice(1).join(',').trim() : formattedDate;

    return (
        <m.section
            initial={{opacity: 0, scale: 0.95, y: 30}}
            whileInView={{opacity: 1, scale: 1, y: 0}}
            viewport={{once: true, amount: 0.2}}
            transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
            className="relative bg-emerald-500 border-4 border-black p-6 md:p-12 shadow-[16px_16px_0px_0px_black] overflow-hidden"
        >
            {/* Floating leaf particles */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({length: 12}).map((_, i) => (
                    <m.span
                        key={i}
                        className="absolute text-emerald-300/40 text-2xl"
                        style={{left: `${(i * 13) % 100}%`, top: `${(i * 23) % 100}%`}}
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 30, 0],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3 + (i % 4),
                            delay: i * 0.3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        ✦
                    </m.span>
                ))}
            </div>

            {/* Subtle stripes */}
            <m.div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, transparent, transparent 18px, #fff 18px, #fff 22px)',
                }}
                animate={{backgroundPositionX: ['0px', '40px']}}
                transition={{duration: 8, repeat: Infinity, ease: 'linear'}}
            />

            {/* Decorative sun */}
            <m.div
                className="absolute -top-8 -right-8 text-emerald-200/30 pointer-events-none"
                animate={{rotate: [0, 360]}}
                transition={{duration: 80, repeat: Infinity, ease: 'linear'}}
            >
                <Sun size={240} strokeWidth={1.2}/>
            </m.div>

            <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <m.span
                        initial={{opacity: 0, x: -10}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.1}}
                        className="bg-black text-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 border-white shadow-[3px_3px_0px_0px_white] flex items-center gap-1.5"
                    >
                        <m.span
                            animate={{rotate: [0, 20, -20, 0]}}
                            transition={{duration: 2.4, repeat: Infinity, ease: 'easeInOut'}}
                        >
                            <Leaf size={11} strokeWidth={3}/>
                        </m.span>
                        EL_DÍA_MÁS_TRANQUILO
                    </m.span>
                    <span className="text-white/70 font-mono text-[10px] uppercase">/ CALMEST_DAY</span>
                    <span className="text-white font-mono text-[10px] uppercase ml-auto hidden md:inline flex items-center gap-1">
                        ESTADO_OK · {calmestDay.total_events === 0 ? 'CERO' : calmestDay.total_events} EVENTOS
                    </span>
                </div>

                <div className="relative z-10 mb-2">
                    {dayName && (
                        <m.div
                            initial={{opacity: 0, x: -20}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true}}
                            transition={{delay: 0.15}}
                            className="text-emerald-100 font-mono text-sm md:text-base font-black uppercase tracking-widest mb-2"
                        >
                            ☼ {dayName}
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

                <m.div
                    initial={{opacity: 0, y: 10}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.3}}
                    className="inline-block bg-white border-2 border-black text-black px-3 py-2 mb-6 font-mono text-xs md:text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
                >
                    <Sparkles size={12} strokeWidth={3} className="inline mr-1.5 -mt-0.5"/>
                    Sin desconexiones, sin afectaciones críticas. La luz dijo "hoy no me voy".
                </m.div>

                {calmestDay.sample_message_id > 0 && (
                    <m.a
                        href={`https://t.me/${channelUsername}/${calmestDay.sample_message_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{opacity: 0, y: 10}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{delay: 0.5}}
                        className="inline-flex items-center gap-2 bg-black text-white border-2 border-white px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_white] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                        Ver mensajes de ese día <ExternalLink size={12}/>
                    </m.a>
                )}
            </div>
        </m.section>
    );
};

export default memo(CalmestDayHero);
