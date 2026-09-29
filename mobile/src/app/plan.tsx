import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getSessions, type SessionsResponse } from '@/lib/api';
import { clearToken, getStoredToken } from '@/lib/auth';

export default function PlanScreen() {
  const [plan, setPlan] = useState<SessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getStoredToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      setPlan(await getSessions(token));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load the plan.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlan();
    }, [loadPlan]),
  );

  async function handleLogout() {
    await clearToken();
    router.replace('/login');
  }

  function openSession(id: string) {
    router.push({ pathname: '/session/[id]', params: { id } });
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

  if (error && !plan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={() => void loadPlan()}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
          <Pressable onPress={() => void handleLogout()}>
            <Text style={styles.linkText}>Logout</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your plan</Text>
            <Text style={styles.progress}>
              {plan.completedCount} of {plan.sessions.length} completed
            </Text>
          </View>
          <Pressable onPress={() => void handleLogout()}>
            <Text style={styles.linkText}>Logout</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.inlineError}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void loadPlan()}>
              <Text style={styles.linkText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.list}>
          {plan.sessions.map((session) => {
            const locked = session.status === 'locked';

            return (
              <Pressable
                accessibilityRole="button"
                disabled={locked}
                key={session.id}
                onPress={() => openSession(session.id)}
                style={[styles.card, locked && styles.lockedCard]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardOrder}>Session {session.order}</Text>
                  <Text style={styles.status}>{session.status}</Text>
                </View>
                <Text style={styles.cardTitle}>{session.title}</Text>
                <Text style={styles.description}>{session.description}</Text>
                <Text style={styles.duration}>
                  About {session.durationMinutes} min
                </Text>
              </Pressable>
            );
          })}
        </View>

        {plan.nextSessionId ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() => openSession(plan.nextSessionId!)}
          >
            <Text style={styles.primaryButtonText}>Continue next session</Text>
          </Pressable>
        ) : (
          <View style={styles.completeCard}>
            <Text style={styles.completeTitle}>Plan complete</Text>
            <Text style={styles.description}>
              You completed all three sessions.
            </Text>
          </View>
        )}
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
    gap: 20,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#20201e',
    fontSize: 32,
    fontWeight: '700',
  },
  progress: {
    color: '#5f5c57',
    fontSize: 16,
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  card: {
    borderColor: '#c9c0b5',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    gap: 8,
    padding: 18,
  },
  lockedCard: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardOrder: {
    color: '#5f5c57',
    fontSize: 14,
  },
  status: {
    color: '#b34725',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#20201e',
    fontSize: 22,
    fontWeight: '600',
  },
  description: {
    color: '#5f5c57',
    fontSize: 16,
    lineHeight: 22,
  },
  duration: {
    color: '#20201e',
    fontSize: 14,
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
  linkText: {
    color: '#b34725',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#a1362a',
    textAlign: 'center',
  },
  inlineError: {
    alignItems: 'center',
    gap: 8,
  },
  completeCard: {
    borderRadius: 12,
    backgroundColor: '#e4eee7',
    gap: 6,
    padding: 18,
  },
  completeTitle: {
    color: '#26734d',
    fontSize: 20,
    fontWeight: '700',
  },
});
