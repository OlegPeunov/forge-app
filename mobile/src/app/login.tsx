import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/lib/api';
import { storeToken } from '@/lib/auth';
import { colors, layout } from '@/lib/theme';

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
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.screen}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark} />
            <Text style={styles.brand}>FORGE</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>TRAIN WITH INTENT</Text>
            <Text style={styles.title}>Build strength.{`\n`}Keep momentum.</Text>
            <Text style={styles.description}>
              Three focused sessions. One clear path forward.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.subtle}
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
              placeholderTextColor={colors.subtle}
              secureTextEntry
              style={styles.input}
              value={password}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void handleLogin()}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.onLime} />
              ) : (
                <Text style={styles.buttonText}>Enter your training</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 18,
    paddingBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
  brand: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  hero: {
    gap: 16,
    paddingVertical: 30,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  description: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 330,
  },
  form: {
    gap: 12,
  },
  input: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 17,
    paddingVertical: 15,
  },
  errorBox: {
    borderRadius: 12,
    backgroundColor: '#2A1F1D',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.lime,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.onLime,
    fontSize: 16,
    fontWeight: '800',
  },
});
