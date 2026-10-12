# HiAI-MenuGo Frontend — Nghiệp Vụ F&B (BUSINESS)

> **Góc nhìn Frontend (Web):** Tài liệu này mô tả nghiệp vụ F&B dưới dạng **UI behavior, data flow và component logic** để agent biết render gì, validate gì và gọi API nào cho từng màn hình trên nền tảng Web.
>
> - 🏗️ Entry point & cấu trúc repo: [AGENTS.md](./AGENTS.md)
> - ⛔ Luật bắt buộc khi viết code: [RULES.md](./RULES.md)
> - 🎨 Design System & UI: [SKILLS.md](./SKILLS.md)

---

## 1. Mô Hình Multi-Tenant — Frontend Perspective

Frontend nhận `tenantId` và `branchId` từ JWT sau khi login. Toàn bộ data hiển thị phải thuộc đúng tenant + branch đó:

```typescript
// auth.store.ts sau login:
const user = {
  userId, tenantId, branchId, role,
  name, email
}

// branch.store.ts — Quản trị viên có thể chuyển đổi chi nhánh:
const { selectedBranchId, setSelectedBranchId } = useBranchStore();
// selectedBranchId = 'ALL' → xem toàn bộ chi nhánh (khi có quyền ADMIN/PLATFORM_ADMIN)
// selectedBranchId = 'branch_uuid' → lọc theo chi nhánh cụ thể
```

**Mọi API call tự động gắn header `x-branch-id`** qua client interceptor trong `lib/api.ts`.

---

## 2. Hệ Thống Màn Hình & Phân Quyền (RBAC)

Web Admin & POS gồm các phân hệ chức năng tương ứng trên thanh điều hướng chính (`Sidebar`):

| Đường dẫn route | Tên menu | Component chính | Mục đích & Nghiệp vụ |
|---|---|---|---|
| `/dashboard` | Doanh thu | `DashboardView.tsx` | Biểu đồ doanh thu, thống kê theo ngày/tuần/tháng, tỷ trọng thanh toán, top món bán chạy |
| `/orders` | Đặt món | `OrderLineView.tsx` | **POS Đặt món**: Chọn bàn, chọn món, tuỳ chọn modifier, ghi chú, thanh toán nhanh hoặc gửi đơn vào bàn |
| `/order-management` | Quản lý đơn | `OrderManagementView.tsx` | **Quản lý đơn live**: Theo dõi các đơn PENDING, CONFIRMED, DONE theo thời gian thực; nút Tiếp nhận, Hoàn tất, Hủy đơn |
| `/cashier` | Thanh toán | `CashierView.tsx` | Thu ngân: Xem bàn có đơn chưa thanh toán, tính tiền, áp mã giảm giá, tiền mặt / VietQR |
| `/tables` | Quản lý bàn | `FloorPlanView.tsx` | Sơ đồ mặt bằng bàn ăn, trạng thái bàn (Trống, Đang dùng, Chờ dọn), in mã QR bàn |
| `/menu` | Quản lý món | `MenuManagementView.tsx` | Danh mục món ăn, danh sách món, chỉnh sửa giá/ảnh/modifier, toggle Báo hết món |
| `/inventory` | Nguyên liệu | `InventoryView.tsx` | Quản lý nguyên liệu thô, định lượng món (BOM), cảnh báo sắp hết kho, điều chỉnh số lượng tồn |
| `/history` | Lịch sử đơn | `OrderHistoryView.tsx` | Tra cứu đơn hàng đã hoàn tất/hủy trong quá khứ, in lại hóa đơn |
| `/customers` | Khách hàng | `CustomersView.tsx` | Danh sách khách hàng, điểm tích lũy, phân hạng thành viên (Đồng, Bạc, Vàng) |
| `/promotions` | Khuyến mãi | `PromotionsView.tsx` | Quản lý voucher mã giảm giá (giảm %, giảm tiền mặt, điều kiện đơn tối thiểu) |
| `/staff` | Nhân viên | `StaffView.tsx` | Quản lý tài khoản nhân viên, phân quyền vai trò (Admin, Manager, Cashier...) |
| `/requests` | Yêu cầu | `CustomerRequestsView.tsx` | Danh sách các yêu cầu gọi phục vụ / yêu cầu thanh toán từ bàn của khách |
| `/table/[tableId]` | QR Menu | `TableMenuPage.tsx` | Giao diện công khai dành cho khách quét mã tại bàn: xem thực đơn, gọi món, gọi nhân viên |

