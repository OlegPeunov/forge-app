import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sendCoachMessage } from '@/lib/api';
import { getStoredToken } from '@/lib/auth';
import { colors, layout } from '@/lib/theme';

type ChatMessage = {
  id: number;
  role: 'coach' | 'user';
  text: string;
};

const greeting: ChatMessage = {
  id: 0,
  role: 'coach',
  text: 'I’m your Forge Coach. Ask me about consistency, recovery, or building strength.',
};

export default function CoachScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const nextMessageId = useRef(1);
  const scrollView = useRef<ScrollView>(null);

  async function submitMessage(message: string, addUserMessage: boolean) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending) return;

    if (addUserMessage) {
      setMessages((current) => [
        ...current,
        { id: nextMessageId.current++, role: 'user', text: trimmedMessage },
      ]);
      setDraft('');
    }

    setSending(true);
    setError(null);
    setFailedMessage(null);

    try {
      const token = await getStoredToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      const { reply } = await sendCoachMessage(token, trimmedMessage);

      setMessages((current) => [
        ...current,
        { id: nextMessageId.current++, role: 'coach', text: reply },
      ]);
    } catch {
      setError('Coach is unavailable right now. Try again.');
      setFailedMessage(trimmedMessage);
    } finally {
      setSending(false);
    }
  }

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backLabel}>Your training</Text>
            </Pressable>
            <Text style={styles.miniBrand}>FORGE</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>YOUR TRAINING COMPANION</Text>
            <Text style={styles.title}>Coach</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.messages}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollView.current?.scrollToEnd({ animated: true })}
            ref={scrollView}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.message,
                  message.role === 'user' ? styles.userMessage : styles.coachMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageLabel,
                    message.role === 'user' && styles.userMessageLabel,
                  ]}
                >
                  {message.role === 'coach' ? 'COACH' : 'YOU'}
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' && styles.userMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ))}

            {sending ? (
              <View style={[styles.message, styles.coachMessage, styles.loadingMessage]}>
                <ActivityIndicator color={colors.lime} size="small" />
                <Text style={styles.loadingText}>Coach is thinking</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                {failedMessage ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={sending}
                    onPress={() => void submitMessage(failedMessage, false)}
                  >
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              editable={!sending}
              maxLength={500}
              multiline
              onChangeText={setDraft}
              placeholder="Ask your coach…"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              value={draft}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!canSend}
              onPress={() => void submitMessage(draft, true)}
              style={({ pressed }) => [
                styles.sendButton,
                !canSend && styles.sendButtonDisabled,
                pressed && canSend && styles.sendButtonPressed,
              ]}
            >
              <Text style={styles.sendButtonText}>Send</Text>
              <Text style={styles.sendArrow}>↑</Text>
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
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
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
  heading: {
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 24,
    paddingBottom: 18,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.3,
    lineHeight: 44,
    marginTop: 6,
  },
  scroll: {
    flex: 1,
  },
  messages: {
    gap: 12,
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 4,
    paddingBottom: 20,
  },
  message: {
    maxWidth: '88%',
    gap: 7,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  coachMessage: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.lime,
    borderBottomRightRadius: 5,
  },
  messageLabel: {
    color: colors.lime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  userMessageLabel: {
    color: colors.onLime,
    opacity: 0.65,
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.onLime,
    fontWeight: '600',
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  errorBox: {
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#2A1F1D',
    padding: 13,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },
  retryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: 12,
    paddingBottom: 12,
  },
  input: {
    minHeight: 52,
    maxHeight: 112,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 13,
  },
  sendButton: {
    minWidth: 86,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: colors.lime,
    paddingHorizontal: 14,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
  sendButtonPressed: {
    opacity: 0.86,
  },
  sendButtonText: {
    color: colors.onLime,
    fontSize: 14,
    fontWeight: '800',
  },
  sendArrow: {
    color: colors.onLime,
    fontSize: 18,
    fontWeight: '900',
  },
});
