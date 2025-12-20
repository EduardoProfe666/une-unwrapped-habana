import React, {memo} from 'react';
import TelegramMessage from '@/src/components/TelegramMessage';
import { m } from 'framer-motion';

interface MessageHighlightCardProps {
    title: string;
    message: any;
    accentColor?: string;
}

const MessageHighlightCard: React.FC<MessageHighlightCardProps> = ({
                                                                       title,
                                                                       message,
                                                                       accentColor = "bg-black"
                                                                   }) => {
    if (!message) return null;

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative w-full group"
        >
            <div className="flex">
                <div className={`
                    ${accentColor} text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest 
                    border-4 border-black relative z-10
                `}>
                    {title}
                </div>

            </div>

            <div className="relative -mt-1 group-hover:-translate-y-1 transition-transform duration-300">
                <TelegramMessage
                    message={message}
                    className="shadow-[8px_8px_0px_0px_black] group-hover:shadow-[12px_12px_0px_0px_black] transition-shadow"
                />
            </div>

            <div className="absolute -bottom-4 right-4 font-mono text-[8px] font-black opacity-10 group-hover:opacity-30 transition-opacity uppercase">
                Record_Type: {title.replace(" ", "_")}
            </div>
        </m.div>
    );
};

export default memo(MessageHighlightCard);