---

## 3. Chu Trình Đơn Hàng & Thao Tác Trên Web

### Luồng 1: Khách hàng gọi món qua QR Menu (`/table/[tableId]`)
```
Quét mã QR tại bàn → Xem thực đơn (GET /api/menu/public?tableId=...)
                   → Chọn món + tuỳ chọn Size/Đường/Đá/Topping
                   → Xác nhận giỏ hàng → Gửi đơn (POST /api/sessions/:tableId/order)
                   → Tự động phát Socket 'order:new' đến Quản Lý Đơn & POS
```

### Luồng 2: Nhân viên đặt món tại quầy / tại bàn (`/orders` — `OrderLineView`)
```
Chọn bàn ăn → Chọn món từ danh mục lưới
             → Mở modal ItemOptionsModal chọn modifiers
             → Thêm vào giỏ hàng
             → Lựa chọn:
                a) Bấm "Gửi đơn": Lưu đơn vào session bàn để theo dõi
                b) Bấm "Thanh toán ngay": Mở modal thanh toán tiền mặt / VietQR chốt đơn
```

### Luồng 3: Quản lý & Tiếp nhận đơn live (`/order-management` — `OrderManagementView`)
```
Nhận sự kiện realtime Socket 'order:new' → Tự động hiện đơn mới + phát âm thanh
Tabs quản lý:
  - PENDING (Chờ tiếp nhận): Bấm "Tiếp nhận đơn" → PATCH /api/orders/:id/status (CONFIRMED)
  - CONFIRMED (Đang chế biến/phục vụ): Đồng hồ đếm ngược chạy live → Bấm "Hoàn tất" → PATCH /api/orders/:id/status (DONE)
  - DONE (Hoàn tất): Đơn đã phục vụ xong, chờ thanh toán
  - Hủy đơn: Bấm nút Void → Nhập lý do → POST /api/orders/:id/void
```

### Luồng 4: Thu ngân thanh toán (`/cashier` — `CashierView`)
```
Chọn bàn có đơn → Tải chi tiết phiên ăn & danh sách món
                → Nhập số điện thoại khách để tích điểm / hưởng ưu đãi hạng thành viên
                → Nhập mã voucher nếu có
                → Chọn Tiền mặt (nhập tiền khách đưa, tính tiền thối) hoặc VietQR (hiển thị mã QR)
                → Socket 'payment:completed' hoặc bấm xác nhận → In hóa đơn → Giải phóng bàn
```

---

## 4. Thực Đơn & Modifiers — UI Rules

### Hiển thị Modifier Groups:
- **Đồ uống (DRINK)**:
  - Kích cỡ (Size): `required=true, multiSelect=false` (Radio).
  - Mức đường (Sugar): `required=true, multiSelect=false` (Radio).
  - Mức đá (Ice): `required=true, multiSelect=false` (Radio).
  - Topping: `required=false, multiSelect=true` (Checkbox, tính thêm phụ phí `extraPrice`).
- **Đồ ăn (FOOD)**: Các ghi chú yêu cầu chế biến (ít cay, không hành...).

### Báo hết món (Sold-Out):
- Nhận event Socket `sold_out:updated`:
  - Cập nhật badge mờ/disabled trên món ăn ở trang `/orders` và `/table/[tableId]`.
  - Không cho phép người dùng click thêm món đã hết vào giỏ hàng.

---

## 5. Realtime Socket Events Trên Web

| Event | Component lắng nghe | Hành vi UI |
|---|---|---|
| `order:new` | `OrderManagementView`, `Sidebar` | Tăng badge số đơn mới, thêm card vào tab PENDING, phát âm thanh alert |
| `order:updated` | `OrderManagementView` | Cập nhật trạng thái card đơn theo thời gian thực |
| `call_staff:request` | `Sidebar`, `CustomerRequestsView` | Tăng badge số bàn đang gọi nhân viên, hiển thị thông báo popup |
| `payment:completed` | `CashierView`, `FloorPlanView` | Đóng modal thanh toán, cập nhật trạng thái bàn sang trống |
| `sold_out:updated` | `MenuManagementView`, `OrderLineView` | Cập nhật trạng thái còn/hết của món trên giao diện |
| `table:status-changed`| `FloorPlanView`, `OrderLineView` | Cập nhật màu sắc sơ đồ bàn (Xanh: Trống, Đỏ: Đang có khách) |
