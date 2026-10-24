/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Paleta de marca Chamán 4.0 ("Centro de Comando"): fondo azul noche con acentos
 * esmeralda y cian. La app es solo oscura (userInterfaceStyle: "dark" en app.json), así
 * que ambas entradas usan la misma paleta; se conservan las dos claves para no romper a
 * los componentes que indexan por esquema de color.
 */
const PaletaChaman = {
  text: '#f8fafc',
  background: '#070b14',
  backgroundElement: '#0f172a',
  backgroundSelected: '#1e293b',
  textSecondary: '#94a3b8',
  border: '#1e293b',
  accent: '#10b981',
  accentSoft: 'rgba(16, 185, 129, 0.15)',
  accentSecondary: '#06b6d4',
  onAccent: '#ffffff',
  warning: '#f59e0b',
  danger: '#f87171',
} as const;

export const Colors = {
  light: PaletaChaman,
  dark: PaletaChaman,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
