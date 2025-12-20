import React, {useMemo} from 'react';
import {TelegramMessage as ITelegramMessage} from '../common/types.ts';
import {ExternalLink, Eye, MessageCircle} from 'lucide-react';

interface Props {
    message: ITelegramMessage;
    highlightCount?: string;
    className?: string;
}

export const TelegramMessage: React.FC<Props> = ({message, highlightCount, className = ''}) => {
    const topReactions = useMemo(() => {
        return Object.entries(message.reactions)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 4);
    }, [message.reactions]);

    const formattedViews = useMemo(() => message.views.toLocaleString('es-ES'), [message.views]);

    return (
        <div
            className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-sans max-w-md mx-auto relative overflow-hidden flex flex-col group ${className}`}>

            {highlightCount && (
                <div
                    className="absolute top-0 right-0 bg-yellow-400 text-black font-black px-3 py-1 text-sm border-l-4 border-b-4 border-black z-10">
                    {highlightCount}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center p-4 border-b-4 border-black gap-3 bg-gray-50">
                <div
                    className="w-12 h-12 rounded-full bg-blue-600 border-2 border-black flex items-center justify-center text-white font-black text-xl shrink-0 shadow-[2px_2px_0px_0px_black]">
                    EE
                </div>
                <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm md:text-base leading-tight truncate sm:whitespace-normal">
            Empresa Eléctrica de La Habana
          </span>
                    <span className="text-[10px] font-mono text-gray-500 mt-1">{new Date(message.date_cuba).toLocaleString('es-CU')}</span>
                </div>
            </div>

            {/* Body */}
            <div
                className="p-4 text-sm text-gray-900 font-medium whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto overscroll-contain bg-white scrollbar-neobrutal">
                {message.text}
                <br/>
                <a
                    href={message.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 font-black mt-3 hover:underline decoration-2 transition-colors"
                >
                    <ExternalLink size={14}/> Ver en Telegram
                </a>
            </div>

            {/* Footer / Stats */}
            <div
                className="p-3 bg-gray-100 border-t-4 border-black flex items-center justify-between text-xs font-bold mt-auto">
                <div
                    className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_black]">
                    <Eye size={14} strokeWidth={3}/>
                    <span>{formattedViews}</span>
                </div>

                {message.replies > 0 && (
                    <div
                        className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_black]">
                        <MessageCircle size={14} strokeWidth={3}/>
                        <span>{message.replies}</span>
                    </div>
                )}
            </div>

            {/* Reactions Bar */}
            {topReactions.length > 0 && (
                <div className="px-3 pb-3 pt-2 bg-gray-100 flex flex-wrap gap-2">
                    {topReactions.map(([emoji, count]) => (
                        <span key={emoji}
                              className="inline-flex items-center bg-white border-2 border-black rounded-lg px-2 py-0.5 text-xs shadow-[2px_2px_0px_0px_black] hover:translate-y-[-1px] transition-transform">
              <span className="mr-1 text-sm">{emoji}</span>
              <span className="font-black">{count as number}</span>
            </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(TelegramMessage);