import { ApiResponse, AuthResponse, User } from '../types/api';
import { apiRequest } from './api';

export const authService = {
  async register(username: string, email: string, password: string, name?: string): Promise<AuthResponse> {
    const res = await apiRequest<ApiResponse<AuthResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, name }),
    });

    if (res.data?.token) {
      localStorage.setItem('excalidraw_token', res.data.token);
      localStorage.setItem('excalidraw_user', JSON.stringify({
        id: res.data.userId,
        username: res.data.username,
        email: res.data.email,
        name: res.data.name,
      }));
    }

    return res.data;
  },

  async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    if (res.data?.token) {
      localStorage.setItem('excalidraw_token', res.data.token);
      localStorage.setItem('excalidraw_user', JSON.stringify({
        id: res.data.userId,
        username: res.data.username,
        email: res.data.email,
        name: res.data.name,
      }));
    }

    return res.data;
  },

  logout(): void {
    localStorage.removeItem('excalidraw_token');
    localStorage.removeItem('excalidraw_user');
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('excalidraw_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('excalidraw_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('excalidraw_token');
  },
};
