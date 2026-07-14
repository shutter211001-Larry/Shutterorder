import React, { useState, useEffect } from 'react';
import { Sparkles, Gift } from 'lucide-react';

export interface GachaResult {
  parentName: string;
  parentImage?: string | null;
  drawnItems: Array<{ name: string; image?: string | null }>;
}

export const GachaAnimationOverlay = ({ 
  results, 
  onComplete 
}: { 
  results: GachaResult[]; 
  onComplete: () => void;
}) => {
  const [phase, setPhase] = useState<'slideIn' | 'fadeWhite' | 'reveal'>('slideIn');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (phase === 'slideIn') {
      const timer = setTimeout(() => setPhase('fadeWhite'), 1500);
      return () => clearTimeout(timer);
    }
    if (phase === 'fadeWhite') {
      const timer = setTimeout(() => setPhase('reveal'), 800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPhase('slideIn');
    } else {
      onComplete();
    }
  };

  const currentResult = results[currentIndex];
  if (!currentResult) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/90 font-sans backdrop-blur-sm">
      {/* Slide In Phase */}
      {(phase === 'slideIn' || phase === 'fadeWhite') && (
        <div className={`flex flex-col items-center justify-center transform transition-all duration-1000 ease-out ${phase === 'slideIn' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-100 scale-110'} ${phase === 'fadeWhite' ? 'brightness-200 contrast-200' : ''}`}>
          <div className="text-white text-2xl font-bold mb-8 animate-pulse text-center">
            正在為您開啟...<br />
            <span className="text-primary-400">{currentResult.parentName}</span>
          </div>
          <div className="w-64 h-64 bg-surface rounded-3xl shadow-[0_0_50px_rgba(var(--color-primary-500),0.5)] border-4 border-primary-500 flex flex-col items-center justify-center overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent"></div>
            {currentResult.parentImage ? (
              <img src={currentResult.parentImage} alt="Box" className="w-48 h-48 object-cover rounded-xl shadow-lg relative z-10 animate-bounce" />
            ) : (
              <Gift className="w-32 h-32 text-primary-500 relative z-10 animate-bounce" />
            )}
            <Sparkles className="absolute top-4 right-4 w-8 h-8 text-yellow-400 animate-spin" />
            <Sparkles className="absolute bottom-4 left-4 w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Fade White Overlay */}
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-500 z-50 ${phase === 'fadeWhite' ? 'opacity-100' : 'opacity-0'}`} />

      {/* Reveal Phase */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-6 animate-fadeIn z-40">
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-600 mb-2 text-center drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            恭喜獲得！
          </h2>
          <p className="text-gray-400 text-sm md:text-base mb-10 text-center">來自 {currentResult.parentName}</p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 max-w-4xl max-h-[50vh] overflow-y-auto p-4 custom-scrollbar">
            {currentResult.drawnItems.map((item, idx) => (
              <div 
                key={idx} 
                className="w-40 md:w-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center shadow-2xl transform hover:scale-105 transition-transform"
                style={{ animation: `slideUp 0.5s ease-out ${idx * 0.15}s both` }}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/5 flex items-center justify-center mb-4 relative shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-10"></div>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover relative z-20" />
                  ) : (
                    <span className="text-white/50 font-bold text-xl uppercase tracking-wider relative z-20">{item.name.substring(0, 1)}</span>
                  )}
                </div>
                <h3 className="text-white font-bold text-center text-lg leading-tight drop-shadow-md">{item.name}</h3>
              </div>
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="mt-12 px-10 py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold rounded-full shadow-[0_0_30px_rgba(var(--color-primary-500),0.6)] transform hover:scale-105 transition-all text-lg tracking-wider active:scale-95"
          >
            {currentIndex < results.length - 1 ? '開啟下一個盲盒' : '確認並繼續'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
