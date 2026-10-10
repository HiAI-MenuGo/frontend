import { ApiResponse } from '../api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UploadResult {
  url: string;
  publicId: string;
  bytes?: number;
  format?: string;
  isLocalFallback?: boolean;
}

/**
 * Upload an image File to Cloudinary via backend POST /api/upload/image
 */
export async function uploadImageFile(
  file: File,
  folder = 'hiai-menugo/menu'
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const endpoint = `${API_URL.replace(/\/+$/, '')}/upload/image`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json: ApiResponse<UploadResult> = await res.json();
  if (!json.success || !json.data?.url) {
    throw new Error(json.message || 'Tải ảnh lên máy chủ thất bại');
  }

  return json.data;
}

/**
 * Check backend Cloudinary configuration status
 */
export async function fetchUploadStatus(): Promise<{
  cloudinaryConfigured: boolean;
  cloudName: string | null;
  storageMode: string;
}> {
  const endpoint = `${API_URL.replace(/\/+$/, '')}/upload/status`;
  const res = await fetch(endpoint);
  const json = await res.json();
  return json.data;
}
