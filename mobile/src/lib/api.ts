const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type User = {
  id: string;
  email: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

type MeResponse = {
  user: User;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${API_URL}${path}`, options);
  const body = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(body.message ?? `API returned ${response.status}`);
  }

  return body as T;
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token: string) {
  return request<MeResponse>('/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
