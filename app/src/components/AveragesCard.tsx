import React, {memo} from 'react';
import {formatNumber} from '@/src/common/utils';
import {m} from 'framer-motion';

interface AveragesCardProps {
    accentClass: string;
    avgViews: number;
    avgReactions: number;
    avgTextLength: number;
    avgPositive: number;
    avgNegative: number;
    year: number;
}

const AveragesCard: React.FC<AveragesCardProps> = ({
                                                       accentClass,
                                                       avgViews,
                                                       avgReactions,
                                                       avgTextLength,
                                                       avgPositive,
                                                       avgNegative,
                                                       year,
                                                   }) => {
    const totalAvgReactions = avgPositive + avgNegative || 1;
    const posRate = (avgPositive / totalAvgReactions) * 100;

    return (
        <div
            className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_black] p-8 w-full max-w-4xl mx-auto relative overflow-hidden">
            {/* Marca de agua / Decoración */}
            <div
                className="absolute -right-8 -top-8 text-[120px] font-black opacity-[0.03] select-none pointer-events-none">
                AVG
            </div>

            <header
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b-4 border-black pb-6">
                <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter">Métricas Promedio</h3>
                    <p className="font-mono text-xs font-bold text-gray-400">ANÁLISIS DE RENDIMIENTO UNITARIO POR
                        MENSAJE</p>
                </div>
                <div
                    className={`${accentClass} border-2 border-black px-4 py-2 font-black text-sm shadow-[4px_4px_0px_0px_black] uppercase rotate-2`}>
                    Consolidado {year}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Bloque Principal: Vistas y Reacciones */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div className="border-l-4 border-black pl-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Vistas / Msg</span>
                        <p className="text-4xl font-black">{formatNumber(avgViews)}</p>
                    </div>
                    <div className="border-l-4 border-black pl-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Reacciones / Msg</span>
                        <p className="text-4xl font-black">{avgReactions.toFixed(1)}</p>
                    </div>
                    <div className="col-span-2 bg-gray-50 border-2 border-black p-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Longitud de Texto Promedio</span>
                        <p className="text-xl font-black uppercase">{avgTextLength} Caracteres</p>
                        <div className="w-full bg-gray-200 h-2 mt-2 border border-black overflow-hidden">
                            <m.div
                                initial={{width: 0}}
                                whileInView={{width: `${Math.min(100, (avgTextLength / 500) * 100)}%`}}
                                className="h-full bg-black"
                            />
                        </div>
                    </div>
                </div>

                {/* Bloque: Ratio de Sentimiento */}
                <div className="flex flex-col justify-center bg-black text-white p-6 shadow-[8px_8px_0px_0px_#22c55e]">
                    <span className="text-[10px] font-black uppercase opacity-60 mb-4">Balance de Sentimiento</span>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-black mb-1">
                                <span>POSITIVO</span>
                                <span>{avgPositive.toFixed(1)}</span>
                            </div>
                            <div className="h-4 bg-gray-800 border border-white/20">
                                <div className="h-full bg-green-500" style={{width: `${posRate}%`}}/>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-black mb-1">
                                <span>NEGATIVO</span>
                                <span>{avgNegative.toFixed(1)}</span>
                            </div>
                            <div className="h-4 bg-gray-800 border border-white/20">
                                <div className="h-full bg-red-500" style={{width: `${100 - posRate}%`}}/>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default memo(AveragesCard);