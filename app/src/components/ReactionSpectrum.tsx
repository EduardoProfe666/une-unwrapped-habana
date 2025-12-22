import React, {useMemo} from 'react';
import {m} from 'framer-motion';

interface Props {
    distributionReaction: Record<string, number>;
    totalReactions: number;
    accentColor: string;
    year: number;
}

const ReactionSpectrum: React.FC<Props> = ({distributionReaction, totalReactions, accentColor, year}) => {
    const sortedReactions = useMemo(() => {
        return Object.entries(distributionReaction)
            .map(([emoji, count]) => ({
                emoji,
                count,
                percentage: (count / totalReactions) * 100,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [distributionReaction, totalReactions]);

    return (
        <section className="bg-white neobrutal-border p-8 md:p-12 neobrutal-shadow overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-16">

                <div className="lg:w-1/3 space-y-8">
                    <header>
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-[0.8]">
                            Análisis<br/>
                            <span className="text-outline text-white"
                                  style={{WebkitTextStroke: '2px black'}}>Social</span>
                        </h2>
                        <div className="h-4 w-24 bg-black mt-6 mb-4"/>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                            Análisis de {totalReactions.toLocaleString()} reacciones
                        </p>
                    </header>

                    <div className="border-4 border-black p-6 space-y-2 relative">
                        <div
                            className={`absolute -top-4 -right-4 w-12 h-12 border-4 border-black ${accentColor} flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_black]`}>
                            {sortedReactions[0]?.emoji}
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Sentimiento Principal</p>
                        <p className="text-4xl font-black italic">
                            {sortedReactions[0]?.percentage.toFixed(1)}%
                        </p>
                        <p className="text-[10px] font-bold leading-tight">
                            La mayoría de los usuarios interactúan con "{sortedReactions[0]?.emoji}" ante las
                            actualizaciones del SEN.
                        </p>
                    </div>
                </div>

                <div className="lg:w-2/3 w-full flex flex-col gap-3">
                    {sortedReactions.map((item, index) => (
                        <m.div
                            key={item.emoji}
                            initial={{x: 50, opacity: 0}}
                            whileInView={{x: 0, opacity: 1}}
                            transition={{delay: index * 0.05, duration: 0.4}}
                            className="group relative flex items-center h-12"
                        >
                            <div
                                className="w-12 h-full flex items-center justify-center border-y-2 border-l-2 border-black bg-white z-10 group-hover:bg-black group-hover:text-white transition-colors duration-200">
                                <span className="text-2xl">{item.emoji}</span>
                            </div>

                            <div className="flex-1 h-full border-2 border-black bg-gray-50 relative overflow-hidden">
                                <m.div
                                    initial={{width: 0}}
                                    whileInView={{width: `${item.percentage}%`}}
                                    transition={{duration: 1.2, ease: [0.22, 1, 0.36, 1]}}
                                    className={`absolute top-0 left-0 h-full border-r-2 border-black ${accentColor} z-10`}
                                />
                                <div className="absolute inset-0 flex items-center px-4 justify-between z-0">
                                    <span className="text-xs font-black uppercase text-black">
                                        {item.count.toLocaleString()} <span className="opacity-40 ml-2 font-bold">EVTS</span>
                                    </span>
                                    <span className="text-xs font-black text-black opacity-40 font-mono">
                                        {item.percentage.toFixed(1)}%
                                    </span>
                                    </div>
                                    <m.div
                                        initial={{ clipPath: 'inset(0 100% 0 0)' }}
                                        whileInView={{ clipPath: `inset(0 ${100 - item.percentage}% 0 0)` }}
                                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                        className="absolute inset-0 flex items-center px-4 justify-between z-20 pointer-events-none"
                                    >
                                        <span className="text-xs font-black uppercase text-white">
                                            {item.count.toLocaleString()} <span className="opacity-60 ml-2 font-bold text-white">EVTS</span>
                                        </span>
                                        <span className="text-xs font-black text-slate-400 opacity-60 font-mono">
                                            {item.percentage.toFixed(1)}%
                                        </span>
                                    </m.div>
                            </div>

                            <div
                                className="w-10 flex justify-end items-center font-mono text-[10px] font-black opacity-20 group-hover:opacity-100 transition-opacity">
                                {String(index + 1).padStart(2, '0')}
                            </div>
                        </m.div>
                    ))}
                </div>
            </div>

            <div className="mt-16 flex justify-between group items-center border-t-2 border-black pt-4">
                <div className="flex gap-1 opacity-50 group-hover:opacity-100">
                    {Array.from({length: 12}).map((_, i) => (
                        <div key={i} className="w-1 h-4 bg-black" style={{opacity: (i + 1) / 12}}/>
                    ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-slate-500 text-slate-300">
                    Espectro de Reacciones // {year}
                </span>
            </div>
        </section>
    );
};

export default React.memo(ReactionSpectrum);