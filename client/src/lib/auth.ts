import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    return response.json();
  },

  signup: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/signup", userData);
    return response.json();
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};

export const tokenStorage = {
  get: (): string | null => localStorage.getItem("auth_token"),
  set: (token: string): void => localStorage.setItem("auth_token", token),
  remove: (): void => localStorage.removeItem("auth_token"),
};
