import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Picker } from '@react-native-picker/picker';
import { useThemeColor } from '@/hooks/use-theme-color';

interface Category {
  id: number;
  name: string;
  type: 'GASTO' | 'ORIGEM' | 'PAGAMENTO';
}

export default function ExpenseModalScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  
  const [gastoId, setGastoId] = useState<number | string>('');
  const [origemId, setOrigemId] = useState<number | string>('');
  const [pagamentoId, setPagamentoId] = useState<number | string>('');

  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const [gastosCategories, setGastosCategories] = useState<Category[]>([]);
  const [origemCategories, setOrigemCategories] = useState<Category[]>([]);
  const [pagamentoCategories, setPagamentoCategories] = useState<Category[]>([]);
  
  const db = useSQLiteContext();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    const fetchData = async () => {
      const allCats: Category[] = await db.getAllAsync('SELECT * FROM categories WHERE data_fim IS NULL');
      
      const gastos = allCats.filter(c => c.type === 'GASTO');
      const origens = allCats.filter(c => c.type === 'ORIGEM');
      const pagamentos = allCats.filter(c => c.type === 'PAGAMENTO');

      setGastosCategories(gastos);
      setOrigemCategories(origens);
      setPagamentoCategories(pagamentos);

      if (isEditing) {
        const expense: any = await db.getFirstAsync('SELECT * FROM expenses WHERE id = ?', [id]);
        if (expense) {
          setDescription(expense.description);
          setAmount(expense.amount.toString());
          setGastoId(expense.gasto_id);
          setOrigemId(expense.origem_id);
          setPagamentoId(expense.pagamento_id);
          
          // Format date from YYYY-MM-DD to DD/MM/YYYY
          if (expense.date) {
            const [y, m, d] = expense.date.split('-');
            setCustomDate(`${d}/${m}/${y}`);
            setUseCustomDate(true);
          }
        }
      } else {
        if (gastos.length > 0) setGastoId(gastos[0].id);
        if (origens.length > 0) setOrigemId(origens[0].id);
        if (pagamentos.length > 0) setPagamentoId(pagamentos[0].id);
        
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();
        setCustomDate(`${d}/${m}/${y}`);
      }
    };
    fetchData();
  }, [db, id]);

  const handleDateChange = (text: string) => {
    // Basic mask DD/MM/YYYY
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    setCustomDate(formatted);
  };

  const validateDate = (dateStr: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateStr)) return false;
    
    const [d, m, y] = dateStr.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  };

  const handleSave = async () => {
    if (!description || !amount || !gastoId || !origemId || !pagamentoId) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (useCustomDate && !validateDate(customDate)) {
      Alert.alert('Erro', 'Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount)) {
      Alert.alert('Erro', 'Valor inválido.');
      return;
    }

    let finalDate;
    if (useCustomDate) {
      const [d, m, y] = customDate.split('/');
      finalDate = `${y}-${m}-${d}`;
    } else {
      finalDate = new Date().toISOString().split('T')[0];
    }

    try {
      if (isEditing) {
        await db.runAsync(
          'UPDATE expenses SET description = ?, amount = ?, date = ?, gasto_id = ?, origem_id = ?, pagamento_id = ? WHERE id = ?',
          [description, numericAmount, finalDate, gastoId as number, origemId as number, pagamentoId as number, id]
        );
      } else {
        await db.runAsync(
          'INSERT INTO expenses (description, amount, date, gasto_id, origem_id, pagamento_id) VALUES (?, ?, ?, ?, ?, ?)',
          [description, numericAmount, finalDate, gastoId as number, origemId as number, pagamentoId as number]
        );
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o gasto.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Mover para Lixeira', 'Deseja mover este gasto para a lixeira?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Mover', 
        style: 'destructive', 
        onPress: async () => {
          const now = new Date().toISOString();
          await db.runAsync('UPDATE expenses SET data_fim = ? WHERE id = ?', [now, id]);
          router.back();
        } 
      }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <Stack.Screen options={{ title: isEditing ? 'Editar Gasto' : 'Adicionar Gasto' }} />
            <ThemedView style={styles.container}>
              <ThemedText style={[styles.label, { color: primaryColor }]}>Descrição</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardColor, borderColor, color: textColor }]}
                placeholder="Ex: Almoço"
                placeholderTextColor={iconColor}
                value={description}
                onChangeText={setDescription}
              />

              <ThemedText style={[styles.label, { color: primaryColor }]}>Valor (R$)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardColor, borderColor, color: textColor }]}
                placeholder="0.00"
                placeholderTextColor={iconColor}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <ThemedText style={[styles.label, { color: primaryColor }]}>Subcategoria de Gasto</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: cardColor, borderColor }]}>
                <Picker
                  selectedValue={gastoId}
                  onValueChange={(itemValue) => setGastoId(itemValue)}
                  style={[styles.picker, { color: textColor }]}
                  dropdownIconColor={primaryColor}
                >
                  {gastosCategories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} color={textColor} style={{ backgroundColor: cardColor }} />
                  ))}
                </Picker>
              </View>

              <ThemedText style={[styles.label, { color: primaryColor }]}>Origem do Dinheiro</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: cardColor, borderColor }]}>
                <Picker
                  selectedValue={origemId}
                  onValueChange={(itemValue) => setOrigemId(itemValue)}
                  style={[styles.picker, { color: textColor }]}
                  dropdownIconColor={primaryColor}
                >
                  {origemCategories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} color={textColor} style={{ backgroundColor: cardColor }} />
                  ))}
                </Picker>
              </View>

              <ThemedText style={[styles.label, { color: primaryColor }]}>Tipo de Pagamento</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: cardColor, borderColor }]}>
                <Picker
                  selectedValue={pagamentoId}
                  onValueChange={(itemValue) => setPagamentoId(itemValue)}
                  style={[styles.picker, { color: textColor }]}
                  dropdownIconColor={primaryColor}
                >
                  {pagamentoCategories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} color={textColor} style={{ backgroundColor: cardColor }} />
                  ))}
                </Picker>
              </View>

              <View style={[styles.dateToggleContainer, { backgroundColor: cardColor, borderColor }]}>
                <ThemedText style={[styles.dateToggleLabel, { color: primaryColor }]}>Informar data específica?</ThemedText>
                <Switch
                  value={useCustomDate}
                  onValueChange={setUseCustomDate}
                  trackColor={{ false: '#767577', true: '#50C878' }}
                  thumbColor={useCustomDate ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              {useCustomDate && (
                <View>
                  <ThemedText style={[styles.label, { color: primaryColor }]}>Data do Gasto</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: cardColor, borderColor, color: textColor }]}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={iconColor}
                    value={customDate}
                    onChangeText={handleDateChange}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              )}

              <TouchableOpacity style={[styles.button, { backgroundColor: primaryColor }]} onPress={handleSave}>
                <ThemedText style={styles.buttonText}>{isEditing ? 'Atualizar Gasto' : 'Salvar Gasto'}</ThemedText>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity style={[styles.deleteButton, { backgroundColor: cardColor, borderColor: '#FF3B30' }]} onPress={handleDelete}>
                  <ThemedText style={[styles.deleteButtonText, { color: '#FF3B30' }]}>Excluir Gasto</ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1.5,
  },
  dateToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
});
