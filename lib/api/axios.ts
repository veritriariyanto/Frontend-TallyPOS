import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function to get full image URL
export const getImageUrl = (imageUrl: string | null): string | null => {
  if (!imageUrl) return null;
  // If already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // If base64, return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  // Build full URL from backend
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${baseURL}${imageUrl}`;
};
