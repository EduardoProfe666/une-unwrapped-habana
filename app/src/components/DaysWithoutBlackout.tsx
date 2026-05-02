import React, {memo, useEffect, useRef, useState} from 'react';
import {AnimatePresence, m, useInView} from 'framer-motion';
import {AlertOctagon, Layers, Timer, Trophy, Zap} from 'lucide-react';
import type {YearRecords} from '@/src/lib/types';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';

interface Props {
    records?: YearRecords | null;
}

interface CounterData {
    label: string;
    value: number;
    last: string;
    Icon: React.FC<{size?: number; strokeWidth?: number; className?: string}>;
    accent: 'yellow' | 'red' | 'orange';
}

// ───────────────────────────────────────────────────────────────────────────
// Single split-flap dial. Slot-machine reveal: cycles random digits and then
// "settles" on the real digit with a satisfying flash.
// ───────────────────────────────────────────────────────────────────────────
const Dial: React.FC<{digit: string; idx: number; isAlert: boolean}> = ({digit, idx, isAlert}) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, {once: true, amount: 0.4});
    const [current, setCurrent] = useState('0');
    const [settled, setSettled] = useState(false);

    useEffect(() => {
        if (!inView) return;
        let cancelled = false;
        const startDelay = 260 + idx * 90;
        const totalSpins = 5 + Math.floor(Math.random() * 3);

        const startId = setTimeout(() => {
            let i = 0;
            const step = () => {
                if (cancelled) return;
                if (i >= totalSpins) {
                    setCurrent(digit);
                    setSettled(true);
                    return;
                }
                setCurrent(Math.floor(Math.random() * 10).toString());
                i++;
                // accelerate-then-decelerate cadence (more dramatic at the end)
                const delay = 55 + i * 22;
                setTimeout(step, delay);
            };
            step();
        }, startDelay);

        return () => {
            cancelled = true;
            clearTimeout(startId);
        };
    }, [inView, digit, idx]);

    return (
        <m.div
            ref={ref}
            initial={{opacity: 0, y: -16, rotateX: -50, scale: 0.9}}
            whileInView={{opacity: 1, y: 0, rotateX: 0, scale: 1}}
            viewport={{once: true}}
            transition={{delay: 0.08 + idx * 0.06, type: 'spring', stiffness: 280, damping: 22}}
            whileHover={{y: -2}}
            className={`relative w-12 h-16 md:w-14 md:h-20 border-4 border-black flex items-center justify-center font-black italic font-mono shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] overflow-hidden ${
                isAlert ? 'bg-red-600 text-white' : 'bg-black text-yellow-300'
            }`}
            style={{perspective: '240px'}}
        >
            {/* Top glass-like reflection */}
            <span className="absolute left-0 right-0 top-0 h-1/2 bg-gradient-to-b from-white/12 to-transparent pointer-events-none z-[2]"/>
            {/* Center seam (split-flap line) */}
            <span className="absolute left-0 right-0 top-1/2 h-px bg-white/30 pointer-events-none z-[3]"/>
            {/* Scanlines */}
            <span
                className="absolute inset-0 pointer-events-none opacity-15 z-[1]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 3px)',
                }}
            />

            {/* The flipping digit */}
            <AnimatePresence mode="popLayout" initial={false}>
                <m.span
                    key={current}
                    initial={{rotateX: -90, y: -10, opacity: 0}}
                    animate={{rotateX: 0, y: 0, opacity: 1}}
                    exit={{rotateX: 90, y: 10, opacity: 0}}
                    transition={settled
                        ? {duration: 0.42, type: 'spring', stiffness: 240, damping: 17}
                        : {duration: 0.1, ease: 'easeOut'}
                    }
                    className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl leading-none z-[1]"
                    style={{transformStyle: 'preserve-3d', backfaceVisibility: 'hidden'}}
                >
                    {current}
                </m.span>
            </AnimatePresence>

            {/* "Settle" flash — single one-shot inset glow when locking the digit */}
            {settled && (
                <m.div
                    className="absolute inset-0 pointer-events-none z-[4]"
                    initial={{opacity: 0}}
                    animate={{opacity: [0, 0.65, 0]}}
                    transition={{duration: 0.55, ease: 'easeOut', delay: 0.1}}
                    style={{
                        boxShadow: isAlert
                            ? 'inset 0 0 22px 4px rgba(255, 100, 100, 0.9)'
                            : 'inset 0 0 22px 4px rgba(252, 211, 77, 0.9)',
                    }}
                />
            )}
        </m.div>
    );
};

