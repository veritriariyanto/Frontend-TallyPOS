import apiClient from './axios';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'kasir';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile (jika ada endpoint untuk ini)
  // Untuk sementara kita akan decode JWT token di client
};
