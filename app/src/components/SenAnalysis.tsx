import React from 'react';
import { SenAnalysis } from '../common/types.ts';
import { formatDuration, formatDate } from '../common/utils.ts';
import { AlertOctagon, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { TelegramMessage } from './TelegramMessage.tsx';

interface Props {
  analysis: SenAnalysis;
}

const SenAnalysisSection: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-500 neobrutal-border p-6 text-white neobrutal-shadow">
            <h3 className="text-2xl font-bold uppercase">Menciones al SEN</h3>
            <p className="text-6xl font-black">{analysis.mentions}</p>
        </div>
        <div className="bg-black neobrutal-border p-6 text-white neobrutal-shadow">
            <h3 className="text-2xl font-bold uppercase">Caídas Totales</h3>
            <p className="text-6xl font-black text-red-500">{analysis.total_failure_events}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-8 mb-4">
         <h3 className="text-2xl font-bold border-b-4 border-black inline-block">Cronología de Eventos</h3>
         <a href="https://eduardoprofe666.github.io" className="opacity-0 hover:opacity-100 transition-opacity text-xl cursor-default" title="???">🎩</a>
      </div>

      <div className="space-y-12 relative border-l-8 border-black ml-4 pl-8 md:pl-12">
        {analysis.failure_events.map((event, idx) => (
            <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative bg-white neobrutal-border p-6 neobrutal-shadow mb-12"
            >
                {/* Timeline Dot */}
                <div className="absolute -left-[54px] md:-left-[70px] top-6 w-10 h-10 bg-red-500 border-4 border-black rounded-full z-10 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">!</span>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-red-50 p-4 border-2 border-red-100">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertOctagon size={32} strokeWidth={3} />
                        <div>
                             <span className="block font-black text-xl uppercase leading-none">Caída del Sistema</span>
                             <span className="text-xs font-bold text-red-400">EVENTO #{idx + 1}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-2 shadow-[4px_4px_0px_0px_black] transform rotate-1">
                        <Clock size={20} />
                        <span className="font-black font-mono">{formatDuration(event.estimated_duration_seconds)}</span>
                    </div>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 p-3 border-l-4 border-black">
                        <p className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-1">Inicio del Evento</p>
                        <p className="font-mono text-xl font-bold">{formatDate(event.start_date)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 border-l-4 border-black">
                        <p className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-1">Fin del Evento</p>
                        <p className="font-mono text-xl font-bold">{formatDate(event.end_date)}</p>
                    </div>
                </div>

                {/* Messages Comparison */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-6 border-t-4 border-dashed border-gray-300">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <span className="bg-black text-white px-3 py-1 text-sm font-bold uppercase transform -rotate-2">Inicio</span>
                             <span className="h-1 flex-1 bg-black"></span>
                        </div>
                        <TelegramMessage message={event.start_message} className="transform hover:scale-[1.02] transition-transform duration-300" />
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <span className="bg-black text-white px-3 py-1 text-sm font-bold uppercase transform rotate-2">Restablecimiento</span>
                             <span className="h-1 flex-1 bg-black"></span>
                        </div>
                        <TelegramMessage message={event.end_message} className="transform hover:scale-[1.02] transition-transform duration-300" />
                     </div>
                </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SenAnalysisSection;