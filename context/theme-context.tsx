import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const deviceColorScheme = useDeviceColorScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result: any = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', ['theme_mode']);
        if (result?.value) {
          setModeState(result.value as ThemeMode);
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
      }
    };
    loadTheme();
  }, [db]);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['theme_mode', newMode]);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const theme = mode === 'system' ? deviceColorScheme : mode;

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
