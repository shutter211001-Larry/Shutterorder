import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface GachaResult {
  parentItemId: string;
  parentItemName: string;
  hasGachaAnimation: boolean;
  image?: string | null;
  results: {
    childItemId: string;
    childItemName: string;
    quantity: number;
    image?: string | null;
  }[];
}

interface Props {
  results: GachaResult[];
  onComplete: () => void;
}

export function GachaAnimationOverlay({ results, onComplete }: Props) {
  const { t } = useTranslation();
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'fade-white' | 'reveal' | 'done'>('intro');

  // Filter only results that want animation
  const animatingResults = results.filter(r => r.hasGachaAnimation);

  useEffect(() => {
    if (animatingResults.length === 0) {
      onComplete();
      return;
    }

    if (phase === 'intro') {
      const timer = setTimeout(() => setPhase('fade-white'), 2000);
      return () => clearTimeout(timer);
    } else if (phase === 'fade-white') {
      const timer = setTimeout(() => setPhase('reveal'), 1500);
      return () => clearTimeout(timer);
    } else if (phase === 'reveal') {
      const timer = setTimeout(() => {
        if (activeResultIndex < animatingResults.length - 1) {
          setActiveResultIndex(prev => prev + 1);
          setPhase('intro');
        } else {
          setPhase('done');
          setTimeout(onComplete, 1000); // 1s buffer before unmounting
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, activeResultIndex, animatingResults.length, onComplete]);

  if (animatingResults.length === 0 || phase === 'done') return null;

  const currentResult = animatingResults[activeResultIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Background Overlay */}
      <div 
        className={`absolute inset-0 bg-black/80 transition-opacity duration-1000 ${
          phase === 'fade-white' ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* White Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-white transition-opacity duration-700 ${
          phase === 'fade-white' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full p-6 text-center">
        {phase === 'intro' && (
          <div className="animate-pulse flex flex-col items-center space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-wide drop-shadow-lg">
              {t('gacha.opening') || '準備開箱...'}
            </h2>
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white/10 backdrop-blur-sm">
              {currentResult.image ? (
                <img 
                  src={currentResult.image} 
                  alt={currentResult.parentItemName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-white/50">
                  🎁
                </div>
              )}
            </div>
            <p className="text-xl text-white/90 font-medium">{currentResult.parentItemName}</p>
          </div>
        )}

        {phase === 'reveal' && (
          <div className="animate-bounce flex flex-col items-center space-y-6">
            <h2 className="text-4xl font-black text-white mb-2 tracking-wider drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300">
              {t('gacha.congratulations') || '恭喜抽中！'}
            </h2>
            
            <div className="flex flex-col gap-4 w-full">
              {currentResult.results.map((child, idx) => (
                <div 
                  key={idx}
                  className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(253,224,71,0.4)] ring-4 ring-yellow-400 bg-white"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  {child.image ? (
                    <img 
                      src={child.image} 
                      alt={child.childItemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-50 to-gray-200">
                      🎉
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-12">
                    <p className="text-xl font-bold text-white">{child.childItemName}</p>
                    {child.quantity > 1 && (
                      <p className="text-yellow-400 font-medium">x{child.quantity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
