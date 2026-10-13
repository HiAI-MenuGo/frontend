import { apiFetch } from '../api';

export interface QrWalletCreateResult {
  referenceNo: string;
  amount: number;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export async function createMoMoQrPayment(tableId: string): Promise<QrWalletCreateResult> {
  const res = await apiFetch<QrWalletCreateResult>('/qr-pay/momo/create', {
    method: 'POST',
    body: JSON.stringify({ tableId }),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Không tạo được thanh toán MoMo');
  return res.data;
}

export async function createVNPayQrPayment(tableId: string): Promise<QrWalletCreateResult> {
  const res = await apiFetch<QrWalletCreateResult>('/qr-pay/vnpay/create', {
    method: 'POST',
    body: JSON.stringify({ tableId }),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Không tạo được thanh toán VNPay');
  return res.data;
}

export async function fetchQrPaymentStatus(
  referenceNo: string
): Promise<{ referenceNo: string; status: string; amount: number; paidAt?: string }> {
  const res = await apiFetch<{ referenceNo: string; status: string; amount: number; paidAt?: string }>(
    `/qr-pay/status/${encodeURIComponent(referenceNo)}`
  );
  if (!res.success || !res.data) throw new Error(res.message || 'Không lấy được trạng thái');
  return res.data;
}
