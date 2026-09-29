import { useEffect, useState } from 'react';
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

import { getMe, login, type User } from '@/lib/api';
import { clearToken, getStoredToken, storeToken } from '@/lib/auth';

type AuthState =
  | { status: 'checking' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: User };

export default function HomeScreen() {
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getStoredToken()
      .then(async (storedToken) => {
        if (!storedToken) {
          if (active) setAuth({ status: 'signedOut' });
          return;
        }

        try {
          const { user } = await getMe(storedToken);
          if (active) setAuth({ status: 'signedIn', user });
        } catch {
          await clearToken();
          if (active) setAuth({ status: 'signedOut' });
        }
      })
      .catch(() => {
        if (active) setAuth({ status: 'signedOut' });
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      await storeToken(result.token);
      setPassword('');
      setAuth({ status: 'signedIn', user: result.user });
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

  async function handleLogout() {
    await clearToken();
    setAuth({ status: 'signedOut' });
  }

  if (auth.status === 'checking') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#d85d32" />
        </View>
      </SafeAreaView>
    );
  }

  if (auth.status === 'signedIn') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Forge</Text>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.email}>{auth.user.email}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleLogout()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centered}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Forge</Text>
          <Text style={styles.label}>Sign in to continue</Text>

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
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
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
  label: {
    color: '#5f5c57',
    fontSize: 18,
    textAlign: 'center',
  },
  email: {
    color: '#20201e',
    fontSize: 22,
    fontWeight: '600',
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
  primaryButton: {
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#d85d32',
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#d85d32',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#b34725',
    fontSize: 16,
    fontWeight: '600',
  },
});
