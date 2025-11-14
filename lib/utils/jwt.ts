import { jwtDecode } from 'jwt-decode';

export interface JWTPayload {
  sub: string; // user id
  username: string;
  role: 'admin' | 'kasir';
  avatarUrl?: string | null;
  iat: number;
  exp: number;
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};
