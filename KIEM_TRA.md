# Kết quả kiểm tra bản Vercel

- `npm run build`: thành công (React/Vite).
- `npm test`: thành công; dùng database libSQL tạm trên máy kiểm tra.
- Kiểm tra 2 tài khoản: dữ liệu tách riêng theo user_id, không đọc/ghi chéo.
- Cùng tài khoản đăng nhập phiên khác: đọc lại tiến độ được.
- Phiên cũ bị từ chối khi ghi đè phiên bản dữ liệu mới.
- Phiên đăng xuất bị thu hồi; tài khoản khác không bị ảnh hưởng.
- 1.127 câu; 1.122 câu dùng chấm điểm.
- PDF yêu cầu đăng nhập; đường dẫn file ngoài danh sách cho phép bị từ chối.
- Trình duyệt: đăng ký, đăng nhập, đánh dấu câu, đăng xuất, đăng nhập lại và đọc lại câu đã đánh dấu thành công.
- `npm audit --omit=dev`: không báo lỗ hổng tại thời điểm kiểm tra.

Giới hạn xác minh: chưa đăng nhập tài khoản Vercel và chưa được cấu hình URL/token database Turso thật của người dùng. `vercel build --yes` dừng với `login_required`. Chưa có deployment Vercel thực tế được xác nhận. Mã nguồn và cấu hình đã chuẩn bị để import vào Vercel; cần thêm 3 biến môi trường theo README.
