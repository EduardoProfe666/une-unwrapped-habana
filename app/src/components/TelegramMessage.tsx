import React, {useMemo} from 'react';
import {TelegramMessage as ITelegramMessage} from '../common/types.ts';
import {ExternalLink, Eye, MessageCircle, Hash} from 'lucide-react';
import {m} from 'framer-motion';

interface Props {
    message: ITelegramMessage;
    highlightCount?: string;
    className?: string;
}

const TelegramMessage: React.FC<Props> = ({message, highlightCount, className = ''}) => {
    const topReactions = useMemo(() => {
        return Object.entries(message.reactions)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 4);
    }, [message.reactions]);

    const formattedViews = useMemo(() => {
        return message.views >= 1000
            ? (message.views / 1000).toFixed(1) + 'k'
            : message.views.toLocaleString('es-ES');
    }, [message.views]);

    return (
        <m.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] font-sans max-w-md mx-auto relative flex flex-col group transition-transform hover:-translate-y-1 ${className}`}
        >
            {highlightCount && (
                <div className="absolute -top-1 -right-1 bg-black text-white font-black px-4 py-1 text-sm border-2 border-white z-20 shadow-[-4px_4px_0px_0px_#facc15] flex items-center gap-1 italic">
                    <Hash size={14} className="text-yellow-400" /> {highlightCount}
                </div>
            )}

            <div className="flex items-center p-4 border-b-4 border-black gap-3 bg-white">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-black flex items-center justify-center text-white font-black text-xl shrink-0 shadow-[3px_3px_0px_0px_black]">
                        EE
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-black rounded-full" />
                </div>
                <div className="flex flex-col min-w-0 pr-10">
                    <span className="font-black text-sm uppercase tracking-tighter leading-none truncate">
                        Empresa Eléctrica Habana
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-400 mt-1 uppercase">
                        {new Date(message.date_cuba).toLocaleDateString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="p-5 text-[13px] md:text-sm text-black font-bold whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto overscroll-contain bg-[#fdfdfd] scrollbar-neobrutal">
                <div className="relative z-10">
                    {message.text}
                </div>

                <a
                    href={message.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black mt-4 shadow-[3px_3px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase"
                >
                    <ExternalLink size={12} strokeWidth={3}/> Abrir Canal
                </a>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t-4 border-black flex items-center justify-between mt-auto">
                <div className="flex gap-4 text-black">
                    <div className="flex items-center gap-1.5">
                        <Eye size={16} strokeWidth={3} className="text-black"/>
                        <span className="font-black text-xs">{formattedViews}</span>
                    </div>

                    {message.replies > 0 && (
                        <div className="flex items-center gap-1.5">
                            <MessageCircle size={16} strokeWidth={3} className="text-black"/>
                            <span className="font-black text-xs">{message.replies}</span>
                        </div>
                    )}
                </div>

                <span className="font-mono text-[10px] font-black text-gray-400">
                    ID_{message.id}
                </span>
            </div>

            {topReactions.length > 0 && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 flex flex-wrap gap-2">
                    {topReactions.map(([emoji, count]) => (
                        <div
                            key={emoji}
                            className="inline-flex items-center bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_black]"
                        >
                            <span className="mr-1.5 text-base">{emoji}</span>
                            <span className="font-black text-[11px]">{count as number}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="h-1.5 w-full bg-black flex gap-1 px-1 overflow-hidden opacity-20 group-hover:opacity-100 transition-opacity">
                {Array.from({length: 30}).map((_, i) => (
                    <div key={i} className="h-full bg-white" style={{ width: Math.random() * 10 + 2 + 'px' }} />
                ))}
            </div>
        </m.div>
    );
};

export default React.memo(TelegramMessage);