import React from 'react';

interface Props {
  words: Record<string, number>;
  color: string;
}

const WordCloud: React.FC<Props> = ({ words, color }) => {
  const sortedWords = Object.entries(words).sort((a, b) => (b[1] as number) - (a[1] as number));
  const maxCount = sortedWords[0][1] as number;
  const minCount = sortedWords[sortedWords.length - 1][1] as number;

  const getSize = (count: number) => {
    // Linear scale between 1rem and 4rem
    const minSize = 0.8;
    const maxSize = 4;
    return minSize + ((count - minCount) / (maxCount - minCount)) * (maxSize - minSize);
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 p-8 bg-white neobrutal-border neobrutal-shadow">
      {sortedWords.map(([word, count]) => {
        const size = getSize(count as number);
        return (
          <div 
            key={word}
            className="relative group cursor-pointer transition-transform hover:scale-110"
            style={{ fontSize: `${size}rem` }}
          >
            <span className={`font-bold ${color} opacity-80 group-hover:opacity-100 group-hover:underline decoration-4`}>
              {word}
            </span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 whitespace-nowrap z-20 font-mono">
              {count as number} repeticiones
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WordCloud;