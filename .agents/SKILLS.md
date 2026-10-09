# HiAI-MenuGo — Design System, UI/UX Standards & Mastery Guide

> Cẩm nang quy chuẩn toàn diện về kiến trúc giao diện, hệ thống Design Tokens, trải nghiệm người dùng (UI/UX) và các pattern hiển thị đặc thù cho cả **Mobile App** và **Web Frontend** của **HiAI-MenuGo**.
>
> - 📖 Nghiệp vụ: [BUSINESS.md](./BUSINESS.md) · 🏗️ Stack: [TECHS.md](./TECHS.md)
> - ⛔ Luật cấm: [RULES.md](./RULES.md) · 🧭 Index: [AGENTS.md](./AGENTS.md)

---

## 1. Bản Đồ Màu Sắc & Tâm Lý Học Bề Mặt Nền (Color & Mood Engineering)

Màu sắc trong F&B không chỉ để trang trí mà là công cụ trực tiếp kích thích cảm giác ngon miệng và điều hướng tâm lý khách hàng:

### A. Quy luật bề mặt nền (Background Surface Dynamics)
- **Hệ thống Web POS & Restaurant Management (Tasty Station / HiAI-MenuGo Light Mode):**
  - Nền Canvas tổng thể: `#F4F6F8` / `#F8FAFC` — tạo cảm giác sạch sẽ, thoáng đãng và đẳng cấp.
  - Thẻ thông tin (Cards) & Bảng điều khiển: Nền trắng `#FFFFFF`, bo tròn lớn `rounded-[20px]` đến `rounded-[24px]`, viền nhẹ `#E2E8F0` / `#F1F5F9`, bóng đổ tinh tế `shadow-[0_2px_12px_rgba(15,23,42,0.04)]`.
  - Tách biệt rõ ràng 3 phân vùng thao tác: Sidebar điều hướng (trái), Khu vực tác vụ / Lưới thực đơn (giữa), Bảng Order Ticket / Chi tiết bàn (phải).

### B. Bảng màu chuẩn Tasty Station x HiAI-MenuGo
| Sắc thái | Mã Hex chuẩn | Ứng dụng cụ thể trong hệ thống |
|---|---|---|
| **Mint / Teal Chủ Đạo** | `#00A389` / `#0D9488` | Logo, Nút CTA chính ("Place Order", "+ Add"), Tab đang chọn, Bàn Available |
| **Mint Tint Nhạt** | `#E6F7F4` / `#ECFDF5` | Nền Badge "In Kitchen", Nền Tab active, Nền Bàn trống (Available) |
| **Coral / Cam Đào** | `#FF7A59` / `#F97316` | Trạng thái "Wait List", Bàn đang ăn "On Dine", Ghế cam, Đơn hàng gấp |
| **Coral Tint Nhạt** | `#FFEDD5` / `#FFF7ED` | Nền thẻ đơn "Wait List", Nền thẻ bàn "On Dine", Tag món đặc biệt |
| **Lavender / Tím Nhạt** | `#A855F7` / `#9333EA` | Trạng thái đơn "Ready" (Đã xong), Badge món tráng miệng / Special |
| **Lavender Tint** | `#F3E8FF` / `#FAF5FF` | Nền thẻ đơn "Ready", Thẻ danh mục món ngọt Desserts |
| **Slate Tối (Chữ Chính)** | `#0F172A` / `#1E293B` | Tiêu đề, Tên món, Giá tiền, Mã đơn hàng, Tên bàn |
| **Slate Trung Tính (Phụ)**| `#64748B` / `#94A3B8` | Danh mục phụ, Thời gian, Số ghế, Chú thích |
| **Nền Canvas** | `#F4F6F8` / `#F8FAFC` | Nền toàn trang, Nền ô tìm kiếm, Nền nút phụ |

---

## 2. Nhịp Điệu Chữ & Nghệ Thuật Ghép Đôi Font (Typography Hierarchy)

Bộ font được cấu hình trong `app/layout.tsx` và ứng dụng di động:
- **Font không chân hiện đại (`Be Vietnam Pro`, `Geist Mono`, `System Sans`):**
  - Dùng cho: Toàn bộ thông số giá tiền, nhãn nút bấm, bảng định lượng kho, mã đơn, số lượng món.
  - Tác dụng: Quét mắt cực nhanh (Scannability) ở kích thước nhỏ (11px - 14px) trên màn hình cảm ứng di động.
