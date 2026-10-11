const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  // Trang đăng nhập tự xử lý lỗi 401 (sai mật khẩu) nên không chuyển hướng
  if (window.location.pathname.startsWith('/login')) return;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.setItem(
      'auth_expired_reason',
      'Phiên làm việc hoặc access token của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục làm việc.'
    );
  } catch {
    // bỏ qua
  }
  window.location.href = '/login?expired=1';
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const branchId = typeof window !== 'undefined' ? (localStorage.getItem('selected-branch-id') || 'ALL') : 'ALL';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(branchId ? { 'x-branch-id': branchId } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Token hết hạn / không hợp lệ -> xóa phiên và văng về đăng nhập
    if (res.status === 401) {
      handleUnauthorized();
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: error.message || 'Không thể kết nối tới máy chủ',
    };
  }
}

export default apiFetch;
