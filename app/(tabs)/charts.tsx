import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Picker } from '@react-native-picker/picker';
import { PieChart } from 'react-native-gifted-charts';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CategorySummary {
  category_id: number;
  category_name: string;
  total_amount: number;
  color?: string;
}

interface PieData {
  value: number;
  text: string;
  color: string;
  category_name: string;
}

export type PeriodFilter = 'MONTH' | 'QUARTER' | 'SEMESTER' | 'YEAR' | 'ALL' | 'SPECIFIC_MONTH' | 'RANGE';
export type GroupBy = 'CATEGORY' | 'ORIGIN';

const FULL_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const COLORS = ['#003366', '#50C878', '#FF5733', '#FFC300', '#8E44AD', '#3498DB', '#E67E22', '#2ECC71'];

export default function ChartsScreen() {
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [pieData, setPieData] = useState<PieData[]>([]);
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

    if (result.length > 0 && sum > 0) {
      const top5 = result.slice(0, 5).map((item, index) => ({
        value: item.total_amount,
        text: `${Math.round((item.total_amount / sum) * 100)}%`,
        color: COLORS[index % COLORS.length],
        category_name: item.category_name
      }));
      
      const othersAmount = result.slice(5).reduce((acc, curr) => acc + curr.total_amount, 0);
      if (othersAmount > 0) {
        top5.push({
          value: othersAmount,
          text: `${Math.round((othersAmount / sum) * 100)}%`,
          color: '#ADB5BD',
          category_name: 'Outros'
        });
      }
      setPieData(top5);
    } else {
      setPieData([]);
    }
  }, [db, dateFilter, periodDays, selectedFilter, groupBy]);

  const [isReady, setIsReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timer);
    }, [fetchSummary])
  );

  const topCategory = summaries.length > 0 ? summaries[0].category_name : '---';

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <View style={[styles.filterSection, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <View style={styles.filterHeader}>
          <ThemedText style={styles.filterLabel} type="defaultSemiBold">Período:</ThemedText>
          <View style={[styles.pickerWrapper, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
            <Picker
              selectedValue={selectedFilter}
              onValueChange={(itemValue) => {
                setIsReady(false);
                setSelectedFilter(itemValue);
              }}
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
              onValueChange={(itemValue) => {
                setIsReady(false);
                setGroupBy(itemValue as GroupBy);
              }}
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
                onValueChange={(val) => {
                  setIsReady(false);
                  setSpecificMonth(val);
                }}
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
                onValueChange={(val) => {
                  setIsReady(false);
                  setSpecificYear(val);
                }}
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
                  onValueChange={(val) => {
                    setIsReady(false);
                    setStartMonth(val);
                  }}
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
                  onValueChange={(val) => {
                    setIsReady(false);
                    setStartYear(val);
                  }}
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
                  onValueChange={(val) => {
                    setIsReady(false);
                    setEndMonth(val);
                  }}
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
                  onValueChange={(val) => {
                    setIsReady(false);
                    setEndYear(val);
                  }}
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
          <ThemedText style={[styles.statValue, { color: primaryColor }]} type="defaultSemiBold">R$ {totalExpenses.toFixed(0)}</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.statLabel}>Média Diária</ThemedText>
          <ThemedText style={[styles.statValue, { color: primaryColor }]} type="defaultSemiBold">R$ {dailyAverage.toFixed(0)}</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <ThemedText style={styles.statLabel}>Top Categoria</ThemedText>
          <ThemedText style={[styles.statValue, { color: primaryColor }]} type="defaultSemiBold" numberOfLines={1}>{topCategory}</ThemedText>
        </View>
      </View>

      {totalExpenses > 0 ? (
        <View style={styles.innerContainer}>
          <ThemedText style={styles.sectionTitle} type="subtitle">
            Distribuição por {groupBy === 'CATEGORY' ? 'Gasto' : 'Origem'}
          </ThemedText>
          <View style={[styles.pieWrapper, { backgroundColor: cardColor }]}>
            {isReady && pieData.length > 0 ? (
              <PieChart
                data={pieData}
                donut
                radius={100}
                innerRadius={60}
                textSize={12}
                showGradient={false}
                innerCircleColor={cardColor}
              />
            ) : (
              <ThemedText style={styles.loadingText}>Carregando gráfico...</ThemedText>
            )}
            <View style={styles.pieLegend}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, {backgroundColor: item.color}]} />
                  <ThemedText style={styles.legendText} numberOfLines={1}>{item.category_name}</ThemedText>
                </View>
              ))}
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: primaryColor }]} 
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Voltar ao Relatório</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>Nenhum gasto registrado neste período para gerar gráficos.</ThemedText>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: primaryColor, marginTop: 20 }]} 
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Voltar ao Relatório</ThemedText>
          </TouchableOpacity>
        </View>
      )}
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
  backHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 8,
  },
  backButton: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pieWrapper: {
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieLegend: {
    marginLeft: 20,
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.6,
  },
});
