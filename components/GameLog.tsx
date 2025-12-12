import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Dices, Info } from 'lucide-react';

interface GameLogProps {
  history: LogEntry[];
  loading: boolean;
}

export const GameLog: React.FC<GameLogProps> = ({ history, loading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const getRollStyle = (text: string) => {
      // We rely on CSS variables set in App.tsx based on the Theme
      // but we can add specific modifiers for Crit/Fail
     const match = text.match(/(\d+)/);
     const val = match ? parseInt(match[0]) : 0;
     
     let glow = '';
     if (val === 20) glow = 'shadow-[0_0_15px_var(--dnd-gold)]';
     if (val === 1) glow = 'shadow-[0_0_10px_var(--dnd-red)]';

     return `
        background-color: var(--dnd-dice-bg); 
        color: var(--dnd-dice-text); 
        border-color: var(--dnd-dice-border);
        ${glow}
     `;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar min-h-[300px] max-h-[70vh] md:max-h-none rounded-xl">
      {history.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-dnd-muted/40 italic font-body">
          <span className="text-5xl opacity-20 mb-4 animate-pulse">✦</span>
          История ждет своего героя...
        </div>
      )}
      
      {history.map((entry) => (
        <div key={entry.id} className={`animate-fadeIn flex ${
          entry.type === 'action' ? 'justify-end' : 'justify-start'
        }`}>
          <div className={`max-w-[95%] md:max-w-[95%] ${
            entry.type === 'action' 
              ? 'text-right border-r-2 border-dnd-gold pr-6 py-2'
              : entry.type === 'system'
              ? 'w-full text-center flex items-center justify-center py-4'
              : entry.type === 'roll'
              ? 'w-full flex justify-center py-2'
              : 'text-left pl-0 py-2'
          }`}>
            
            {entry.type === 'action' && (
              <div className="text-dnd-gold font-fantasy text-xl mb-1 tracking-wide">{entry.text}</div>
            )}

            {entry.type === 'narrative' && (
              <div className="text-dnd-primary font-body text-lg leading-relaxed whitespace-pre-line selection:bg-dnd-gold/20">
                {entry.text}
              </div>
            )}

            {entry.type === 'system' && (
               <div className="w-full flex items-center gap-4">
                  <div className="h-px bg-dnd-border flex-1"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-dnd-muted flex items-center gap-2">
                     <Info className="w-3 h-3" /> {entry.text}
                  </span>
                  <div className="h-px bg-dnd-border flex-1"></div>
               </div>
            )}
            
            {entry.type === 'roll' && (
              <div 
                className="px-4 py-2 rounded-xl text-sm font-mono flex items-center gap-3 border transition-all transform hover:scale-105"
                style={{ 
                    backgroundColor: 'var(--dnd-dice-bg)',
                    color: 'var(--dnd-dice-text)',
                    borderColor: 'var(--dnd-dice-border)',
                    boxShadow: entry.text.includes('20') ? '0 0 10px var(--dnd-dice-text)' : 'none'
                }}
              >
                <Dices className="w-4 h-4" /> 
                <span className="font-bold tracking-wider">{entry.text}</span>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-center py-8 opacity-60">
           <div className="flex gap-2">
             <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
             <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
             <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
           </div>
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};