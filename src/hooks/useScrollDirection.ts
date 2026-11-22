import { useState, useEffect } from 'react';

/**
 * Hook to detect mobile scroll direction for auto-hiding navigation bars.
 * Only triggers on mobile/tablet viewports (< 768px) with a threshold to avoid jitter.
 */
export function useScrollDirection(enabled: boolean = true) {
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      if (isScrollingDown) setIsScrollingDown(false);
      return;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      // Don't auto-hide on desktop screens
      if (window.innerWidth >= 768) {
        if (isScrollingDown) setIsScrollingDown(false);
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY;

          // Always show navigation when near top
          if (currentScrollY <= 40) {
            setIsScrollingDown(false);
          } else if (diff > 12 && currentScrollY > 80) {
            // Scrolling down with significant delta
            setIsScrollingDown(true);
          } else if (diff < -15) {
            // Scrolling up with deliberate delta
            setIsScrollingDown(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrollingDown, enabled]);

  return isScrollingDown;
}
