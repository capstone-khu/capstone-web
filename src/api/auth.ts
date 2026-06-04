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

export const loginApi = async (
  data: LoginRequest,
): Promise<LoginResponse> => {

  const response = await api.post('/auth/login', data);

  return response.data;
};