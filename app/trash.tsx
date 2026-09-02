import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TrashScreen() {
  const [deletedCategories, setDeletedCategories] = useState<any[]>([]);
  const [deletedExpenses, setDeletedExpenses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'EXPENSES'>('CATEGORIES');
  
  const db = useSQLiteContext();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');

  const fetchDeletedItems = useCallback(async () => {
    try {
      // Busca apenas categorias na lixeira (data_fim preenchido) e que ainda são visíveis
      const categories: any[] = await db.getAllAsync(
        'SELECT * FROM categories WHERE data_fim IS NOT NULL AND (visible = 1 OR visible IS NULL)'
      );
      setDeletedCategories(categories);

      // Busca apenas despesas na lixeira e que ainda são visíveis
      const expenses: any[] = await db.getAllAsync(
        'SELECT e.*, c.name as category_name FROM expenses e LEFT JOIN categories c ON e.gasto_id = c.id WHERE e.data_fim IS NOT NULL AND (e.visible = 1 OR e.visible IS NULL)'
      );
      setDeletedExpenses(expenses);
    } catch (error) {
      console.error('Erro ao buscar itens excluídos:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchDeletedItems();
    }, [fetchDeletedItems])
  );

  const handleRestoreCategory = async (id: number) => {
    try {
      await db.runAsync('UPDATE categories SET data_fim = NULL WHERE id = ?', [id]);
      Alert.alert('Sucesso', 'Categoria restaurada com sucesso!');
      fetchDeletedItems();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível restaurar a categoria.');
    }
  };

  const handleRestoreExpense = async (id: number) => {
    try {
      await db.runAsync('UPDATE expenses SET data_fim = NULL WHERE id = ?', [id]);
      Alert.alert('Sucesso', 'Despesa restaurada com sucesso!');
      fetchDeletedItems();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível restaurar a despesa.');
    }
  };

  const handleHideCategory = (id: number) => {
    Alert.alert(
      'Ocultar da Lixeira',
      'Este item não aparecerá mais na lixeira, mas continuará no banco de dados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Ocultar', 
          style: 'destructive',
          onPress: async () => {
            await db.runAsync('UPDATE categories SET visible = 0 WHERE id = ?', [id]);
            fetchDeletedItems();
          } 
        }
      ]
    );
  };

  const handleHideExpense = (id: number) => {
    Alert.alert(
      'Ocultar da Lixeira',
      'Este item não aparecerá mais na lixeira, mas continuará no banco de dados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Ocultar', 
          style: 'destructive',
          onPress: async () => {
            await db.runAsync('UPDATE expenses SET visible = 0 WHERE id = ?', [id]);
            fetchDeletedItems();
          } 
        }
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <View style={[styles.item, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={styles.itemDetail}>{item.type}</ThemedText>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleRestoreCategory(item.id)} style={styles.actionButton}>
          <IconSymbol name="arrow.uturn.backward.circle.fill" size={28} color="#28A745" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleHideCategory(item.id)} style={styles.actionButton}>
          <IconSymbol name="trash.fill" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExpenseItem = ({ item }: { item: any }) => (
    <View style={[styles.item, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName}>{item.description}</ThemedText>
        <ThemedText style={styles.itemDetail}>
          R$ {item.amount.toFixed(2)} • {item.category_name || 'Sem categoria'}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleRestoreExpense(item.id)} style={styles.actionButton}>
          <IconSymbol name="arrow.uturn.backward.circle.fill" size={28} color="#28A745" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleHideExpense(item.id)} style={styles.actionButton}>
          <IconSymbol name="trash.fill" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          header: () => (
            <View style={[styles.customHeader, { backgroundColor: primaryColor }]}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
              >
                <IconSymbol name="chevron.left" size={28} color="#fff" />
              </TouchableOpacity>
              <ThemedText style={styles.customHeaderTitle}>Lixeira</ThemedText>
            </View>
          )
        }} 
      />

      <View style={[styles.tabContainer, { backgroundColor: borderColor }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CATEGORIES' && { backgroundColor: cardColor }]} 
          onPress={() => setActiveTab('CATEGORIES')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'CATEGORIES' && { color: primaryColor }]}>Categorias</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'EXPENSES' && { backgroundColor: cardColor }]} 
          onPress={() => setActiveTab('EXPENSES')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'EXPENSES' && { color: primaryColor }]}>Despesas</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'CATEGORIES' ? deletedCategories : deletedExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={activeTab === 'CATEGORIES' ? renderCategoryItem : renderExpenseItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>Nenhum item na lixeira.</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    height: 140,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  customHeaderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    padding: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 5,
    margin: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  item: {
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetail: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 15,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
});
