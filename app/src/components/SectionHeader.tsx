import React from "react";

const SectionHeader = ({ title, color, id }: { title: string, color: string, id: string }) => (
    <div id={id} className="pt-20 mb-12">
        <div className="flex items-center gap-4">
            <div className={`h-12 w-12 border-4 border-black ${color} flex items-center justify-center shadow-[4px_4px_0px_0px_black]`}>
                <span className="font-black text-xl">{title.split('_')[0]}</span>
            </div>
            <div className="flex-1 h-1 bg-black"></div>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter bg-white border-4 border-black px-6 py-2 shadow-[6px_6px_0px_0px_black]">
                {title.split('_').slice(1).join(' ')}
            </h2>
        </div>
    </div>
);

export default React.memo(SectionHeader);