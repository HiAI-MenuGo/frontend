# Frontend - Hệ thống điều hướng Code (HiAI-MenuGo Web)

## Tổng quan
Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Zustand + Socket.IO Client. Quản lý nhà hàng: Dashboard, Bàn, Menu, Order, Cashier, Inventory, Staff, Settings.

---

## Cấu trúc thư mục thực tế

```
frontend/
├── src/
│   ├── app/                      # App Router pages
│   │   ├── layout.tsx            # Root layout + fonts + I18nProvider
│   │   ├── page.tsx              # Redirect -> /dashboard
│   │   ├── globals.css           # Global styles + Tailwind v4
│   │   ├── login/page.tsx        # Login page
│   │   ├── dashboard/            # Dashboard (tổng quan)
│   │   ├── (main)/               # Route group chính (có sidebar)
│   │   │   ├── layout.tsx        # Main layout với Sidebar + Header
│   │   │   ├── tables/page.tsx   # Quản lý bàn
│   │   │   ├── inventory/page.tsx # Kiểm kho
│   │   │   ├── staff/page.tsx    # Quản lý nhân viên
│   │   │   └── ...               # Các trang khác
│   │   └── table/[tableId]/      # Public menu tại bàn (khách đặt món)
│   │       ├── page.tsx          # Menu page
│   │       ├── menu/page.tsx
│   │       ├── payment/page.tsx  # Thanh toán
│   │       └── hooks/useMenuSoldOut.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   └── Header.tsx        # Top header
│   │   ├── dashboard/
│   │   │   └── DashboardView.tsx
│   │   ├── tables/
│   │   │   ├── ManageTableView.tsx
│   │   │   └── TableQRModal.tsx
│   │   ├── menu/
│   │   │   ├── ManageDishesView.tsx
│   │   │   └── AddDishModal.tsx
│   │   ├── cashier/
│   │   │   └── CashierView.tsx
│   │   ├── customers/
│   │   │   └── CustomersView.tsx
│   │   ├── orders/
│   │   │   ├── OrderLineView.tsx
│   │   │   └── ItemOptionsModal.tsx
│   │   ├── history/
│   │   │   └── OrderHistoryView.tsx
│   │   ├── inventory/
│   │   │   └── InventoryView.tsx
│   │   ├── staff/
│   │   │   └── StaffView.tsx
│   │   ├── settings/
│   │   │   └── SettingsView.tsx
│   │   ├── payment/
│   │   │   ├── VietQRModal.tsx
│   │   │   └── BillPrintModal.tsx
│   │   ├── order-management/
│   │   │   └── OrderManagementView.tsx
│   │   ├── floor/
│   │   │   └── TableQRCode.tsx
│   │   └── common/
│   │       └── LanguageSwitcher.tsx
│   ├── lib/
│   │   ├── api.ts                # Axios instance + interceptors
│   │   ├── format.ts             # Format currency, date, etc.
│   │   ├── format-note.tsx       # Format note component
│   │   ├── socket.ts             # Socket.IO client singleton
│   │   └── api/                  # API endpoints theo domain
│   │       ├── auth.api.ts
│   │       ├── users.api.ts
│   │       ├── branches.api.ts
│   │       ├── tables.api.ts
│   │       ├── menu.api.ts
│   │       ├── ingredients.api.ts
│   │       ├── orders.api.ts
│   │       ├── sessions.api.ts
│   │       ├── customers.api.ts
│   │       ├── branding.api.ts
│   │       ├── analytics.api.ts
│   │       └── types.ts          # Shared API types
│   ├── context/
│   │   └── i18nContext.tsx       # i18n provider (vi/en)
│   ├── stores/                   # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── cart.store.ts
│   │   ├── header.store.ts
│   │   └── search.store.ts
│   ├── lib/i18n/locales/
│   │   ├── vi.json
│   │   └── en.json
│   └── types/                    # (nếu có, hoặc dùng từ lib/api/types.ts)
├── public/
│   ├── images/
│   ├── sounds/                   # new_order.wav
│   └── *.svg
├── scripts/
│   └── check-i18n.mjs
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts (v4 dùng CSS)
├── postcss.config.mjs
├── eslint.config.mjs
├── .env / .env.local / .env.example
└── README.md
```

