import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, authApi, tokenStorage } from "@/lib/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login(email, password);
          tokenStorage.set(response.token);
          set({ user: response.user, isAuthenticated: true });
        } catch (error) {
          throw error;
        }
      },

      signup: async (userData) => {
        try {
          const response = await authApi.signup(userData);
          tokenStorage.set(response.token);
          set({ user: response.user, isAuthenticated: true });
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        tokenStorage.remove();
        set({ user: null, isAuthenticated: false });
      },

      initialize: async () => {
        const token = tokenStorage.get();
        if (token) {
          try {
            const response = await authApi.getMe();
            set({ user: response.user, isAuthenticated: true });
          } catch (error) {
            // Invalid token
            tokenStorage.remove();
            set({ user: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
