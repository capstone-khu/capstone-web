import { create } from 'zustand';

interface User {
  id: number;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;

  setAuth: (
    user: User,
    token: string,
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

  logout: () =>
    set({
      user: null,
      accessToken: null,
    }),
}));