---

## Tìm file nhanh (theo chức năng)

| Cần tìm | File/Thư mục |
|---------|-------------|
| Entry point | `src/app/layout.tsx`, `src/app/page.tsx` |
| Routing & Layout chính | `src/app/(main)/layout.tsx` |
| Sidebar/Navigation | `src/components/layout/Sidebar.tsx` |
| Header | `src/components/layout/Header.tsx` |
| Login | `src/app/login/page.tsx` |
| Dashboard | `src/components/dashboard/DashboardView.tsx` |
| Quản lý bàn | `src/components/tables/ManageTableView.tsx`, `TableQRModal.tsx` |
| Menu (CRUD món) | `src/components/menu/ManageDishesView.tsx`, `AddDishModal.tsx` |
| Thu ngân (Cashier) | `src/components/cashier/CashierView.tsx` |
| Khách hàng | `src/components/customers/CustomersView.tsx` |
| Order/Đơn hàng | `src/components/orders/OrderLineView.tsx`, `ItemOptionsModal.tsx`, `OrderManagementView.tsx` |
| Lịch sử đơn | `src/components/history/OrderHistoryView.tsx` |
| Kho/Nguyên liệu | `src/components/inventory/InventoryView.tsx` |
| Nhân viên | `src/components/staff/StaffView.tsx` |
| Settings | `src/components/settings/SettingsView.tsx` |
| Thanh toán (VietQR, In bill) | `src/components/payment/VietQRModal.tsx`, `BillPrintModal.tsx` |
| Public menu (khách đặt bàn) | `src/app/table/[tableId]/` |
| API calls (Axios) | `src/lib/api.ts`, `src/lib/api/*.api.ts` |
| Socket.IO realtime | `src/lib/socket.ts` |
| State global (Zustand) | `src/stores/*.store.ts` |
| i18n (vi/en) | `src/context/i18nContext.tsx`, `src/lib/i18n/locales/` |
| Format helpers | `src/lib/format.ts`, `format-note.tsx` |
| Types API | `src/lib/api/types.ts` |

---

## Patterns tìm code (ripgrep)

```bash
# Tìm component (page/component)
rg "export default function\|export const.*=.*=>" src/components/ src/app/

# Tìm page route
rg "export default function" src/app/ --include="*.tsx" | grep -v layout

# Tìm API call
rg "api\.\w+" src/lib/api/ src/components/

# Tìm Zustand store
rg "createStore\|useStore" src/stores/

# Tìm Socket.IO event
rg "socket\.on\|socket\.emit" src/lib/socket.ts src/components/

# Tìm type/interface
rg "interface\|type " src/ --include="*.ts" --include="*.tsx"

# Tìm translation key
rg "t\(" src/ --include="*.tsx"

# Tìm format currency/date
rg "formatCurrency\|formatDate" src/lib/format.ts

# Tìm component theo tên
rg "ManageDishesView\|CashierView\|OrderLineView" src/components/
```

---

## Scripts quan trọng (package.json)

```bash
npm run dev        # Next.js dev server (Turbopack)
npm run build      # Build production
npm start          # Chạy production
npm run lint       # ESLint
npm run check:i18n # Kiểm tra i18n keys
```

---

## File quan trọng phải đọc trước
1. `README.md` - Tổng quan
2. `src/app/layout.tsx` - Root layout, fonts, I18nProvider
3. `src/app/(main)/layout.tsx` - Main layout với Sidebar + Header
4. `src/lib/api.ts` - Axios config, interceptors (auth, error handling)
5. `src/lib/api/types.ts` - Type definitions cho API response
6. `src/stores/auth.store.ts` - Auth state management
7. `src/context/i18nContext.tsx` - i18n setup
8. `src/lib/socket.ts` - Socket.IO client setup
9. `next.config.ts` - Next.js config
10. `.env.example` - Biến môi trường