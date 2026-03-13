# Admin Frontend - Hệ Thống Quản Lý Bán Vé Xe Buýt

Ứng dụng quản lý hệ thống bán vé xe buýt được xây dựng bằng React, Vite, Ant Design, và axios.

## Tính Năng Chính

### 1. **Dashboard** (`/dashboard`)
- Hiển thị tổng quan hệ thống
- Thống kê:
  - Tổng số vé bán
  - Tổng chuyến xe
  - Tổng doanh thu
  - Số khách hàng
- Biểu đồ doanh thu theo tháng
- Biểu đồ số vé bán theo tuyến đường

### 2. **Quản Lý Xe** (`/buses`)
Chức năng CRUD cho danh sách xe:
- **Thêm xe mới**: Nhập biển số xe, loại xe, số ghế
- **Sửa xe**: Cập nhật thông tin xe
- **Xóa xe**: Xoá khỏi hệ thống
- Bảng hiển thị:
  - Biển số xe
  - Loại xe (Limousine, Ghế ngồi, Giường nằm, VIP)
  - Số ghế
  - Trạng thái (Hoạt động / Ngừng hoạt động)

### 3. **Quản Lý Tuyến Đường** (`/routes`)
Quản lý các tuyến xe chạy:
- **Thêm tuyến**: Nhập điểm đi, điểm đến, khoảng cách
- **Sửa tuyến**: Cập nhật thông tin tuyến
- **Xóa tuyến**: Xoá khỏi hệ thống
- Bảng hiển thị:
  - Điểm đi
  - Điểm đến
  - Khoảng cách (km)
  - Mô tả

### 4. **Quản Lý Chuyến Xe** (`/trips`)
Quản lý lịch trình và chuyến xe:
- **Tạo chuyến xe**: Chọn xe, tuyến đường, ngày giờ khởi hành, giá vé
- **Cập nhật chuyến xe**: Sửa thông tin
- **Xóa chuyến xe**: Xoá khỏi lịch trình
- Bảng hiển thị:
  - Xe (Biển số)
  - Tuyến đường
  - Ngày khởi hành
  - Giờ khởi hành
  - Giá vé

### 5. **Quản Lý Vé** (`/tickets`)
Quản lý toàn bộ vé bán:
- **Xem danh sách vé**: Hiển thị tất cả vé
- **Cập nhật trạng thái vé**: Chuyển giữa các trạng thái (Chờ xác nhận, Đã xác nhận, Hoàn thành, Đã hủy)
- **Tìm kiếm vé**: Theo mã vé, tên khách hàng, số điện thoại
- **Lọc theo trạng thái**: Hiển thị vé theo trạng thái
- Bảng hiển thị:
  - Mã vé
  - Khách hàng
  - Số điện thoại
  - Ghế
  - Tuyến đường
  - Ngày khởi hành
  - Giá
  - Trạng thái

### 6. **Quản Lý Hành Khách** (`/passengers`)
Quản lý dữ liệu khách hàng:
- **Xem thông tin hành khách**: Danh sách đầy đủ
- **Tìm kiếm hành khách**: Theo tên, email, số điện thoại, mã hành khách
- **Thống kê**:
  - Tổng hành khách
  - Hành khách mới (tháng này)
  - Trung bình vé/khách
- Bảng hiển thị:
  - Mã hành khách
  - Họ và tên
  - Email
  - Số điện thoại
  - Số CMND/CCCD
  - Địa chỉ
  - Số vé đã mua

### 7. **Quản Lý Nhân Viên** (`/employees`)
Quản lý tài khoản nhân viên:
- **Thêm nhân viên**: Nhập thông tin cơ bản, chức vụ
- **Sửa nhân viên**: Cập nhật thông tin
- **Xóa nhân viên**: Xoá tài khoản
- Bảng hiển thị:
  - Mã nhân viên
  - Họ và tên
  - Email
  - Số điện thoại
  - Chức vụ (Quản trị viên, Quản lý, Nhân viên)
  - Trạng thái

