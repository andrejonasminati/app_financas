import { useTheme } from '@/context/theme-context';

export function useColorScheme() {
  try {
    const { theme } = useTheme();
    return theme;
  } catch (error) {
    return 'light';
  }
}
