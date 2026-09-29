import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMe } from '@/lib/api';
import { clearToken, getStoredToken } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function IndexScreen() {
  useEffect(() => {
    let active = true;

    getStoredToken()
      .then(async (token) => {
        if (!token) {
          if (active) router.replace('/login');
          return;
        }

        try {
          await getMe(token);
          if (active) router.replace('/plan');
        } catch {
          await clearToken();
          if (active) router.replace('/login');
        }
      })
      .catch(() => {
        if (active) router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={colors.lime} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
