import { useMediaQuery } from './useMediaQuery';

// Standardized 2026 breakpoints
// XS: 0px - 499px
// SM: 500px - 767px
// MD: 768px - 1199px
// LG: 1200px - 1919px
// XL: 1920px+

export function useDisplayTopology() {
  const isExtraSmall = useMediaQuery('(max-width: 499px)');
  const isSmall = useMediaQuery('(min-width: 500px) and (max-width: 767px)');
  const isMedium = useMediaQuery('(min-width: 768px) and (max-width: 1199px)');
  const isLarge = useMediaQuery('(min-width: 1200px) and (max-width: 1919px)');
  const isUltraWide = useMediaQuery('(min-width: 1920px)');
  
  const isMobile = isExtraSmall || isSmall;
  const isDesktop = isLarge || isUltraWide;
  
  const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return {
    isExtraSmall,
    isSmall,
    isMedium,
    isLarge,
    isUltraWide,
    isMobile,
    isDesktop,
    isReducedMotion,
  };
}