## Cấu Trúc Thư Mục

```
src/
├── pages/                      # Các trang chính
│   ├── Dashboard.jsx          # Trang tổng quan
│   ├── Dashboard.css
│   ├── BusManagement.jsx      # Quản lý xe
│   ├── RouteManagement.jsx    # Quản lý tuyến đường
│   ├── TripManagement.jsx     # Quản lý chuyến xe
│   ├── TicketManagement.jsx   # Quản lý vé
│   ├── PassengerManagement.jsx # Quản lý hành khách
│   ├── EmployeeManagement.jsx  # Quản lý nhân viên
│   └── Management.css         # Style chung
│
├── components/
│   ├── Sidebar.jsx            # Thanh điều hướng bên trái
│   ├── Sidebar.css
│   ├── MainLayout.jsx         # Layout chính
│   └── MainLayout.css
│
├── services/
│   ├── api.js                 # Cấu hình axios
│   ├── busService.js          # API cho xe
│   ├── routeService.js        # API cho tuyến đường
│   ├── tripService.js         # API cho chuyến xe
│   ├── ticketService.js       # API cho vé
│   ├── passengerService.js    # API cho hành khách
│   ├── employeeService.js     # API cho nhân viên
│   └── dashboardService.js    # API cho dashboard
│
├── constants/
│   ├── api.js                 # Hằng số API endpoints
│   └── config.js              # Cấu hình ứng dụng
│
├── utils/
│   └── helpers.js             # Hàm tiện ích
│
├── App.jsx                    # Component chính với routing
├── App.css
├── main.jsx                   # Entry point
├── index.css
└── index.html
```

## Công Nghệ Sử Dụng

- **React 19.2.0** - UI framework
- **Vite 7.3.1** - Build tool
- **React Router DOM 7.13.1** - Routing
- **Ant Design 6.3.1** - UI Component library
- **Axios 1.13.6** - HTTP client
- **Day.js 1.11.19** - Xử lý ngày tháng

## Cài Đặt & Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm preview
```

## Routes

| Route | Trang | Mô Tả |
|-------|-------|-------|
| `/` | Dashboard | Trang chủ/Tổng quan |
| `/dashboard` | Dashboard | Trang chủ/Tổng quan |
| `/buses` | Bus Management | Quản lý xe |
| `/routes` | Route Management | Quản lý tuyến đường |
| `/trips` | Trip Management | Quản lý chuyến xe |
| `/tickets` | Ticket Management | Quản lý vé |
| `/passengers` | Passenger Management | Quản lý hành khách |
| `/employees` | Employee Management | Quản lý nhân viên |

## API Base URL

```
http://localhost:5000/api
```

## Các Tính Năng Bổ Sung

### Authentication
- Token được lưu trong localStorage
- Token tự động thêm vào header Authorization
- Tự động chuyển hướng đến `/login` nếu token hết hiệu lực

### Responsive Design
- Mobile-friendly interface
- Hỗ trợ các kích thước màn hình khác nhau
- Sidebar có thể thu gọn trên mobile

### Thông Báo Người Dùng
- Toast notifications cho các hành động (thêm, sửa, xóa)
- Thông báo lỗi từ API

### Tìm Kiếm & Lọc
- Tìm kiếm vé, hành khách theo nhiều tiêu chí
- Lọc vé theo trạng thái
- Phân trang bảng dữ liệu

## Biến Môi Trường

Tạo file `.env` (nếu cần):

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Các Cải Tiến Tương Lai

- [ ] Thêm export dữ liệu (Excel, PDF)
- [ ] Dashboard analytics advanced
- [ ] Report generation
- [ ] Real-time notifications
- [ ] Dark mode
- [ ] Multi-language support
- [ ] User profile page
- [ ] Settings page

## Hỗ Trợ

Nếu có vấn đề, vui lòng liên hệ team technical support.

## License

© 2026 Bus Ticket System. All rights reserved.
