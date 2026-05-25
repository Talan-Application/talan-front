export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  role?: string;
  preferred_locale?: string;
}

export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ConfirmCodeRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}