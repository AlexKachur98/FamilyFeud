
const SERVER_URL = import.meta.env.PROD ? (import.meta.env.VITE_SERVER_URL || '') : (import.meta.env.VITE_LOCAL_URL || '');
const API_BASE = '/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${SERVER_URL}${API_BASE}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers
    }
  });

  return res;
};

export const auth = {

  validate: () => apiFetch('/auth/validate', { method: 'GET' }),

  signin: (email, password) =>
    apiFetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  signup: (username, email, password) =>
    apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    }),

  signout: () => apiFetch('/auth/signout', { method: 'GET' })
};

export const questions = {
  getRandom: (options = {}) => {
    const params = new URLSearchParams();
    if (options.minAnswers) params.set('minAnswers', options.minAnswers);
    if (options.maxAnswers) params.set('maxAnswers', options.maxAnswers);
    if (options.round) params.set('round', options.round);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/question${query}`, { method: 'GET' });
  },
  getById: (id) => apiFetch(`/question/${id}`, { method: 'GET' })
};

export const ai = {
  submitAnswer: (questionId, userAnswer) =>
    apiFetch(`/ai/${questionId}`, {
      method: 'POST',
      body: JSON.stringify({ userAnswer })
    })
};

export const users = {
  get: (id) => apiFetch(`/user/${id}`, { method: 'GET' }),
  update: (id, payload) =>
    apiFetch(`/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
};

export const uploads = {
  avatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFetch('/uploads/avatar', {
      method: 'POST',
      body: formData
    });
  }
};

export const sessions = {
  create: (payload) =>
    apiFetch('/gamesession', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
