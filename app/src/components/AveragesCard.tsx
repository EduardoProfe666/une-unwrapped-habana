import React, {memo} from 'react';
import {formatNumber} from '@/src/common/utils';
import StatBlock from "@/src/components/StatBlock.tsx";

interface AveragesCardProps {
    accentClass: string;
    avgViews: number;
    avgReactions: number;
    avgTextLength: number;
    avgPositive: number;
    avgNegative: number;
}

const AveragesCard: React.FC<AveragesCardProps> = ({
                                                       accentClass,
                                                       avgViews,
                                                       avgReactions,
                                                       avgTextLength,
                                                       avgPositive,
                                                       avgNegative
                                                   }) => {
    return (
        <div
            className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_black] p-6 w-full max-w-3xl mx-auto
                       transition-transform hover:-translate-y-1"
        >
            {/* HEADER */}
            <div className="flex justify-center mb-6">
                <span
                    className={`px-6 py-2 text-xl font-black uppercase border-4 border-black ${accentClass}`}
                >
                    Promedios
                </span>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-2 gap-4">

                {/* VIEWS */}
                <StatBlock
                    label="Vistas / Msg"
                    value={formatNumber(avgViews)}
                />

                {/* REACTIONS */}
                <StatBlock
                    label="Reacciones / Msg"
                    value={avgReactions}
                />

                {/* TEXT LENGTH (FULL WIDTH) */}
                <div className="col-span-2">
                    <StatBlock
                        label="Longitud del Texto"
                        value={`${avgTextLength} letras`}
                    />
                </div>

                {/* POSITIVE */}
                <StatBlock
                    label="👍 Reacciones Positivas"
                    value={avgPositive}
                    extraClass="bg-green-100"
                />

                {/* NEGATIVE */}
                <StatBlock
                    label="👎 Reacciones Negativas"
                    value={avgNegative}
                    extraClass="bg-red-100"
                />
            </div>
        </div>
    );
};

export default memo(AveragesCard);
