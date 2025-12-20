import React, {memo} from 'react';
import {TelegramMessage} from '@/src/components/TelegramMessage';

interface MessageHighlightCardProps {
    title: string;
    message: any;
}

const MessageHighlightCard: React.FC<MessageHighlightCardProps> = ({
                                                                       title,
                                                                       message,
                                                                   }) => {
    return (
        <div className="relative w-full group">
            <span
                className={`absolute -rotate-2 -top-3 left-4 bg-black text-white px-3 py-1 text-xs font-black z-20`}>
                {title}
            </span>

            <div>
                <TelegramMessage message={message}/>
            </div>
        </div>
    );
};

export default memo(MessageHighlightCard);
