# Frontend System Design — HiAI-MenuGo Web

## 1. Architecture Overview

**Web Admin Dashboard, POS, KDS & QR Menu** cho F&B multi-tenant.
- **Framework:** Next.js 16 App Router + React 19 + TypeScript 5
- **Styling:** TailwindCSS 4 (dark mode default `bg-zinc-950`)
- **State:** Zustand 5 (`auth`, `branch`, `cart`, `header`, `search`)
- **Realtime:** Socket.IO Client 4.8 (via `SocketContext`)
- **Charts:** Recharts 3
- **Icons:** Lucide React only
- **i18n:** `I18nProvider` + `useI18n()` (vi/en)
- **Port:** 3000 — **không tự đổi**

---

## 2. Routing Structure (Actual — from `app/` folder)

```
app/
├── layout.tsx                              # Root: fonts, metadata, I18nProvider
├── page.tsx                                # Redirect → /login
├── globals.css                             # Tailwind v4 + global styles
├── login/page.tsx                          # Public login
├── table/[tableId]/                        # QR Menu (public, no auth)
│   ├── page.tsx                            # Menu display
│   ├── menu/page.tsx                       # Category browsing
│   └── order-status/page.tsx               # Guest order status
├── [tenantId]/[branchId]/table/[tableId]/  # Tenant-scoped QR (future)
│   ├── page.tsx
│   ├── menu/page.tsx
│   └── order-status/page.tsx
└── (main)/                                 # Authenticated area (Sidebar + Header)
    ├── layout.tsx                          # MainLayout + SocketProvider
    ├── dashboard/page.tsx                  # ADMIN, MANAGER — KPIs, Recharts
    ├── menu/page.tsx                       # ADMIN, MANAGER — CRUD món, modifier, category
    ├── orders/page.tsx                     # KITCHEN — KDS realtime
    ├── order-management/page.tsx           # ADMIN, MANAGER — Filter/order list
    ├── cashier/page.tsx                    # CASHIER — POS (cash + VietQR)
    ├── tables/page.tsx                     # CASHIER, MANAGER — Floor map + QR
    ├── inventory/page.tsx                  # MANAGER — Kho, BOM, kiểm kê
    ├── promotions/page.tsx                 # ADMIN — Voucher, loyalty tier
    ├── customers/page.tsx                  # ADMIN, MANAGER — Khách hàng thân thiết
    ├── staff/page.tsx                      # ADMIN, MANAGER — Nhân viên + RBAC
    ├── history/page.tsx                    # ADMIN, MANAGER — Lịch sử, Z-Report
    ├── requests/page.tsx                   # CASHIER, MANAGER — Yêu cầu bàn
    └── settings/page.tsx                   # ADMIN — Branding, branch, config
```

---

## 3. State Management (Zustand)

### Stores
| Store | Path | Responsibility |
|-------|------|----------------|
| `auth.store.ts` | `stores/auth.store.ts` | User, token, login/logout, initialize from localStorage |
| `branch.store.ts` | `stores/branch.store.ts` | Selected branch (`ALL` or ID), branch list |
| `cart.store.ts` | `stores/cart.store.ts` | POS cart items, composite key |
| `header.store.ts` | `stores/header.store.ts` | Dynamic page title/breadcrumb |
| `search.store.ts` | `stores/search.store.ts` | Global search state |

### Rules
- **Never** use `localStorage` directly for access token — only `auth.store`
- **Never** create new Context/Redux — use existing stores
- Selectors: `useAuthStore(s => s.user)` (prevents re-renders)

---

## 4. API Client (`lib/api.ts`)

### Automatic Headers
```typescript
// Auto-injected per request:
Authorization: Bearer <token>        // from auth.store
x-branch-id: <selectedBranchId>      // from branch.store (ALL = no filter)
```

### Error Handling
- 401 → auto-clear token + redirect `/login?expired=1` (except `/login`)
- Network error → `{ success: false, errorCode: 'NETWORK_ERROR', message }`
- **Always** check `res.success` before using `res.data`

### Usage
```typescript
import apiFetch from '@/lib/api';
import { fetchBranches } from '@/lib/api/branches.api';

// Direct
const res = await apiFetch<Branch[]>('/branches');

// Typed (preferred)
const branches = await fetchBranches();
```

---

## 5. Socket.IO Realtime (`context/SocketContext.tsx`)

### Provider
```tsx
<SocketProvider config={{ tableId: 'optional-for-qr' }}>
  {children}
</SocketProvider>
```

### Connection Logic
- Auto-connect on mount (once)
- Reconnects when: `token`, `tenantId`, `branchId`, `tableId` change
- Exponential backoff: 1s → 5s max, 10 attempts
- Joins room: `branch:{selectedBranchId}` (or tenant room if `ALL`)

### Usage
```typescript
const { on, off, emit, isConnected } = useSocket();

useEffect(() => {
  const cleanup = on('order:new', handleNewOrder);
  return cleanup;
}, [on]);
```

### Events (match backend `SOCKET_EVENTS`)
- `order:new`, `order:updated`, `order:item-status` — KDS
- `payment:completed` — Cashier auto-close
- `table:status-changed` — Floor plan
- `sold_out:updated` — Menu availability
- `session:closed` — Table session end
- `call_staff:request`, `review:new` — Guest requests
- `notification:new` — Notifications
- `menu_item:deleted` — Menu changes

