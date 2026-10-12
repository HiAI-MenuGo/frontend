# HiAI-MenuGo Frontend — Master Code Patterns & Skills (SKILLS)

> **Góc nhìn Frontend (Web):** Tài liệu này chứa toàn bộ các **UI patterns, component templates, Zustand state patterns và API client snippets chuẩn** trong Next.js 16 App Router + React 19 + TailwindCSS 4 của HiAI-MenuGo.
>
> - 🧭 Index & Cấu trúc repo: [AGENTS.md](./AGENTS.md)
> - 📖 Nghiệp vụ: [BUSINESS.md](./BUSINESS.md)
> - ⛔ Luật bắt buộc: [RULES.md](./RULES.md)
> - 🔧 Tech Stack: [TECHS.md](./TECHS.md)

---

## 1. Component Architecture & Server vs Client Pattern

Quy tắc phân định:
- Mặc định là **Server Component** (không có directive).
- Chỉ thêm `'use client'` ở dòng đầu tiên khi component: dùng hooks (`useState`, `useEffect`, `useCallback`), dùng Zustand stores, lắng nghe Socket.IO hoặc bắt sự kiện người dùng (`onClick`, `onChange`).

### Mẫu Client Component Chuẩn (`components/orders/OrderLineView.tsx`):
```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';
import { fetchMenuItems } from '@/lib/api/menu.api';
import type { MenuItemDTO } from '@/lib/api/types';
import { useBranchStore } from '@/stores/branch.store';
import { formatVND } from '@/lib/format';
import { useSocket } from '@/context/SocketContext';

export default function OrderLineView() {
  const [items, setItems] = useState<MenuItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const { on, isConnected } = useSocket();

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMenuItems(selectedBranchId);
      setItems(data);
    } catch (err) {
      console.error('Lỗi tải menu:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Lắng nghe realtime khi có cập nhật món hết hàng
  useEffect(() => {
    if (!isConnected) return;
    const cleanup = on('sold_out:updated', () => {
      loadMenu();
    });
    return cleanup;
  }, [isConnected, on, loadMenu]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Đang tải thực đơn...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition"
        >
          <div>
            <h3 className="font-semibold text-white text-base">{item.name}</h3>
            <p className="text-sm text-zinc-400 mt-1">{formatVND(item.price)}</p>
          </div>
          <button
            disabled={item.isSoldOut}
            className="mt-3 w-full bg-[#00A389] hover:bg-[#00A389]/90 disabled:bg-zinc-800 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            {item.isSoldOut ? 'Hết món' : 'Chọn món'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 2. Design System & TailwindCSS 4 Dark Theme Styling

Bảng màu & Tokens chuẩn được áp dụng trên toàn bộ Web Admin và POS:

| Thành phần UI | Tailwind Class chuẩn | Ghi chú |
|---|---|---|
| Background chính | `bg-zinc-950 text-zinc-50` | Nền tối sâu sang trọng |
| Surface / Card | `bg-zinc-900 border border-zinc-800 rounded-xl` | Khối nội dung, bảng thông số |
| Nút Primary CTA | `bg-[#00A389] hover:bg-[#00A389]/90 text-white rounded-lg` | Màu xanh ngọc thương hiệu |
| Nút Secondary / Viền | `bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700` | Nút phụ, đóng modal |
| Nút Hủy / Nguy hiểm | `bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20` | Hủy đơn, xóa món |
| Ô nhập liệu Input | `bg-zinc-800/60 border border-zinc-700 focus:border-[#00A389] text-white rounded-lg px-3 py-2` | Form & Search bar |
| Badge trạng thái | `bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs` | PENDING, cảnh báo |

---

## 3. Zustand Store Patterns

Luôn dùng selector để chỉ lấy đúng phần state cần dùng (tránh re-render không cần thiết):

```typescript
// 1. Lấy dữ liệu với selector:
const user = useAuthStore((s) => s.user);
const token = useAuthStore((s) => s.token);
const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

// 2. Lấy action ổn định (không thay đổi reference):
const setBranchId = useBranchStore((s) => s.setSelectedBranchId);
const logout = useAuthStore((s) => s.logout);

// 3. KHÔNG BAO GIỜ destructure cả store:
// ❌ const { user, token, login } = useAuthStore(); // Re-render mỗi khi bất kỳ field nào đổi!
```

---

## 4. API Client Pattern (`lib/api.ts`)

Mọi lệnh gọi API nội bộ sử dụng hàm tiện ích `apiFetch`:
```typescript
import apiFetch from '@/lib/api';

// Gọi API tự động gắn Bearer Token và x-branch-id
export async function getLiveOrders() {
  const res = await apiFetch<LiveOrderDTO[]>('/orders/active');
  if (!res.success) {
    throw new Error(res.message || 'Không thể tải danh sách đơn');
  }
  return res.data;
}

// Gọi API POST / PATCH có body:
export async function updateOrderStatus(orderId: string, status: string) {
  const res = await apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}
```

---

## 5. Realtime Socket.IO Pattern (`context/SocketContext.tsx`)

Sử dụng hook `useSocket()` để lắng nghe realtime và luôn return cleanup để tránh leak bộ nhớ:

```typescript
import { useSocket } from '@/context/SocketContext';

export function OrderLiveSubscriber({ onNewOrder }: { onNewOrder: (order: any) => void }) {
  const { on, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Lắng nghe đơn mới
    const cleanupNewOrder = on('order:new', (payload) => {
      onNewOrder(payload);
    });

    // Lắng nghe cập nhật thanh toán
    const cleanupPayment = on('payment:completed', (payload) => {
      console.log('Thanh toán hoàn tất:', payload);
    });

    return () => {
      cleanupNewOrder();
      cleanupPayment();
    };
  }, [isConnected, on, onNewOrder]);

  return null;
}
```

---

## 6. Modal / Dialog Pattern Chuẩn

Mẫu Modal tuân thủ khả năng bấm ra ngoài để đóng, nhấn ESC và khóa cuộn trang nền:

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition p-1 rounded-lg"
          >
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
```

---

## 7. Format Tiền Tệ & Đa Ngôn Ngữ (i18n)

### Định dạng tiền tệ VND (`lib/format.ts`):
```typescript
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
// Ví dụ: formatVND(45000) → "45.000 ₫"
```

### Sử dụng i18n (`context/i18nContext.tsx`):
```tsx
import { useI18n } from '@/context/i18nContext';

export function ActionButtons() {
  const { t } = useI18n();
  return (
    <div className="flex gap-2">
      <button className="bg-zinc-800 px-4 py-2 rounded-lg">{t('common.cancel')}</button>
      <button className="bg-[#00A389] px-4 py-2 rounded-lg">{t('common.save')}</button>
    </div>
  );
}
```
