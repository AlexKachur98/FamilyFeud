
const SERVER_URL = import.meta.env.PROD ? (import.meta.env.VITE_SERVER_URL || '') : (import.meta.env.VITE_LOCAL_URL || '');
const API_BASE = '/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${SERVER_URL}${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // interferes with controllers.
  // if (!res.ok) {
  //   const errorText = await res.text();
  //   throw new Error(`Fetch error: ${res.status} ${errorText}`);
  // };
  return res;
};

//auth
export const auth = {

  validate: () => apiFetch('/auth/validate', { method: 'GET' }),

  signin: (email, password) =>
    apiFetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  signup: (name, email, password) =>
    apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),

  signout: () => apiFetch('/auth/signout', { method: 'GET' })
};
