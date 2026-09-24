const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trao_auth_token');
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('trao_auth_token', token);
  } else {
    localStorage.removeItem('trao_auth_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
  }

  return data;
}

export const api = {
  auth: {
    register: (body) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    me: () => request('/auth/me'),
    logout: () => {
      setAuthToken(null);
      return request('/auth/logout', { method: 'POST' });
    },
  },
  kits: {
    list: () => request('/kits'),
    get: (id) => request(`/kits/${id}`),
    generate: (body) =>
      request('/kits/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    batchUpload: (pairs) =>
      request('/kits/batch-upload', {
        method: 'POST',
        body: JSON.stringify({ pairs }),
      }),
    update: (id, updates) =>
      request(`/kits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    regenerateSection: (id, body) =>
      request(`/kits/${id}/regenerate-section`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    practiceCard: (id, cardId, confidence) =>
      request(`/kits/${id}/flashcards/${cardId}/practice`, {
        method: 'POST',
        body: JSON.stringify({ confidence }),
      }),
    mockInterview: (id, questionId, candidateAnswer) =>
      request(`/kits/${id}/mock-interview`, {
        method: 'POST',
        body: JSON.stringify({ questionId, candidateAnswer }),
      }),
    delete: (id) =>
      request(`/kits/${id}`, {
        method: 'DELETE',
      }),
  },
};
