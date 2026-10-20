import { create } from 'zustand';

type AuthState = {
  token: string | null;
  userId: number | null;
  setToken: (token: string) => void;
  logout: () => void;
};

function getUserId(token: string | null) {
  if (!token) return null;
  try {
    const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')));
    return Number.isInteger(Number(payload.sub)) ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  userId: getUserId(localStorage.getItem('access_token')),
  setToken: (token) => {
    localStorage.setItem('access_token', token);
    set({ token, userId: getUserId(token) });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, userId: null });
  },
}));
