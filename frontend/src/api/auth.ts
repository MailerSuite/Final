import axios from '@/http/axios'
import type { components } from '@/types/openapi.d'

export type Token = components['schemas']['Token']
export type UserCreate = components['schemas']['UserCreate']
export type User = components['schemas']['User']

export interface LoginTelegramPayload {
  email: string
  password: string
  fingerprint?: string
}

export interface LoginEmailPayload {
  email: string
  password: string
  fingerprint?: string
}

export type LoginPayload = LoginTelegramPayload | LoginEmailPayload

export type LoginResponse = Token

export interface LoginError {
  reason?: 'fingerprint_limit' | 'login_limit'
  detail?: string
}

/**
 * Register a new user.
 * @param data - user registration payload
 * @returns access token
 */
export const register = async (data: UserCreate) => {
  const { data: res } = await axios.post<Token>('/api/v1/auth/register', data)
  return res
}

/**
 * Login with Telegram username and password.
 * @param data - login credentials
 * @returns access token
 */
export const loginTelegram = async (
  data: LoginTelegramPayload,
): Promise<LoginResponse> => {
  const { data: res } = await axios.post<LoginResponse>(
    '/login/telegram',
    {
      identifier: data.email,
      password: data.password,
      fingerprint: data.fingerprint
    },
  )
  return res
}

/**
 * Login with email and password.
 * @param data - login credentials
 * @returns access token
 */
export const loginEmail = async (
  data: LoginEmailPayload,
): Promise<LoginResponse> => {
  const { data: res } = await axios.post<LoginResponse>(
    '/api/v1/auth/login',
    { 
      email: data.email,  // FIXED: Backend expects 'email' field, not 'username'
      password: data.password, 
      fingerprint: data.fingerprint 
    },
  )
  return res
}

export const login = async (
  data: LoginPayload,
): Promise<LoginResponse> => {
  if ('email' in data) {
    return loginEmail(data)
  }
  return loginTelegram(data)
}

/** Fetch current authenticated user */
export const me = async () => {
  const { data } = await axios.get<User>('/api/v1/auth/me')
  return data
}

/** Verify stored token and refresh if needed */
export const verify = async () => {
  const { data } = await axios.post<string>('/api/v1/auth/verify-token')
  return data
}


// 2FA API functions
export interface Verify2FARequest {
  user_id: string;
  code?: string;
  backup_code?: string;
}

export interface Verify2FAResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  backup_codes?: string[];
}

export interface Resend2FARequest {
  user_id: string;
}

export interface Resend2FAResponse {
  success: boolean;
  message: string;
  expires_in: number;
}

export const verify2FACode = async (data: Verify2FARequest): Promise<Verify2FAResponse> => {
  const response = await axios.post<Verify2FAResponse>('/auth/2fa/verify', data);
  return response.data;
};

export const resend2FACode = async (data: Resend2FARequest): Promise<Resend2FAResponse> => {
  const response = await axios.post<Resend2FAResponse>('/auth/2fa/resend', data);
  return response.data;
};

export interface TwoFAStatusResponse {
  enabled: boolean;
  verified: boolean;
  backup_codes_count: number;
}

export const get2FAStatus = async (): Promise<TwoFAStatusResponse> => {
  const response = await axios.get<TwoFAStatusResponse>('/auth/2fa/status');
  return response.data;
};

export interface Enable2FARequest {
  send_code?: boolean;
  verification_code?: string;
}

export interface Enable2FAResponse {
  success: boolean;
  message: string;
  expires_in?: number;
  backup_codes?: string[];
}

export const enable2FA = async (data: Enable2FARequest): Promise<Enable2FAResponse> => {
  const response = await axios.post<Enable2FAResponse>('/auth/2fa/enable', data);
  return response.data;
};

export const disable2FA = async (): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post<{ success: boolean; message: string }>('/auth/2fa/disable');
  return response.data;
};

export const getBackupCodes = async (): Promise<{ success: boolean; message: string; backup_codes: string[] }> => {
  const response = await axios.get<{ success: boolean; message: string; backup_codes: string[] }>('/auth/2fa/backup-codes');
  return response.data;
};

export const regenerateBackupCodes = async (): Promise<{ success: boolean; message: string; backup_codes: string[] }> => {
  const response = await axios.post<{ success: boolean; message: string; backup_codes: string[] }>('/auth/2fa/regenerate-backup-codes');
  return response.data;
};
