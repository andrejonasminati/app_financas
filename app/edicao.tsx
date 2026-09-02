import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, TextInput, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type CategoryType = 'GASTO' | 'ORIGEM' | 'PAGAMENTO';

interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

export default function EdicaoCategoriasScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryType>('GASTO');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const db = useSQLiteContext();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  const fetchCategories = useCallback(async () => {
    const result: Category[] = await db.getAllAsync(
      'SELECT id, name, type FROM categories WHERE type = ? AND data_fim IS NULL',
      [activeTab]
    );
    setCategories(result);
  }, [db, activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await db.runAsync(
        'INSERT INTO categories (name, type) VALUES (?, ?)',
        [newCategory.trim(), activeTab]
      );
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar a categoria.');
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', [editingName.trim(), editingId]);
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o nome.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      // Verificar se existem despesas vinculadas (ativos e não excluídos)
      const expensesCount: any = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM expenses WHERE (gasto_id = ? OR origem_id = ? OR pagamento_id = ?) AND data_fim IS NULL',
        [id, id, id]
      );

      const message = expensesCount.count > 0 
        ? `Esta categoria possui ${expensesCount.count} lançamentos ativos. Se você excluí-la, ela será movida para a lixeira e não aparecerá em novos lançamentos. Deseja continuar?`
        : 'Deseja mover esta categoria para a lixeira?';

      Alert.alert(
        'Excluir Categoria',
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Mover para Lixeira', 
            style: 'destructive',
            onPress: async () => {
              const now = new Date().toISOString();
              await db.runAsync('UPDATE categories SET data_fim = ? WHERE id = ?', [now, id]);
              fetchCategories();
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao verificar despesas:', error);
      Alert.alert('Erro', 'Não foi possível processar a exclusão.');
    }
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={[styles.item, { backgroundColor: cardColor, borderColor }]}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {editingId === item.id ? (
          <TextInput
            style={[styles.itemName, styles.inputEdit, { color: textColor, borderBottomColor: primaryColor }]}
            value={editingName}
            onChangeText={setEditingName}
            autoFocus
            onBlur={handleSaveEdit}
            onSubmitEditing={handleSaveEdit}
          />
        ) : (
          <TouchableOpacity 
            style={{ flex: 1 }} 
            onPress={() => handleStartEdit(item)}
          >
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.actions}>
        {editingId === item.id ? (
          <TouchableOpacity onPress={handleSaveEdit} style={styles.actionButton}>
            <IconSymbol name="checkmark.circle.fill" size={24} color="#28A745" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => handleStartEdit(item)} style={styles.actionButton}>
            <IconSymbol name="pencil.circle.fill" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          onPress={() => handleDeleteCategory(item.id)} 
          style={styles.actionButton}
        >
          <IconSymbol name="trash.fill" size={24} color="#FF3B30" />
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
              <ThemedText style={styles.customHeaderTitle}>Gerenciar Categorias</ThemedText>
            </View>
          )
        }} 
      />
      <View style={[styles.content, { backgroundColor }]}>
        <View style={[styles.tabContainer, { backgroundColor: borderColor }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'GASTO' && { backgroundColor: cardColor }]} 
            onPress={() => setActiveTab('GASTO')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'GASTO' && { color: primaryColor }]}>Gastos</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ORIGEM' && { backgroundColor: cardColor }]} 
            onPress={() => setActiveTab('ORIGEM')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'ORIGEM' && { color: primaryColor }]}>Origem</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'PAGAMENTO' && { backgroundColor: cardColor }]} 
            onPress={() => setActiveTab('PAGAMENTO')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'PAGAMENTO' && { color: primaryColor }]}>Pagamento</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.addSection}>
          <TextInput
            style={[styles.input, { backgroundColor: cardColor, borderColor, color: textColor }]}
            placeholder={`Nova subcategoria de ${activeTab.toLowerCase()}`}
            placeholderTextColor={iconColor}
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <TouchableOpacity style={[styles.addButton, { backgroundColor: primaryColor }]} onPress={handleAddCategory}>
            <ThemedText style={styles.addButtonText}>Adicionar</ThemedText>
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 5,
    marginBottom: 20,
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
  addSection: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  input: {
    flex: 1,
    height: 55,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
  },
  inputEdit: {
    borderBottomWidth: 1,
    padding: 0,
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
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
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 15,
  },
});
