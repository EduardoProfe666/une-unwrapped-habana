import React, {memo} from 'react';
import {formatNumber} from '@/src/common/utils';

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
        <div className="bg-white neobrutal-border p-6 neobrutal-shadow-sm space-y-4 w-full max-w-2xl mx-auto transition-transform hover:-translate-y-1">
            <h2
                className={`text-3xl font-black ${accentClass} uppercase border-b-2 border-black pb-2 text-center`}
            >
                Promedios
            </h2>

            <ul className="space-y-3 font-mono text-lg">
                <li className="flex justify-between">
                    <span>Vistas/Msg:</span>
                    <b>{formatNumber(avgViews)}</b>
                </li>
                <li className="flex justify-between">
                    <span>Reacciones/Msg:</span>
                    <b>{avgReactions}</b>
                </li>
                <li className="flex justify-between">
                    <span>Longitud Texto:</span>
                    <b>{avgTextLength} letras</b>
                </li>
                <li className="flex justify-between text-green-600">
                    <span>👍 Avg:</span>
                    <b>{avgPositive}</b>
                </li>
                <li className="flex justify-between text-red-600">
                    <span>👎 Avg:</span>
                    <b>{avgNegative}</b>
                </li>
            </ul>
        </div>
    );
};

export default memo(AveragesCard);
