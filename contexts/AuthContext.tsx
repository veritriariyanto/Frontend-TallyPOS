'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, LoginRequest } from '@/lib/api/auth';
import { decodeToken, isTokenExpired, JWTPayload } from '@/lib/utils/jwt';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: JWTPayload | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check token saat aplikasi pertama kali dimuat
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && !isTokenExpired(token)) {
      const decoded = decodeToken(token);
      setUser(decoded);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      
      // Simpan token
      localStorage.setItem('token', response.access_token);
      
      // Decode token untuk mendapatkan user info
      const decoded = decodeToken(response.access_token);
      if (decoded) {
        setUser(decoded);
        localStorage.setItem('user', JSON.stringify(decoded));
        toast.success('Login berhasil!');
        
        // Redirect berdasarkan role
        if (decoded.role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/kasir');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login gagal. Periksa username dan password Anda.';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logout berhasil');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
