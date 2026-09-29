import { StyleSheet, Text, View } from 'react-native';

import type { SessionStatus } from '@/lib/api';
import { colors } from '@/lib/theme';

type StatusBadgeProps = {
  status: SessionStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, styles[status]]}>
      <Text style={[styles.label, styles[`${status}Label`]]}>
        {status === 'completed' ? '✓  COMPLETED' : status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  open: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  openLabel: {
    color: colors.onLime,
  },
  completed: {
    backgroundColor: colors.limeSoft,
    borderColor: '#52683C',
  },
  completedLabel: {
    color: colors.lime,
  },
  locked: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  lockedLabel: {
    color: colors.subtle,
  },
});
