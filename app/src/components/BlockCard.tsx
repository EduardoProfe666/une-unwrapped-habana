import React, { useRef, useState, useCallback, useMemo } from 'react';
import { BlockAnalysis } from '../common/types.ts';
import { Download, Zap, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { AnimatePresence } from 'framer-motion';
import NeobrutalTooltip from "@/src/components/NeobrutalTooltip.tsx";

interface Props {
  block: BlockAnalysis;
  color: string;
}

const BlockCard: React.FC<Props> = ({ block, color }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `bloque-${block.number}-stats.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  }, [block.number]);

  const stats = useMemo(() => [
    { id: 'mentions', label: 'Menciones', value: block.mentions, icon: Activity, text: `Cantidad de veces que se mencionó al bloque ${block.number}`, colorClass: 'text-black' },
    { id: 'recoveries', label: 'Recuperaciones', value: block.declared_recoveries, icon: CheckCircle, text: `Cantidad de veces que se mencionó que el bloque ${block.number} estaba en proceso de recuperación`, colorClass: 'text-green-700' },
    { id: 'affectations', label: 'Afectaciones', value: block.declared_affectations, icon: AlertTriangle, text: `Cantidad de veces que se mencionó que el bloque ${block.number} estaba siendo afectado`, colorClass: 'text-orange-600' },
    { id: 'emergencies', label: 'Emergencias', value: block.declared_emergencies, icon: Zap, iconSize: 20, text: `Cantidad de veces que se mencionó que el bloque ${block.number} estaba afectado específicamente por emergencia`, colorClass: 'text-red-600' },
  ], [block]);

  return (
      <div className="flex flex-col gap-2 group">
        <div
            ref={cardRef}
            className="bg-white neobrutal-border neobrutal-shadow p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-2"
        >
          {/* Decorative Background Number */}
          <span className={`absolute right-0 bottom-0 text-9xl font-black opacity-10 select-none pointer-events-none leading-none z-0 ${color} transition-opacity group-hover:opacity-20`}>
          {block.number}
        </span>

          {/* Header */}
          <div className="flex justify-between items-center z-10 relative">
            <h3 className={`text-2xl font-black ${color} bg-black px-3 py-1`}>
              BLOQUE {block.number}
            </h3>
            <Zap className={color} size={32} strokeWidth={3} />
          </div>

          {/* Stats Container */}
          <div className="space-y-1 z-10 relative bg-transparent rounded border border-transparent">
            {stats.map((stat) => (
                <div
                    key={stat.id}
                    className={`flex justify-between items-center border-b-2 border-black py-3 cursor-help relative last:border-b-0 ${stat.colorClass}`}
                    onMouseEnter={() => setHoveredStat(stat.id)}
                    onMouseLeave={() => setHoveredStat(null)}
                >
                  <AnimatePresence>
                    {hoveredStat === stat.id && (
                        <div className="absolute bottom-full mb-1">
                          <NeobrutalTooltip text={stat.text} />
                        </div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2">
                    <stat.icon size={20} />
                    <span className="font-bold uppercase text-xs md:text-sm tracking-tight">{stat.label}</span>
                  </div>
                  <span className="text-2xl font-mono font-black">{stat.value}</span>
                </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-2 pt-3 border-t-2 border-black border-dashed z-10 relative flex flex-col items-center gap-1">
            <p className="text-[9px] text-gray-500 font-bold text-center leading-tight uppercase">
              * Datos no oficiales sujetos a error
            </p>
            <div className="bg-black text-white text-[10px] font-black px-2 py-0.5 mt-1 transform -rotate-1">
              une-unwrapped-habana.vercel.app
            </div>
          </div>
        </div>

        <button
            onClick={handleDownload}
            className="self-end bg-black text-white px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all neobrutal-shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none border-2 border-black"
        >
          <Download size={16} />
          <span>GUARDAR</span>
        </button>
      </div>
  );
};

export default React.memo(BlockCard);