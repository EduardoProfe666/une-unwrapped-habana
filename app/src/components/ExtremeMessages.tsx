import React, {memo} from 'react';
import MessageHighlightCard from './MessageHighlightCard';

interface ExtremeMessagesProps {
    shortestMessage: any;
    longestMessage: any;
}

const ExtremeMessages: React.FC<ExtremeMessagesProps> = ({ shortestMessage, longestMessage }) => {
    return (
        <section className="space-y-8">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter bg-black text-white px-4 py-1">Anomalías de Texto</h2>
                <div className="h-1 flex-grow bg-black/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl mx-auto">
                <MessageHighlightCard
                    title="Mensaje más corto"
                    message={shortestMessage}
                    accentColor="bg-orange-500"
                />
                <MessageHighlightCard
                    title="Mensaje más largo"
                    message={longestMessage}
                    accentColor="bg-emerald-600"
                />
            </div>
        </section>
    );
};

export default memo(ExtremeMessages);