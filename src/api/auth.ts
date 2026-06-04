import { api } from './client';

export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
  };
}

export const loginApi = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
    
  const response = await api.post('/auth/login', data);

  return response.data;
};