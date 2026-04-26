import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const songsAPI = {
  getAll: () => api.get('/songs'),
  getById: (id) => api.get(`/songs/${id}`),
  create: (songData) => api.post('/songs', songData),
  update: (id, songData) => api.patch(`/songs/${id}`, songData),
  delete: (id) => api.delete(`/songs/${id}`),
  toggleFavorite: (id) => api.patch(`/songs/${id}/favorite`),
};

export default api;
