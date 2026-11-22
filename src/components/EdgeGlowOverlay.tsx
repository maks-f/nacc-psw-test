import React, { useEffect, useState } from 'react';

export type EdgeGlowType = 'correct' | 'incorrect' | null;

interface EdgeGlowOverlayProps {
  glowType: EdgeGlowType;
  onAnimationEnd?: () => void;
}

export const EdgeGlowOverlay: React.FC<EdgeGlowOverlayProps> = ({ glowType, onAnimationEnd }) => {
  const [activeGlow, setActiveGlow] = useState<EdgeGlowType>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (glowType) {
      setActiveGlow(glowType);
      setAnimationKey((prev) => prev + 1);
      const timer = setTimeout(() => {
        setActiveGlow(null);
        if (onAnimationEnd) onAnimationEnd();
      }, 1150);
      return () => clearTimeout(timer);
    }
  }, [glowType, onAnimationEnd]);

  if (!activeGlow) return null;

  return (
    <div
      key={animationKey}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[9999] transition-all duration-200 ${
        activeGlow === 'correct'
          ? 'edge-glow-correct'
          : 'edge-glow-incorrect'
      }`}
    />
  );
};
