/**
 * Consolidated Authentication Service
 * Replaces: auth-api.ts, user-api.ts, session-api.ts, profile-api.ts
 */

import { UnifiedApiCore } from '../unified-api-core';

export interface UnifiedUser {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  role: 'admin' | 'user' | 'moderator';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  plan?: string;
  permissions?: string[];
}

export interface LoginResponse {
  user: UnifiedUser;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}

class ConsolidatedAuthService extends UnifiedApiCore {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('post', '/auth/login', { email, password }, {
      showSuccessToast: true,
      retry: 2
    });
    
    // Store tokens
    this.setAuthToken(response.token);
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    return this.makeRequest('post', '/auth/register', userData, {
      showSuccessToast: true
    });
  }

  async logout(): Promise<void> {
    await this.makeRequest('post', '/auth/logout', {}, {
      showSuccessToast: true
    });
    
    this.removeAuthToken();
    localStorage.removeItem('refresh_token');
  }

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.makeRequest('post', '/auth/refresh', { refreshToken });
  }

  async getCurrentUser(): Promise<UnifiedUser> {
    return this.makeRequest('get', '/auth/me', undefined, {
      cache: true
    });
  }

  async updateProfile(updates: Partial<UnifiedUser>): Promise<UnifiedUser> {
    return this.makeRequest('put', '/auth/profile', updates, {
      showSuccessToast: true
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.makeRequest('put', '/auth/password', {
      currentPassword,
      newPassword
    }, {
      showSuccessToast: true
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    return this.makeRequest('post', '/auth/forgot-password', { email }, {
      showSuccessToast: true
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.makeRequest('post', '/auth/reset-password', { token, newPassword }, {
      showSuccessToast: true
    });
  }

  async verifyEmail(token: string): Promise<void> {
    return this.makeRequest('post', '/auth/verify-email', { token }, {
      showSuccessToast: true
    });
  }

  async resendVerification(): Promise<void> {
    return this.makeRequest('post', '/auth/resend-verification', {}, {
      showSuccessToast: true
    });
  }

  async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    return this.makeRequest('post', '/auth/2fa/enable');
  }

  async verify2FA(token: string): Promise<void> {
    return this.makeRequest('post', '/auth/2fa/verify', { token }, {
      showSuccessToast: true
    });
  }

  async disable2FA(password: string): Promise<void> {
    return this.makeRequest('post', '/auth/2fa/disable', { password }, {
      showSuccessToast: true
    });
  }
}

// Create singleton instance
const authService = new ConsolidatedAuthService();

export default authService;
export { ConsolidatedAuthService };