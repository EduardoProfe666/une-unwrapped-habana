import React from "react";

interface StatBlockProps {
    label: string;
    value: string | number;
    extraClass?: string;
}

const StatBlock: React.FC<StatBlockProps> = ({label,value,extraClass = ''
                                             }) => {
    return (
        <div
            className={`border-4 border-black p-4 flex flex-col justify-between
                        shadow-[3px_3px_0px_0px_black] ${extraClass}`}
        >
            <span className="text-xs font-black uppercase tracking-wide">
                {label}
            </span>

            <span className="text-3xl font-black leading-none mt-2">
                {value}
            </span>
        </div>
    );
};

export default React.memo(StatBlock);
