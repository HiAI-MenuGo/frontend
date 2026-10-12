# HiAI-MenuGo Frontend — Tech Stack & Dependencies (TECHS)

> **Góc nhìn Frontend (Web):** Tài liệu công nghệ chi tiết, phiên bản thư viện, cấu hình TailwindCSS, Zustand stores, Socket.IO Client và môi trường vận hành dành riêng cho repo `frontend/`.
>
> - 🧭 Index & Cấu trúc repo: [AGENTS.md](./AGENTS.md)
> - 📖 Nghiệp vụ: [BUSINESS.md](./BUSINESS.md)
> - ⛔ Luật bắt buộc: [RULES.md](./RULES.md)
> - 🎨 Mastery Skills: [SKILLS.md](./SKILLS.md)

---

## 1. Core Stack & Framework

| Thành phần | Công nghệ / Phiên bản | Vai trò & Mục đích |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React framework hỗ trợ SSR, streaming và Server Components |
| **Giao diện** | React 19 | UI core library |
| **Ngôn ngữ** | TypeScript 5 | Type checking & strict interfaces |
| **Styling** | TailwindCSS 4 | Utility-first CSS, dark mode mặc định `bg-zinc-950` |
| **Icons** | `lucide-react` | Bộ icon duy nhất toàn hệ thống |
| **State** | Zustand 5 | Quản lý state toàn cục (Auth, Branch, Cart, Search, Header) |
| **Realtime** | `socket.io-client` 4.8 | Kết nối realtime với backend qua SocketContext |
| **Biểu đồ** | `recharts` 2.15 | Vẽ đồ thị doanh thu, phân tích xu hướng |
| **Mã QR** | `qrcode.react` 4.2 | Tạo mã QR động cho bàn ăn và thanh toán VietQR |

---

## 2. Port & Cấu Hình Mạng

- **Cổng chạy dev:** `PORT=3000` (khởi chạy qua Turbopack: `next dev --turbopack -p 3000`).
- **Kết nối Backend:**
  - Localhost: `http://localhost:5000/api`
  - Multi-Device LAN (WiFi): `http://192.168.x.x:5000/api`

---

## 3. Hệ Thống State Management (Zustand Stores)

Các store được tổ chức tập trung trong thư mục `stores/`:

| Store | Đường dẫn | Trách nhiệm |
|---|---|---|
| `auth.store.ts` | `stores/auth.store.ts` | Lưu `user`, `token`, quyền `role`, hàm `login`/`logout` |
| `branch.store.ts` | `stores/branch.store.ts` | Chi nhánh đang chọn (`selectedBranchId`), danh sách chi nhánh |
| `cart.store.ts` | `stores/cart.store.ts` | Giỏ hàng POS chọn món, tính tổng tiền, phụ thu |
| `header.store.ts` | `stores/header.store.ts` | Tiêu đề trang động và Breadcrumb hiển thị trên Topbar |
| `search.store.ts` | `stores/search.store.ts` | Từ khóa tìm kiếm toàn cục (`query`) |

---

## 4. Danh Sách Biến Môi Trường (`.env.local`)

```env
# URL API Backend Express
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# URL Socket.IO Server
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Cổng khởi chạy frontend
PORT=3000
```

> **Khi kiểm thử trên mạng LAN:** Đổi `localhost` thành địa chỉ IP nội bộ của máy chủ (ví dụ `http://192.168.1.50:5000`).

---

## 5. Cấu Hình Styling (TailwindCSS 4)

- Khởi tạo qua file `postcss.config.mjs` với `@tailwindcss/postcss`.
- Hệ màu và font chữ được cấu hình trong `globals.css` và `app/layout.tsx`:
  - **Màu thương hiệu (Primary):** `#00A389` (Teal / Mint)
  - **Nền Dark Mode:** `bg-zinc-950`
  - **Khối Card & Surface:** `bg-zinc-900 border-zinc-800`
  - **Chữ chính:** `text-zinc-50`, Chữ phụ: `text-zinc-400`
  - **Fonts:** `Be Vietnam Pro`, `Geist Mono`, `Playfair Display`

---

## 6. Scripts Vận Hành

```bash
npm run dev          # Khởi động máy chủ phát triển Turbopack (cổng 3000)
npm run build        # Build bản phát hành production và kiểm tra lỗi TypeScript
npm run start        # Chạy server production sau khi build
npm run lint         # Quét lỗi cú pháp ESLint
npm run check:i18n   # Kiểm tra độ phủ các khóa ngôn ngữ tiếng Việt & tiếng Anh
```
