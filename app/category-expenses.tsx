import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
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

const FULL_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CategoryExpensesScreen() {
  const {
    categoryId,
    categoryName,
    filter,
    groupBy,
    specificMonth,
    specificYear,
    startMonth,
    startYear,
    endMonth,
    endYear
  } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  const dateFilter = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const baseFilter = 'e.data_fim IS NULL';

    switch (filter) {
      case 'MONTH':
        const monthStr = String(month + 1).padStart(2, '0');
        return `${baseFilter} AND strftime('%Y-%m', e.date) = '${year}-${monthStr}'`;
      case 'SPECIFIC_MONTH':
        const specM = Number(specificMonth ?? month);
        const specY = Number(specificYear ?? year);
        const specMonthStr = String(specM + 1).padStart(2, '0');
        return `${baseFilter} AND strftime('%Y-%m', e.date) = '${specY}-${specMonthStr}'`;
      case 'RANGE':
        const sM = Number(startMonth ?? 0);
        const sY = Number(startYear ?? year);
        const eM = Number(endMonth ?? month);
        const eY = Number(endYear ?? year);
        const sMonthStr = String(sM + 1).padStart(2, '0');
        const eMonthStr = String(eM + 1).padStart(2, '0');
        return `${baseFilter} AND e.date >= '${sY}-${sMonthStr}-01' AND e.date <= '${eY}-${eMonthStr}-31'`;
      case 'QUARTER':
        const quarterStartMonth = Math.floor(month / 3) * 3 + 1;
        const qStart = `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`;
        return `${baseFilter} AND e.date >= '${qStart}' AND e.date <= date('${qStart}', '+3 months', '-1 day')`;
      case 'SEMESTER':
        const semStartMonth = month < 6 ? '01' : '07';
        const sStart = `${year}-${semStartMonth}-01`;
        return `${baseFilter} AND e.date >= '${sStart}' AND e.date <= date('${sStart}', '+6 months', '-1 day')`;
      case 'YEAR':
        return `${baseFilter} AND strftime('%Y', e.date) = '${year}'`;
      case 'ALL':
      default:
        return baseFilter;
    }
  }, [filter, specificMonth, specificYear, startMonth, startYear, endMonth, endYear]);

  const periodLabel = useMemo(() => {
    switch (filter) {
      case 'MONTH':
        return 'Mês Atual';
      case 'SPECIFIC_MONTH':
        const mIdx = Number(specificMonth ?? 0);
        const yVal = specificYear ?? new Date().getFullYear();
        return `${FULL_MONTHS[mIdx] || ''} / ${yVal}`;
      case 'RANGE':
        const smIdx = Number(startMonth ?? 0);
        const emIdx = Number(endMonth ?? 0);
        return `${FULL_MONTHS[smIdx]?.substring(0, 3)}/${startYear} a ${FULL_MONTHS[emIdx]?.substring(0, 3)}/${endYear}`;
      case 'QUARTER':
        return 'Trimestre Atual';
      case 'SEMESTER':
        return 'Semestre Atual';
      case 'YEAR':
        return 'Ano Atual';
      case 'ALL':
      default:
        return 'Todo o Período';
    }
  }, [filter, specificMonth, specificYear, startMonth, startYear, endMonth, endYear]);

  const totalAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [expenses]);

  const fetchExpenses = useCallback(async () => {
    const filterField = groupBy === 'ORIGIN' ? 'e.origem_id' : 'e.gasto_id';
    
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
      WHERE ${filterField} = ? AND ${dateFilter}
      ORDER BY e.date DESC
    `, [categoryId]);
    setExpenses(result);
  }, [db, categoryId, dateFilter, groupBy]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity 
      style={[styles.item, { backgroundColor: cardColor, borderColor }]} 
      onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
    >
      <View style={styles.itemInfo}>
        <ThemedText style={[styles.description, { color: primaryColor }]}>{item.description}</ThemedText>
        <ThemedText style={styles.details}>
          {item.origem_name || 'Sem origem'}
          {' • '}
          {item.pagamento_name || 'Sem pagto'}
        </ThemedText>
        <ThemedText style={styles.date}>{formatDateBR(item.date)}</ThemedText>
      </View>
      <ThemedText style={styles.amount}>{formatCurrency(item.amount)}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: categoryName as string }} />
      
      <View style={[styles.headerInfo, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <View>
          <ThemedText style={[styles.periodText, { color: primaryColor }]}>
            {periodLabel}
          </ThemedText>
          <ThemedText style={styles.countText}>{expenses.length} registros</ThemedText>
        </View>
        <ThemedText style={[styles.amount, { color: primaryColor }]}>
          Total: {formatCurrency(totalAmount)}
        </ThemedText>
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
            <ThemedText style={styles.emptyText}>Nenhum gasto nesta categoria para este período.</ThemedText>
          </View>
        }
      />

      <TouchableOpacity style={[styles.closeButton, { backgroundColor: primaryColor }]} onPress={() => router.back()}>
        <ThemedText style={styles.closeButtonText}>Voltar ao Relatório</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    padding: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 12,
    color: '#7F8C8D',
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
  description: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  date: {
    fontSize: 10,
    color: '#ADB5BD',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  closeButton: {
    margin: 20,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