- **Font có chân cổ điển (`Playfair Display`, `Serif`):**
  - Dùng cho: Tên thương hiệu nhà hàng, lời chào trên trang chủ (*"Thực Đơn Tinh Hoa"*), danh mục món cao cấp.
  - Tác dụng: Tôn vinh đẳng cấp không gian ẩm thực.

### 3 Cặp tương phản kinh điển trên giao diện thực đơn:
1. **Tên món to đậm + Mô tả nguyên liệu mảnh nhẹ:** `Trà Đào Cam Sả` (Font-bold 15px) đi kèm *Đào miếng ngâm giòn, sả tươi và cam vàng* (Font-normal 12px, xám nhạt).
2. **Giá tiền nổi bật + Đơn vị tính:** `45.000` (Extrabold 16px, `primaryDark`) đi kèm `đ` (Regular 11px).
3. **Món chính + Tùy chọn đi kèm:** Tên món màu chữ đậm, dòng tùy chọn size/đá/đường thụt đầu dòng màu cam/xanh dịu mắt.

---

## 3. Ngôn Ngữ Hình Học 4 Cấp Độ & Hiệu Ứng Chiều Sâu (Geometry & Depth)

| Cấp độ | Bo góc `borderRadius` | Đối tượng áp dụng | Mục đích tâm lý |
|---|---|---|---|
| **Pill (Viên thuốc)** | `999px` | Nút CTA ("Gọi món", "Xem giỏ"), thanh tìm kiếm, bộ đếm số lượng `- 1 +`, tag danh mục | Mềm mại, mời gọi đầu ngón tay chạm vào |
| **Large Sheet Top** | `28px - 36px` | Mép trên của Bottom Sheet, Modal chọn Size/Topping | Tạo ranh giới êm ái khi vuốt từ dưới màn hình lên |
| **Container Card** | `16px - 20px` | Card món ăn, Card bàn ăn, Khối thông tin doanh thu | Ôm trọn nội dung ngăn nắp, tách bạch rõ ràng |
| **Action Tile / Square** | `10px - 14px` | Nút lọc, nút `+` thêm nhanh, ô chọn ảnh, nút in phiếu | Dứt khoát, cảm giác công cụ chuyên nghiệp |

### Kỹ thuật 3D Overlapping Hero:
Cho ảnh đĩa thức ăn/ly nước nổi một nửa đè lên trên khối Header và một nửa nằm trong thân Card. Kỹ thuật này tạo cảm giác đĩa thức ăn tràn ra khỏi màn hình đầy sống động mà không tốn tài nguyên render 3D nặng nề.

---

## 4. Công Thái Học Vùng Ngón Tay Cái (Thumb Zone Affordance)

Mọi thao tác cốt lõi trên thiết bị di động phải nằm trong **nửa dưới màn hình (Natural Thumb Zone)**:
- Nút CTA mua hàng & Nút Xác nhận đơn luôn cố định ở Bottom Bar hoặc Floating Dock.
- **Thanh Dock điều hướng nổi (Floating BottomNav):**
  - Luôn cách mép đáy màn hình một khoảng Safe Area (`useSafeAreaInsets().bottom`).
  - Bo tròn pill mềm mại (`height: 60, borderRadius: 30`), có bóng đổ float mềm.
  - Tự động ẩn khi người dùng chuyển sang các màn hình thao tác con (Sub-views) để giải phóng diện tích làm việc.

---

## 5. Chu Trình 5 Chặng Trải Nghiệm Trên Mobile & QR Menu

```
[Chặng 1: Quét QR & Nhận bàn] ➔ [Chặng 2: Khám phá Thực đơn] ➔ [Chặng 3: Tùy biến món]
                                                                        │
                                                                        ▼
[Chặng 5: Theo dõi đơn & Thanh toán] ◄── [Chặng 4: Giỏ hàng & Gửi đơn]
```

