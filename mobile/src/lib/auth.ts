import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'forge.authToken';

export function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  return AsyncStorage.removeItem(TOKEN_KEY);
}
