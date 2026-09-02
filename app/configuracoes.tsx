import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Alert, ScrollView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/context/theme-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';

export default function ConfiguracoesScreen() {
  const [dbSize, setDbSize] = useState<string>('Calculando...');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { mode, setMode } = useTheme();
  const { user, logout } = useAuth();
  
  const db = useSQLiteContext();
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  const calculateDbSize = useCallback(async () => {
    try {
      const pageSizeResult: any = await db.getFirstAsync('PRAGMA page_size');
      const pageCountResult: any = await db.getFirstAsync('PRAGMA page_count');
      
      const pageSize = pageSizeResult?.page_size || 0;
      const pageCount = pageCountResult?.page_count || 0;
      
      const sizeInBytes = pageSize * pageCount;
      if (sizeInBytes < 1024) {
        setDbSize(`${sizeInBytes} bytes`);
      } else if (sizeInBytes < 1024 * 1024) {
        setDbSize(`${(sizeInBytes / 1024).toFixed(2)} KB`);
      } else {
        setDbSize(`${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`);
      }
    } catch (error) {
      console.error('Erro ao calcular tamanho do banco:', error);
      setDbSize('Erro ao calcular');
    }
  }, [db]);

  useEffect(() => {
    calculateDbSize();
  }, [calculateDbSize]);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos de senha.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    try {
      if (!user) {
        Alert.alert('Erro', 'Usuário não identificado.');
        return;
      }
      await db.runAsync('UPDATE users SET password = ? WHERE username = ?', [newPassword, user]);
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordVisible(false);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      Alert.alert('Erro', 'Não foi possível alterar a senha.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() }
    ]);
  };

  return (
    <ThemedView style={styles.mainContainer}>
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
              <ThemedText style={styles.customHeaderTitle}>Configurações</ThemedText>
            </View>
          )
        }} 
      />
      <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
        <ThemedText style={styles.sectionTitle}>Geral</ThemedText>
        
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: cardColor, borderColor }]} 
          onPress={() => router.push('/edicao')}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol name="pencil.and.outline" size={24} color={primaryColor} />
            <ThemedText style={[styles.menuItemText, { color: primaryColor }]}>Gerenciar Categorias</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#ADB5BD" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: cardColor, borderColor }]} 
          onPress={() => router.push('/trash')}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol name="trash.fill" size={24} color={primaryColor} />
            <ThemedText style={[styles.menuItemText, { color: primaryColor }]}>Lixeira (Itens Excluídos)</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#ADB5BD" />
        </TouchableOpacity>

        <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.infoCardHeader}>
            <IconSymbol name="internaldrive.fill" size={20} color={primaryColor} />
            <ThemedText style={[styles.infoCardTitle, { color: primaryColor }]}>Armazenamento</ThemedText>
          </View>
          <View style={styles.infoCardBody}>
            <ThemedText style={styles.infoLabel}>Tamanho do Banco de Dados</ThemedText>
            <ThemedText style={styles.infoValue}>{dbSize}</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Aparência</ThemedText>
        <View style={[styles.themeContainer, { backgroundColor: cardColor, borderColor }]}>
          <TouchableOpacity 
            style={[styles.themeOption, mode === 'light' && { backgroundColor: primaryColor }]} 
            onPress={() => setMode('light')}
          >
            <IconSymbol name="house.fill" size={20} color={mode === 'light' ? '#fff' : primaryColor} />
            <ThemedText style={[styles.themeText, { color: primaryColor }, mode === 'light' && styles.themeTextActive]}>Claro</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.themeOption, mode === 'dark' && { backgroundColor: primaryColor }]} 
            onPress={() => setMode('dark')}
          >
            <IconSymbol name="house.fill" size={20} color={mode === 'dark' ? '#fff' : primaryColor} />
            <ThemedText style={[styles.themeText, { color: primaryColor }, mode === 'dark' && styles.themeTextActive]}>Escuro</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.themeOption, mode === 'system' && { backgroundColor: primaryColor }]} 
            onPress={() => setMode('system')}
          >
            <IconSymbol name="gearshape.fill" size={20} color={mode === 'system' ? '#fff' : primaryColor} />
            <ThemedText style={[styles.themeText, { color: primaryColor }, mode === 'system' && styles.themeTextActive]}>Sistema</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.sectionTitle}>Segurança</ThemedText>
        
        <View style={[styles.expandableCard, { backgroundColor: cardColor, borderColor }]}>
          <TouchableOpacity 
            style={styles.expandableHeader} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="lock.fill" size={20} color={primaryColor} />
              <ThemedText style={[styles.menuItemText, { color: primaryColor }]}>Alterar Senha de Acesso</ThemedText>
            </View>
            <IconSymbol 
              name="chevron.right" 
              size={20} 
              color="#ADB5BD" 
              style={{ transform: [{ rotate: isPasswordVisible ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {isPasswordVisible && (
            <View style={[styles.passwordContent, { borderTopColor: backgroundColor }]}>
              <ThemedText style={[styles.inputLabel, { color: primaryColor }]}>Nova Senha</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor, color: textColor }]}
                placeholder="Digite a nova senha"
                placeholderTextColor={iconColor}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              
              <ThemedText style={[styles.inputLabel, { color: primaryColor }]}>Confirmar Nova Senha</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor, color: textColor }]}
                placeholder="Confirme a nova senha"
                placeholderTextColor={iconColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: primaryColor }]} onPress={handleChangePassword}>
                <ThemedText style={styles.saveButtonText}>Atualizar Senha</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.homeButton, { backgroundColor: cardColor, borderColor: primaryColor, marginBottom: 15 }]} 
          onPress={() => router.replace('/(tabs)')}
        >
          <IconSymbol 
            name="house.fill" 
            size={24} 
            color={primaryColor} 
            style={{ marginRight: 12 }}
          />
          <ThemedText style={[styles.homeButtonText, { color: primaryColor }]}>Voltar ao Início</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: '#FF3B30' }]} 
          onPress={handleLogout}
        >
          <IconSymbol 
            name="rectangle.portrait.and.arrow.right" 
            size={24} 
            color="#FF3B30" 
            style={{ marginRight: 12 }}
          />
          <ThemedText style={[styles.homeButtonText, { color: '#FF3B30' }]}>Sair da Conta</ThemedText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Financial Control v1.0.1</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
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
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  infoCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  themeContainer: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 15,
    marginBottom: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeTextActive: {
    color: '#FFFFFF',
  },
  expandableCard: {
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 30,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  passwordContent: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
    textTransform: 'uppercase',
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    marginTop: 10,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    marginTop: 0,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#ADB5BD',
  },
});