1. **Khởi đầu & Định danh:** Quét QR tự động nhận diện chi nhánh và số bàn trong 0.5 giây. Không bắt đăng nhập tài khoản.
2. **Khám phá thực đơn:** Danh mục món cuộn ngang dạng Tabs/Pills. Thanh tìm kiếm nhanh. Lưới 2 cột trực quan.
3. **Tùy biến món (Modal/BottomSheet):**
   - Đồ uống: Hiện rõ ràng các nút radio bấm chọn Đường (100/70/50/0%), Đá, Size và Checkbox Topping kèm giá cộng thêm.
   - Đồ ăn: Chỉ hiển thị ô nhập ghi chú món để tránh làm rối mắt khách.
4. **Giỏ hàng & Xác nhận đơn:** Bottom Capsule hiển thị số lượng món và tổng tiền tạm tính. Bấm vào bung Modal xác nhận tóm tắt.
5. **Theo dõi & Thanh toán:** Hiển thị thẻ món đã gửi với trạng thái trực tiếp từ bếp. Nút gọi thanh toán VietQR động.

---

## 6. Các Pattern UI/UX Bắt Buộc Đã Thiết Lập (Critical UI Rules)

> Chi tiết luật cấm tương ứng xem [RULES.md](./RULES.md#5-critical-ui-rules-đã-thiết-lập-không-được-phá). Dưới đây là code mẫu chuẩn để copy-paste.

### A. Ghi Chú Tùy Chọn Món — Định Dạng Multi-Line Bắt Buộc
> **Áp dụng cho:** `CashierClient.tsx`, `kds/page.tsx`, `KitchenTicketTemplate.tsx`, `ReceiptPrintTemplate.tsx`, `mobile/src/screens/operations/OrdersScreen.tsx`.

Chuỗi `item.note` từ backend là tổ hợp các tùy chọn nối nhau bằng dấu `•` hoặc `|`. **TUYỆT ĐỐI KHÔNG** hiển thị nguyên chuỗi dài liền mạch. Bắt buộc tách thành từng dòng riêng có bullet:

```tsx
// Hiển thị trên màn hình POS Cashier & KDS Bếp (màu cam/vàng dễ đọc):
{item.note
  .replace(/^📝?\s*Ghi chú:\s*/i, '')
  .split(/•|;|\||\n/)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((line, idx) => (
    <div key={idx} className="flex items-start gap-1 leading-tight text-xs text-amber-300">
      <span className="text-orange-400/70 font-bold select-none">•</span>
      <span>{line}</span>
    </div>
  ))}

// Định dạng in bill nhiệt (KitchenTicketTemplate / ReceiptPrintTemplate) - Chữ đen nhỏ:
{item.note
  .replace(/^📝?\s*Ghi chú:\s*/i, '')
  .split(/•|;|\||\n/)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((line, nIdx) => (
    <div key={nIdx} className="leading-tight text-xs text-black">- {line}</div>
  ))}
```

### B. Nút HỦY MÓN trong POS Cashier — Luôn Canh Phải
- Nút hủy món trong danh sách order của thu ngân bắt buộc canh lề phải (`justify-end`), đặt màu đỏ hồng tinh tế (`text-rose-400 border border-rose-500/20`), tránh để bên trái gây bấm nhầm khi đang thao tác nhanh.

### C. Nút Thanh Toán QR Menu — Chống Giật/Chớp Giao Diện
- Nút Thanh toán không được xuất hiện rồi biến mất đột ngột khi dữ liệu `PENDING` từ Socket.IO đang đồng bộ.
- Bắt buộc bổ sung `!isInitializing` vào điều kiện render:
  ```tsx
  {cartTab === 'history' && !isInitializing && lastOrder && lastOrder.length > 0 && (
    <div>
      {!lastOrder.some(item => item.status === 'PENDING') && lastOrder.some(item => item.status !== 'VOID') && (
        <button className="...">Yêu Cầu Thanh Toán</button>
      )}
    </div>
  )}
  ```

### D. Form Tích Điểm QR Menu — Đồng Bộ Màu Nhận Diện Thương Hiệu
- Khung container SĐT tích điểm và nút Xác nhận phải dùng `primaryColor` và `secondaryColor` của quán.
- Thẻ phân hạng thành viên (Vàng, Bạc, Đồng) giữ nguyên mã màu riêng theo `customerData.membershipTier.color`.
- Badge hạng và badge điểm đặt cùng 1 hàng ngang (side-by-side flex), không rớt dòng.

### E. Quy Chuẩn Bản In Nhiệt (Print Templates)
- **Phiếu chế biến bếp (`KitchenTicketTemplate.tsx`):** Chữ đen rõ nét trên nền trắng, in đậm số bàn và giờ vào đơn, note ghi chú gạch đầu dòng `- xxx`, không dùng icon màu hay viền lòe loẹt làm hỏng đầu kim máy in nhiệt khổ 80mm/58mm.
- **Hóa đơn thanh toán (`ReceiptPrintTemplate.tsx`):** Chữ đen sắc nét, đầy đủ thông tin tên nhà hàng, địa chỉ, số bill, bảng chi tiết món, thuế, giảm giá voucher, điểm loyalty và mã QR chuyển khoản VietQR ở chân bill.

---

## 7. Thư Viện Component React Native Chuẩn Mẫu

### 1. Stepper Pill Số Lượng (`- 1 +`)
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';

interface StepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  primaryColor?: string;
}

