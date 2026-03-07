'use client';

import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  companyName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    companyName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('fv_token') : null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response: any = await authApi.login({ email, password });
      const { accessToken, user } = response.data;
      localStorage.setItem('fv_token', accessToken);
      set({ token: accessToken, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response: any = await authApi.register(data);
      const { accessToken, user } = response.data;
      localStorage.setItem('fv_token', accessToken);
      set({ token: accessToken, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('fv_token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/auth/login';
  },

  loadUser: async () => {
    const token = localStorage.getItem('fv_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const response: any = await authApi.getProfile();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('fv_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
