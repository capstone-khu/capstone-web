import { create } from 'zustand';

interface User {
  id: number;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;

  setAuth: (
    user: User | null,
    token: string | null,
  ) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  setAuth: (user, token) =>
    set({
      user,
      accessToken: token,
    }),

  logout: () => {
    localStorage.removeItem('access_token');
    set({
      user: null,
      accessToken: null,
    });
  }
}));