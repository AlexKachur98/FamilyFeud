const SERVER_URL = import.meta.env.PROD ? (import.meta.env.VITE_SERVER_URL || '') : '';

export const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${SERVER_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fetch error: ${res.status} ${errorText}`);
  }

  return res.json();
};
