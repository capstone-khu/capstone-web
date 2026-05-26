import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 목업 인증 — 백엔드 없는 화면 기획용. 이름만 받아 로그인 상태를 흉내낸다.
 * persist로 새로고침 시에도 로그인 상태 유지(데모 편의).
 */
type User = { name: string };

type AuthState = {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (name) => set({ user: { name } }),
      logout: () => set({ user: null }),
    }),
    { name: 'capstone-auth' },
  ),
);
