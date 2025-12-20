import React, {memo} from 'react';
import MessageHighlightCard from './MessageHighlightCard';

interface FirstLastMessagesProps {
    firstMessage: any;
    lastMessage: any;
}

const FirstLastMessages: React.FC<FirstLastMessagesProps> = ({ firstMessage, lastMessage }) => {
    return (
        <section className="space-y-8">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter bg-black text-white px-4 py-1">Línea de Tiempo</h2>
                <div className="h-1 flex-grow bg-black/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl mx-auto italic">
                <MessageHighlightCard
                    title="Primer Mensaje"
                    message={firstMessage}
                    accentColor="bg-blue-600"
                />
                <MessageHighlightCard
                    title="Último mensaje"
                    message={lastMessage}
                    accentColor="bg-purple-600"
                />
            </div>
        </section>
    );
};

export default memo(FirstLastMessages);