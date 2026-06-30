export type UserRole = "CLIENT" | "PROJECT_MANAGER" | "ADMIN";

export interface AuthUser {
  id:    string;
  name:  string;
  email: string;
  role:  UserRole;
  image: string | null;
}

export interface AuthState {
  user:  AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user:  AuthUser;
}

export interface RefreshResponse {
  token: string;
  user:  AuthUser;
}
