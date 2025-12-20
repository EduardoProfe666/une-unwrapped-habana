import { TelegramMessage as TelegramMessageType } from "@/src/common/types.ts";
import React, { memo } from "react";
import { formatNumber } from "@/src/common/utils.ts";
import TelegramMessage from "@/src/components/TelegramMessage.tsx";
import { m } from "framer-motion";

export interface TopListProps {
    title: string;
    items: TelegramMessageType[];
    badgeColorClass: string;
}

const TopListSectionComponent: React.FC<TopListProps> = ({ title, items, badgeColorClass }) => {
    if (!items?.length) return null;

    return (
        <section className="space-y-12 py-8">
            <div className="relative inline-block">
                <h2 className={`relative z-10 text-2xl md:text-5xl font-black uppercase tracking-tighter px-6 py-2 border-4 border-black shadow-[8px_8px_0px_0px_black] ${badgeColorClass}`}>
                    {title}
                </h2>
                <div className="absolute top-1/2 left-full w-24 md:w-64 h-1 bg-black -z-10 hidden md:block" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {items.map((msg, index) => {
                    const rankColors = [
                        "bg-yellow-400", // Gold
                        "bg-gray-300",   // Silver
                        "bg-[#cd7f32]"   // Bronze
                    ];

                    return (
                        <m.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="relative flex flex-col pt-8"
                        >
                            <div className={`
                                absolute top-0 left-6 z-30 
                                border-4 border-black px-4 py-1
                                font-black text-2xl italic shadow-[4px_4px_0px_0px_black]
                                ${rankColors[index] || "bg-white"}
                            `}>
                                #{index + 1}
                            </div>

                            <div className="group transition-transform duration-300 hover:-translate-y-2">
                                <TelegramMessage
                                    message={msg}
                                    highlightCount={
                                        msg.count !== undefined
                                            ? formatNumber(msg.count)
                                            : undefined
                                    }
                                />
                            </div>
                            
                            <div className="mt-4 flex items-center gap-2 px-2">
                                <div className="h-0.5 flex-grow bg-black opacity-10" />
                                <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">
                                    Top_Result_{index + 1}
                                </span>
                            </div>
                        </m.div>
                    );
                })}
            </div>
        </section>
    );
};

const TopList = memo(
    TopListSectionComponent,
    (prev, next) =>
        prev.title === next.title &&
        prev.badgeColorClass === next.badgeColorClass &&
        prev.items === next.items
);

export default TopList;