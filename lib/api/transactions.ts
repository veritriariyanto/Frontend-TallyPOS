import apiClient from './axios';

export interface TransactionDetail {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  subtotal: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    imageUrl: string | null;
  };
}

export interface TransactionFull {
  id: string;
  transactionCode: string;
  userId: string;
  customerId: string | null;
  transactionDate: string;
  subtotal: string;
  discountAmount: string;
  discountPercentage: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: 'cash' | 'debit' | 'credit' | 'qris' | 'transfer';
  paymentAmount: string;
  changeAmount: string;
  notes: string | null;
  status: 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  details: TransactionDetail[];
}

export const transactionApi = {
  // Get all transactions
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    status?: string;
  }): Promise<TransactionFull[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.userId) queryParams.append('userId', params.userId);
      if (params?.status) queryParams.append('status', params.status);
      
      const response = await apiClient.get<TransactionFull[]>(`/transactions?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch transactions:', error.message);
      return [];
    }
  },

  // Get transaction by ID
  getById: async (id: string): Promise<TransactionFull> => {
    const response = await apiClient.get<TransactionFull>(`/transactions/${id}`);
    return response.data;
  },

  // Get transaction by code
  getByCode: async (code: string): Promise<TransactionFull> => {
    const response = await apiClient.get<TransactionFull>(`/transactions/code/${code}`);
    return response.data;
  },

  // Cancel transaction
  cancel: async (id: string): Promise<TransactionFull> => {
    const response = await apiClient.patch<TransactionFull>(`/transactions/${id}/cancel`);
    return response.data;
  },

  // Get transaction details
  getDetails: async (transactionId: string): Promise<TransactionDetail[]> => {
    const response = await apiClient.get<TransactionDetail[]>(`/transaction-details/transaction/${transactionId}`);
    return response.data;
  },
};
