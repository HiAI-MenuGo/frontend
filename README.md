# 🖥️ HiAI-MenuGo — Web Frontend (Admin Dashboard & POS)

> **Ứng dụng web quản lý nhà hàng F&B** dành cho ADMIN, MANAGER, CASHIER và KITCHEN — xây dựng bằng **Next.js 16 App Router + React 19 + TailwindCSS 4**.

---

## 🛠️ Tech Stack

| Tầng | Công nghệ |
|---|---|
| Framework | **Next.js 16** (App Router) |
| Runtime UI | **React 19.2** |
| Ngôn ngữ | **TypeScript 5** |
| Styling | **TailwindCSS 4** |
| State | **Zustand 5** (`auth`, `cart`, `branch`, `header`, `search`) |
| Realtime | **Socket.IO Client 4.8** (qua `SocketContext`) |
| Icons | **Lucide React** |
| Charts | **Recharts 3** |
| QR Code | **qrcode.react** |
| i18n | `I18nProvider` + `useI18n()` hook (`context/i18nContext.tsx`) |
| Font | `Be Vietnam Pro` + `Geist Mono` + `Playfair Display` |

---

## 🗂️ Cấu Trúc Dự Án

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout: Fonts, Metadata
│   ├── page.tsx                # Root redirect → /login
│   ├── globals.css             # Global styles + TailwindCSS
│   ├── login/                  # Trang đăng nhập
│   ├── table/[tableId]/        # QR Menu (khách hàng quét mã)
│   ├── [tenantId]/             # Layout theo tenant
│   └── (main)/                 # Khu vực quản trị (auth required)
│       ├── layout.tsx          # Sidebar + Header layout
│       ├── dashboard/          # Tổng quan doanh thu & chỉ số
│       ├── menu/               # Quản lý thực đơn, modifier, danh mục
│       ├── orders/             # Đặt món tại quầy (POS OrderLineView)
│       ├── order-management/   # Quản lý đơn hàng live (OrderManagementView)
│       ├── cashier/            # POS / Thu ngân
│       ├── tables/             # Sơ đồ bàn + QR code
│       ├── inventory/          # Kho nguyên liệu (BOM)
│       ├── promotions/         # Voucher, chương trình khuyến mãi
│       ├── customers/          # Khách hàng thân thiết + loyalty
│       ├── staff/              # Quản lý nhân viên & RBAC
│       ├── history/            # Lịch sử giao dịch & Z-Report
│       ├── requests/           # Yêu cầu từ bàn (gọi phục vụ, đánh giá)
│       └── settings/           # Cài đặt tenant, branding, chi nhánh
├── components/                 # UI components dùng chung
│   ├── layout/                 # Sidebar, Header, Breadcrumb
│   ├── cashier/                # Components POS
│   ├── dashboard/              # Chart, stat cards
│   ├── floor/                  # Sơ đồ bàn
│   ├── history/                # Lịch sử đơn hàng
│   ├── inventory/              # Kho nguyên liệu
│   ├── menu/                   # Menu item, modifier, category
│   ├── order-management/       # Quản lý đơn hàng
│   ├── orders/                 # POS OrderLineView components
│   ├── payment/                # Thanh toán, QR
│   ├── promotions/             # Voucher, loyalty tier
│   ├── requests/               # Yêu cầu bàn
│   ├── settings/               # Cài đặt
│   ├── staff/                  # Nhân viên
│   └── tables/                 # Bàn + QR
├── context/
│   ├── SocketContext.tsx        # Socket.IO provider (realtime)
│   └── i18nContext.tsx          # i18n provider (đa ngôn ngữ)
├── stores/
│   ├── auth.store.ts            # Zustand: user, token, login/logout
│   ├── cart.store.ts            # Zustand: giỏ hàng POS
│   ├── branch.store.ts          # Zustand: chi nhánh đang chọn
│   ├── header.store.ts          # Zustand: tiêu đề trang động
│   └── search.store.ts          # Zustand: tìm kiếm global
├── lib/                         # API client, utilities
├── scripts/                     # Script kiểm tra (check-i18n.mjs)
├── public/                      # Static assets
├── .agents/                     # Ngữ cảnh cho AI Agent
├── .env.local                   # Biến môi trường (không commit)
├── .env.example                 # Template biến môi trường
├── next.config.ts
├── tailwind.config (trong postcss.config.mjs)
└── tsconfig.json
```

---

## 🗺️ Sơ Đồ Trang

| Đường dẫn | Vai trò | Mô tả |
|---|---|---|
| `/login` | Tất cả | Trang đăng nhập |
| `/(main)/dashboard` | ADMIN, MANAGER | Tổng quan doanh thu, biểu đồ Recharts |
| `/(main)/menu` | ADMIN, MANAGER | Quản lý thực đơn, modifier, danh mục |
| `/(main)/orders` | CASHIER, MANAGER | Đặt món tại quầy (POS OrderLineView) |
| `/(main)/order-management` | ADMIN, MANAGER, CASHIER | Quản lý đơn hàng live (PENDING / CONFIRMED / DONE) |
| `/(main)/cashier` | CASHIER | POS thanh toán tiền mặt / VietQR |
| `/(main)/tables` | CASHIER, MANAGER | Sơ đồ bàn, QR tại bàn |
| `/(main)/inventory` | MANAGER | Kho nguyên liệu, BOM, kiểm kê |
| `/(main)/promotions` | ADMIN | Voucher, khuyến mãi, loyalty tier |
| `/(main)/customers` | ADMIN, MANAGER | Khách hàng thân thiết |
| `/(main)/staff` | ADMIN, MANAGER | Nhân viên và phân quyền |
| `/(main)/history` | ADMIN, MANAGER | Lịch sử đơn, Z-Report |
| `/(main)/requests` | CASHIER, MANAGER | Yêu cầu từ bàn |
| `/(main)/settings` | ADMIN | Branding, chi nhánh, cài đặt |
| `/table/[tableId]` | Khách hàng | QR Menu tự gọi món (public) |

---

## 🚀 Khởi Chạy Nhanh

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Tạo file môi trường

```bash
cp .env.example .env.local
# Chỉnh sửa .env.local
```

Các biến môi trường:

| Biến | Ví dụ | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | URL Backend API |
| `PORT` | `3000` | Cổng Next.js (mặc định 3000) |

> ⚠️ **Lưu ý:** `NEXT_PUBLIC_API_URL` phải trỏ đúng địa chỉ IP/port của backend. Khi test đa thiết bị trên cùng mạng LAN, thay `localhost` bằng IP LAN máy chủ backend (ví dụ: `http://192.168.1.x:5000/api`).

