import React, {useMemo} from 'react';
import {SenAnalysis} from '../common/types.ts';
import {formatDate, formatDuration} from '../common/utils.ts';
import {AlertOctagon, Clock, Zap, Activity} from 'lucide-react';
import {m} from 'framer-motion';
import TelegramMessage from './TelegramMessage.tsx';

interface Props {
    analysis: SenAnalysis;
}

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
        <div className="space-y-12">
            {/* KPI DE IMPACTO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-600 border-4 border-black p-6 text-white shadow-[8px_8px_0px_0px_black] flex flex-col justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <Activity size={16} /> Menciones Totales
                    </h3>
                    <p className="text-6xl font-black italic mt-4">{analysis.mentions}</p>
                </div>

                <div className="md:col-span-2 bg-black border-4 border-black p-6 text-white shadow-[8px_8px_0px_0px_black] relative overflow-hidden">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                            <Zap size={16} fill="currentColor" /> Eventos de Caída Total
                        </h3>
                        <p className="text-7xl font-black text-red-500 italic leading-none mt-2">
                            {analysis.total_failure_events.toString().padStart(2, '0')}
                        </p>
                    </div>
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={120} strokeWidth={1} />
                    </div>
                </div>
            </div>

            {/* CRONOLOGÍA */}
            <div className="relative">
                <div className="absolute left-4 md:left-8 top-0 bottom-0 w-2 bg-black opacity-10" />
                <div className="absolute left-4 md:left-8 top-0 bottom-0 w-2 border-l-2 border-dashed border-black/30 ml-4" />

                <div className="space-y-20 relative">
                    {renderedEvents.map((event, index) => (
                        <m.div
                            key={`${event.eventNumber}-${event.start_date}`}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative pl-12 md:pl-24"
                        >
                            {/* Punto de Conexión (El "Breaker") */}
                            <div className="absolute left-1.5 md:left-5.5 top-0 flex flex-col items-center">
                                <div className="w-10 h-10 bg-black border-4 border-red-500 rounded-none rotate-45 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(239,68,68,0.5)] z-20">
                                    <span className="text-white font-black text-sm -rotate-45">{event.eventNumber}</span>
                                </div>
                            </div>

                            {/* Contenedor Principal */}
                            <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_black] overflow-hidden">
                                {/* Barra de Estado de la Alerta */}
                                <div className="bg-yellow-300 border-b-4 border-black p-4 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <AlertOctagon size={28} strokeWidth={3} className="text-black" />
                                        <h4 className="font-black text-xl uppercase tracking-tighter">Colapso del Sistema</h4>
                                    </div>
                                    <div className="bg-black text-white px-4 py-2 font-mono text-sm md:text-lg font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] flex items-center gap-2">
                                        <Clock size={20} />
                                        {event.duration}
                                    </div>
                                </div>

                                <div className="p-6 space-y-8">
                                    {/* Info Técnica de Fechas */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-black border-2 border-black">
                                        <div className="bg-gray-50 p-4">
                                            <span className="block text-[10px] font-black uppercase text-gray-400 mb-1">Punto de Desconexión</span>
                                            <span className="font-mono text-base md:text-lg font-bold">{event.formattedStart}</span>
                                        </div>
                                        <div className="bg-gray-50 p-4">
                                            <span className="block text-[10px] font-black uppercase text-gray-400 mb-1">Punto de Sincronización</span>
                                            <span className="font-mono text-base md:text-lg font-bold">{event.formattedEnd}</span>
                                        </div>
                                    </div>

                                    {/* Comparativa de Mensajes */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-2 py-1 bg-red-100 border-l-4 border-red-600 w-fit">
                                                <span className="text-[10px] font-black uppercase text-red-600">Reporte de Falla</span>
                                            </div>
                                            <TelegramMessage message={event.start_message} />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-2 py-1 bg-green-100 border-l-4 border-green-600 w-fit">
                                                <span className="text-[10px] font-black uppercase text-green-600">Reporte de Recuperación</span>
                                            </div>
                                            <TelegramMessage message={event.end_message} />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Técnico del Evento */}
                                <div className="bg-gray-100 border-t-2 border-black p-2 px-4 flex justify-between">
                                    <span className="text-[9px] font-mono font-black opacity-30">SEN_STATUS: CRITICAL</span>
                                    <span className="text-[9px] font-mono font-black opacity-30">LOG_ID_{event.eventNumber.toString().padStart(3, '0')}</span>
                                </div>
                            </div>
                        </m.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(SenAnalysisSection);