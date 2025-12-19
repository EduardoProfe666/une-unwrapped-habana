import React, { useRef } from 'react';
import { BlockAnalysis } from '../types';
import { Download, Zap, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface Props {
  block: BlockAnalysis;
  color: string;
}

export const BlockCard: React.FC<Props> = ({ block, color }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(cardRef.current, {
            backgroundColor: '#fff',
            skipFonts: false
        });
        const link = document.createElement('a');
        link.download = `bloque-${block.number}-une-stats.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error exporting image', error);
        alert('No se pudo exportar la imagen. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
        <div ref={cardRef} className={`bg-white neobrutal-border neobrutal-shadow p-6 flex flex-col gap-4 relative overflow-hidden`}>
            {/* Background Decorative Number */}
            <span className={`absolute right-0 bottom-0 text-9xl font-black opacity-20 select-none pointer-events-none leading-none z-0 ${color}`}>
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
            <div className="space-y-4 z-10 relative bg-white/80 p-2 rounded backdrop-blur-sm border-2 border-transparent">
                {/* ... (Tus estadísticas existentes sin cambios) ... */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <div className="flex items-center gap-2">
                        <Activity size={20} />
                        <span className="font-bold uppercase text-sm">Menciones</span>
                    </div>
                    <span className="text-2xl font-mono font-bold">{block.mentions}</span>
                </div>

                <div className="flex justify-between items-center border-b-2 border-black pb-2 text-green-700">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={20} />
                        <span className="font-bold uppercase text-sm">Recuperaciones</span>
                    </div>
                    <span className="text-2xl font-mono font-bold">{block.declared_recoveries}</span>
                </div>

                <div className="flex justify-between items-center border-b-2 border-black pb-2 text-orange-600">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} />
                        <span className="font-bold uppercase text-sm">Afectaciones</span>
                    </div>
                    <span className="text-2xl font-mono font-bold">{block.declared_affectations}</span>
                </div>

                <div className="flex justify-between items-center text-red-600">
                    <div className="flex items-center gap-2">
                        <Zap size={20} />
                        <span className="font-bold uppercase text-sm">Emergencias</span>
                    </div>
                    <span className="text-2xl font-mono font-bold">{block.declared_emergencies}</span>
                </div>
            </div>

            {/* --- NUEVA SECCIÓN: FOOTER Y DISCLAIMER --- */}
            <div className="mt-4 pt-3 border-t-2 border-black border-dashed z-10 relative flex flex-col items-center gap-1">
                <p className="text-[10px] text-gray-600 font-medium text-center leading-tight max-w-[90%]">
                    * Estadísticas aproximadas no oficiales. <br/>
                    Pueden existir grandes márgenes de error.
                </p>
                <div className="bg-black text-white text-[10px] font-black px-2 py-0.5 mt-1 transform -rotate-1">
                    une-unwrapped-habana.vercel.app
                </div>
            </div>
             {/* ------------------------------------------ */}
        </div>
        
        <button 
            onClick={handleDownload}
            className="self-end bg-black text-white px-3 py-2 text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors neobrutal-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none border-2 border-transparent"
        >
            <Download size={16} /> Guardar Imagen
        </button>
    </div>
  );
};