import { PixelRatio, AccessibilityInfo } from 'react-native';

export function scaledFontSize(size: number): number {
  const scale = Math.min(PixelRatio.getFontScale(), 1.4);
  return Math.round(size * scale);
}

export function isLargeText(): boolean {
  return PixelRatio.getFontScale() > 1.2;
}

export function announceForAccessibility(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}
