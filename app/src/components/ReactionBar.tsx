import React from 'react';
import {formatNumber} from '@/src/common/utils';

interface ReactionBarProps {
    emoji: string;
    value: number;
    percentage: number;
    colorClass: string;
    label: string;
}

const ReactionBar = React.memo<ReactionBarProps>(
    ({emoji, value, percentage, colorClass, label}) => (
        <div className="flex flex-col items-center flex-1 h-full justify-end group relative">
            <div className="hidden group-hover:flex absolute left-1/2 -translate-x-1/2 bottom-full mb-4 bg-black text-white p-3 text-xs w-48 border-2 border-white shadow-lg pointer-events-none flex-col items-center text-center">
                <span className="font-black text-lg">{formatNumber(value)}</span>
                <span>{label}</span>
            </div>

            <span className="font-black text-2xl mb-2">
                {percentage.toFixed(1)}%
            </span>

            <div
                style={{height: `${percentage}%`}}
                className={`w-full max-w-[80px] ${colorClass} border-4 border-black min-h-[20px] shadow-[4px_4px_0px_0px_black] transition-all group-hover:-translate-y-1`}
            />

            <span className="text-4xl mt-4">{emoji}</span>
        </div>
    )
);

export default ReactionBar;