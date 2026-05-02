import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {animate, AnimatePresence, m, useMotionValue} from 'framer-motion';
import {AlertOctagon, Bolt, ChevronLeft, ChevronRight, Crown, Film, Pause, Play, Sparkles, Trophy, X, Zap} from 'lucide-react';
import type {AffectedZone, BlockAnalysis, UneAnalysis} from '@/src/lib/types';
import AnimatedCounter from '@/src/components/AnimatedCounter.tsx';
import {formatDuration} from '@/src/lib/utils.ts';

interface Props {
    data: UneAnalysis;
    primaryColorClass: string;
    secondaryColorClass: string;
}

interface Slide {
    title: string;
    headline: string | React.ReactNode;
    sub: string;
    bg: string;
    Icon: React.FC<{size?: number; strokeWidth?: number; className?: string}>;
    confetti?: boolean;
}

const SLIDE_DURATION_MS = 6000;

const formatDate = (s: string): string => {
    if (!s) return '';
    try {
        return new Date(s).toLocaleDateString('es-CU', {day: '2-digit', month: 'long'}).toUpperCase();
    } catch {
        return s;
    }
};

// ───────────────────────────────────────────────────────────────────────────
// Confetti — tiny falling squares for the outro slide
// ───────────────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#dc2626', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ffffff'];

const Confetti: React.FC = () => {
    const pieces = useMemo(() => Array.from({length: 50}, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2.5 + Math.random() * 2.5,
        size: 6 + Math.floor(Math.random() * 8),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 720 - 360,
        drift: (Math.random() - 0.5) * 80,
    })), []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {pieces.map((p) => (
                <m.div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        border: '1.5px solid rgba(0,0,0,0.6)',
                        top: -30,
                    }}
                    initial={{y: -30, rotate: 0, opacity: 1}}
                    animate={{y: '105vh', rotate: p.rotation, x: p.drift, opacity: [1, 1, 0.8, 0]}}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: 'easeIn',
                    }}
                />
            ))}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────────────────────────
