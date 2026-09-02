import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, Switch, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useAuth } from '@/context/auth-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const db = useSQLiteContext();
  const { login } = useAuth();

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  // Carregar usuário lembrado ao iniciar
  useEffect(() => {
    const loadRememberedUser = async () => {
      try {
        const result: any = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', ['remembered_username']);
        if (result?.value) {
          setUsername(result.value);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário lembrado:', error);
      }
    };
    loadRememberedUser();
  }, [db]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const user: any = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', [username]);

      if (user) {
        if (user.password === password) {
          // Salvar ou remover usuário lembrado
          if (rememberMe) {
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['remembered_username', username]);
          } else {
            await db.runAsync('DELETE FROM settings WHERE key = ?', ['remembered_username']);
          }
          
          login(username);
        } else {
          Alert.alert('Erro', 'Senha incorreta.');
        }
      } else {
        Alert.alert('Erro', 'Usuário não encontrado.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ThemedView style={styles.container}>
            <View style={styles.headerContainer}>
              <ThemedText style={[styles.brandName, { color: primaryColor }]}>FINANÇAS</ThemedText>
              <View style={styles.underline} />
              <ThemedText style={styles.welcomeText}>Bem-vindo ao seu controle financeiro</ThemedText>
            </View>

            <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
              <ThemedText style={styles.cardTitle}>Login</ThemedText>
              
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: primaryColor }]}>USUÁRIO</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, borderColor, color: textColor }]}
                  placeholder="Seu nome de usuário"
                  placeholderTextColor={iconColor}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: primaryColor }]}>SENHA</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, borderColor, color: textColor }]}
                  placeholder="Senha"
                  placeholderTextColor={iconColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.rememberContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#767577', true: '#50C878' }}
                  thumbColor={rememberMe ? '#FFFFFF' : '#f4f3f4'}
                />
                <ThemedText style={styles.rememberText}>Lembrar usuário</ThemedText>
              </View>

              <TouchableOpacity style={[styles.button, { backgroundColor: primaryColor }]} onPress={handleLogin} activeOpacity={0.8}>
                <ThemedText style={styles.buttonText}>Acessar Conta</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.footerText}>Versão 1.0.1 • Seguro e Criptografado</ThemedText>
          </ThemedView>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  underline: {
    height: 4,
    width: 40,
    backgroundColor: '#50C878',
    marginTop: 8,
    borderRadius: 2,
  },
  welcomeText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
    color: '#7F8C8D',
  },
  card: {
    borderRadius: 25,
    padding: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap: 10,
  },
  rememberText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  button: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: '#ADB5BD',
    fontSize: 12,
    marginTop: 40,
  },
});
