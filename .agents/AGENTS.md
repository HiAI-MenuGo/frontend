# HiAI-MenuGo Frontend — Agent Entry Point

> **Repo này là `frontend/`** — Next.js 16 App Router + React 19 + TailwindCSS 4.  
> Web Admin Dashboard, POS Đặt món, Quản lý đơn hàng và QR Menu dành cho ADMIN / MANAGER / CASHIER.

---

## 1. Bản Đồ Files (đọc theo thứ tự)

| # | File | Nội dung chính | Khi nào đọc |
|---|---|---|---|
| 1 | `AGENTS.md` (file này) | Index repo · cấu trúc thư mục · sơ đồ trang · workflow frontend | Luôn đọc đầu tiên |
| 2 | [BUSINESS.md](./BUSINESS.md) | Nghiệp vụ F&B: lifecycle gọi món, RBAC, Dashboard KPIs, Z-Report, Loyalty | Trước khi xây tính năng liên quan nghiệp vụ |
| 3 | [TECHS.md](./TECHS.md) | Stack: Next.js 16, TailwindCSS 4, Zustand 5, Socket.IO Client, Recharts, i18n | Trước khi chọn thư viện, tạo page/component mới |
| 4 | [RULES.md](./RULES.md) | Luật bắt buộc: không localStorage token, Zustand stores, dark mode, icon rules | Trước khi viết/sửa bất kỳ code nào |
| 5 | [SKILLS.md](./SKILLS.md) | Design System: màu sắc, typography, layout chuẩn, component mẫu, Tailwind patterns | Trước khi làm UI/component mới |
| 6 | [SYSTEM.md](./SYSTEM.md) | System: auth flow, Socket.IO integration, i18n, multi-tenant routing | Khi làm tính năng auth, realtime hoặc routing phức tạp |

---

## 2. Thông Tin Repo Này

- **Repo:** `frontend.git` — Web platform (Admin, POS, Quản lý đơn, QR Menu)
- **Framework:** Next.js 16 App Router · React 19 · TypeScript 5
- **Port:** `3000` — **không tự đổi**
- **Nhánh hiện tại:** `dev` → PR vào `dev`, merge `main` khi release
- **API backend:** `NEXT_PUBLIC_API_URL` trong `.env.local` (mặc định `http://localhost:5000/api`)
- **Auth:** JWT access token lưu trong Zustand (`auth.store.ts`) — **không localStorage**

---

