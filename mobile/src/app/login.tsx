import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { login } from '@/lib/api';
import { storeToken } from '@/lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      await storeToken(result.token);
      router.replace('/plan');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not sign in. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centered}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Forge</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            style={styles.input}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            editable={!loading}
            onChangeText={setPassword}
            onSubmitEditing={() => void handleLogin()}
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => void handleLogin()}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f2ea',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    gap: 14,
  },
  title: {
    color: '#20201e',
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#5f5c57',
    fontSize: 18,
    textAlign: 'center',
  },
  input: {
    borderColor: '#c9c0b5',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    color: '#20201e',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    color: '#a1362a',
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#d85d32',
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
