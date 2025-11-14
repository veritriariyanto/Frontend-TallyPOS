import apiClient from './axios';

// Statistics
export interface DashboardStats {
  totalTransactions: number;
  totalRevenue: string;
  totalDiscount: string;
  totalTax: string;
  totalProfit: string;
}

// Products
export interface Product {
  id: string;
  categoryId: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  purchasePrice: string;
  sellingPrice: string;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
}

// Transactions
export interface Transaction {
  id: string;
  transactionCode: string;
  transactionDate: string;
  subtotal: string;
  discountAmount: string;
  discountPercentage: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: 'cash' | 'debit' | 'credit' | 'qris' | 'transfer';
  paymentAmount: string;
  changeAmount: string;
  status: 'completed' | 'cancelled' | 'refunded';
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
}

// Customers
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

export const dashboardApi = {
  // Get sales report/statistics
  getReport: async (startDate?: string, endDate?: string): Promise<DashboardStats> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<any>(`/transactions/report?${params}`);
      const data = response.data;
      return {
        totalTransactions: data.totalTransactions ?? 0,
        totalRevenue: data.totalSales?.toString() ?? '0', // mapping totalSales -> totalRevenue
        totalDiscount: data.totalDiscount?.toString() ?? '0',
        totalTax: data.totalTax?.toString() ?? '0',
        totalProfit: data.totalProfit?.toString() ?? '0',
      };
    } catch (error: any) {
      // Return default stats if error (no data yet)
      console.warn('Failed to fetch report, returning default stats:', error.message);
      return {
        totalTransactions: 0,
        totalRevenue: '0',
        totalDiscount: '0',
        totalTax: '0',
        totalProfit: '0',
      };
    }
  },

  // Get low stock products
  getLowStockProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>('/products/low-stock');
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch low stock products:', error.message);
      return [];
    }
  },

  // Get recent transactions
  getRecentTransactions: async (limit: number = 10): Promise<Transaction[]> => {
    try {
      const response = await apiClient.get<Transaction[]>('/transactions');
      return response.data.slice(0, limit);
    } catch (error: any) {
      console.warn('Failed to fetch recent transactions:', error.message);
      return [];
    }
  },

  // Get top customers
  getTopCustomers: async (limit: number = 5): Promise<Customer[]> => {
    try {
      const response = await apiClient.get<Customer[]>(`/customers/top?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch top customers:', error.message);
      return [];
    }
  },

  // Get all products
  getProducts: async (params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    
    const response = await apiClient.get<Product[]>(`/products?${queryParams}`);
    return response.data;
  },

  // Get all transactions with filters
  getTransactions: async (params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    status?: string;
  }): Promise<Transaction[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.status) queryParams.append('status', params.status);
    
    const response = await apiClient.get<Transaction[]>(`/transactions?${queryParams}`);
    return response.data;
  },
};
