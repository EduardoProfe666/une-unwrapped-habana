import React, {memo, useMemo} from 'react';
import {MESSAGE_TYPE_DESCRIPTIONS, MESSAGE_TYPE_LABELS} from '@/src/common/constants';
import {formatNumber} from '@/src/common/utils';
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

    const messageDistribution = useMemo(
        () =>
            Object.entries(distributionMessage).map(([typeId, count]) => ({
                typeId: Number(typeId),
                count,
                percentage: (count / totalMessages) * 100,
                label: MESSAGE_TYPE_LABELS[Number(typeId)] ?? `Tipo ${typeId}`,
                description:
                    MESSAGE_TYPE_DESCRIPTIONS[Number(typeId)] ??
                    'Sin descripción disponible.'
            })),
        [distributionMessage, totalMessages]
    );

    const positivePercentage = useMemo(
        () => (totalPositiveReactions / totalReactions) * 100,
        [totalPositiveReactions, totalReactions]
    );

    const negativePercentage = useMemo(
        () => (totalNegativeReactions / totalReactions) * 100,
        [totalNegativeReactions, totalReactions]
    );

    return (
        <section className="bg-white neobrutal-border p-8 neobrutal-shadow">
            <h2 className="text-3xl font-black mb-6 uppercase">
                Tipos de Mensajes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* MESSAGE TYPES */}
                <div className="space-y-4">
                    {messageDistribution.map(item => (
                        <div
                            key={item.typeId}
                            className="flex items-center gap-2 group cursor-help relative"
                        >
                            <div className="w-full bg-gray-100 h-10 border-2 border-black shadow-[2px_2px_0px_0px_black] relative overflow-hidden">
                                <div
                                    className={`absolute top-0 left-0 h-full ${primaryColorClass}`}
                                    style={{width: `${item.percentage}%`}}
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 z-10 font-bold text-xs uppercase">
                                    {item.label}
                                </span>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 z-10 font-mono text-xs font-bold">
                                    {item.count}
                                </span>
                            </div>

                            {/* Tooltip */}
                            <div className="hidden group-hover:flex absolute left-0 bottom-full mb-2 bg-black text-white p-3 text-xs w-64 border-2 border-white shadow-lg pointer-events-none z-20">
                                {item.description}
                            </div>
                        </div>
                    ))}
                </div>

                {/* REACTIONS */}
                <div className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 p-4">
                    <h3 className="font-bold mb-8 uppercase text-xl">
                        Reacciones Totales
                    </h3>

                    <div className="flex gap-12 items-end h-64 w-full justify-center px-4">
                        <ReactionBar
                            emoji="👍"
                            value={totalPositiveReactions}
                            percentage={positivePercentage}
                            colorClass="bg-green-500"
                            label="REACCIONES POSITIVAS"
                        />

                        <ReactionBar
                            emoji="👎"
                            value={totalNegativeReactions}
                            percentage={negativePercentage}
                            colorClass="bg-red-500"
                            label="REACCIONES NEGATIVAS"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default memo(DistributionSection);