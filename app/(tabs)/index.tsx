import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Picker } from '@react-native-picker/picker';

import { formatCurrency, formatDateBR } from '@/utils/formatters';

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  gasto_name: string;
  origem_name: string;
  pagamento_name: string;
}

export default function ListagemScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth);

  const periods = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value: val });
    }
    return options;
  }, []);

  const fetchExpenses = useCallback(async () => {
    const result: Expense[] = await db.getAllAsync(`
      SELECT 
        e.*, 
        cg.name as gasto_name,
        co.name as origem_name,
        cp.name as pagamento_name
      FROM expenses e 
      LEFT JOIN categories cg ON e.gasto_id = cg.id
      LEFT JOIN categories co ON e.origem_id = co.id
      LEFT JOIN categories cp ON e.pagamento_id = cp.id
      WHERE strftime('%Y-%m', e.date) = ? AND e.data_fim IS NULL
      ORDER BY e.date DESC
    `, [selectedPeriod]);
    setExpenses(result);
  }, [db, selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses])
  );

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity 
      style={[styles.item, { backgroundColor: cardColor, borderColor: borderColor }]} 
      onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
    >
      <View style={styles.itemInfo}>
        <ThemedText style={[styles.description, { color: primaryColor }]} type="defaultSemiBold">{item.description}</ThemedText>
        <ThemedText style={styles.details}>
          <ThemedText style={styles.bold}>{item.gasto_name || 'Sem gasto'}</ThemedText>
          {' • '}
          <ThemedText>{item.origem_name || 'Sem origem'}</ThemedText>
          {' • '}
          <ThemedText>{item.pagamento_name || 'Sem pagto'}</ThemedText>
        </ThemedText>
        <ThemedText style={styles.date}>{formatDateBR(item.date)}</ThemedText>
      </View>
      <ThemedText style={styles.amount} type="defaultSemiBold">{formatCurrency(item.amount)}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.filterContainer, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <ThemedText style={[styles.filterLabel, { color: primaryColor }]} type="defaultSemiBold">Período:</ThemedText>
        <View style={[styles.pickerWrapper, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
          <Picker
            selectedValue={selectedPeriod}
            onValueChange={(itemValue) => setSelectedPeriod(itemValue)}
            style={[styles.picker, { color: textColor }]}
            dropdownIconColor={primaryColor}
            mode="dropdown"
          >
            {periods.map((p) => (
              <Picker.Item 
                key={p.value} 
                label={p.label} 
                value={p.value} 
                color={textColor} 
                style={{ backgroundColor: cardColor }}
              />
            ))}
          </Picker>
        </View>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>Nenhum gasto neste período.</ThemedText>
          </View>
        }
      />
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: primaryColor }]} 
        onPress={() => router.push('/modal')}
      >
        <Image 
          source={require('@/assets/images/mais.png')} 
          style={styles.fabIcon} 
          resizeMode="contain"
        />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
  },
  picker: {
    height: 55,
    width: '100%',
  },
  listContent: {
    padding: 15,
  },
  item: {
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
  },
  details: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  bold: {
    fontWeight: '600',
  },
  date: {
    fontSize: 10,
    color: '#ADB5BD',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabIcon: {
    width: 32,
    height: 32,
    tintColor: '#fff',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
