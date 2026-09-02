/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#003366'; // Azul Marinho
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#2C3E50', // Cinza Escuro (mais suave que preto)
    background: '#F8F9FA', // Cinza Claríssimo (fundo limpo)
    tint: tintColorLight,
    icon: '#7F8C8D',
    tabIconDefault: '#BDC3C7',
    tabIconSelected: tintColorLight,
    primary: '#003366', // Azul Marinho
    secondary: '#50C878', // Verde Esmeralda
    card: '#FFFFFF',
    border: '#E9ECEF',
  },
  dark: {
    text: '#ECEDEE',
    background: '#121212',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#5DADE2', // Azul mais claro e legível para modo dark
    secondary: '#50C878',
    card: '#1E1E1E',
    border: '#333333',
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
