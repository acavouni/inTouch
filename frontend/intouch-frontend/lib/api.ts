import { useAuth } from '@clerk/clerk-expo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Authenticated fetch helper that automatically includes Clerk JWT token
 * This should be used inside React components that have access to useAuth hook
 */
export async function authedFetch(
  url: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>
): Promise<Response> {
  const token = await getToken();

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json', // After spread to ensure it's not overridden
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/**
 * Create an authed fetch function bound to the current auth context
 * Use this in components:
 * 
 * const { getToken } = useAuth();
 * const fetch = createAuthedFetch(getToken);
 * const response = await fetch('/api/users');
 */
export function createAuthedFetch(getToken: () => Promise<string | null>) {
  return (url: string, options: RequestInit = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    return authedFetch(fullUrl, options, getToken);
  };
}

