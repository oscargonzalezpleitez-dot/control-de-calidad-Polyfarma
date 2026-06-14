import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Interceptor de request — inyectar JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response — manejo de errores y refresh de token
api.interceptors.response.use(
  (response) => response.data.data ?? response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    const message =
      (error.response?.data as any)?.message ||
      error.message ||
      'Error desconocido';

    return Promise.reject(new Error(message));
  },
);

// API helpers tipados
export const authApi = {
  login: (data: { email: string; password: string; mfaToken?: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/auth/change-password', data),
  setupMfa: () => api.get('/auth/mfa/setup'),
  enableMfa: (token: string) => api.post('/auth/mfa/enable', { token }),
};

export const usersApi = {
  findAll: (params?: any) => api.get('/users', { params }),
  findOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  deactivate: (id: string, reason: string) => api.delete(`/users/${id}`, { data: { reason } }),
  updatePermissions: (id: string, permissions: any[]) =>
    api.patch(`/users/${id}/permissions`, { permissions }),
};

export const formatsApi = {
  findAll: (params?: any) => api.get('/formats', { params }),
  findOne: (id: string) => api.get(`/formats/${id}`),
  create: (data: any) => api.post('/formats', data),
  submitForApproval: (id: string) => api.patch(`/formats/${id}/submit`),
  approve: (id: string, approvalId: string, comments: string) =>
    api.patch(`/formats/${id}/approve/${approvalId}`, { comments }),
  createNewVersion: (id: string) => api.post(`/formats/${id}/new-version`),
  obsolete: (id: string, reason: string) => api.patch(`/formats/${id}/obsolete`, { reason }),
};

export const recordsApi = {
  findAll: (params?: any) => api.get('/records', { params }),
  findOne: (id: string) => api.get(`/records/${id}`),
  create: (data: any) => api.post('/records', data),
  saveFieldValues: (id: string, data: any) => api.patch(`/records/${id}/values`, data),
  complete: (id: string) => api.patch(`/records/${id}/complete`),
  cancel: (id: string, reason: string) => api.patch(`/records/${id}/cancel`, { reason }),
  invalidate: (id: string, reason: string) => api.patch(`/records/${id}/invalidate`, { reason }),
  delete: (id: string, reason: string, password: string) =>
    api.delete(`/records/${id}`, { data: { reason, password } }),
  getDashboard: () => api.get('/records/dashboard'),
};

export const signaturesApi = {
  create: (data: any) => api.post('/signatures', data),
  getForRecord: (recordId: string) => api.get(`/signatures/record/${recordId}`),
  verify: (id: string) => api.get(`/signatures/${id}/verify`),
  revoke: (id: string, reason: string) => api.patch(`/signatures/${id}/revoke`, { reason }),
};

export const auditApi = {
  findAll: (params?: any) => api.get('/audit', { params }),
  findByEntity: (entityType: string, entityId: string) =>
    api.get(`/audit/entity/${entityType}/${entityId}`),
  verify: (id: string) => api.get(`/audit/verify/${id}`),
  getStatistics: (params?: any) => api.get('/audit/statistics', { params }),
};

export const reportsApi = {
  generate: (data: { recordId: string; format: 'PDF' | 'DOCX' | 'XLSX' }) =>
    api.post('/reports/generate', data),
  findAll: (params?: any) => api.get('/reports', { params }),
  downloadUrl: (id: string) => `${API_URL}/api/v1/reports/${id}/download`,
};

export const attachmentsApi = {
  upload: (recordId: string, formData: FormData) =>
    api.post(`/attachments/record/${recordId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getForRecord: (recordId: string) => api.get(`/attachments/record/${recordId}`),
  downloadUrl: (id: string) => `${API_URL}/api/v1/attachments/${id}/download`,
  delete: (id: string) => api.delete(`/attachments/${id}`),
};
