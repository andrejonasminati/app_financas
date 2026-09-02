import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { SQLiteProvider } from 'expo-sqlite';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeProvider as AppThemeProvider } from '@/context/theme-context';
import { initializeDatabase } from '@/database/initialize';
import { useThemeColor } from '@/hooks/use-theme-color';

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    const isLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !isLoginScreen) {
      router.replace('/login');
    } else if (isAuthenticated && isLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: primaryColor,
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'left',
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Gasto' }} />
        <Stack.Screen name="category-expenses" options={{ presentation: 'modal', title: 'Detalhes da Categoria' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

function LoadingScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
      <ActivityIndicator size="large" color={primaryColor} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="financial_control.db" onInit={initializeDatabase}>
      <AppThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppThemeProvider>
    </SQLiteProvider>
  );
}
