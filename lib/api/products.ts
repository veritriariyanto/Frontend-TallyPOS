import apiClient from './axios';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  sku: string;
  barcode: string;
  name: string;
  description: string | null;
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

export interface ProductCreateDto {
  categoryId: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl?: string;
}

export interface ProductUpdateDto {
  categoryId?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export const productApi = {
  // Get all products
  getAll: async (params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<Product[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      
      const response = await apiClient.get<Product[]>(`/products?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch products:', error.message);
      return [];
    }
  },

  // Get active products
  getActive: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>('/products/active');
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch active products:', error.message);
      return [];
    }
  },

  // Get low stock products
  getLowStock: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>('/products/low-stock');
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch low stock products:', error.message);
      return [];
    }
  },

  // Get product by ID
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  // Get product by SKU
  getBySku: async (sku: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/sku/${sku}`);
    return response.data;
  },

  // Get product by barcode
  getByBarcode: async (barcode: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/barcode/${barcode}`);
    return response.data;
  },

  // Create product
  create: async (data: ProductCreateDto): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  // Update product
  update: async (id: string, data: ProductUpdateDto): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  // Update stock
  updateStock: async (id: string, quantity: number): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}/stock`, { quantity });
    return response.data;
  },

  // Toggle active status
  toggleActive: async (id: string): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}/toggle-active`);
    return response.data;
  },

  // Delete product
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // Upload image
  uploadImage: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file); // Backend expects 'image' not 'file'
      
      const response = await apiClient.post<{ url: string }>('/products/upload-image', formData);
      return response.data.url; // Backend returns 'url' field
    } catch (error: any) {
      console.error('Upload error details:', error.response?.data);
      throw error;
    }
  },
};

export const categoryApi = {
  // Get all categories
  getAll: async (params?: {
    search?: string;
    isActive?: boolean;
  }): Promise<Category[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      
      const response = await apiClient.get<Category[]>(`/categories?${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch categories:', error.message);
      return [];
    }
  },

  // Get active categories
  getActive: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<Category[]>('/categories/active');
      return response.data;
    } catch (error: any) {
      console.warn('Failed to fetch active categories:', error.message);
      return [];
    }
  },

  // Get category by ID
  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  // Create category
  create: async (data: { name: string; description?: string }): Promise<Category> => {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  },

  // Update category
  update: async (id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  // Toggle active status
  toggleActive: async (id: string): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/categories/${id}/toggle-active`);
    return response.data;
  },

  // Delete category
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
