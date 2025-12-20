import {TelegramMessage as TelegramMessageType} from "@/src/common/types.ts";
import {memo} from "react";
import {formatNumber} from "@/src/common/utils.ts";
import TelegramMessage from "@/src/components/TelegramMessage.tsx";

export interface TopListProps {
    title: string;
    items: TelegramMessageType[];
    badgeColorClass: string;
}

const TopListSectionComponent: React.FC<TopListProps> = ({title, items, badgeColorClass}) => {
    if (!items?.length) return null;

    return (
        <section className="space-y-6">
            <h2 className={`text-2xl md:text-4xl font-black inline-block px-4 py-1 neobrutal-border neobrutal-shadow ${badgeColorClass}`}>
                {title}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {items.map((msg, index) => (
                    <div key={msg.id} className="transform hover:-translate-y-2 transition-transform duration-300">
                        <div className="text-center font-bold text-4xl mb-2 opacity-20">
                            #{index + 1}
                        </div>

                        <TelegramMessage
                            message={msg}
                            highlightCount={
                                msg.count !== undefined
                                    ? formatNumber(msg.count)
                                    : undefined
                            }
                        />
                    </div>
                ))}
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