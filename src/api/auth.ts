import type { AxiosResponse } from 'axios';
import { apiClient } from './client';
import type {
  RegisterRequest,
  LoginRequest,
  ConfirmCodeRequest,
  AuthResponse,
  MessageResponse,
} from '../types/auth.types';

export const authApi = {
  register: (data: RegisterRequest): Promise<AxiosResponse<MessageResponse>> =>
    apiClient.post<MessageResponse>('/auth/register', data),

  login: (data: LoginRequest): Promise<AxiosResponse<MessageResponse>> =>
    apiClient.post<MessageResponse>('/auth/login', data),

  verifyLogin: (data: ConfirmCodeRequest): Promise<AxiosResponse<AuthResponse>> =>
    apiClient.post<AuthResponse>('/auth/verify-login', data),

  verifyEmail: (data: ConfirmCodeRequest): Promise<AxiosResponse<MessageResponse>> =>
    apiClient.post<MessageResponse>('/auth/verify-email', data),

  resendCode: (email: string): Promise<AxiosResponse<MessageResponse>> =>
    apiClient.post<MessageResponse>('/auth/resend-code', { email }),

  refresh: (refreshToken: string): Promise<AxiosResponse<{ access_token: string }>> =>
    apiClient.post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken }),

  logout: (): Promise<AxiosResponse<void>> =>
    apiClient.post('/auth/logout'),
};
