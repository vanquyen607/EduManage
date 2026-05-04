# Security Specification - EduManage

## Data Invariants
- Một `Student` (Học sinh) phải thuộc về một `Class` (Lớp học) hợp lệ.
- `Invoice` (Hóa đơn) và `Comment` (Nhận xét) phải tham chiếu đến một `studentId` hiện có.
- Trạng thái `status` của học sinh chỉ có thể là `active` hoặc `inactive`.

## Admin Access
- Chỉ User có email `vanquyen607@gmail.com` và đã xác minh email mới có quyền đọc/ghi toàn bộ hệ thống.

## The Dirty Dozen Payloads (Test cases)
1. **Identity Spoofing**: Cố gắng tạo học sinh với `ownerId` giả mạo.
2. **State Shortcutting**: Cố gắng cập nhật hóa đơn trực tiếp từ `pending` sang `paid` mà không qua cổng thanh toán (nếu hệ thống mở).
3. **ID Poisoning**: Sử dụng chuỗi 1MB làm `studentId`.
4. **Field Injection**: Thêm trường `isAdmin: true` vào hồ sơ học sinh.
5. **PII Leak**: Người dùng không xác định cố gắng đọc email phụ huynh.
... (và các trường hợp khác)
