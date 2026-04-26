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

export const foldersAPI = {
  getAll: () => api.get('/folders'),
  create: (data) => api.post('/folders', data),
  update: (id, data) => api.patch(`/folders/${id}`, data),
  delete: (id) => api.delete(`/folders/${id}`),
};

export const playlistsAPI = {
  getAll: () => api.get('/playlists'),
  getById: (id) => api.get(`/playlists/${id}`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.patch(`/playlists/${id}`, data),
  addSongs: (id, songIds) => api.post(`/playlists/${id}/songs`, { songIds }),
  removeSong: (id, songId) => api.delete(`/playlists/${id}/songs/${songId}`),
  delete: (id) => api.delete(`/playlists/${id}`),
};

export default api;
