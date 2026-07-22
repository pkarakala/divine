export const Colors = {
  primary: '#1A1A2E',
  primaryLight: '#2D2D44',
  accent: '#C9A96E',
  accentLight: '#E8D5A8',
  white: '#FFFFFF',
  offWhite: '#F8F8FA',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  success: '#4CAF50',
  error: '#E53935',
  warning: '#FF9800',
  info: '#2196F3',
  background: {
    light: '#FFFFFF',
    dark: '#1A1A2E',
  },
  text: {
    primary: '#1A1A2E',
    secondary: '#616161',
    light: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  card: {
    light: '#FFFFFF',
    dark: '#2D2D44',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
