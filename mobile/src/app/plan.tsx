import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { getSessions, type SessionsResponse } from '@/lib/api';
import { clearToken, getStoredToken } from '@/lib/auth';
import { colors, layout } from '@/lib/theme';

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
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.lime} />
          <Text style={styles.loadingText}>Loading your training</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !plan) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn&apos;t load your plan</Text>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadPlan()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleLogout()}
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>Log out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) return null;

  const completionRatio = plan.completedCount / plan.sessions.length;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark} />
            <Text style={styles.brand}>FORGE</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.push('/coach')}
              style={styles.coachButton}
            >
              <Text style={styles.coachLabel}>Coach</Text>
              <Text style={styles.coachArrow}>→</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => void handleLogout()}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutLabel}>Log out</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.headingBlock}>
            <Text style={styles.eyebrow}>THIS WEEK</Text>
            <Text style={styles.title}>Your training</Text>
            <Text style={styles.subtitle}>
              Stay consistent. The next session opens when you&apos;re ready.
            </Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={styles.progressValue}>
                {plan.completedCount} of {plan.sessions.length} completed
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${completionRatio * 100}%` }]}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.inlineError}>
              <Text style={styles.error}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => void loadPlan()}>
                <Text style={styles.retryLabel}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.list}>
            {plan.sessions.map((session) => {
              const locked = session.status === 'locked';
              const open = session.status === 'open';
              const completed = session.status === 'completed';

              return (
                <Pressable
                  accessibilityRole="button"
                  disabled={locked}
                  key={session.id}
                  onPress={() => openSession(session.id)}
                  style={({ pressed }) => [
                    styles.card,
                    open && styles.openCard,
                    completed && styles.completedCard,
                    locked && styles.lockedCard,
                    pressed && !locked && styles.cardPressed,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.sessionNumber, open && styles.openNumber]}>
                      {String(session.order).padStart(2, '0')}
                    </Text>
                    <StatusBadge status={session.status} />
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, locked && styles.lockedText]}>
                      {session.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.duration}>
                        {session.durationMinutes} MIN
                      </Text>
                      {open ? <Text style={styles.beginLabel}>BEGIN  →</Text> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {plan.nextSessionId ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => openSession(plan.nextSessionId!)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Continue training</Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>
          ) : (
            <View style={styles.planComplete}>
              <View style={styles.completeIcon}>
                <Text style={styles.completeIconText}>✓</Text>
              </View>
              <View style={styles.completeCopy}>
                <Text style={styles.completeTitle}>Plan complete</Text>
                <Text style={styles.completeDescription}>Three sessions. Done.</Text>
              </View>
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 14,
    paddingBottom: 12,
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  coachLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  coachArrow: {
    color: colors.lime,
    fontSize: 15,
    fontWeight: '700',
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  logoutButton: {
    paddingVertical: 6,
  },
  logoutLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headingBlock: {
    gap: 10,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 44,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 350,
  },
  progressBlock: {
    gap: 10,
    marginTop: 28,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  progressValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.lime,
  },
  list: {
    gap: 12,
    marginTop: 24,
  },
  card: {
    minHeight: 128,
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 17,
  },
  openCard: {
    borderColor: colors.lime,
    backgroundColor: colors.limeSoft,
  },
  completedCard: {
    backgroundColor: '#1B211B',
  },
  lockedCard: {
    opacity: 0.55,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sessionNumber: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  openNumber: {
    color: colors.lime,
  },
  cardBody: {
    gap: 10,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  lockedText: {
    color: colors.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  beginLabel: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
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
  primaryButtonArrow: {
    color: colors.onLime,
    fontSize: 22,
    fontWeight: '700',
  },
  planComplete: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 15,
    backgroundColor: colors.limeSoft,
    paddingHorizontal: 16,
  },
  completeIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.lime,
  },
  completeIconText: {
    color: colors.onLime,
    fontSize: 18,
    fontWeight: '900',
  },
  completeCopy: {
    gap: 2,
  },
  completeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  completeDescription: {
    color: colors.muted,
    fontSize: 13,
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
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#2A1F1D',
    marginTop: 18,
    padding: 12,
  },
  retryLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  textButton: {
    padding: 10,
  },
  textButtonLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
