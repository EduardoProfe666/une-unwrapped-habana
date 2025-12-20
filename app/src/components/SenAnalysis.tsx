import React, {useMemo} from 'react';
import {SenAnalysis} from '../common/types.ts';
import {formatDate, formatDuration} from '../common/utils.ts';
import {AlertOctagon, Clock} from 'lucide-react';
import {m, Variants} from 'framer-motion';
import TelegramMessage from './TelegramMessage.tsx';

interface Props {
    analysis: SenAnalysis;
}

const timelineItemVariants: Variants = {
    hidden: {opacity: 0, x: -30},
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            damping: 20,
            stiffness: 100
        }
    }
};

const SenAnalysisSection: React.FC<Props> = ({analysis}) => {
    const renderedEvents = useMemo(() => {
        return analysis.failure_events.map((event, idx) => ({
            ...event,
            formattedStart: formatDate(event.start_date),
            formattedEnd: formatDate(event.end_date),
            duration: formatDuration(event.estimated_duration_seconds),
            eventNumber: idx + 1
        }));
    }, [analysis.failure_events]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-red-500 neobrutal-border p-6 text-white neobrutal-shadow">
                    <h3 className="text-xl md:text-2xl font-bold uppercase">Menciones al SEN</h3>
                    <p className="text-5xl md:text-6xl font-black leading-none mt-2">{analysis.mentions}</p>
                </div>
                <div className="bg-black neobrutal-border p-6 text-white neobrutal-shadow">
                    <h3 className="text-xl md:text-2xl font-bold uppercase">Caídas Totales</h3>
                    <p className="text-5xl md:text-6xl font-black text-red-500 leading-none mt-2">
                        {analysis.total_failure_events}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-8 mb-4">
                <h3 className="text-2xl font-bold border-b-4 border-black inline-block">Cronología de Eventos</h3>
            </div>

            <div className="space-y-12 relative border-l-8 border-black ml-4 pl-8 md:pl-12 py-4">
                {renderedEvents.map((event) => (
                    <m.div
                        key={`${event.eventNumber}-${event.start_date}`}
                        variants={timelineItemVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{once: true, margin: "-50px"}}
                        className="relative bg-white neobrutal-border p-4 md:p-6 neobrutal-shadow mb-12"
                    >
                        {/* Timeline Dot */}
                        <div
                            className="absolute -left-[54px] md:-left-[70px] top-6 w-10 h-10 bg-red-500 border-4 border-black rounded-full z-10 flex items-center justify-center shadow-[2px_2px_0px_0px_black]">
                            <span className="text-white font-bold text-lg">!</span>
                        </div>

                        <div
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-red-50/50 p-4 border-2 border-red-200">
                            <div className="flex items-center gap-3 text-red-600">
                                <AlertOctagon size={32} strokeWidth={3} className="shrink-0"/>
                                <div>
                                    <span
                                        className="block font-black text-xl uppercase leading-none">Caída del Sistema</span>
                                    <span className="text-xs font-bold text-red-400">EVENTO #{event.eventNumber}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-2 shadow-[4px_4px_0px_0px_black] transform rotate-1 self-start sm:self-auto max-w-full">
                                <Clock size={18} className="shrink-0"/>
                                <span className="font-black font-mono text-sm md:text-base break-all sm:break-normal">
                                  {event.duration}
                                </span>
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-8">
                            <div className="bg-gray-50 p-3 border-l-4 border-black">
                                <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-1">Inicio</p>
                                <p className="font-mono text-lg font-bold">{event.formattedStart}</p>
                            </div>
                            <div className="bg-gray-50 p-3 border-l-4 border-black">
                                <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-1">Fin</p>
                                <p className="font-mono text-lg font-bold">{event.formattedEnd}</p>
                            </div>
                        </div>

                        {/* Messages Comparison */}
                        <div
                            className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-6 border-t-4 border-dashed border-gray-200">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="bg-black text-white px-3 py-1 text-xs font-bold uppercase transform -rotate-1">Inicio</span>
                                    <div className="h-[2px] flex-1 bg-black/10"></div>
                                </div>
                                <TelegramMessage message={event.start_message}/>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="bg-black text-white px-3 py-1 text-xs font-bold uppercase transform rotate-1">Restablecimiento</span>
                                    <div className="h-[2px] flex-1 bg-black/10"></div>
                                </div>
                                <TelegramMessage message={event.end_message}/>
                            </div>
                        </div>
                    </m.div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(SenAnalysisSection);