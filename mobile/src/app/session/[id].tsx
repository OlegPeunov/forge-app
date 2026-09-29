import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  completeSession,
  getSessions,
  type SessionsResponse,
} from '@/lib/api';
import { getStoredToken } from '@/lib/auth';

export default function SessionScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [plan, setPlan] = useState<SessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = useMemo(
    () => plan?.sessions.find((item) => item.id === sessionId),
    [plan, sessionId],
  );

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getStoredToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await getSessions(token);

      if (!response.sessions.some((item) => item.id === sessionId)) {
        throw new Error('Session not found');
      }

      setPlan(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load the session.',
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void Promise.resolve().then(loadSession);
  }, [loadSession]);

  async function handleComplete() {
    if (!session || session.status !== 'open') return;

    setCompleting(true);
    setError(null);

    try {
      const token = await getStoredToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      setPlan(await completeSession(token, session.id));
      setJustCompleted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not complete the session.',
      );
    } finally {
      setCompleting(false);
    }
  }

  function openNextSession(id: string) {
    setJustCompleted(false);
    router.replace({ pathname: '/session/[id]', params: { id } });
  }

  if (loading && !plan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#d85d32" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={() => void loadSession()}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/plan')}>
            <Text style={styles.linkText}>Back to Plan</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan || !session) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace('/plan')}>
          <Text style={styles.linkText}>← Plan</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            Session {session.order} · {session.status}
          </Text>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.description}>{session.description}</Text>
          <Text style={styles.duration}>
            About {session.durationMinutes} minutes
          </Text>
        </View>

        <View style={styles.focusCard}>
          <Text style={styles.sectionTitle}>Focus</Text>
          {session.focusItems.map((item) => (
            <Text key={item} style={styles.focusItem}>
              • {item}
            </Text>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {justCompleted ? (
          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>Session complete</Text>
            <Text style={styles.description}>Your progress has been saved.</Text>

            {plan.nextSessionId ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => openNextSession(plan.nextSessionId!)}
              >
                <Text style={styles.primaryButtonText}>Next session</Text>
              </Pressable>
            ) : (
              <Text style={styles.allComplete}>All sessions completed!</Text>
            )}

            <Pressable onPress={() => router.replace('/plan')}>
              <Text style={styles.linkText}>Back to Plan</Text>
            </Pressable>
          </View>
        ) : null}

        {!justCompleted && session.status === 'open' ? (
          <Pressable
            disabled={completing}
            onPress={() => void handleComplete()}
            style={[styles.primaryButton, completing && styles.buttonDisabled]}
          >
            {completing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Complete session</Text>
            )}
          </Pressable>
        ) : null}

        {!justCompleted && session.status === 'completed' ? (
          <Text style={styles.stateMessage}>This session is already completed.</Text>
        ) : null}

        {session.status === 'locked' ? (
          <Text style={styles.stateMessage}>
            Complete the previous session to unlock this workout.
          </Text>
        ) : null}
      </ScrollView>
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
    gap: 18,
    padding: 24,
  },
  content: {
    gap: 22,
    padding: 24,
  },
  header: {
    gap: 10,
  },
  eyebrow: {
    color: '#b34725',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: '#20201e',
    fontSize: 34,
    fontWeight: '700',
  },
  description: {
    color: '#5f5c57',
    fontSize: 16,
    lineHeight: 23,
  },
  duration: {
    color: '#20201e',
    fontSize: 16,
    fontWeight: '600',
  },
  focusCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    gap: 10,
    padding: 18,
  },
  sectionTitle: {
    color: '#20201e',
    fontSize: 20,
    fontWeight: '700',
  },
  focusItem: {
    color: '#5f5c57',
    fontSize: 16,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#d85d32',
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  linkText: {
    color: '#b34725',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#a1362a',
    textAlign: 'center',
  },
  completionCard: {
    borderRadius: 12,
    backgroundColor: '#e4eee7',
    gap: 14,
    padding: 18,
  },
  completionTitle: {
    color: '#26734d',
    fontSize: 24,
    fontWeight: '700',
  },
  allComplete: {
    color: '#26734d',
    fontSize: 18,
    fontWeight: '700',
  },
  stateMessage: {
    borderRadius: 10,
    backgroundColor: '#e8e3dc',
    color: '#5f5c57',
    fontSize: 16,
    padding: 16,
    textAlign: 'center',
  },
});
