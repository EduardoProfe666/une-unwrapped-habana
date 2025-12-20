import React from 'react';
import {formatNumber} from '@/src/common/utils';
import {m} from 'framer-motion';

interface ReactionBarProps {
    emoji: string;
    value: number;
    percentage: number;
    colorClass: string;
    label: string;
}

const ReactionBar = React.memo<ReactionBarProps>(
    ({emoji, value, percentage, colorClass, label}) => (
        <div className="flex flex-col items-center flex-1 h-full justify-end group relative w-full max-w-[100px]">
            <div className="absolute -top-4 opacity-0 group-hover:opacity-100 transition-all group-hover:-top-10 z-30 pointer-events-none">
                <div className="bg-black text-white px-3 py-1 text-[10px] font-black border-2 border-white shadow-lg whitespace-nowrap">
                    {formatNumber(value)} {label}
                </div>
            </div>

            <span className="font-black text-xl mb-2 tracking-tighter italic">
                {percentage.toFixed(1)}%
            </span>

            <div className="w-full bg-white border-4 border-black h-full max-h-[160px] relative overflow-hidden shadow-[4px_4px_0px_0px_black]">
                <m.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`absolute bottom-0 left-0 w-full ${colorClass} border-t-4 border-black`}
                />
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                     style={{ backgroundImage: 'linear-gradient(0deg, #000 2px, transparent 2px)', backgroundSize: '100% 10px' }} />
            </div>

            <div className="text-4xl mt-4 transform group-hover:scale-125 transition-transform duration-300">
                {emoji}
            </div>
        </div>
    )
);

export default ReactionBar;