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
