import apiClient from './axios';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  totalTransactions: number;
  totalSpent: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface CustomerUpdateDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const customerApi = {
  // Get all customers
  getAll: async (params?: {
    search?: string;
  }): Promise<Customer[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      
      const response = await apiClient.get<Customer[]>(`/customers?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch customers:', error.message);
      return [];
    }
  },

  // Get top customers
  getTop: async (limit: number = 10): Promise<Customer[]> => {
    try {
      const response = await apiClient.get<Customer[]>(`/customers/top?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch top customers:', error.message);
      return [];
    }
  },

  // Get customer by ID
  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  // Get customer by phone
  getByPhone: async (phone: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/phone/${phone}`);
    return response.data;
  },

  // Create customer
  create: async (data: CustomerCreateDto): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers', data);
    return response.data;
  },

  // Update customer
  update: async (id: string, data: CustomerUpdateDto): Promise<Customer> => {
    const response = await apiClient.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