const SplitFlap: React.FC<{value: number; isAlert: boolean}> = ({value, isAlert}) => {
    const padded = value.toString().padStart(3, '0');
    return (
        <div className="flex gap-1.5">
            {padded.split('').map((d, i) => (
                <Dial key={i} digit={d} idx={i} isAlert={isAlert}/>
            ))}
        </div>
    );
};

const Counter: React.FC<{counter: CounterData; idx: number; longestStreak: number}> = ({counter, idx, longestStreak}) => {
    const isAlert = counter.value === 0;
    const isRecord = counter.value > 0 && counter.value === longestStreak;

    const accentBg =
        counter.accent === 'yellow' ? 'bg-yellow-300' :
        counter.accent === 'red' ? 'bg-red-500' :
        'bg-orange-400';

    return (
        <m.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{delay: idx * 0.1, type: 'spring', stiffness: 220, damping: 22}}
            whileHover={{y: -3}}
            className="relative bg-white border-4 border-black p-4 md:p-5 shadow-[6px_6px_0px_0px_black] hover:shadow-[10px_10px_0px_0px_black] transition-shadow overflow-hidden group"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 relative">
                <m.div
                    whileHover={{rotate: [0, -8, 8, 0]}}
                    transition={{duration: 0.4}}
                    className={`p-1.5 border-2 border-black ${accentBg}`}
                >
                    <counter.Icon size={14} strokeWidth={3}/>
                </m.div>
                <div className="text-[10px] font-black uppercase tracking-widest leading-tight">
                    {counter.label}
                </div>
            </div>

            {/* Big counter */}
            <div className="flex items-center justify-center my-3 md:my-4">
                <SplitFlap value={counter.value} isAlert={isAlert}/>
            </div>

            {/* Sub label with live LED dot */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-dashed border-black/20">
                <span className="text-[9px] font-mono opacity-60 uppercase tracking-widest flex items-center gap-1.5">
                    <m.span
                        className={`w-1.5 h-1.5 rounded-full inline-block ${isAlert ? 'bg-red-500' : 'bg-green-500'}`}
                        animate={{opacity: [1, 0.25, 1], scale: [1, 0.85, 1]}}
                        transition={{duration: 1.4, repeat: Infinity, ease: 'easeInOut'}}
                    />
                    DÍAS
                </span>
                <span className="text-[9px] font-mono opacity-60">
                    último: <span className="font-black text-black opacity-100">{counter.last || '—'}</span>
                </span>
            </div>

            {/* "HOY" alert pill — pulses with blinking dot */}
            {isAlert && (
                <m.div
                    className="absolute -top-2.5 -right-2.5 bg-red-600 text-white border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_black] flex items-center gap-1 z-20"
                    initial={{scale: 0, rotate: -20}}
                    whileInView={{scale: 1, rotate: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.6 + idx * 0.1, type: 'spring', stiffness: 320, damping: 14}}
                >
                    <m.div
                        animate={{
                            rotate: [0, -4, 4, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{duration: 1.4, repeat: Infinity, ease: 'easeInOut'}}
                        className="flex items-center gap-1"
                    >
                        <m.span
                            className="w-1.5 h-1.5 bg-white rounded-full"
                            animate={{opacity: [1, 0.2, 1]}}
                            transition={{duration: 0.7, repeat: Infinity, ease: 'easeInOut'}}
                        />
                        HOY
                    </m.div>
                </m.div>
            )}

            {/* "RECORD" pill — golden shimmer sweep */}
            {isRecord && counter.value > 30 && (
                <m.div
                    className="absolute -top-2.5 -right-2.5 bg-yellow-300 text-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_black] flex items-center gap-1 overflow-hidden z-20"
                    initial={{scale: 0, rotate: 20}}
                    whileInView={{scale: 1, rotate: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.6 + idx * 0.1, type: 'spring', stiffness: 320, damping: 14}}
                >
                    <m.span
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.85) 50%, transparent 70%)',
                        }}
                        animate={{x: ['-120%', '220%']}}
                        transition={{duration: 1.6, repeat: Infinity, ease: 'linear', repeatDelay: 2.5}}
                    />
                    <m.div
                        animate={{rotate: [0, -4, 4, 0]}}
                        transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
                        className="flex items-center gap-1 relative z-10"
                    >
                        <Trophy size={9} strokeWidth={3}/> RECORD
                    </m.div>
                </m.div>
            )}

            {/* Animated red stripes if we're at 0 (today is a bad day) */}
            {isAlert && (
                <m.div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(45deg, transparent, transparent 8px, #dc2626 8px, #dc2626 10px)',
                    }}
                    animate={{backgroundPositionX: ['0px', '20px']}}
                    transition={{duration: 2, repeat: Infinity, ease: 'linear'}}
                />
            )}
        </m.div>
    );
};