export const QuantityStepper: React.FC<StepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  primaryColor = '#10B981',
}) => {
  return (
    <View style={[styles.stepperContainer, { backgroundColor: primaryColor }]}>
      <TouchableOpacity onPress={onDecrement} style={styles.stepperBtn} activeOpacity={0.7}>
        <Minus size={14} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity onPress={onIncrement} style={styles.stepperBtn} activeOpacity={0.7}>
        <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  stepperBtn: {
    padding: 3,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 16,
    textAlign: 'center',
  },
});
```

### 2. Thẻ Đơn Hàng Live (Kanban Card Component)
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';

interface LiveOrderCardProps {
  tableNumber: string;
  orderCode: string;
  timeAgo: string;
  itemsCount: number;
  status: 'PENDING' | 'PREPARING' | 'READY';
}

const statusConfig = {
  PENDING: { label: 'Chờ duyệt', bg: '#FEF3C7', text: '#D97706' },
  PREPARING: { label: 'Đang nấu', bg: '#EFF6FF', text: '#2563EB' },
  READY: { label: 'Sẵn sàng', bg: '#ECFDF5', text: '#059669' },
};

export const LiveOrderCard: React.FC<LiveOrderCardProps> = ({
  tableNumber,
  orderCode,
  timeAgo,
  itemsCount,
  status,
}) => {
  const conf = statusConfig[status];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.tableText}>{tableNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: conf.bg }]}>
          <Text style={[styles.statusText, { color: conf.text }]}>{conf.label}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.codeText}>#{orderCode}</Text>
        <View style={styles.timeBox}>
          <Clock size={12} color="#94A3B8" />
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
```

---

## 8. Mobile Theme Tokens Chuẩn (`mobile/src/theme/index.ts`)

Mọi màu/bo góc/bóng đổ lấy từ tokens dưới đây — cấm hardcode hex rời rạc trong component con:

```ts
export const theme = {
  colors: {
    primary: '#10B981', primaryDark: '#059669', primaryLight: '#D1FAE5', primaryTint: '#ECFDF5',
    accent: '#0284C7', accentLight: '#E0F2FE',
    success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6',
    background: '#F8FAFC', surface: '#FFFFFF', surfaceSubtle: '#F1F5F9',
    border: '#E2E8F0', borderSubtle: '#F1F5F9',
    textMain: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8', textInverse: '#FFFFFF',
  },
  radii: { pill: 999, xl: 24, lg: 18, md: 14, sm: 10 },
  shadows: {
    card:  { shadowColor:'#0F172A', shadowOffset:{w:0,h:4}, shadowOpacity:0.05, shadowRadius:10, elevation:2 },
    float: { shadowColor:'#059669', shadowOffset:{w:0,h:8}, shadowOpacity:0.25, shadowRadius:14, elevation:6 },
    dock:  { shadowColor:'#0F172A', shadowOffset:{w:0,h:-4}, shadowOpacity:0.08, shadowRadius:16, elevation:8 },
  }
}
```

