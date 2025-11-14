import apiClient from './axios';

export interface SalesReport {
  totalTransactions: number;
  totalRevenue: string;
  totalDiscount: string;
  totalTax: string;
  totalProfit: string;
  transactions?: any[];
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: string;
  transactionCount: number;
}

export interface ProductStats {
  productId: string;
  totalQuantity: number;
  totalRevenue: string;
  totalTransactions: number;
  averageQuantityPerTransaction: number;
  details?: any[];
}

export const reportApi = {
  // Get sales report
  getSalesReport: async (startDate?: string, endDate?: string): Promise<SalesReport> => {
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
        transactions: data.transactions ?? [],
      };
    } catch (error: any) {
      console.warn('Failed to fetch sales report:', error.message);
      return {
        totalTransactions: 0,
        totalRevenue: '0',
        totalDiscount: '0',
        totalTax: '0',
        totalProfit: '0',
      };
    }
  },

  // Get top selling products
  getTopSellingProducts: async (limit: number = 10): Promise<TopSellingProduct[]> => {
    try {
      const response = await apiClient.get<TopSellingProduct[]>(`/transaction-details/top-selling?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch top selling products:', error.message);
      return [];
    }
  },

  // Get product statistics
  getProductStats: async (productId: string, startDate?: string, endDate?: string): Promise<ProductStats> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get<ProductStats>(`/transaction-details/product/${productId}/stats?${params}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch product stats:', error.message);
      throw error;
    }
  },
};
