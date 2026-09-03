import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Picker } from '@react-native-picker/picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

import { formatCurrency } from '@/utils/formatters';

interface CategorySummary {
  category_id: number;
  category_name: string;
  total_amount: number;
  color?: string;
}

export type PeriodFilter = 'MONTH' | 'QUARTER' | 'SEMESTER' | 'YEAR' | 'ALL' | 'SPECIFIC_MONTH' | 'RANGE';
export type GroupBy = 'CATEGORY' | 'ORIGIN';

const FULL_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function RelatorioScreen() {
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<PeriodFilter>('MONTH');
  const [groupBy, setGroupBy] = useState<GroupBy>('CATEGORY');
  
  const [specificMonth, setSpecificMonth] = useState(new Date().getMonth());
  const [specificYear, setSpecificYear] = useState(new Date().getFullYear());
  
  const [startMonth, setStartMonth] = useState(0);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth());
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  const db = useSQLiteContext();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');

  const periodDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();

    switch (selectedFilter) {
      case 'MONTH':
        return getDaysInMonth(month, year);
      case 'SPECIFIC_MONTH':
        return getDaysInMonth(specificMonth, specificYear);
      case 'RANGE':
        const start = new Date(startYear, startMonth, 1);
        const end = new Date(endYear, endMonth + 1, 0);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      case 'QUARTER':
        const qStartMonth = Math.floor(month / 3) * 3;
        let qDays = 0;
        for (let i = 0; i < 3; i++) qDays += getDaysInMonth(qStartMonth + i, year);
        return qDays;
      case 'SEMESTER':
        const sStartMonth = month < 6 ? 0 : 6;
        let sDays = 0;
        for (let i = 0; i < 6; i++) sDays += getDaysInMonth(sStartMonth + i, year);
        return sDays;
      case 'YEAR':
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        return isLeap ? 366 : 365;
      case 'ALL':
      default:
        return 1;
    }
  }, [selectedFilter, specificMonth, specificYear, startMonth, startYear, endMonth, endYear]);

  const dateFilter = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const baseFilter = 'e.data_fim IS NULL';

    switch (selectedFilter) {
      case 'MONTH':
        const monthStr = String(month + 1).padStart(2, '0');
        return `${baseFilter} AND strftime('%Y-%m', e.date) = '${year}-${monthStr}'`;
      case 'SPECIFIC_MONTH':
        const specMonthStr = String(specificMonth + 1).padStart(2, '0');
        return `${baseFilter} AND strftime('%Y-%m', e.date) = '${specificYear}-${specMonthStr}'`;
      case 'RANGE':
        const sMonthStr = String(startMonth + 1).padStart(2, '0');
        const eMonthStr = String(endMonth + 1).padStart(2, '0');
        return `${baseFilter} AND e.date >= '${startYear}-${sMonthStr}-01' AND e.date <= '${endYear}-${eMonthStr}-31'`;
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
  }, [selectedFilter, specificMonth, specificYear, startMonth, startYear, endMonth, endYear]);

  const fetchSummary = useCallback(async () => {
    const groupField = groupBy === 'CATEGORY' ? 'e.gasto_id' : 'e.origem_id';
    const nameField = groupBy === 'CATEGORY' ? 'c.name' : 'o.name';
    
    const result: CategorySummary[] = await db.getAllAsync(`
      SELECT ${groupField} as category_id, ${nameField} as category_name, SUM(e.amount) as total_amount
      FROM expenses e
      ${groupBy === 'CATEGORY' 
        ? 'JOIN categories c ON e.gasto_id = c.id' 
        : 'JOIN categories o ON e.origem_id = o.id'}
      WHERE ${dateFilter}
      GROUP BY ${groupField}
      ORDER BY total_amount DESC
    `);
    setSummaries(result);

    const total: any = await db.getFirstAsync(`
      SELECT SUM(amount) as total FROM expenses e WHERE ${dateFilter}
    `);
    const sum = total?.total || 0;
    setTotalExpenses(sum);
    
    if (selectedFilter === 'ALL') {
      const daysCount: any = await db.getFirstAsync(`SELECT COUNT(DISTINCT date) as days FROM expenses e WHERE ${dateFilter}`);
      setDailyAverage(sum / (daysCount?.days || 1));
    } else {
      setDailyAverage(sum / periodDays);
    }
  }, [db, dateFilter, periodDays, selectedFilter, groupBy]);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [fetchSummary])
  );

  const handleCategoryPress = (category: CategorySummary) => {
    router.push({
      pathname: '/category-expenses',
      params: { 
        categoryId: category.category_id, 
        categoryName: category.category_name,
        filter: selectedFilter,
        groupBy: groupBy,
        specificMonth: specificMonth,
        specificYear: specificYear,
        startMonth: startMonth,
        startYear: startYear,
        endMonth: endMonth,
        endYear: endYear
      }
    });
  };

  const topCategory = summaries.length > 0 ? summaries[0].category_name : '---';

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <View style={[styles.filterSection, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <View style={styles.filterHeader}>
          <ThemedText style={styles.filterLabel} type="defaultSemiBold">Período:</ThemedText>
          <View style={[styles.pickerWrapper, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
            <Picker
              selectedValue={selectedFilter}
              onValueChange={(itemValue) => setSelectedFilter(itemValue)}
              style={[styles.picker, { color: textColor }]}
              dropdownIconColor={primaryColor}
              mode="dropdown"
            >
              <Picker.Item label="Mês Atual" value="MONTH" color={textColor} style={{ backgroundColor: cardColor }} />
              <Picker.Item label="Mês Específico" value="SPECIFIC_MONTH" color={textColor} style={{ backgroundColor: cardColor }} />
              <Picker.Item label="Intervalo de Meses" value="RANGE" color={textColor} style={{ backgroundColor: cardColor }} />
              <Picker.Item label="Trimestre Atual" value="QUARTER" color={textColor} style={{ backgroundColor: cardColor }} />
              <Picker.Item label="Semestre Atual" value="SEMESTER" color={textColor} style={{ backgroundColor: cardColor }} />
              <Picker.Item label="Ano Atual" value="YEAR" color={textColor} style={{ backgroundColor: cardColor }} />
              <Picker.Item label="Todo o Período" value="ALL" color={textColor} style={{ backgroundColor: cardColor }} />
            </Picker>
          </View>
        </View>

        <View style={[styles.filterHeader, { paddingTop: 0 }]}>
          <ThemedText style={styles.filterLabel} type="defaultSemiBold">Agrupar por:</ThemedText>
          <View style={[styles.pickerWrapper, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
            <Picker
              selectedValue={groupBy}
              onValueChange={(itemValue) => setGroupBy(itemValue as GroupBy)}
              style={[styles.picker, { color: textColor }]}
              dropdownIconColor={primaryColor}
              mode="dropdown"
            >
              <Picker.Item label="Categoria de Gasto" value="CATEGORY" color={textColor} style={{ backgroundColor: cardColor }} />
              <Picker.Item label="Origem do Dinheiro" value="ORIGIN" color={textColor} style={{ backgroundColor: cardColor }} />
            </Picker>
          </View>
        </View>

        {selectedFilter === 'SPECIFIC_MONTH' && (
          <View style={styles.subFilterContainer}>
            <View style={[styles.miniPickerWrapper, { backgroundColor: cardColor, borderColor }]}>
              <Picker
                selectedValue={specificMonth}
                onValueChange={(val) => setSpecificMonth(val)}
                style={[styles.miniPicker, { color: textColor }]}
                dropdownIconColor={primaryColor}
                mode="dropdown"
              >
                {FULL_MONTHS.map((m, i) => <Picker.Item key={i} label={m} value={i} color={textColor} style={{ backgroundColor: cardColor }} />)}
              </Picker>
            </View>
            <View style={[styles.miniPickerWrapper, { backgroundColor: cardColor, borderColor }]}>
              <Picker
                selectedValue={specificYear}
                onValueChange={(val) => setSpecificYear(val)}
                style={[styles.miniPicker, { color: textColor }]}
                dropdownIconColor={primaryColor}
                mode="dropdown"
              >
                {YEARS.map(y => <Picker.Item key={y} label={String(y)} value={y} color={textColor} style={{ backgroundColor: cardColor }} />)}
              </Picker>
            </View>
          </View>
        )}

        {selectedFilter === 'RANGE' && (
          <View style={styles.rangeContainer}>
            <View style={styles.rangeRow}>
              <ThemedText style={styles.rangeLabel} type="defaultSemiBold">De:</ThemedText>
              <View style={[styles.miniPickerWrapper, { backgroundColor: cardColor, borderColor }]}>
                <Picker
                  selectedValue={startMonth}
                  onValueChange={(val) => setStartMonth(val)}
                  style={[styles.miniPicker, { color: textColor }]}
                  dropdownIconColor={primaryColor}
                  mode="dropdown"
                >
                  {FULL_MONTHS.map((m, i) => <Picker.Item key={i} label={m} value={i} color={textColor} style={{ backgroundColor: cardColor }} />)}
                </Picker>
              </View>
              <View style={[styles.miniPickerWrapper, { backgroundColor: cardColor, borderColor }]}>
                <Picker
                  selectedValue={startYear}
                  onValueChange={(val) => setStartYear(val)}
                  style={[styles.miniPicker, { color: textColor }]}
                  dropdownIconColor={primaryColor}
                  mode="dropdown"
                >
                  {YEARS.map(y => <Picker.Item key={y} label={String(y)} value={y} color={textColor} style={{ backgroundColor: cardColor }} />)}
                </Picker>
              </View>
            </View>
            <View style={styles.rangeRow}>
              <ThemedText style={styles.rangeLabel} type="defaultSemiBold">Até:</ThemedText>
              <View style={[styles.miniPickerWrapper, { backgroundColor: cardColor, borderColor }]}>
                <Picker
                  selectedValue={endMonth}
                  onValueChange={(val) => setEndMonth(val)}
                  style={[styles.miniPicker, { color: textColor }]}
                  dropdownIconColor={primaryColor}
                  mode="dropdown"
                >
                  {FULL_MONTHS.map((m, i) => <Picker.Item key={i} label={m} value={i} color={textColor} style={{ backgroundColor: cardColor }} />)}
                </Picker>
              </View>
              <View style={[styles.miniPickerWrapper, { backgroundColor: cardColor, borderColor }]}>
                <Picker
                  selectedValue={endYear}
                  onValueChange={(val) => setEndYear(val)}
                  style={[styles.miniPicker, { color: textColor }]}
                  dropdownIconColor={primaryColor}
                  mode="dropdown"
                >
                  {YEARS.map(y => <Picker.Item key={y} label={String(y)} value={y} color={textColor} style={{ backgroundColor: cardColor }} />)}
                </Picker>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.statLabel}>Total Gasto</ThemedText>
          <ThemedText style={[styles.statValue, { color: primaryColor }]} type="defaultSemiBold">{formatCurrency(totalExpenses)}</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.statLabel}>Média Diária</ThemedText>
          <ThemedText style={[styles.statValue, { color: primaryColor }]} type="defaultSemiBold">{formatCurrency(dailyAverage)}</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.statLabel}>Top Categoria</ThemedText>
          <ThemedText style={[styles.statValue, { color: primaryColor }]} type="defaultSemiBold" numberOfLines={1}>{topCategory}</ThemedText>
        </View>
      </View>

      <View style={styles.innerContainer}>
        <ThemedText style={styles.sectionTitle} type="subtitle">
          Ranking por {groupBy === 'CATEGORY' ? 'Categoria' : 'Origem'}
        </ThemedText>
        {summaries.length > 0 ? (
          summaries.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryItem, { backgroundColor: cardColor, borderColor: borderColor }]}
              onPress={() => handleCategoryPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryInfo}>
                <ThemedText style={[styles.categoryName, { color: primaryColor }]} type="defaultSemiBold">{item.category_name}</ThemedText>
                <ThemedText style={styles.categoryAmount} type="defaultSemiBold">{formatCurrency(item.total_amount)}</ThemedText>
              </View>
              <View style={[styles.progressBarBackground, { backgroundColor: borderColor }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(item.total_amount / totalExpenses) * 100}%` }
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>Nenhum gasto registrado neste período.</ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  filterSection: {
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  filterHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  picker: {
    minHeight: 50,
    width: '100%',
  },
  subFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  miniPickerWrapper: {
    flex: 1,
    borderRadius: 10,
    minHeight: 45,
    justifyContent: 'center',
    borderWidth: 1,
  },
  miniPicker: {
    minHeight: 45,
    width: '100%',
  },
  rangeContainer: {
    paddingHorizontal: 20,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  rangeLabel: {
    width: 30,
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
    marginTop: 5,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
    opacity: 0.7,
  },
  statValue: {
    fontSize: 15,
  },
  innerContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginTop: 25,
    marginBottom: 15,
  },
  categoryItem: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryAmount: {
    fontSize: 14,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#50C878',
    borderRadius: 3,
  },
  emptyContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 14,
  },
});
