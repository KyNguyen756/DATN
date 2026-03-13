# Client Frontend - WEB CLIENT (Khách đặt vé)

Ứng dụng khách hàng cho hệ thống bán vé xe buýt, xây dựng với React, Vite, Material UI và axios.

## Tính Năng Chính

### 1. **Trang chủ (Home)**
- Form tìm chuyến xe gồm:
  - Điểm đi
  - Điểm đến
  - Ngày đi
- Button "Tìm" điều hướng sang trang Search Trip
- Placeholder banner/thông tin nhà xe

### 2. **Trang tìm chuyến xe (Search Trip)**
- Lấy thông tin từ query params (`from`, `to`, `date`)
- Gọi API `tripService.search` để lấy danh sách
- Hiển thị card mỗi chuyến:
  - Tên nhà xe
  - Giờ khởi hành
  - Giá vé
  - Số ghế còn trống
  - Loại xe
  - Nút "Chọn chuyến xe" chuyển đến seat selection

### 3. **Trang chọn ghế (Seat Selection)**
- Hiển thị sơ đồ ghế trả về từ API `seatService.getLayout`
- Ghế có trạng thái `empty`, `booked` hoặc `selected`
- Khách chọn nhiều ghế
- Nút "Tiếp tục" điều hướng sang trang Booking với query params `tripId` và `seats`

### 4. **Trang đặt vé (Booking)**
- Form nhập thông tin hành khách:
  - Họ tên
  - Số điện thoại
  - Email
- Khi submit, gọi `bookingService.create` và điều hướng sang /payment

### 5. **Trang thanh toán (Payment)**
- Hiển thị đơn tóm tắt:
  - Thông tin chuyến (dummy)
  - Ghế đã chọn
  - Tổng tiền
- Nút "Thanh toán" (thực hiện alert giả lập)

### 6. **Trang lịch sử vé (My Tickets)**
- Gọi API `ticketService.getUserTickets` với userId từ localStorage
- Hiển thị danh sách vé:
  - Mã vé
  - Chuyến
  - Ghế
  - Trạng thái

### 7. **Trang đăng nhập (Login)**
- Form đăng nhập email + mật khẩu
- Gọi `userService.login`, lưu `token` và `userId` vào localStorage
- Chuyển về trang chủ sau khi login thành công

### 8. **Trang đăng ký (Register)**
- Form đăng ký: tên, email, mật khẩu
- Gọi `userService.register` và điều hướng về login khi thành công

## Cấu Trúc Thư Mục

```
src/
├── pages/
│   ├── Home.jsx
│   ├── SearchTrip.jsx
│   ├── SeatSelection.jsx
│   ├── Booking.jsx
│   ├── Payment.jsx
│   ├── MyTickets.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│
├── components/
│   ├── Header.jsx
│   └── MainLayout.jsx
│
├── services/
│   ├── api.js
│   ├── tripService.js
│   ├── seatService.js
│   ├── bookingService.js
│   ├── userService.js
│   └── ticketService.js
│
├── utils/  (empty, bonus)
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

## Công Nghệ Sử Dụng

- **React 19.2.0**
- **Vite 7.3.1**
- **React Router DOM 7.13.1**
- **Material UI 7.3.9**
- **Axios 1.13.6**
- **Day.js**

## Cài Đặt & Chạy

```bash
cd client-frontend
npm install
npm run dev
```

## Routes

| Đường dẫn | Trang |
|-----------|-------|
| `/` | Home |
| `/search` | Search Trip |
| `/seat-selection` | Seat Selection |
| `/booking` | Booking |
| `/payment` | Payment |
| `/my-tickets` | My Tickets |
| `/login` | Login |
| `/register` | Register |


## API Base URL

```
http://localhost:5000/api
```

## Lưu ý

- Các API chạy giả lập, cần backend hỗ trợ cho chức năng
- Token và userId lưu localStorage để phân biệt người dùng
- Ngày sử dụng format `YYYY-MM-DD`

## Nâng cấp

- Thêm xác thực và bảo vệ route
- Thiết kế sơ đồ ghế trực quan hơn
- Đối chiếu giá và thông tin chuyến thực tế
- Thêm thống kê vé của khách

---

Tài liệu này hỗ trợ bạn tiếp tục phát triển hoặc kiểm tra nhanh các trang.
