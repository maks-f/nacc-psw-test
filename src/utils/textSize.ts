import { TextSize } from '../types';

export interface TextSizeClasses {
  stem: string;
  translation: string;
  option: string;
  optionTranslation: string;
  explanation: string;
}

export function getTextSizeClasses(size: TextSize = 'normal'): TextSizeClasses {
  switch (size) {
    case 'compact':
      return {
        stem: 'text-sm sm:text-base',
        translation: 'text-[11px] sm:text-xs',
        option: 'text-xs sm:text-sm',
        optionTranslation: 'text-[11px] sm:text-xs',
        explanation: 'text-xs',
      };
    case 'large':
      return {
        stem: 'text-lg sm:text-xl',
        translation: 'text-sm sm:text-base',
        option: 'text-sm sm:text-base',
        optionTranslation: 'text-xs sm:text-sm',
        explanation: 'text-sm sm:text-base',
      };
    case 'normal':
    default:
      return {
        stem: 'text-base sm:text-lg',
        translation: 'text-xs sm:text-sm',
        option: 'text-xs sm:text-[14.5px]',
        optionTranslation: 'text-[12px] sm:text-[13px]',
        explanation: 'text-xs sm:text-sm',
      };
  }
}

export function getNextTextSize(current: TextSize): TextSize {
  if (current === 'compact') return 'normal';
  if (current === 'normal') return 'large';
  return 'compact';
}
