export const isNativePlatform = (): boolean => {
  return false;
};

export const getPlatformName = (): string => {
  return 'web';
};

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light'): void => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const duration = style === 'heavy' ? 30 : style === 'medium' ? 20 : 10;
      navigator.vibrate(duration);
    }
  } catch {
    // Fail silently in environments without vibration support
  }
};

export const initMobileStatusBar = async (): Promise<void> => {
  // Web browser no-op
};