## 3. Cấu Trúc Thư Mục Frontend

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout: fonts (Be Vietnam Pro, Geist Mono), metadata
│   ├── page.tsx                      # Redirect → /login
│   ├── globals.css                   # TailwindCSS 4 + global styles
│   ├── favicon.ico
│   ├── login/                        # Trang đăng nhập (public)
│   ├── table/[tableId]/              # QR Menu khách hàng (public, không cần auth)
│   ├── [tenantId]/                   # Layout theo tenant slug
│   └── (main)/                       # Khu vực quản trị (yêu cầu auth)
│       ├── layout.tsx                # Sidebar + Header + SocketContext provider
│       ├── dashboard/                # Tổng quan doanh thu, stat cards, Recharts
│       ├── menu/                     # CRUD thực đơn, modifier group, danh mục
│       ├── orders/                   # POS Đặt món tại quầy (OrderLineView)
│       ├── order-management/         # Quản lý đơn hàng live (OrderManagementView)
│       ├── cashier/                  # POS thu ngân (tiền mặt + VietQR)
│       ├── tables/                   # Sơ đồ bàn + sinh QR code bàn
│       ├── inventory/                # Kho nguyên liệu + BOM
│       ├── promotions/               # Voucher, khuyến mãi, loyalty tier
│       ├── customers/                # Khách hàng thân thiết
│       ├── staff/                    # Nhân viên + phân quyền RBAC
│       ├── history/                  # Lịch sử giao dịch + xuất Z-Report
│       ├── requests/                 # Yêu cầu từ bàn (gọi phục vụ, đánh giá)
│       └── settings/                 # Branding, chi nhánh, cài đặt tenant
├── components/
│   ├── layout/                       # Sidebar, Header, Breadcrumb
│   ├── dashboard/                    # StatCard, RevenueChart, TopItems
│   ├── menu/                         # MenuItemCard, ModifierForm, CategoryList
│   ├── orders/                       # POS OrderLineView, ItemOptionsModal
│   ├── cashier/                      # POS CartPanel, PaymentModal, QRDisplay
│   ├── tables/                       # FloorMap, TableCard, QRGenerator
│   ├── inventory/                    # IngredientTable, StockAdjustForm
│   ├── promotions/                   # VoucherForm, LoyaltyTierCard
│   ├── customers/                    # CustomerSearch, LoyaltyBadge
│   ├── staff/                        # StaffForm, RoleSelector
│   ├── history/                      # OrderHistory, ZReportExport
│   ├── requests/                     # RequestFeed, RatingCard
│   ├── floor/                        # Floor map components
│   ├── order-management/             # OrderFilter, OrderTable
│   ├── payment/                      # PaymentFlow, VietQRModal
│   └── settings/                     # BrandingForm, BranchForm
├── context/
│   ├── SocketContext.tsx             # Socket.IO provider: kết nối, join room, emit/listen
│   └── i18nContext.tsx               # i18n provider + useI18n() hook
├── stores/                           # Zustand stores
│   ├── auth.store.ts                 # user, accessToken, login(), logout(), refresh()
│   ├── cart.store.ts                 # Giỏ hàng POS (items, addItem, removeItem, clear)
│   ├── branch.store.ts               # Chi nhánh đang chọn (branchId, branchName)
│   ├── header.store.ts               # Tiêu đề trang động (setTitle)
│   └── search.store.ts               # Tìm kiếm global (query, setQuery)
├── lib/
│   ├── api.ts                        # Axios instance với interceptor (auto attach token, refresh 401)
│   └── utils.ts                      # Helper functions (cn, formatCurrency, formatDate...)
├── scripts/
│   └── check-i18n.mjs                # Kiểm tra i18n key coverage
├── public/                           # Static assets (logo, images)
├── .env.local / .env.example
├── next.config.ts
└── tsconfig.json
```

---

## 4. Sơ Đồ Trang & RBAC

| Route | Roles được phép | Mô tả |
|---|---|---|
| `/login` | Public | Đăng nhập |
| `/table/[tableId]` | Public (khách hàng) | QR Menu tự gọi món |
| `/(main)/dashboard` | ADMIN, MANAGER | Tổng quan KPIs, biểu đồ doanh thu |
| `/(main)/menu` | ADMIN, MANAGER | Quản lý thực đơn, modifier, danh mục |
| `/(main)/orders` | CASHIER, MANAGER | POS Đặt món tại quầy / tại bàn |
| `/(main)/order-management` | ADMIN, MANAGER, CASHIER | Quản lý đơn hàng live (PENDING, CONFIRMED, DONE) |
| `/(main)/cashier` | CASHIER | POS thanh toán tiền mặt / VietQR |
| `/(main)/tables` | CASHIER, MANAGER | Sơ đồ bàn + QR code |
| `/(main)/inventory` | MANAGER | Kho nguyên liệu, BOM, kiểm kê |
| `/(main)/promotions` | ADMIN | Voucher, khuyến mãi, loyalty tier |
| `/(main)/customers` | ADMIN, MANAGER | Khách hàng thân thiết |
| `/(main)/staff` | ADMIN, MANAGER | Nhân viên và phân quyền |
| `/(main)/history` | ADMIN, MANAGER | Lịch sử giao dịch, xuất Z-Report PDF/Excel |
| `/(main)/requests` | CASHIER, MANAGER | Yêu cầu từ bàn (gọi phục vụ, đánh giá) |
| `/(main)/settings` | ADMIN | Branding, chi nhánh, cài đặt hệ thống |

---

## 5. Pattern Chuẩn — API Call

```typescript
// lib/api.ts tự động:
// - Attach header Authorization: Bearer <token> từ auth.store
// - Intercept 401 → tự gọi POST /auth/refresh → retry request
// - Nếu refresh fail → logout()

import api from '@/lib/api';

// Ví dụ trong component/page:
const { data } = await api.get('/menu/items', { params: { branchId } });
```

---

## 6. Pattern Chuẩn — Zustand Store

```typescript
// Đọc state:
const { user, accessToken } = useAuthStore();
const { branchId } = useBranchStore();

// Không tạo thêm Context/Redux — dùng Zustand stores đã có
// Nếu cần store mới: tạo file mới trong stores/ + export hook useXxxStore()
```

---

## 7. Pattern Chuẩn — Socket.IO (Realtime)

```typescript
// Trong component cần realtime:
const { socket } = useSocket(); // từ SocketContext

useEffect(() => {
  if (!socket) return;
  socket.on('order:new', (order) => { /* cập nhật UI */ });
  return () => { socket.off('order:new'); };
}, [socket]);
```

SocketContext tự động:
- Kết nối khi có `accessToken`
- Join room `branch:{branchId}` sau khi connect
- Disconnect khi logout

---

## 8. Workflow Bắt Buộc Của Agent

1. Đọc file này → xác định task thuộc page/component nào → đọc SKILLS.md nếu làm UI.
2. **Không dùng `localStorage`** để lưu token — chỉ Zustand `auth.store`.
3. **API calls** luôn qua `lib/api.ts` — không `fetch()` trực tiếp.
4. **Icons:** Chỉ dùng `lucide-react` — không import từ thư viện khác.
5. **Styling:** TailwindCSS 4 — dark mode default `bg-zinc-950`. Không viết CSS thô ngoài `globals.css`.
6. **TUYỆT ĐỐI KHÔNG `git push`** khi chưa có xác nhận của user.
7. Commit theo Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
