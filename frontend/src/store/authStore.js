import { create } from 'zustand';
import axios from 'axios';

// Create an axios instance that automatically includes credentials (cookies)
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Interceptor to handle silent token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, user is fully logged out
        useAuthStore.getState().logout(true);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/auth/profile');
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async (silent = false) => {
    if (!silent) {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.error(e);
      }
    }
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),

}));
