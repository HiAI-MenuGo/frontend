import { apiFetch } from '../api';

export interface LoginUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  branchId: string | null;
}

export interface LoginResult {
  user: LoginUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export async function loginApi(email: string, password: string): Promise<LoginResult> {
  const res = await apiFetch<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.success || !res.data) throw new AuthError(res.message || 'Đăng nhập thất bại', res.errorCode);
  return res.data;
}

export async function fetchMe(): Promise<LoginUser> {
  const res = await apiFetch<LoginUser>('/auth/me');
  if (!res.success || !res.data) throw new AuthError(res.message || 'Phiên đăng nhập hết hạn', res.errorCode);
  return res.data;
}

/**
 * Kiểm tra xem JWT access token đã hết hạn hay chưa theo trường exp (Unix epoch seconds)
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