---

## 6. Authentication Flow

### Login
1. `POST /api/auth/login` → `{ user, accessToken, refreshToken }`
2. `auth.store.setAuth(user, accessToken)` → persists to localStorage
3. `SocketProvider` auto-reconnects with new token

### Token Refresh
- `apiFetch` catches 401 → calls `/api/auth/refresh` (HttpOnly cookie) → retries
- If refresh fails → logout + redirect

### Logout
- `POST /api/auth/logout` (revokes refresh token)
- Clear localStorage + Zustand state

### Role-Based Access
```typescript
const { user } = useAuthStore();
const isAdmin = user?.role === 'ADMIN' || user?.role === 'PLATFORM_ADMIN';
const isCashier = user?.role === 'CASHIER';
// Conditional render or redirect
```

---

## 7. Branch & Tenant Context

### Branch Selection
- `branch.store.selectedBranchId`: `'ALL'` (default) or branch UUID
- Persisted in `localStorage.selected-branch-id`
- Header `x-branch-id` sent with **every** API request
- Socket room: `branch:{selectedBranchId}` (or `tenant:{tenantId}` if `ALL`)

### Changing Branch
```typescript
const { setBranchId } = useBranchStore();
setBranchId(branchId); // Triggers Socket reconnect + API refetch
```

---

## 8. QR Menu (Public Pages)

### Route: `/table/[tableId]`
- No auth required
- `SocketProvider config={{ tableId }}` → joins `table:{tableId}` room
- Guest role: read-only menu, create session/order, call staff, submit review

---

## 9. Styling (TailwindCSS 4)

### Theme
- Dark mode default: `bg-zinc-950` / `text-zinc-50`
- Primary: `#00A389` (teal) — configured in `globals.css`
- **No** arbitrary hex — use Tailwind classes or CSS variables

### Patterns
```tsx
// Layout
<div className="flex h-screen bg-zinc-950">
  <aside className="w-64 bg-zinc-900 border-r border-zinc-800" />
  <main className="flex-1 overflow-auto p-6" />
</div>

// Card
<div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6" />

// Button Primary
<button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition" />

// Input
<input className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
```

### Responsive
- Mobile-first: base + `md:`, `lg:`, `xl:`
- Sidebar: collapsed on `< lg` (hamburger in Header)

---

## 10. i18n (Internationalization)

### Usage
```tsx
import { useI18n } from '@/context/i18nContext';
const { t } = useI18n();
return <span>{t('common.save')}</span>;
```

### Rules
- Keys: `feature.action` (e.g., `menu.create`, `order.payment.success`)
- JSON: `lib/i18n/locales/{vi,en}.json`
- Check: `npm run check:i18n`
- **No** hardcoded Vietnamese strings in components

---

## 11. Common Patterns

### Client Component Data Fetching
```tsx
'use client';
import { useEffect, useState } from 'react';
import { fetchBranches } from '@/lib/api/branches.api';

export function BranchSelector() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches().then(data => { setBranches(data); setLoading(false); });
  }, []);

  if (loading) return <Skeleton />;
  return <select>{branches.map(b => <option key={b.id}>{b.name}</option>)}</select>;
}
```

### Server Components (Default)
- Use `async` components + `fetch` for SEO/initial load
- No `use client` unless interactivity needed

---

## 12. Environment Variables

### `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
PORT=3000
```

### Multi-Device (LAN)
- Backend host IP: `192.168.x.x`
- Client `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://192.168.x.x:5000/api
NEXT_PUBLIC_SOCKET_URL=http://192.168.x.x:5000
```

---

## 13. File Navigation Quick Reference

| Need | File |
|------|------|
| Root layout | `src/app/layout.tsx` |
| Main layout (Sidebar+Header) | `src/app/(main)/layout.tsx` |
| API client + interceptors | `src/lib/api.ts` |
| API types | `src/lib/api/types.ts` |
| Auth store | `src/stores/auth.store.ts` |
| Branch store | `src/stores/branch.store.ts` |
| Socket.IO | `src/lib/socket.ts`, `src/context/SocketContext.tsx` |
| i18n | `src/context/i18nContext.tsx` |
| Sidebar | `src/components/layout/Sidebar.tsx` |
| Header | `src/components/layout/Header.tsx` |

---

## 14. Quality Gates (Pre-push)

```bash
npm run build        # Production build (checks types)
npm run lint         # ESLint
npm run check:i18n   # i18n key coverage
```

---

## 15. Forbidden Patterns

| ❌ Forbidden | ✅ Use Instead |
|-------------|----------------|
| `localStorage.setItem('token', ...)` | `auth.store.setAuth()` |
| `fetch('/api/...')` raw | `apiFetch()` or typed `*.api.ts` |
| `io('http://localhost:5000')` raw | `useSocket()` from `SocketContext` |
| Hardcoded colors (`#FF5733`) | Tailwind classes / CSS variables |
| Hardcoded strings (`"Lưu"`) | `t('common.save')` |
| New Zustand store | Existing stores (`auth`, `branch`, `cart`) |
| React Navigation / Expo Router | Next.js App Router (file-based) |