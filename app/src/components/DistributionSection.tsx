import React, {memo, useMemo, useState} from 'react';
import {AI_CATEGORY_BG_COLORS, AI_CATEGORY_DESCRIPTIONS, AI_CATEGORY_LABELS, MESSAGE_TYPE_DESCRIPTIONS, MESSAGE_TYPE_LABELS} from '@/src/lib/constants';
import ReactionBar from "@/src/components/ReactionBar.tsx";

interface DistributionSectionProps {
    distributionMessage: Record<number, number>;
    aiCategoriesDistribution?: Record<string, number>;
    totalMessages: number;
    totalReactions: number;
    totalPositiveReactions: number;
    totalNegativeReactions: number;
    primaryColorClass: string;
}

type Mode = 'legacy' | 'ai';

const DistributionSection: React.FC<DistributionSectionProps> = ({
                                                                     distributionMessage,
                                                                     aiCategoriesDistribution,
                                                                     totalMessages,
                                                                     totalReactions,
                                                                     totalPositiveReactions,
                                                                     totalNegativeReactions,
                                                                     primaryColorClass
                                                                 }) => {

    const hasAi = !!aiCategoriesDistribution && Object.keys(aiCategoriesDistribution).length > 0;
    const [mode, setMode] = useState<Mode>(hasAi ? 'ai' : 'legacy');

    const legacyDistribution = useMemo(() =>
            Object.entries(distributionMessage).map(([typeId, count]) => ({
                key: typeId,
                count,
                percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0,
                label: MESSAGE_TYPE_LABELS[Number(typeId)] ?? `Tipo ${typeId}`,
                description: MESSAGE_TYPE_DESCRIPTIONS[Number(typeId)] ?? 'Sin descripción disponible.',
                color: primaryColorClass,
            })).sort((a, b) => b.count - a.count),
        [distributionMessage, totalMessages, primaryColorClass]);

    const aiDistribution = useMemo(() => {
        if (!hasAi) return [];
        return Object.entries(aiCategoriesDistribution!).map(([catId, count]) => ({
            key: catId,
            count,
            percentage: totalMessages > 0 ? (count / totalMessages) * 100 : 0,
            label: AI_CATEGORY_LABELS[catId] ?? catId,
            description: AI_CATEGORY_DESCRIPTIONS[catId] ?? 'Categoría detectada por IA.',
            color: AI_CATEGORY_BG_COLORS[catId] ?? 'bg-gray-400',
        })).sort((a, b) => b.count - a.count);
    }, [aiCategoriesDistribution, hasAi, totalMessages]);

    const distribution = mode === 'ai' ? aiDistribution : legacyDistribution;

    const positivePercentage = useMemo(() => totalReactions > 0 ? (totalPositiveReactions / totalReactions) * 100 : 0, [totalPositiveReactions, totalReactions]);
    const negativePercentage = useMemo(() => totalReactions > 0 ? (totalNegativeReactions / totalReactions) * 100 : 0, [totalNegativeReactions, totalReactions]);

    return (
        <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_black] overflow-hidden">
            <header className="mb-10 border-b-4 border-black pb-4 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Clasificación</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {mode === 'ai' ? 'Categorías derivadas por la IA · 15 etiquetas' : 'Tipos clásicos heredados · 5 etiquetas'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {hasAi && (
                        <div className="flex border-2 border-black shadow-[3px_3px_0px_0px_black]">
                            <button
                                onClick={() => setMode('ai')}
                                className={`px-3 py-1.5 cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'ai' ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                IA · 15
                            </button>
                            <button
                                onClick={() => setMode('legacy')}
                                className={`px-3 py-1.5 cursor-pointer text-[10px] font-black uppercase tracking-widest transition-all border-l-2 border-black ${mode === 'legacy' ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                CLÁSICA · 5
                            </button>
                        </div>
                    )}
                    <div className="text-right font-mono text-[10px] font-black opacity-20 hidden md:block">REF_INT_DISTR_09</div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <div className="lg:col-span-3 space-y-6">
                    <h3 className="text-xs font-black bg-black text-white px-2 py-1 w-fit mb-4 uppercase">Frecuencia por Categoría</h3>
                    <div className="space-y-3">
                        {distribution.map(item => (
                            <div key={item.key} className="group relative">
                                <div className="flex justify-between items-end mb-1 px-1">
                                    <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                                    <span className="text-[10px] font-mono font-bold opacity-40">{item.count.toLocaleString()} MSG</span>
                                </div>

                                <div className="h-7 border-2 border-black bg-gray-50 relative overflow-hidden shadow-[3px_3px_0px_0px_black]">
                                    <div className={`absolute top-0 left-0 h-full border-r-2 border-black transition-all duration-1000 ease-out ${item.color} z-10`} style={{width: `${item.percentage}%`}}/>

                                    <div className="absolute inset-0 flex items-center px-2 z-0">
                                        <span className="font-black text-[10px] uppercase text-black">
                                            {item.percentage.toFixed(1)}% Cobertura
                                        </span>
                                    </div>

                                    <div className="absolute inset-0 flex items-center px-2 z-20 pointer-events-none transition-all duration-1000 ease-out"
                                         style={{
                                             clipPath: `inset(0 ${100 - item.percentage}% 0 0)`,
                                             color: 'white'
                                         }}>
                                        <span className="font-black text-[10px] uppercase">
                                            {item.percentage.toFixed(1)}% Cobertura
                                        </span>
                                    </div>
                                </div>

                                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[30] flex items-center justify-center">
                                    <div className="bg-black text-white p-2 text-[10px] font-bold border-2 border-white translate-y-8 shadow-xl max-w-[260px] text-center uppercase tracking-tighter">
                                        {item.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col bg-gray-50 border-4 border-black p-6 shadow-[6px_6px_0px_0px_black]">
                    <h3 className="text-xs font-black uppercase border-b-2 border-black pb-2 mb-8 text-center">Balance de Reacciones</h3>

                    <div className="flex gap-8 items-end h-64 w-full justify-center">
                        <ReactionBar
                            emoji="👍"
                            value={totalPositiveReactions}
                            percentage={positivePercentage}
                            colorClass="bg-green-400"
                            label="POSITIVAS"
                        />
                        <div className="h-full w-px bg-black border-dashed border-l-2 opacity-20"/>
                        <ReactionBar
                            emoji="👎"
                            value={totalNegativeReactions}
                            percentage={negativePercentage}
                            colorClass="bg-red-400"
                            label="NEGATIVAS"
                        />
                    </div>

                    <div className="mt-8 text-center border-t-2 border-black pt-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Muestra Total: {totalReactions.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default memo(DistributionSection);
