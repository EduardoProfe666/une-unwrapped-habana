import React from 'react';
import { TelegramMessage as ITelegramMessage } from '../common/types.ts';
import { Eye, MessageCircle } from 'lucide-react';

interface Props {
  message: ITelegramMessage;
  highlightCount?: string;
  className?: string;
}

export const TelegramMessage: React.FC<Props> = ({ message, highlightCount, className = '' }) => {
  return (
    <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-sans max-w-md mx-auto relative overflow-hidden flex flex-col ${className}`}>
        {highlightCount && (
            <div className="absolute top-0 right-0 bg-yellow-400 text-black font-black px-3 py-1 text-sm border-l-4 border-b-4 border-black z-10">
                {highlightCount}
            </div>
        )}
      {/* Header */}
      <div className="flex items-center p-4 border-b-4 border-black gap-3 bg-gray-50">
        <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-white font-black text-xl shrink-0">
          EE
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base leading-tight">Empresa Eléctrica<br/>de La Habana</span>
          <span className="text-xs font-mono text-gray-500 mt-1">{message.date_cuba}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 text-sm text-gray-900 font-medium whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar bg-white">
        {message.text}
        {/* Only show link if not already included in text logic (which is simpler here) */}
        <a href={message.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold block mt-2 hover:underline decoration-2">
            🔗 Ver en Telegram
        </a>
      </div>

      {/* Footer / Stats */}
      <div className="p-3 bg-gray-100 border-t-4 border-black flex items-center justify-between text-xs font-bold mt-auto">
        <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_black]">
            <Eye size={16} />
            <span>{message.views.toLocaleString()}</span>
        </div>
        
        <div className="flex gap-3">
            {message.replies > 0 && (
                 <div className="flex items-center gap-1">
                    <MessageCircle size={16} />
                    <span>{message.replies}</span>
                </div>
            )}
        </div>
      </div>
      
      {/* Reactions Bar imitation */}
      {Object.keys(message.reactions).length > 0 && (
          <div className="px-3 pb-3 pt-2 bg-gray-100 flex flex-wrap gap-2">
              {Object.entries(message.reactions).sort((a,b) => (b[1] as number) - (a[1] as number)).slice(0, 4).map(([emoji, count]) => (
                  <span key={emoji} className="inline-flex items-center bg-white border-2 border-black rounded-lg px-2 py-0.5 text-xs shadow-[2px_2px_0px_0px_black]">
                      <span className="mr-1 text-sm">{emoji}</span>
                      <span className="font-black">{count as number}</span>
                  </span>
              ))}
          </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-left: 2px solid black;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000;
        }
      `}</style>
    </div>
  );
};