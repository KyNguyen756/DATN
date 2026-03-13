# Hướng dẫn chạy Bus Ticket System

## Yêu cầu
- Node.js (v18+)
- MongoDB
- 3 terminal để chạy Backend, Client-Frontend, Admin-Frontend

## Bước 1: Backend

1. Tạo file `.env` trong thư mục `backend`:
```
MONGO_URI=mongodb://localhost:27017/bus-ticket
JWT_SECRET=your-secret-key
```

2. Chạy backend:
```bash
cd backend
npm install
npm run dev
```
Backend chạy tại http://localhost:5000

## Bước 2: Client Frontend

```bash
cd client-frontend
npm install
npm run dev
```
Client chạy tại http://localhost:5173 (hoặc port Vite hiển thị)

## Bước 3: Admin Frontend

```bash
cd admin-frontend
npm install
npm run dev
```
Admin chạy tại http://localhost:5174 (hoặc port khác)

## Luồng sử dụng

1. **Đăng ký / Đăng nhập (Client)**: Vào client-frontend → Đăng ký tài khoản mới hoặc Đăng nhập
2. **Tạo dữ liệu**: 
   - Admin cần tạo Xe buýt, Chuyến xe trước (qua admin-frontend)
   - Hoặc thêm dữ liệu mẫu qua MongoDB/API
3. **Đặt vé (Client)**: Tìm chuyến → Chọn ghế → Nhập thông tin → Thanh toán
4. **Xem dữ liệu (Admin)**: Đăng nhập admin (dùng tài khoản đã đăng ký ở client) → Xem Quản lý hành khách, Quản lý vé

## Lưu ý
- Admin và Client dùng chung API backend (http://localhost:5000/api)
- Tài khoản đăng ký trên Client có thể dùng để đăng nhập Admin
- Cần có ít nhất 1 Xe buýt và 1 Chuyến xe trong database để tìm kiếm và đặt vé
