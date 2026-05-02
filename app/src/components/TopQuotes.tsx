import React, {memo} from 'react';
import {m} from 'framer-motion';
import {ExternalLink, Eye, MessageCircleHeart, Quote} from 'lucide-react';
import type {TopQuote} from '@/src/lib/types';

interface Props {
    quotes?: TopQuote[];
    primaryColorClass: string;
    channelUsername?: string;
}

const METRIC_ICON: Record<string, React.FC<{size?: number; strokeWidth?: number}>> = {
    views: Eye,
    replies: MessageCircleHeart,
    reactions: MessageCircleHeart,
};

const METRIC_LABEL: Record<string, string> = {
    views: 'MÁS VISTO',
    replies: 'MÁS COMENTADO',
    reactions: 'MÁS REACCIONES',
};

const formatDate = (s: string): string => {
    if (!s) return '';
    try {
        return new Date(s.replace(' ', 'T')).toLocaleDateString('es-CU', {
            day: '2-digit',
            month: 'short',
        }).toUpperCase();
    } catch {
        return s.slice(5, 10);
    }
};

const QuoteCard: React.FC<{quote: TopQuote; idx: number; primaryColorClass: string; channelUsername: string}> = memo(
    ({quote, idx, primaryColorClass, channelUsername}) => {
        const Icon = METRIC_ICON[quote.metric] ?? Eye;
        const isFirst = idx === 0;

        return (
            <m.div
                initial={{opacity: 0, y: 30, rotate: idx % 2 === 0 ? -1.5 : 1.5}}
                whileInView={{opacity: 1, y: 0, rotate: idx % 2 === 0 ? -0.5 : 0.5}}
                viewport={{once: true, amount: 0.2}}
                transition={{delay: idx * 0.08, type: 'spring', stiffness: 220, damping: 22}}
                whileHover={{y: -5, rotate: 0, scale: 1.01}}
                className={`relative bg-white border-4 border-black p-5 md:p-6 shadow-[8px_8px_0px_0px_black] hover:shadow-[12px_12px_0px_0px_black] transition-shadow group ${isFirst ? 'lg:col-span-2' : ''}`}
            >
                {/* Big quote mark */}
                <m.div
                    className="absolute -top-4 -left-2 text-black opacity-90"
                    animate={{rotate: [0, -4, 4, 0]}}
                    transition={{duration: 4, repeat: Infinity, ease: 'easeInOut'}}
                >
                    <Quote size={40} strokeWidth={3} fill="currentColor"/>
                </m.div>

                {/* Top-right metric badge */}
                <div className={`absolute -top-3 -right-3 ${primaryColorClass} border-4 border-black px-2 py-1 shadow-[3px_3px_0px_0px_black] flex items-center gap-1`}>
                    <Icon size={11} strokeWidth={3}/>
                    <span className="text-white text-[9px] font-black uppercase tracking-widest">
                        {METRIC_LABEL[quote.metric] ?? quote.metric.toUpperCase()}
                    </span>
                </div>

                {/* Rank stripe */}
                <div className="text-[10px] font-mono font-black opacity-30 mb-2 tracking-widest mt-4">
                    QUOTE_{(idx + 1).toString().padStart(2, '0')}
                </div>

                {/* The quote */}
                <m.p
                    initial={{opacity: 0}}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{delay: 0.2 + idx * 0.08, duration: 0.6}}
                    className={`relative font-black uppercase tracking-tighter italic leading-tight mb-4 ${
                        isFirst ? 'text-xl md:text-3xl' : 'text-base md:text-lg'
                    }`}
                >
                    {quote.text_preview || '—'}
                </m.p>

                {/* Footer stats */}
                <div className="flex flex-wrap items-center gap-2 mt-auto pt-3 border-t-2 border-dashed border-black/20 relative">
                    <span className="bg-black text-white text-[9px] font-mono font-black uppercase tracking-widest px-2 py-1 border-2 border-black">
                        {formatDate(quote.date)}
                    </span>
                    <span className="bg-blue-100 text-black text-[9px] font-mono font-black uppercase tracking-widest px-2 py-1 border-2 border-black flex items-center gap-1">
                        <Eye size={10} strokeWidth={3}/>
                        {quote.views.toLocaleString()}
                    </span>
                    {quote.reactions_total > 0 && (
                        <span className="bg-pink-100 text-black text-[9px] font-mono font-black uppercase tracking-widest px-2 py-1 border-2 border-black flex items-center gap-1">
                            <MessageCircleHeart size={10} strokeWidth={3}/>
                            {quote.reactions_total.toLocaleString()}
                        </span>
                    )}

                    <a
                        href={`https://t.me/${channelUsername}/${quote.message_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 bg-white text-black border-2 border-black px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                        Ver original <ExternalLink size={9}/>
                    </a>
                </div>
            </m.div>
        );
    }
);

const TopQuotes: React.FC<Props> = ({quotes, primaryColorClass, channelUsername = 'EmpresaElectricaDeLaHabana'}) => {
    if (!quotes || quotes.length === 0) return null;

    return (
        <section className="bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
            <m.div
                className="absolute -top-6 -right-4 opacity-[0.04] pointer-events-none"
                animate={{rotate: [0, -3, 0, 3, 0]}}
                transition={{duration: 12, repeat: Infinity, ease: 'easeInOut'}}
            >
                <Quote size={220} strokeWidth={1.5} fill="currentColor"/>
            </m.div>

            <header className="mb-8 border-b-4 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <m.span
                            animate={{rotate: [0, -8, 8, 0]}}
                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                            className="inline-block"
                        >
                            <Quote size={28} strokeWidth={3} fill="currentColor"/>
                        </m.span>
                        Frases del Año
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Los mensajes que más impacto tuvieron — vistos, comentados, reaccionados
                    </p>
                </div>
                <div className="font-mono text-[10px] font-black opacity-25 hidden md:block">REF_INT_QUOTES</div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 relative z-10">
                {quotes.map((q, idx) => (
                    <QuoteCard
                        key={q.message_id}
                        quote={q}
                        idx={idx}
                        primaryColorClass={primaryColorClass}
                        channelUsername={channelUsername}
                    />
                ))}
            </div>
        </section>
    );
};

export default memo(TopQuotes);
