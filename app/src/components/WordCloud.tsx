import React, {useMemo, useState} from 'react';
import {AnimatePresence} from 'framer-motion';
import NeobrutalTooltip from "@/src/components/NeobrutalTooltip.tsx";
import {formatNumber} from "@/src/common/utils.ts";

interface Props {
  words: Record<string, number>;
  color: string;
}

const WordCloud: React.FC<Props> = ({ words, color }) => {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const processedWords = useMemo(() => {
    const sorted = Object.entries(words).sort((a, b) => (b[1] as number) - (a[1] as number));
    if (sorted.length === 0) return [];

    const max = sorted[0][1] as number;
    const min = sorted[sorted.length - 1][1] as number;
    const range = max - min || 1;

    return sorted.map(([word, count]) => ({
      word,
      count: count as number,
      size: 0.8 + (((count as number) - min) / range) * (4 - 0.8)
    }));
  }, [words]);

  return (
      <div className="flex flex-wrap justify-center gap-4 p-8 bg-white neobrutal-border neobrutal-shadow">
        {processedWords.map(({ word, count, size }) => (
            <div
                key={word}
                className="relative group cursor-pointer transition-transform hover:scale-110"
                style={{ fontSize: `${size.toFixed(2)}rem` }}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
            >
          <span className={`font-bold ${color} opacity-80 group-hover:opacity-100 group-hover:underline decoration-4`}>
            {word}
          </span>

              <AnimatePresence>
                {hoveredWord === word && (
                    <div className="absolute bottom-3/4 mb-4">
                      <NeobrutalTooltip text={`${formatNumber(count)} repeticiones`} />
                    </div>
                )}
              </AnimatePresence>
            </div>
        ))}
      </div>
  );
};

export default React.memo(WordCloud);