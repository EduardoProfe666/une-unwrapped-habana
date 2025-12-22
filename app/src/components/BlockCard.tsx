import React, {useCallback, useMemo, useRef, useState} from 'react';
import {BlockAnalysis} from '../common/types.ts';
import {Activity, AlertTriangle, CheckCircle, Download, ShieldAlert, Zap, Clock, Timer} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import {AnimatePresence, m} from 'framer-motion';
import {formatDuration} from '../common/utils.ts';

interface Props {
    block: BlockAnalysis;
    color: string;
    year: number;
}

const BASE_HOST = import.meta.env.VITE_BASE_HOST;

const BlockCard: React.FC<Props> = ({block, color, year}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [hoveredStat, setHoveredStat] = useState<string | null>(null);

    const handleDownload = useCallback(async () => {
        if (!cardRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                backgroundColor: '#ffffff',
                cacheBust: true,
                pixelRatio: 3,
            });
            const link = document.createElement('a');
            link.download = `UNE-Bloque-${block.number}-Analysis.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error exporting image:', error);
        }
    }, [block.number]);

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

            <button
                onClick={handleDownload}
                className="group/btn self-center lg:self-end bg-white text-black px-6 py-2 text-xs font-black flex items-center gap-2 hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
                <Download size={14} strokeWidth={3}/>
                <span>GUARDAR BLOQUE_{block.number}</span>
            </button>
        </div>
    );
};

export default React.memo(BlockCard);