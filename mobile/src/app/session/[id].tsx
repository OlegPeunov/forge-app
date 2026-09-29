import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/status-badge';
import {
  completeSession,
  getSessions,
  type SessionsResponse,
} from '@/lib/api';
import { getStoredToken } from '@/lib/auth';
import { colors, layout } from '@/lib/theme';

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
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.lime} />
          <Text style={styles.loadingText}>Preparing your session</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !session) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn&apos;t load this session</Text>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadSession()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/plan')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Back to training</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan || !session) return null;

  if (justCompleted) {
    const allComplete = plan.nextSessionId === null;

    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => router.replace('/plan')}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backLabel}>Plan</Text>
            </Pressable>
            <Text style={styles.miniBrand}>FORGE</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.completionContent}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successEyebrow}>
              {allComplete ? 'PLAN COMPLETE' : 'SESSION COMPLETE'}
            </Text>
            <Text style={styles.successTitle}>
              {allComplete ? 'Strong finish.' : 'Momentum earned.'}
            </Text>
            <Text style={styles.successDescription}>
              {allComplete
                ? 'All three sessions are complete. Your work is saved.'
                : 'Progress saved. Your next session is now unlocked.'}
            </Text>

            <View style={styles.completedSummary}>
              <View>
                <Text style={styles.summaryLabel}>COMPLETED</Text>
                <Text style={styles.summaryTitle}>{session.title}</Text>
              </View>
              <Text style={styles.summaryCheck}>✓</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {plan.nextSessionId ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openNextSession(plan.nextSessionId!)}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Next session</Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace('/plan')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Back to plan</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/plan')}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>View completed plan</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.replace('/plan')}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Your training</Text>
          </Pressable>
          <Text style={styles.miniBrand}>FORGE</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionNumber}>
              SESSION {String(session.order).padStart(2, '0')}
            </Text>
            <StatusBadge status={session.status} />
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>{session.title}</Text>
            <Text style={styles.description}>{session.description}</Text>
          </View>

          <View style={styles.durationRow}>
            <Text style={styles.durationValue}>{session.durationMinutes}</Text>
            <View>
              <Text style={styles.durationLabel}>MINUTES</Text>
              <Text style={styles.durationCaption}>Estimated duration</Text>
            </View>
          </View>

          <View style={styles.focusSection}>
            <Text style={styles.sectionEyebrow}>TODAY&apos;S FOCUS</Text>
            <View style={styles.focusList}>
              {session.focusItems.map((item, index) => (
                <View key={item} style={styles.focusItem}>
                  <View style={styles.focusIndex}>
                    <Text style={styles.focusIndexText}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={styles.focusText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.inlineError}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {session.status === 'open' ? (
            <Pressable
              accessibilityRole="button"
              disabled={completing}
              onPress={() => void handleComplete()}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                completing && styles.buttonDisabled,
              ]}
            >
              {completing ? (
                <ActivityIndicator color={colors.onLime} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Complete session</Text>
                  <Text style={styles.buttonArrow}>✓</Text>
                </>
              )}
            </Pressable>
          ) : null}

          {session.status === 'completed' ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateIcon}>✓</Text>
              <View style={styles.stateCopy}>
                <Text style={styles.stateTitle}>Session completed</Text>
                <Text style={styles.stateDescription}>Your progress is saved.</Text>
              </View>
            </View>
          ) : null}

          {session.status === 'locked' ? (
            <View style={styles.stateCard}>
              <Text style={styles.lockIcon}>—</Text>
              <View style={styles.stateCopy}>
                <Text style={styles.stateTitle}>Session locked</Text>
                <Text style={styles.stateDescription}>
                  Complete the previous session first.
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: layout.horizontalPadding,
  },
  topBar: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: layout.horizontalPadding,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  backArrow: {
    color: colors.lime,
    fontSize: 20,
  },
  backLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  miniBrand: {
    color: colors.subtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 28,
    paddingBottom: 28,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionNumber: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  hero: {
    gap: 16,
    marginTop: 28,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.6,
    lineHeight: 48,
  },
  description: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginTop: 30,
    paddingVertical: 18,
  },
  durationValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
  },
  durationLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  durationCaption: {
    color: colors.subtle,
    fontSize: 12,
    marginTop: 2,
  },
  focusSection: {
    marginTop: 30,
  },
  sectionEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  focusList: {
    gap: 10,
    marginTop: 14,
  },
  focusItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  focusIndex: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.limeSoft,
  },
  focusIndexText: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  focusText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 14,
    paddingBottom: 12,
  },
  primaryButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 15,
    backgroundColor: colors.lime,
    paddingHorizontal: 20,
  },
  primaryButtonPressed: {
    opacity: 0.86,
  },
  primaryButtonText: {
    color: colors.onLime,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonArrow: {
    color: colors.onLime,
    fontSize: 20,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  stateCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
  },
  stateIcon: {
    color: colors.lime,
    fontSize: 22,
    fontWeight: '900',
  },
  lockIcon: {
    color: colors.subtle,
    fontSize: 22,
    fontWeight: '900',
  },
  stateCopy: {
    gap: 2,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  stateDescription: {
    color: colors.muted,
    fontSize: 12,
  },
  completionContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.horizontalPadding,
    paddingVertical: 40,
  },
  successIcon: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 37,
    backgroundColor: colors.lime,
    marginBottom: 26,
  },
  successIconText: {
    color: colors.onLime,
    fontSize: 34,
    fontWeight: '900',
  },
  successEyebrow: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  successTitle: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 46,
    marginTop: 10,
    textAlign: 'center',
  },
  successDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 330,
    textAlign: 'center',
  },
  completedSummary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginTop: 34,
    padding: 17,
  },
  summaryLabel: {
    color: colors.subtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryCheck: {
    color: colors.lime,
    fontSize: 24,
    fontWeight: '900',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  inlineError: {
    borderRadius: 12,
    backgroundColor: '#2A1F1D',
    marginTop: 20,
    padding: 12,
  },
});
