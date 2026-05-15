import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://glambook-backend-zqzt.onrender.com/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => {
    const isFormData = data instanceof FormData;
    return api.put('/auth/profile', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  changePassword: (data) => api.put('/auth/change-password', data),
  savePushToken: (token) => api.put('/auth/push-token', { token }),
};

export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  remove: (id) => api.delete(`/clients/${id}`),
  getHistory: (id) => api.get(`/clients/${id}/history`),
};

export const appointmentAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getToday: () => api.get('/appointments/today'),
  getOne: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id) => api.delete(`/appointments/${id}`),
};

export const serviceAPI = {
  getAll: () => api.get('/services'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  remove: (id) => api.delete(`/services/${id}`),
};

export const portfolioAPI = {
  getAll: (params) => api.get('/portfolio', { params }),
  getOne: (id) => api.get(`/portfolio/${id}`),
  create: (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/portfolio', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  update: (id, data) => api.put(`/portfolio/${id}`, data),
  remove: (id) => api.delete(`/portfolio/${id}`),
};

export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getSummary: () => api.get('/payments/summary'),
  create: (data) => api.post('/payments', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const aiAPI = {
  chat: (message, history) => api.post('/ai/chat', { message, history }),
};

// ── Customer API (separate token handled via customerApi instance) ──────────
const customerApi = axios.create({ baseURL: BASE_URL, timeout: 15000 });
customerApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('customerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
customerApi.interceptors.response.use((res) => res.data, (err) => Promise.reject(err.response?.data || err));

export const customerAuthAPI = {
  register: (data) => customerApi.post('/customer/auth/register', data),
  login: (data) => customerApi.post('/customer/auth/login', data),
  getMe: () => customerApi.get('/customer/auth/me'),
};

export const customerBookingAPI = {
  getServices: () => customerApi.get('/customer/services'),
  book: (data) => {
    const isFormData = data instanceof FormData;
    return customerApi.post('/customer/book', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  getMyAppointments: () => customerApi.get('/customer/my'),
  submitFeedback: (data) => customerApi.post('/customer/feedback', data),
  getMyFeedback: () => customerApi.get('/customer/my-feedback'),
};

export const feedbackAPI = {
  getAll: () => api.get('/appointments/feedback'),
};

export default api;
