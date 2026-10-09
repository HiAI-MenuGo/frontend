export function formatVND(n: number): string {
  return `${Math.round(n).toLocaleString('vi-VN')} ₫`;
}

export function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

// Backend giá VND, giao diện cũ hiển thị USD. Mặc định hiển thị VND cho đúng thực tế.
export function formatPrice(vnd: number): string {
  return formatVND(vnd);
}

export const VND_PER_USD = 25400;
export function usdToVnd(usd: number): number {
  return Math.round(usd * VND_PER_USD);
}
