import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: API_URL });

// Injecter le token auth à chaque requête
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const cvApi = {
  upload: (formData) => api.post('/api/cv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  generate: (sessionId) => api.post(`/api/generate/${sessionId}`),

  getHistory: () => api.get('/api/cv/history'),

  getSession: (sessionId) => api.get(`/api/cv/session/${sessionId}`),

  getVersion: (versionId) => api.get(`/api/cv/version/${versionId}`),

  updateVersion: (versionId, cvData) =>
    api.put(`/api/cv/version/${versionId}`, { cv_data: cvData }),

  selectVersion: (versionId) => api.post(`/api/cv/version/${versionId}/select`),

  downloadPDF: async (versionId, fileName) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/cv/version/${versionId}/pdf`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'cv.pdf';
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
};
