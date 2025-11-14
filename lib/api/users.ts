import apiClient from './axios';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'kasir';
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'kasir';
}

export interface UserUpdateDto {
  username?: string;
  email?: string;
  fullName?: string;
  isActive?: boolean;
}

export const userApi = {
  // Get all users
  getAll: async (params?: {
    search?: string;
  }): Promise<User[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      
      const response = await apiClient.get<User[]>(`/users?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch users:', error.message);
      return [];
    }
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  // Create user
  create: async (data: UserCreateDto): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: UserUpdateDto): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Upload avatar (upload only, returns URL)
  uploadAvatar: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiClient.post<{ url: string }>('/users/upload-avatar', formData);
      return response.data.url;
    } catch (error: any) {
      console.error('Upload avatar error:', error.response?.data);
      throw error;
    }
  },

  // Upload avatar for current user (upload + update)
  uploadMyAvatar: async (file: File): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiClient.post<User>('/users/me/upload-avatar', formData);
      return response.data;
    } catch (error: any) {
      console.error('Upload my avatar error:', error.response?.data);
      throw error;
    }
  },

  // Upload avatar for specific user (upload + update)
  uploadUserAvatar: async (id: string, file: File): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiClient.post<User>(`/users/${id}/upload-avatar`, formData);
      return response.data;
    } catch (error: any) {
      console.error('Upload user avatar error:', error.response?.data);
      throw error;
    }
  },
};
