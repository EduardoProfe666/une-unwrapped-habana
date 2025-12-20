import React, {memo, useMemo} from 'react';
import {MESSAGE_TYPE_DESCRIPTIONS, MESSAGE_TYPE_LABELS} from '@/src/common/constants';
import ReactionBar from "@/src/components/ReactionBar.tsx";

interface DistributionSectionProps {
    distributionMessage: Record<number, number>;
    totalMessages: number;
    totalReactions: number;
    totalPositiveReactions: number;
    totalNegativeReactions: number;
    primaryColorClass: string;
}

const DistributionSection: React.FC<DistributionSectionProps> = ({
                                                                     distributionMessage,
                                                                     totalMessages,
                                                                     totalReactions,
                                                                     totalPositiveReactions,
                                                                     totalNegativeReactions,
                                                                     primaryColorClass
                                                                 }) => {

    const messageDistribution = useMemo(() =>
            Object.entries(distributionMessage).map(([typeId, count]) => ({
                typeId: Number(typeId),
                count,
                percentage: (count / totalMessages) * 100,
                label: MESSAGE_TYPE_LABELS[Number(typeId)] ?? `Tipo ${typeId}`,
                description: MESSAGE_TYPE_DESCRIPTIONS[Number(typeId)] ?? 'Sin descripción disponible.'
            })).sort((a, b) => b.count - a.count),
        [distributionMessage, totalMessages]);

    const positivePercentage = useMemo(() => (totalPositiveReactions / totalReactions) * 100, [totalPositiveReactions, totalReactions]);
    const negativePercentage = useMemo(() => (totalNegativeReactions / totalReactions) * 100, [totalNegativeReactions, totalReactions]);

    return (
        <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_black] overflow-hidden">
            <header className="mb-10 border-b-4 border-black pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Clasificación</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distribución de contenido y sentimiento</p>
                </div>
                <div className="text-right font-mono text-[10px] font-black opacity-20 hidden md:block">
                    REF_INT_DISTR_09
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <div className="lg:col-span-3 space-y-6">
                    <h3 className="text-xs font-black bg-black text-white px-2 py-1 w-fit mb-4 uppercase">Frecuencia por Categoría</h3>
                    <div className="space-y-4">
                        {messageDistribution.map(item => (
                            <div key={item.typeId} className="group relative">
                                <div className="flex justify-between items-end mb-1 px-1">
                                    <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                                    <span className="text-[10px] font-mono font-bold opacity-40">{item.count} MSG</span>
                                </div>
                                <div className="h-8 border-2 border-black bg-gray-50 relative overflow-hidden shadow-[3px_3px_0px_0px_black]">
                                    <div
                                        className={`absolute top-0 left-0 h-full border-r-2 border-black transition-all duration-1000 ease-out ${primaryColorClass}`}
                                        style={{width: `${item.percentage}%`}}
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 z-10 font-black text-[10px] uppercase mix-blend-difference text-white">
                                        {item.percentage.toFixed(1)}% Cobertura
                                    </span>
                                </div>
                                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 flex items-center justify-center">
                                    <div className="bg-black text-white p-2 text-[10px] font-bold border-2 border-white translate-y-8 shadow-xl">
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
                        <div className="h-full w-px bg-black border-dashed border-l-2 opacity-20" />
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