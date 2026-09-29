const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type HealthResponse = {
  status: 'ok';
};

export async function getHealth(): Promise<HealthResponse> {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
