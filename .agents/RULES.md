# Frontend Rules — HiAI-MenuGo Web

## 1. Architecture & Code Organization

### App Router Structure
```
app/
├── layout.tsx              # Root: fonts, metadata, providers
├── page.tsx                # Redirect → /login
├── login/page.tsx          # Public login
├── table/[tableId]/page.tsx # QR Menu (public, no auth)
├── [tenantId]/             # Tenant-scoped (future SaaS)
└── (main)/                 # Authenticated area
    ├── layout.tsx          # Sidebar + Header + SocketProvider
    ├── dashboard/
    ├── menu/
    ├── orders/             # Đặt món (POS Order Line)
    ├── order-management/   # Quản lý đơn hàng live
    ├── cashier/            # Thu ngân & thanh toán
    ├── tables/
    ├── inventory/
    ├── promotions/
    ├── customers/
    ├── staff/
    ├── history/
    ├── requests/
    └── settings/
```

### Component Organization
- `components/layout/` — Sidebar, Header, Breadcrumb (shared shell)
- `components/<feature>/` — Feature-specific UI (cashier, dashboard, floor, etc.)
- **No** `components/ui/` generic library — build per feature, extract when reused 3+ times.

---

## 2. State Management (Zustand)

### Stores (Single Source of Truth)
| Store | Path | Responsibility |
|-------|------|----------------|
| `auth.store.ts` | `stores/auth.store.ts` | User, token, login/logout, initialize from localStorage |
| `branch.store.ts` | `stores/branch.store.ts` | Selected branch (`ALL` or ID), branch list |
| `cart.store.ts` | `stores/cart.store.ts` | POS cart items, composite key |
| `header.store.ts` | `stores/header.store.ts` | Dynamic page title/breadcrumb |
| `search.store.ts` | `stores/search.store.ts` | Global search state |

### Rules
- **Never** use `localStorage` directly for access token — only `auth.store` (in-memory + persisted).
- **Never** create new Context/Redux for global state — use existing stores.
- Selectors: `useAuthStore(s => s.user)` not `useAuthStore()` (prevents re-renders).
- Actions: `useAuthStore(s => s.login)` — stable references.

---

## 3. API Client (`lib/api.ts`)

### Usage
```typescript
import apiFetch from '@/lib/api';
import { fetchBranches } from '@/lib/api/branches.api';

// Direct (auto-injects token + x-branch-id)
const res = await apiFetch<Branch[]>('/branches');

// Via typed API (preferred)
const branches = await fetchBranches();
```

### Automatic Headers
- `Authorization: Bearer <token>` from `auth.store`
- `x-branch-id: <selectedBranchId>` from `branch.store` (`ALL` = no filter)

### Error Handling
- 401 → auto-clear token + redirect `/login?expired=1` (except `/login` page).
- Network error → `{ success: false, errorCode: 'NETWORK_ERROR', message }`.
- **Always** check `res.success` before using `res.data`.

---

## 4. Socket.IO (`context/SocketContext.tsx`)

### Provider Setup
```tsx
<SocketProvider config={{ tableId: 'optional-for-qr' }}>
  {children}
</SocketProvider>
```

### Connection Logic
- Auto-connect on mount (once).
- Reconnects when: `token`, `tenantId`, `branchId`, `tableId` change.
- Exponential backoff: 1s → 5s max, 10 attempts.
- Joins room: `branch:{selectedBranchId}` (or `ALL` → tenant room).

### Usage in Components
```typescript
const { on, off, emit, isConnected } = useSocket();

useEffect(() => {
  const cleanup = on('order:new', handleNewOrder);
  return cleanup;
}, [on]);
```

### Events (match backend `SOCKET_EVENTS`)
- `order:new`, `order:updated`, `order:item:status` — Quản lý đơn hàng live
- `payment:completed` — Cashier auto-close
- `table:status-changed` — Floor plan
- `sold_out:updated` — Menu availability
- `session:closed` — Table session end
- `call_staff:request`, `review:new` — Guest requests

---

## 5. Authentication Flow

### Login
1. `POST /api/auth/login` → `{ user, accessToken, refreshToken }`
2. `auth.store.setAuth(user, accessToken)` → persists to localStorage.
3. `SocketProvider` auto-reconnects with new token.

