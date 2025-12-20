import React, {memo} from 'react';
import MessageHighlightCard from './MessageHighlightCard';

interface ExtremeMessagesProps {
    shortestMessage: any;
    longestMessage: any;
}

const ExtremeMessages: React.FC<ExtremeMessagesProps> = ({
                                                             shortestMessage,
                                                             longestMessage
                                                         }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8  w-full max-w-5xl mx-auto">
            <MessageHighlightCard
                title="MENSAJE MÁS CORTO"
                message={shortestMessage}
            />

            <MessageHighlightCard
                title="MENSAJE MÁS LARGO"
                message={longestMessage}
            />
        </div>
    );
};

export default memo(ExtremeMessages);