### 3. Chạy Development Server

```bash
npm run dev
```

Ứng dụng chạy tại: `http://localhost:3000`

### 4. Build & Production

```bash
npm run build
npm start
```

---

## ⚡ Realtime — Socket.IO

`SocketContext.tsx` kết nối tự động tới backend Socket.IO khi đăng nhập. Client join room `branch:{branchId}` và lắng nghe các events:

- `order:new`, `order:updated`, `order:item:status` — Quản lý đơn tự refresh live
- `payment:completed` — POS đóng bàn tự động
- `table:status-changed` — Sơ đồ bàn cập nhật realtime
- `sold_out:updated` — Menu ẩn/hiện món hết hàng
- `session:closed` — Phiên bàn kết thúc

---

## 🔐 Auth Flow

1. Đăng nhập → `POST /api/auth/login` → nhận `accessToken`
2. `accessToken` lưu trong Zustand (`auth.store.ts`) — **không localStorage**
3. Tự động gọi `POST /api/auth/refresh` khi nhận 401
4. Logout → xóa token + gọi revoke API

---

## 🌐 i18n (Đa ngôn ngữ)

Dùng `I18nProvider` và hook `useI18n()`. Kiểm tra coverage:

```bash
npm run check:i18n
```

---

## 📦 Scripts

```bash
npm run dev          # Chạy dev server (Next.js)
npm run build        # Build production
npm start            # Chạy production build
npm run lint         # Kiểm tra ESLint
npm run check:i18n   # Kiểm tra i18n key coverage
```

---

## 🛠️ Development Workflow

### Branch Selection & Tenant Context
- `branch.store.ts` quản lý `selectedBranchId` (`ALL` = tất cả chi nhánh, hoặc ID cụ thể)
- Header `x-branch-id` tự động gửi kèm mọi API call (`api.ts:37`)
- Socket join room `branch:{selectedBranchId}` khi thay đổi chi nhánh

### Socket.IO Reconnection Logic
`SocketContext.tsx` tự reconnect khi:
- `token`, `tenantId`, `branchId`, `tableId` thay đổi
- Network disconnect → exponential backoff (1s → 5s max, 10 attempts)

### Adding New Pages
1. Tạo file trong `app/(main)/<feature>/page.tsx`
2. Import layout components từ `components/layout/`
3. Dùng `auth.store` cho role check: `user?.role === 'ADMIN'`
4. API calls qua `lib/api/*.api.ts` (tự inject token + branchId)

---

## 🔧 Common Issues & Fixes

| Issue | Nguyên nhân | Fix |
|-------|-------------|-----|
| `NETWORK_ERROR` API calls | Backend không chạy hoặc sai `NEXT_PUBLIC_API_URL` | Check backend port 5000/5001, `.env.local` trỏ đúng IP |
| 401 Unauthorized sau login | Access token hết hạn (15p) | Auto refresh qua `api.ts:50-52` (gọi `/api/auth/refresh`) |
| Socket không nhận real-time | `NEXT_PUBLIC_SOCKET_URL` sai hoặc backend không có Socket.IO | Check `.env.local`, backend log `⚡ [Socket.IO] Client connected` |
| Branch filter không hoạt động | `selected-branch-id` trong localStorage = `ALL` hoặc ID sai | DevTools → Application → LocalStorage → `selected-branch-id` |
| Build fail: `Module not found` | Import path sai (alias `@/*`) | Check `tsconfig.json` paths, restart dev server |

---

## 🌐 Multi-Device Development (LAN)

**Windows (Backend host):** IP = `192.168.x.x`
**Mac/Phone (Client):** Cập nhật `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://192.168.x.x:5000/api
NEXT_PUBLIC_SOCKET_URL=http://192.168.x.x:5000
```
Restart: `npm run dev`

> ⚠️ **Không dùng `localhost`** khi test đa thiết bị — backend bind `0.0.0.0:5000`, client dùng IP LAN máy host.

---

## ⚙️ Quy Tắc Phát Triển

1. **Không dùng `localStorage`** để lưu access token — chỉ dùng Zustand in-memory.
2. **Mọi API call** phải thêm header `Authorization: Bearer <token>` từ `auth.store`.
3. **TailwindCSS 4** — Dark mode mặc định `bg-zinc-950` cho Admin & POS.
4. **Icons:** Chỉ dùng `lucide-react` — không dùng thư viện icon khác.
5. **State:** Dùng Zustand stores đã có (`auth`, `cart`, `branch`...) — không tạo thêm context Redux.
