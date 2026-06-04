import { api } from './client';

export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    user: {
      id: number;
      name: string;
    };
  };
}

// [POST] /auth/login
export const login = async (
  data: LoginRequest,
): Promise<LoginResponse> => {

  const response = await api.post('/auth/login', data);

  return response.data;
};

export interface MeResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    id: number;
    name: string;
    created_at: string;
  };
}

// [GET] /me
export const me = async (): Promise<MeResponse> => {
  const response = await api.get('/me');
  return response.data;
};