Quy ước: background mặc định `background` (`#F8FAFC`), card `surface` trắng, border `#E2E8F0`. Shadow luôn kèm cả iOS (`shadow*`) + Android (`elevation`). Card chuẩn: `backgroundColor:'#FFFFFF', borderRadius:18~20, borderWidth:1, borderColor:'#E2E8F0', ...theme.shadows.card`. Pill/CTA: `borderRadius:999`.

---

## 8. Tasty Station x HiAI-MenuGo Unified POS & Operating System Architecture

Hệ thống giao diện Web thế hệ mới lấy cảm hứng từ Tasty Station, tập trung vào trải nghiệm mượt mà, sáng sủa, công thái học F&B đỉnh cao:

### 1. Kiến Trúc 3 Màn Hình Cốt Lõi:
1. **Order Line (POS & Quản Lý Đơn Trực Tiếp):**
   - **Thanh lọc trạng thái đơn:** `All (78)`, `Dine in (04)`, `Wait List (03)`, `Take Away (12)`, `Served (59)` dạng pill bo tròn.
   - **Băng chuyền thẻ đơn trực tiếp:** Thẻ vuông bo góc mềm với 3 màu phân biệt:
     - Xanh Mint `#E6F7F4` cho đơn `In Kitchen` (Đang nấu)
     - Cam Đào `#FFEDD5` cho đơn `Wait List` (Chờ duyệt)
     - Tím Lavender `#F3E8FF` cho đơn `Ready` (Đã sẵn sàng phục vụ)
   - **Lưới thực đơn (Foodies Menu):**
     - Nút danh mục dạng card bo góc kèm icon món và số lượng món (`All Menu`, `Special`, `Soups`, `Desserts`, `Chickens`).
     - Lưới món ăn gồm ảnh đĩa tròn chụp từ trên xuống (top-down), danh mục, tên món, giá tiền và bộ chọn số lượng `- 0 +` nổi bật màu mint khi có trong giỏ hàng.
   - **Phiếu thanh toán trực tiếp (Order Ticket Sidebar):**
     - Hiển thị Số bàn (`Table No #04`), Mã đơn (`Order #FO030`), Số lượng khách (`2 People`), nút sửa & xóa.
     - Danh sách món đã gọi kèm số nhân và đơn giá.
     - Bảng tổng kết: `Subtotal`, `Tax`, `Donation/Service`, `Total Payable`.
     - 3 nút phương thức thanh toán nhanh: `Cash` (Tiền mặt), `Card` (Thẻ), `Scan` (VietQR động).
     - Hành động cuối: Nút In bill và Nút `Place Order` màu Mint nổi bật.

2. **Manage Tables (Sơ Đồ Bàn Trực Quan & Đặt Bàn):**
   - **Cột trái — Danh sách đặt bàn (Reservation Queue):**
     - Bộ lọc `All (12)`, `Reservation (07)`, `On Dine`.
     - Bộ chuyển ngày `< Thu, 11 January 2024 >`, ô tìm kiếm khách và nút `+ Add New Reservation`.
     - Thẻ đặt bàn: Khung giờ, Tên khách, Số bàn, Số khách, Số điện thoại và trạng thái thanh toán.
   - **Canvas Sơ đồ bàn trung tâm (Visual Interactive Floor Plan):**
     - Tab khu vực: `Main Dining`, `Terrace`, `Outdoor`.
     - Chú thích trạng thái: `● Available` (Xanh Mint), `● Reserved` (Xanh Đậm), `● On Dine` (Cam Đào).
     - Bàn trực quan với các icon ghế bao quanh (2 ghế, 4 ghế, 6 ghế, 8 ghế, 10 ghế).
     - Nhấp vào bàn để mở đơn hàng, đổi trạng thái hoặc thanh toán.

3. **Manage Dishes (Quản Lý Danh Mục & Thực Đơn):**
   - **Cột trái — Dishes Category:** Danh sách danh mục cuộn dọc kèm icon và số lượng món, nút `+ Add New Category`.
   - **Lưới quản lý món:**
     - Thanh tìm kiếm món và nút `+ Add New Dishes`.
     - Thẻ đầu tiên viền nét đứt: `+ Add New Dish to [Category]`.
     - Thẻ món ăn: Checkbox chọn nhiều, menu 3 chấm, ảnh món tròn, tên danh mục, tên món và giá tiền.
     - Hỗ trợ xem dạng Grid / List và bộ lọc.