### Token Refresh
- `apiFetch` catches 401 → calls `/api/auth/refresh` (HttpOnly cookie) → retries original request.
- If refresh fails → logout + redirect.

### Logout
- `POST /api/auth/logout` (revokes refresh token).
- Clear localStorage + Zustand state.

### Role-Based Access
```typescript
const { user } = useAuthStore();
const isAdmin = user?.role === 'ADMIN' || user?.role === 'PLATFORM_ADMIN';
const isCashier = user?.role === 'CASHIER';
// Render conditionally or redirect
```

---

## 6. Branch & Tenant Context

### Branch Selection
- `branch.store.selectedBranchId`: `'ALL'` (default) or branch UUID.
- Persisted in `localStorage.selected-branch-id`.
- Header `x-branch-id` sent with **every** API request.
- Socket room: `branch:{selectedBranchId}` (or `tenant:{tenantId}` if `ALL`).

### Changing Branch
```typescript
const { setBranchId } = useBranchStore();
setBranchId(branchId); // Triggers Socket reconnect + API refetch
```

---

## 7. Styling (TailwindCSS 4)

### Theme
- Dark mode default: `bg-zinc-950` / `text-zinc-50`.
- Primary: `#00A389` (teal), configured in `globals.css` / Tailwind config.
- **No** arbitrary hex colors — use Tailwind classes or CSS variables.

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
- Mobile-first: base classes + `md:`, `lg:`, `xl:` prefixes.
- Sidebar: collapsed on `< lg` (hamburger menu in Header).

---

## 8. i18n (Internationalization)

### Usage
```tsx
import { useI18n } from '@/context/i18nContext';

const { t } = useI18n();
return <span>{t('common.save')}</span>;
```

### Rules
- Keys: `feature.action` (e.g., `menu.create`, `order.payment.success`).
- JSON files: `lib/i18n/locales/{vi,en}.json`.
- Check coverage: `npm run check:i18n`.
- **No** hardcoded Vietnamese strings in components.

---

## 9. QR Menu (Public Pages)

### Route: `/table/[tableId]`
- No auth required.
- `SocketProvider config={{ tableId }}` → joins `table:{tableId}` room.
- Guest role: read-only menu, create session/order, call staff, submit review.

---

## 10. Common Patterns

### Data Fetching (Client Components)
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
- Use `async` components + `fetch` (or Prisma directly if needed) for SEO/initial load.
- No `use client` unless interactivity needed.

### Form Handling
- `react-hook-form` + Zod resolver (when forms complex).
- Simple forms: controlled inputs + `onSubmit` handler.

---

## 11. Environment Variables

`.env.local`:
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

## 12. Quality & Build

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build (checks types)
npm run lint         # ESLint
npm run check:i18n   # i18n key coverage
```

### Pre-commit Checks
- `npm run build` passes (no TypeScript errors).
- `npm run lint` passes.
- No `console.log` in production (use `logger` or remove).
- No `any` — proper types from `lib/api/types.ts`.

---

## 13. Forbidden Patterns

| ❌ Forbidden | ✅ Use Instead |
|-------------|----------------|
| `localStorage.setItem('token', ...)` | `auth.store.setAuth()` |
| `fetch('/api/...')` raw | `apiFetch()` or typed `*.api.ts` |
| `io('http://localhost:5000')` raw | `useSocket()` from `SocketContext` |
| Hardcoded colors (`#FF5733`) | Tailwind classes / CSS variables |
| Hardcoded strings (`"Lưu"`) | `t('common.save')` |
| New Zustand store for feature | Existing stores (`auth`, `branch`, `cart`) |
| React Navigation / Expo Router | Next.js App Router (file-based) |

---

## 14. Debugging Tips

- **Socket not connecting**: Check `NEXT_PUBLIC_SOCKET_URL`, backend logs `⚡ [Socket.IO] Client connected`.
- **Branch filter not working**: DevTools → Application → LocalStorage → `selected-branch-id`.
- **401 after login**: Check `auth.store` token, cookie `refreshToken` in DevTools.
- **Build fails `@/*` import**: Restart dev server, check `tsconfig.json` paths.
- **Styles not applying**: Tailwind content paths in `postcss.config.mjs` / `next.config.ts`.