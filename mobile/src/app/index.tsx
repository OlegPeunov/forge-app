import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getHealth, type HealthResponse } from '@/lib/api';

export default function HomeScreen() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setHealth(await getHealth());
    } catch (requestError) {
      setHealth(null);
      setError(
        requestError instanceof Error ? requestError.message : 'Unknown error',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getHealth()
      .then((response) => {
        if (active) {
          setHealth(response);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unknown error',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Forge</Text>
        <Text style={styles.label}>API health</Text>

        {loading ? <ActivityIndicator size="large" color="#d85d32" /> : null}
        {health ? <Text style={styles.success}>{health.status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => void checkHealth()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Check again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f2ea',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  title: {
    color: '#20201e',
    fontSize: 40,
    fontWeight: '700',
  },
  label: {
    color: '#5f5c57',
    fontSize: 18,
  },
  success: {
    color: '#26734d',
    fontSize: 24,
    fontWeight: '600',
  },
  error: {
    color: '#a1362a',
    textAlign: 'center',
  },
  button: {
    borderRadius: 10,
    backgroundColor: '#d85d32',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