const DaysWithoutBlackout: React.FC<Props> = ({records}) => {
    if (!records) return null;

    const counters: CounterData[] = [
        {
            label: 'sin desconexión total del SEN',
            value: records.days_since_sen_failure ?? 0,
            last: records.last_sen_failure_date ? records.last_sen_failure_date.slice(5) : '—',
            Icon: Zap,
            accent: 'red',
        },
        {
            label: 'sin eventos críticos',
            value: records.days_since_critical_event ?? 0,
            last: records.last_critical_event_date ? records.last_critical_event_date.slice(5) : '—',
            Icon: AlertOctagon,
            accent: 'orange',
        },
        {
            label: 'sin afectación de bloques',
            value: records.days_since_block_affectation ?? 0,
            last: records.last_block_affectation_date ? records.last_block_affectation_date.slice(5) : '—',
            Icon: Layers,
            accent: 'yellow',
        },
    ];

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            <m.div
                className="absolute -top-6 -right-4 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, -2, 0, 2, 0]}}
                transition={{duration: 10, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Trophy size={200} strokeWidth={1.5}/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{rotate: [0, -10, 10, -10, 10, 0]}}
                            transition={{
                                duration: 2.6,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                times: [0, 0.15, 0.3, 0.45, 0.6, 1],
                                repeatDelay: 1.2,
                            }}
                            className="inline-block text-yellow-500"
                        >
                            <Timer size={28} strokeWidth={2.5}/>
                        </m.span>
                        Contador del SEN
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Días desde el último incidente · estilo placa industrial
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_DSL</div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
                {counters.map((c, idx) => (
                    <Counter
                        key={c.label}
                        counter={c}
                        idx={idx}
                        longestStreak={records.longest_clean_streak_days}
                    />
                ))}
            </div>

            {/* Record streak banner with shimmer sweep */}
            {records.longest_clean_streak_days > 0 && (
                <m.div
                    initial={{opacity: 0, x: -10}}
                    whileInView={{opacity: 1, x: 0}}
                    viewport={{once: true}}
                    transition={{delay: 0.5}}
                    whileHover={{y: -2}}
                    className="mt-6 bg-yellow-100 border-2 border-black px-4 py-3 shadow-[3px_3px_0px_0px_black] hover:shadow-[5px_5px_0px_0px_black] flex items-center gap-3 relative z-10 overflow-hidden transition-shadow cursor-default"
                >
                    {/* Diagonal shimmer */}
                    <m.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
                        }}
                        animate={{x: ['-100%', '200%']}}
                        transition={{duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 3.5}}
                    />

                    <m.div
                        animate={{rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.1, 1]}}
                        transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            repeatDelay: 1,
                        }}
                        className="relative z-10"
                    >
                        <Trophy size={22} strokeWidth={3} className="text-yellow-600"/>
                    </m.div>

                    <div className="flex-1 relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Racha más larga del año</div>
                        <div className="font-black text-lg italic">
                            <AnimatedCounter value={records.longest_clean_streak_days}/> días sin eventos altos / críticos
                        </div>
                    </div>
                    {records.longest_clean_streak_start && records.longest_clean_streak_end && (
                        <div className="text-[10px] font-mono opacity-60 hidden sm:block text-right relative z-10">
                            <div>{records.longest_clean_streak_start}</div>
                            <m.div
                                animate={{y: [0, 2, 0]}}
                                transition={{duration: 1.6, repeat: Infinity, ease: 'easeInOut'}}
                                className="opacity-50"
                            >
                                ↓
                            </m.div>
                            <div>{records.longest_clean_streak_end}</div>
                        </div>
                    )}
                </m.div>
            )}
        </section>
    );
};

export default memo(DaysWithoutBlackout);