const YearWrapped: React.FC<Props> = ({data, primaryColorClass}) => {
    const [open, setOpen] = useState(false);
    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const [direction, setDirection] = useState(1); // 1 forward, -1 backward
    const directionRef = useRef(1);

    const slides = useMemo<Slide[]>(() => {
        const out: Slide[] = [];

        // 1. Intro
        out.push({
            title: '¿Cómo fue el año?',
            headline: <span>Tu año eléctrico en <em className="not-italic font-black text-yellow-300">{data.year}</em></span>,
            sub: 'Resumen visual del SEN según los mensajes oficiales',
            bg: 'bg-black',
            Icon: Film,
        });

        // 2. Total mensajes
        out.push({
            title: 'Mensajes procesados',
            headline: <AnimatedCounter value={data.total_messages}/>,
            sub: `mensajes analizados por la IA en ${data.year}`,
            bg: 'bg-blue-600',
            Icon: Sparkles,
        });

        // 3. Worst day
        if (data.worst_day) {
            out.push({
                title: 'El peor día',
                headline: formatDate(data.worst_day.date),
                sub: `${data.worst_day.critical_events} críticos · ${data.worst_day.high_events} altos · ${data.worst_day.affected_blocks_count} bloques`,
                bg: 'bg-red-600',
                Icon: AlertOctagon,
            });
        }

        // 4. Calmest day
        if (data.calmest_day) {
            out.push({
                title: 'El día más calmo',
                headline: formatDate(data.calmest_day.date),
                sub: 'sin desconexiones, sin afectaciones críticas',
                bg: 'bg-emerald-500',
                Icon: Sparkles,
            });
        }

        // 5. Health score
        if (data.health_score != null) {
            out.push({
                title: 'Salud del SEN',
                headline: <><AnimatedCounter value={data.health_score}/><span className="text-3xl ml-2 opacity-60">/100</span></>,
                sub: data.health_score >= 60 ? 'el sistema aguantó' : data.health_score >= 40 ? 'el sistema sobrevivió' : 'el sistema sufrió',
                bg: data.health_score >= 60 ? 'bg-emerald-500' : data.health_score >= 40 ? 'bg-amber-500' : 'bg-red-700',
                Icon: Zap,
            });
        }

        // 6. Total SEN failures
        if (data.sen_analysis?.total_failure_events != null) {
            const n = data.sen_analysis.total_failure_events;
            out.push({
                title: 'Caídas totales del SEN',
                headline: <AnimatedCounter value={n}/>,
                sub: n === 0 ? 'el SEN aguantó todo el año' : 'desconexiones nacionales',
                bg: n === 0 ? 'bg-emerald-500' : 'bg-red-700',
                Icon: Bolt,
            });
        }

        // 7. Most affected block — by REAL DOWNTIME (estimated_affected_seconds),
        //    not by mention count. The block that spent more hours without power.
        const peakBlock = (data.blocks_analysis ?? []).reduce<BlockAnalysis | null>(
            (acc, b) => (
                acc == null || (b.estimated_affected_seconds ?? 0) > (acc.estimated_affected_seconds ?? 0) ? b : acc
            ),
            null
        );
        if (peakBlock && (peakBlock.estimated_affected_seconds ?? 0) > 0) {
            out.push({
                title: 'Bloque más golpeado',
                headline: <>BLOQUE <span className="text-yellow-300">{peakBlock.number}</span></>,
                sub: `${formatDuration(peakBlock.estimated_affected_seconds)} sin servicio eléctrico`,
                bg: 'bg-orange-600',
                Icon: AlertOctagon,
            });
        }

        // 8. Most affected municipality
        const munis = (data.affected_zones ?? []).filter((z: AffectedZone) => z.kind === 'municipality');
        const peakMuni = munis.reduce<AffectedZone | null>(
            (acc, m) => (acc == null || m.affectations > acc.affectations ? m : acc),
            null
        );
        if (peakMuni) {
            out.push({
                title: 'Municipio más afectado',
                headline: peakMuni.name.toUpperCase(),
                sub: `${peakMuni.affectations.toLocaleString()} afectaciones`,
                bg: 'bg-rose-600',
                Icon: Crown,
            });
        }

        // 9. Longest streak
        if (data.year_records?.longest_clean_streak_days != null && data.year_records.longest_clean_streak_days > 0) {
            out.push({
                title: 'Racha más limpia',
                headline: <><AnimatedCounter value={data.year_records.longest_clean_streak_days}/><span className="text-3xl ml-2 opacity-60">días</span></>,
                sub: 'sin eventos altos / críticos seguidos',
                bg: 'bg-lime-600',
                Icon: Trophy,
            });
        }

        // 10. Outro
        out.push({
            title: 'Fin del replay',
            headline: <span>Hasta el año <em className="not-italic font-black text-yellow-300">próximo</em></span>,
            sub: 'gracias por mirar · sigue scrolleando para más detalles',
            bg: 'bg-fuchsia-700',
            Icon: Sparkles,
            confetti: true,
        });

        return out;
    }, [data]);

    // ── Progress bar driven by a motion value (fixes initial={false} bug, no bar
    //    overlap or stuck states). One single source of truth for advancement.
    const progressMV = useMotionValue(0);

    // Reset progress whenever slide changes
    useEffect(() => {
        progressMV.set(0);
    }, [idx, progressMV]);

    // Run the progress animation only when open and not paused. Picks up from
    // current value on resume so pause/play feels seamless.
    useEffect(() => {
        if (!open || paused) return;
        const remainingFraction = 1 - progressMV.get();
        if (remainingFraction <= 0) return;
        const controls = animate(progressMV, 1, {
            duration: (remainingFraction * SLIDE_DURATION_MS) / 1000,
            ease: 'linear',
        });
        controls.then(() => {
            // Auto-advance forward
            directionRef.current = 1;
            setDirection(1);
            setIdx(i => (i + 1) % slides.length);
        }).catch(() => {/* stopped on cleanup */});
        return () => controls.stop();
    }, [open, idx, paused, progressMV, slides.length]);

    // Navigation helpers
    const goTo = (newIdx: number) => {
        const dir = newIdx > idx ? 1 : newIdx < idx ? -1 : 1;
        directionRef.current = dir;
        setDirection(dir);
        setIdx(((newIdx % slides.length) + slides.length) % slides.length);
    };
    const goNext = () => goTo(idx + 1);
    const goPrev = () => goTo(idx - 1);

    // Keyboard handlers
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
            else if (e.key === 'ArrowRight') goNext();
            else if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === ' ') {
                e.preventDefault();
                setPaused(p => !p);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, idx, slides.length]);

    const current = slides[idx];

    // Direction-aware slide variants — content slides horizontally
    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 90 : -90,
            opacity: 0,
            scale: 0.95,
        }),
        center: {x: 0, opacity: 1, scale: 1},
        exit: (dir: number) => ({
            x: dir > 0 ? -90 : 90,
            opacity: 0,
            scale: 0.95,
        }),
    };

    return (
        <>
            {/* Trigger button */}
            <m.button
                onClick={() => {
                    setIdx(0);
                    setPaused(false);
                    setDirection(1);
                    directionRef.current = 1;
                    setOpen(true);
                }}
                whileHover={{scale: 1.02}}
                whileTap={{scale: 0.97}}
                className={`group relative w-full ${primaryColorClass} text-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_black] hover:shadow-[12px_12px_0px_0px_black] transition-shadow cursor-pointer overflow-hidden`}
            >
                <m.div
                    className="absolute inset-0 pointer-events-none opacity-15"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 12px, #fff 12px, #fff 14px)',
                    }}
                    animate={{backgroundPositionX: ['0px', '26px']}}
                    transition={{duration: 4, repeat: Infinity, ease: 'linear'}}
                />
                <div className="relative flex items-center gap-4">
                    <m.div
                        animate={{rotate: [0, -8, 8, 0]}}
                        transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                        className="flex-shrink-0"
                    >
                        <Film size={48} strokeWidth={3}/>
                    </m.div>
                    <div className="flex-1 text-left">
                        <div className="text-[10px] font-mono font-black uppercase tracking-widest opacity-80">
                            ▶ STORY MODE · {slides.length} SLIDES
                        </div>
                        <div className="font-black text-2xl md:text-4xl uppercase tracking-tighter italic mt-1">
                            Year Wrapped {data.year}
                        </div>
                        <div className="text-[11px] font-mono opacity-80 mt-1">
                            haz click para ver el replay del año en formato historia
                        </div>
                    </div>
                    <m.span
                        animate={{x: [0, 6, 0]}}
                        transition={{duration: 1.4, repeat: Infinity, ease: 'easeInOut'}}
                        className="hidden md:flex flex-shrink-0"
                    >
                        <ChevronRight size={48} strokeWidth={3}/>
                    </m.span>
                </div>
            </m.button>

            {/* Modal overlay */}
            <AnimatePresence>
                {open && current && (
                    <m.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4"
                        onClick={(e) => {
                            if ((e.target as HTMLElement).dataset.overlay) setOpen(false);
                        }}
                        data-overlay="true"
                    >
                        {/* Top progress bars — single motion-value source for the active bar */}
                        <div className="fixed top-0 left-0 right-0 z-30 flex gap-1 p-3" data-overlay="true">
                            {slides.map((_, i) => (
                                <div key={i} className="flex-1 h-1 bg-white/20 overflow-hidden">
                                    {i < idx ? (
                                        <div className="h-full bg-white" style={{width: '100%'}}/>
                                    ) : i === idx ? (
                                        <m.div
                                            className="h-full bg-white origin-left"
                                            style={{scaleX: progressMV, width: '100%'}}
                                        />
                                    ) : (
                                        <div className="h-full bg-white" style={{width: '0%'}}/>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Top-right controls — flex group keeps them perfectly aligned regardless of icon */}
                        <div className="fixed top-6 right-4 z-30 flex gap-2 items-center" data-overlay="false">
                            {/* Pause / play */}
                            <m.button
                                onClick={(e) => {e.stopPropagation(); setPaused(p => !p);}}
                                whileHover={{scale: 1.08, y: -1}}
                                whileTap={{scale: 0.95}}
                                className="cursor-pointer bg-white text-black w-11 h-11 flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black] transition-shadow"
                                aria-label={paused ? 'Reproducir' : 'Pausar'}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <m.span
                                        key={paused ? 'play' : 'pause'}
                                        initial={{scale: 0, rotate: -45}}
                                        animate={{scale: 1, rotate: 0}}
                                        exit={{scale: 0, rotate: 45}}
                                        transition={{duration: 0.18}}
                                        className="flex"
                                    >
                                        {paused ? <Play size={22} strokeWidth={3}/> : <Pause size={22} strokeWidth={3}/>}
                                    </m.span>
                                </AnimatePresence>
                            </m.button>

                            {/* Close */}
                            <m.button
                                onClick={(e) => {e.stopPropagation(); setOpen(false);}}
                                whileHover={{scale: 1.08, rotate: 90}}
                                whileTap={{scale: 0.95}}
                                className="cursor-pointer bg-white text-black w-11 h-11 flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_black] transition-all"
                                aria-label="Cerrar"
                            >
                                <X size={22} strokeWidth={3}/>
                            </m.button>
                        </div>

                        {/* Prev / Next side buttons */}
                        <m.button
                            onClick={(e) => {e.stopPropagation(); goPrev();}}
                            whileHover={{scale: 1.1, x: -2}}
                            whileTap={{scale: 0.95}}
                            className="fixed left-4 top-1/2 -translate-y-1/2 z-30 cursor-pointer bg-white text-black w-12 h-12 flex items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_black] hover:bg-yellow-300 transition-colors"
                            aria-label="Anterior"
                        >
                            <ChevronLeft size={28} strokeWidth={3}/>
                        </m.button>
                        <m.button
                            onClick={(e) => {e.stopPropagation(); goNext();}}
                            whileHover={{scale: 1.1, x: 2}}
                            whileTap={{scale: 0.95}}
                            className="fixed right-4 top-1/2 -translate-y-1/2 z-30 cursor-pointer bg-white text-black w-12 h-12 flex items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_black] hover:bg-yellow-300 transition-colors"
                            aria-label="Siguiente"
                        >
                            <ChevronRight size={28} strokeWidth={3}/>
                        </m.button>

                        {/* Slide content — direction-aware horizontal slide */}
                        <AnimatePresence mode="wait" custom={direction}>
                            <m.div
                                key={idx}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{duration: 0.4, ease: [0.22, 1, 0.36, 1]}}
                                className={`${current.bg} text-white border-8 border-white w-full max-w-3xl aspect-[4/5] md:aspect-video flex flex-col justify-between p-6 md:p-12 shadow-[16px_16px_0px_0px_white] overflow-hidden relative`}
                            >
                                {/* Animated diagonal stripes background */}
                                <m.div
                                    className="absolute inset-0 pointer-events-none opacity-10"
                                    style={{
                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 18px, #fff 18px, #fff 22px)',
                                    }}
                                    animate={{backgroundPositionX: ['0px', '40px']}}
                                    transition={{duration: 6, repeat: Infinity, ease: 'linear'}}
                                />

                                {/* Soft radial highlight that pulses slowly */}
                                <m.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.18) 0%, transparent 60%)',
                                    }}
                                    animate={{opacity: [0.6, 1, 0.6]}}
                                    transition={{duration: 4, repeat: Infinity, ease: 'easeInOut'}}
                                />

                                {/* Confetti for outro */}
                                {current.confetti && <Confetti/>}

                                {/* Top */}
                                <div className="relative z-10 flex items-center justify-between">
                                    <m.div
                                        initial={{opacity: 0, x: -10}}
                                        animate={{opacity: 1, x: 0}}
                                        transition={{delay: 0.1}}
                                        className="text-[12px] font-mono font-black uppercase tracking-widest opacity-70"
                                    >
                                        SLIDE {(idx + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}
                                    </m.div>
                                    <m.div
                                        initial={{opacity: 0, scale: 0, rotate: -45}}
                                        animate={{opacity: 1, scale: 1, rotate: 0}}
                                        transition={{delay: 0.15, type: 'spring', stiffness: 260, damping: 16}}
                                    >
                                        <m.div
                                            animate={{rotate: [0, -10, 10, 0]}}
                                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                                        >
                                            <current.Icon size={32} strokeWidth={3}/>
                                        </m.div>
                                    </m.div>
                                </div>

                                {/* Center */}
                                <div className="relative z-10 my-auto py-8">
                                    <m.div
                                        initial={{opacity: 0, x: -16}}
                                        animate={{opacity: 1, x: 0}}
                                        transition={{delay: 0.2, duration: 0.4}}
                                        className="text-[12px] font-mono font-black uppercase tracking-widest opacity-70 mb-2 flex items-center gap-2"
                                    >
                                        <m.span
                                            animate={{x: [0, 4, 0]}}
                                            transition={{duration: 1.4, repeat: Infinity, ease: 'easeInOut'}}
                                            className="inline-block"
                                        >
                                            »
                                        </m.span>
                                        {current.title}
                                    </m.div>
                                    <m.div
                                        initial={{opacity: 0, y: 24, scale: 0.9}}
                                        animate={{opacity: 1, y: 0, scale: 1}}
                                        transition={{delay: 0.3, type: 'spring', stiffness: 200, damping: 22}}
                                        className="font-black text-5xl md:text-7xl lg:text-8xl uppercase tracking-tighter italic leading-[0.9]"
                                    >
                                        {current.headline}
                                    </m.div>
                                    <m.div
                                        initial={{opacity: 0, y: 8}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{delay: 0.55, duration: 0.4}}
                                        className="text-base md:text-xl font-bold uppercase tracking-wider opacity-90 mt-4"
                                    >
                                        {current.sub}
                                    </m.div>
                                </div>

                                {/* Bottom */}
                                <div className="relative z-10 flex items-center justify-between">
                                    <m.div
                                        initial={{opacity: 0}}
                                        animate={{opacity: 0.5}}
                                        transition={{delay: 0.7}}
                                        className="font-mono text-[10px] font-black uppercase tracking-widest"
                                    >
                                        UNE_UNWRAPPED · {data.year}
                                    </m.div>
                                </div>
                            </m.div>
                        </AnimatePresence>

                        {/* PAUSED indicator — bottom-center, outside the slide so doesn't shift it */}
                        <AnimatePresence>
                            {paused && (
                                <m.div
                                    initial={{opacity: 0, y: 10, scale: 0.8}}
                                    animate={{opacity: 1, y: 0, scale: 1}}
                                    exit={{opacity: 0, y: 10, scale: 0.8}}
                                    transition={{type: 'spring', stiffness: 300, damping: 20}}
                                    className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 bg-yellow-300 text-black px-4 py-2 border-4 border-white shadow-[4px_4px_0px_0px_white] flex items-center gap-2"
                                >
                                    <m.span
                                        animate={{scale: [1, 1.2, 1]}}
                                        transition={{duration: 1.2, repeat: Infinity, ease: 'easeInOut'}}
                                    >
                                        <Pause size={14} strokeWidth={3}/>
                                    </m.span>
                                    <span className="text-[11px] font-black uppercase tracking-widest">Pausado</span>
                                </m.div>
                            )}
                        </AnimatePresence>

                        {/* Hint at bottom */}
                        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 text-white/40 text-[10px] font-mono uppercase tracking-widest pointer-events-none">
                            ← → para navegar · ESPACIO para pausar · ESC para cerrar
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default memo(YearWrapped);
