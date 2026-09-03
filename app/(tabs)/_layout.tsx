import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

import ListagemScreen from './index';
import RelatorioScreen from './explore';

const Tab = createMaterialTopTabNavigator();

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const themeColors = Colors[colorScheme];

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.primary }}>
      <View style={[styles.header, { backgroundColor: themeColors.primary }]}>
        <ThemedText style={styles.headerTitle}>Meus Gastos</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push('/configuracoes')}
            style={styles.headerButton}
          >
            <IconSymbol name="gearshape.fill" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
          tabBarIndicatorStyle: {
            backgroundColor: '#FFFFFF',
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: themeColors.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            textTransform: 'none',
          },
        }}
      >
        <Tab.Screen 
          name="index" 
          component={ListagemScreen} 
          options={{ title: 'Listagem' }}
        />
        <Tab.Screen 
          name="explore" 
          component={RelatorioScreen} 
          options={{ title: 'Relatório' }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
