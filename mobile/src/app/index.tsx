import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';

import { getMe } from '@/lib/api';
import { clearToken, getStoredToken } from '@/lib/auth';

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
      <ActivityIndicator size="large" color="#d85d32" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f2ea',
  },
});
