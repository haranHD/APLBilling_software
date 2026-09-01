import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const API_BASE_URL_KEY = '@apl_api_base_url';

export const getDefaultBaseUrl = () => {
  // If environment variable is provided (e.g. production Vercel/EAS build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // Auto-detect PC IP from Expo bundler host connection (for physical phones)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && !ip.includes('exp.direct')) {
      return `http://${ip}:5000/api`;
    }
  }

  // Fallback for Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getDefaultBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to dynamically set baseURL and Authorization Bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const customUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
      config.baseURL = customUrl || getDefaultBaseUrl();

      const token = await AsyncStorage.getItem('@apl_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Request interceptor error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and 401 unauth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized API call or token expired.');
    }
    return Promise.reject(error);
  }
);

// Helper API methods
export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  registerOwner: (username, password) => api.post('/auth/register-owner', { username, password }),
  getProfile: () => api.get('/auth/me'),
};

export const masterService = {
  getVendors: () => api.get('/masters/vendors'),
  createVendor: (data) => api.post('/masters/vendors', data),
  updateVendor: (id, data) => api.put(`/masters/vendors/${id}`, data),
  deleteVendor: (id) => api.delete(`/masters/vendors/${id}`),

  getFlowers: () => api.get('/masters/flowers'),
  createFlower: (data) => api.post('/masters/flowers', data),
  updateFlower: (id, data) => api.put(`/masters/flowers/${id}`, data),
  deleteFlower: (id) => api.delete(`/masters/flowers/${id}`),
};

export const billService = {
  getDashboardStats: () => api.get('/bills/dashboard-summary'),
  getBills: (params) => api.get('/bills', { params }),
  getBillById: (id) => api.get(`/bills/${id}`),
  createBill: (data) => api.post('/bills', data),
  deleteBill: (id) => api.delete(`/bills/${id}`),
};

export const reportService = {
  getExcelReportUrl: async (month) => {
    const token = await AsyncStorage.getItem('@apl_auth_token');
    const customUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
    const base = customUrl || getDefaultBaseUrl();
    const query = month ? `?month=${month}&token=${token}` : `?token=${token}`;
    return `${base}/reports/excel${query}`;
  },
  getPdfReportUrl: async (month) => {
    const token = await AsyncStorage.getItem('@apl_auth_token');
    const customUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
    const base = customUrl || getDefaultBaseUrl();
    const query = month ? `?month=${month}&token=${token}` : `?token=${token}`;
    return `${base}/reports/pdf${query}`;
  },
};

export default api;
