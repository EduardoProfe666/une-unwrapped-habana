import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BlockAnalysis} from '@/src/lib/types.ts';
import {Activity, AlertTriangle, Check, CheckCircle, Download, Loader2, ShieldAlert, Zap, Clock, Timer} from 'lucide-react';
import {AnimatePresence, m} from 'framer-motion';
import {formatDuration} from '@/src/lib/utils.ts';

type DownloadState = 'idle' | 'loading' | 'success' | 'error';

// html-to-image is loaded on demand (only when the user clicks Download).
// Saves ~22KB gzipped from the initial bundle since most users don't export.

interface Props {
    block: BlockAnalysis;
    color: string;
    year: number;
}

const BASE_HOST = import.meta.env.VITE_BASE_HOST;

const BlockCard: React.FC<Props> = ({block, color, year}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [hoveredStat, setHoveredStat] = useState<string | null>(null);
    const [downloadState, setDownloadState] = useState<DownloadState>('idle');
    const resetTimerRef = useRef<number | null>(null);

    // Clean up the auto-revert timer if the component unmounts mid-download
    useEffect(() => () => {
        if (resetTimerRef.current != null) window.clearTimeout(resetTimerRef.current);
    }, []);

    const handleDownload = useCallback(async () => {
        if (!cardRef.current || downloadState === 'loading') return;
        setDownloadState('loading');
        try {
            // Dynamic import — html-to-image only loads when this handler fires
            const {toPng} = await import('html-to-image');
            const dataUrl = await toPng(cardRef.current, {
                backgroundColor: '#ffffff',
                cacheBust: true,
                pixelRatio: 3,
            });
            const link = document.createElement('a');
            link.download = `UNE-Bloque-${block.number}-Analysis.png`;
            link.href = dataUrl;
            link.click();
            setDownloadState('success');
        } catch (error) {
            console.error('Error exporting image:', error);
            setDownloadState('error');
        } finally {
            // Auto-revert to idle after a brief feedback window
            if (resetTimerRef.current != null) window.clearTimeout(resetTimerRef.current);
            resetTimerRef.current = window.setTimeout(() => setDownloadState('idle'), 1800);
        }
    }, [block.number, downloadState]);

    const timeStats = useMemo(() => {
        const totalSecondsInYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 31622400 : 31536000;
        const percentage = ((block.estimated_affected_seconds / totalSecondsInYear) * 100);
        const formattedTime = formatDuration(block.estimated_affected_seconds);

        return { percentage, formattedTime };
    }, [block.estimated_affected_seconds, year]);

    const stats = useMemo(() => [
        {
            id: 'mentions',
            label: 'Menciones',
            value: block.mentions,
            icon: Activity,
            text: `Frecuencia total de aparición del bloque ${block.number}`,
            colorClass: 'text-black'
        },
        {
            id: 'recoveries',
            label: 'Recuperación',
            value: block.declared_recoveries,
            icon: CheckCircle,
            text: `Frecuencia total que se mencionó la recuperación del bloque ${block.number}`,
            colorClass: 'text-green-600'
        },
        {
            id: 'affectations',
            label: 'Afectación',
            value: block.declared_affectations,
            icon: AlertTriangle,
            text: `Frecuencia total que se mencionó la afectación del bloque ${block.number}`,
            colorClass: 'text-orange-500'
        },
        {
            id: 'emergencies',
            label: 'Emergencia',
            value: block.declared_emergencies,
            icon: ShieldAlert,
            text: `Frecuencia total que se mencionó la afectación por emergencia del bloque ${block.number}`,
            colorClass: 'text-red-600'
        },
    ], [block]);

    return (
        <div className="flex flex-col gap-3 group">
            <div
                ref={cardRef}
                className="bg-white border-4 border-black p-0 shadow-[8px_8px_0px_0px_black] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[12px_12px_0px_0px_black] relative overflow-hidden"
            >
                <div className="bg-black text-white p-3 flex justify-between items-center z-20 relative">
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-3 h-3 rounded-full animate-pulse ${block.declared_emergencies > 0 ? 'bg-red-500' : 'bg-green-500'}`}/>
                        <h3 className={`font-black uppercase tracking-tighter text-2xl ${color}`}>
                            BLOQUE_{block.number}
                        </h3>
                    </div>
                    <Zap className={color.replace('text', 'fill')} size={20}/>
                </div>

                <div className="p-6 relative">
                    <span
                        className={`absolute -right-4 -bottom-8 text-[12rem] font-black opacity-[0.1] select-none pointer-events-none leading-none z-0 ${color}`}>
                        {block.number}
                    </span>

                    <div className="flex flex-col z-10 relative border-t-4 border-black">
                        {stats.map((stat) => (
                            <div
                                key={stat.id}
                                className="group/item relative flex flex-col border-b-4 border-black last:border-b-0"
                                onMouseEnter={() => setHoveredStat(stat.id)}
                                onMouseLeave={() => setHoveredStat(null)}
                            >
                                <div className={`flex justify-between items-center py-4 px-2 transition-colors duration-200 ${hoveredStat === stat.id ? 'bg-gray-50' : 'bg-transparent'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 border-2 border-black bg-white shadow-[2px_2px_0px_0px_black] ${stat.colorClass} group-hover/item:shadow-none group-hover/item:translate-x-1 group-hover/item:translate-y-1 transition-all`}>
                                            <stat.icon size={18} strokeWidth={3} />
                                        </div>
                                        <span className="font-black uppercase text-sm md:text-base tracking-tighter">
                                            {stat.label}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-black font-mono leading-none tabular-nums ${stat.colorClass}`}>
                                            {stat.value}
                                        </span>
                                        <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">EVTS</span>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {hoveredStat === stat.id && (
                                        <m.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute left-1/2 -translate-x-1/2 -top-6 bg-black text-white text-[10px] px-3 py-1 font-bold border-2 border-white shadow-[4px_4px_0px_0px_black] z-50 pointer-events-none"
                                        >
                                            {stat.text.toUpperCase()}
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    <div
                        className="mt-6 relative z-10 group/time"
                        onMouseEnter={() => setHoveredStat('time')}
                        onMouseLeave={() => setHoveredStat(null)}
                    >
                         <AnimatePresence>
                            {hoveredStat === 'time' && (
                                <m.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute right-0 -top-8 bg-black text-white text-[10px] px-3 py-1 font-bold border-2 border-white shadow-[4px_4px_0px_0px_black] z-50 pointer-events-none"
                                >
                                    ESTIMADO TOTAL DE TIEMPO SIN SERVICIO ELÉCTRICO DEL BLOQUE {block.number}
                                </m.div>
                            )}
                        </AnimatePresence>

                        <div className="border-4 border-black bg-gray-100 p-1">
                            <div className="flex justify-between items-center px-2 py-1 mb-1">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} strokeWidth={3} />
                                    <span className="font-black uppercase text-[10px] tracking-widest">TOTAL_DOWNTIME</span>
                                </div>
                                <div className="text-[10px] font-black bg-black text-white px-1.5 py-0.5">
                                    {timeStats.percentage.toFixed(2)}% DEL AÑO
                                </div>
                            </div>

                            <div className="bg-black p-3 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none" />

                                <p className={`relative z-10 font-mono font-black text-lg md:text-xl leading-tight uppercase break-words ${color}`}>
                                    {timeStats.formattedTime}
                                </p>
                            </div>

                            <div className="h-4 w-full bg-white border-t-4 border-black relative mt-1 flex">
                                <div className="absolute inset-0 w-full h-full flex justify-between px-1 z-20 opacity-20 pointer-events-none">
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} className="w-[1px] h-full bg-black" />
                                    ))}
                                </div>
                                <m.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${timeStats.percentage}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={`h-full relative z-10 ${block.declared_emergencies > 50 ? 'bg-red-600' : 'bg-gray-800'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-black border-dashed flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase opacity-40">System_Data_Analysis_{year}</p>
                            <div className="bg-black text-white text-[10px] font-bold px-2 py-0.5 w-fit -rotate-2">
                                {BASE_HOST}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-400 leading-tight uppercase max-w-[100px]">
                                * Datos no oficiales sujetos a error
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <m.button
                onClick={handleDownload}
                disabled={downloadState === 'loading'}
                whileTap={downloadState === 'idle' ? {scale: 0.97} : undefined}
                aria-busy={downloadState === 'loading'}
                aria-live="polite"
                className={`group/btn self-center lg:self-end relative overflow-hidden text-black px-6 py-2 text-xs font-black flex items-center gap-2 transition-all border-4 border-black shadow-[4px_4px_0px_0px_black] min-w-[210px] justify-center
                    ${downloadState === 'idle'    ? 'cursor-pointer bg-white hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:shadow-none active:translate-x-1 active:translate-y-1' : ''}
                    ${downloadState === 'loading' ? 'cursor-wait bg-yellow-200' : ''}
                    ${downloadState === 'success' ? 'bg-green-300' : ''}
                    ${downloadState === 'error'   ? 'bg-red-300' : ''}
                `}
            >
                {/* Indeterminate progress sweep — only visible while loading */}
                {downloadState === 'loading' && (
                    <m.div
                        className="absolute inset-y-0 w-1/3 bg-yellow-400/80 pointer-events-none"
                        animate={{x: ['-110%', '350%']}}
                        transition={{duration: 1.3, repeat: Infinity, ease: 'easeInOut'}}
                    />
                )}

                {/* State-aware label, swaps with crossfade */}
                <AnimatePresence mode="wait" initial={false}>
                    <m.span
                        key={downloadState}
                        initial={{opacity: 0, y: 5}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -5}}
                        transition={{duration: 0.18}}
                        className="relative z-10 flex items-center gap-2"
                    >
                        {downloadState === 'idle' && (
                            <>
                                <Download size={14} strokeWidth={3}/>
                                <span>GUARDAR BLOQUE_{block.number}</span>
                            </>
                        )}
                        {downloadState === 'loading' && (
                            <>
                                <m.span
                                    animate={{rotate: 360}}
                                    transition={{duration: 0.8, repeat: Infinity, ease: 'linear'}}
                                    className="inline-block"
                                >
                                    <Loader2 size={14} strokeWidth={3}/>
                                </m.span>
                                <span>GENERANDO PNG...</span>
                            </>
                        )}
                        {downloadState === 'success' && (
                            <>
                                <m.span
                                    initial={{scale: 0, rotate: -90}}
                                    animate={{scale: 1, rotate: 0}}
                                    transition={{type: 'spring', stiffness: 320, damping: 14}}
                                    className="inline-block"
                                >
                                    <Check size={14} strokeWidth={4}/>
                                </m.span>
                                <span>¡GUARDADO!</span>
                            </>
                        )}
                        {downloadState === 'error' && (
                            <>
                                <AlertTriangle size={14} strokeWidth={3}/>
                                <span>ERROR — REINTENTA</span>
                            </>
                        )}
                    </m.span>
                </AnimatePresence>
            </m.button>
        </div>
    );
};

export default React.memo(BlockCard);