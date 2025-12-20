import React, {memo} from 'react';
import MessageHighlightCard from './MessageHighlightCard';

interface FirstLastMessagesProps {
    firstMessage: any;
    lastMessage: any;
}

const FirstLastMessages: React.FC<FirstLastMessagesProps> = ({
                                                                 firstMessage,
                                                                 lastMessage
                                                             }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
            <MessageHighlightCard
                title="PRIMER MENSAJE"
                message={firstMessage}
            />

            <MessageHighlightCard
                title="ÚLTIMO MENSAJE"
                message={lastMessage}
            />
        </div>
    );
};

export default memo(FirstLastMessages);
