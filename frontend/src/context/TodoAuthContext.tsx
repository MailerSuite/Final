import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, LoginData, RegisterData } from '../api/todoApi';
import axiosInstance from '../http/axios';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_KEY = 'todo_auth_user';

export const TodoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token and user from localStorage on mount
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set default auth header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setIsLoading(false);
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authApi.login(data);
      const { access_token } = response;
      
      // Store token (now using unified token key)
      localStorage.setItem(TOKEN_KEY, access_token);
      setToken(access_token);
      
      // Set default auth header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Fetch user data (we'll need to add a /me endpoint or parse from token)
      // For now, we'll just store basic user info
      const userInfo: User = {
        id: 0, // This should come from a /me endpoint
        username: data.username,
        email: '', // This should come from a /me endpoint
        is_active: true,
        created_at: new Date().toISOString(),
      };
      
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
      
      // Sync with main auth store by triggering a refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-token-updated'));
      }
    } catch (error) {
      // Clean up on error
      logout();
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    const user = await authApi.register(data);
    // After registration, automatically login
    await login({ username: data.username, password: data.password });
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Remove auth header
    delete axiosInstance.defaults.headers.common['Authorization'];
    
    // Notify main auth store about logout
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-token-updated'));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useTodoAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useTodoAuth must be used within a TodoAuthProvider');
  }
  return context;
}; 