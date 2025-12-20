import React, { useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { formatNumber } from "@/src/common/utils.ts";

interface Props {
  words: Record<string, number>;
  color: string; // Ej: 'bg-blue-500' o 'bg-yellow-400'
}

const WordCloud: React.FC<Props> = ({ words, color }) => {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const processedWords = useMemo(() => {
    const entries = Object.entries(words);
    if (entries.length === 0) return [];

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const max = sorted[0][1];
    const min = sorted[sorted.length - 1][1];
    const range = max - min || 1;

    return sorted.map(([word, count]) => {
      const weight = (count - min) / range;

      const fontSize = 0.8 + weight * 2.2;

      return { word, count, weight, fontSize };
    });
  }, [words]);

  return (
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_black] relative overflow-hidden">
        <div className="bg-black text-white px-6 py-2 flex justify-between items-center">
          <span className="font-mono text-[10px] tracking-[0.3em] font-black uppercase">Frecuencia_Léxica_v2.0</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white/20" />
            <div className="w-2 h-2 bg-white/50" />
            <div className="w-2 h-2 bg-white" />
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-wrap justify-center items-center gap-x-4 gap-y-6">
          {processedWords.map(({ word, count, weight, fontSize }) => (
              <m.div
                  key={word}
                  onMouseEnter={() => setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, transition: { duration: 0.1 } }}
                  className="relative group inline-block"
              >
                <div
                    className={`
                border-2 border-black px-3 py-1 transition-all duration-200 cursor-default
                flex flex-col items-center justify-center text-center
                ${hoveredWord === word ? `${color} shadow-[6px_6px_0px_0px_black] -translate-x-1 -translate-y-1` : 'bg-white shadow-[3px_3px_0px_0px_black]'}
              `}
                    style={{
                      minWidth: `${word.length * 0.6 + fontSize}rem`
                    }}
                >
                  <span
                      className="font-black uppercase leading-none tracking-tighter block"
                      style={{ fontSize: `${fontSize}rem` }}
                  >
                {word}
              </span>

                  {weight > 0.4 && (
                      <span className="mt-1 text-[9px] font-mono font-black opacity-30 border-t border-black/10 w-full pt-1">
                  FREQ_{count}
                </span>
                  )}
                </div>

                <AnimatePresence>
                  {hoveredWord === word && (
                      <m.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-3 py-1 border-2 border-white shadow-[4px_4px_0px_0px_black] whitespace-nowrap pointer-events-none"
                      >
                  <span className="text-[10px] font-black uppercase italic">
                    {formatNumber(count)} Repeticiones
                  </span>
                      </m.div>
                  )}
                </AnimatePresence>
              </m.div>
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
  );
};

export default React.memo(WordCloud);