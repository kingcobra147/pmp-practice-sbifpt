# Kết quả kiểm tra bản tự ôn v3 — 07/11/2026

## Kiểm tra tự động

- `npm run build`: thành công với React/Vite. Có cảnh báo sẵn có của lucide-react về chỉ thị `use client`; không làm thất bại build.
- `npm test`: kiểm tra tích hợp nhiều tài khoản và 15 ca kiểm thử chức năng đều thành công.
- Kiểm tra 2 tài khoản: dữ liệu tách theo user_id, từ chối đọc/ghi chéo; phiên đăng xuất bị thu hồi.
- Kiểm tra lưu/đọc lại ghi chú, mức tự tin và mục tiêu; API từ chối lịch sử sai cấu trúc, mã câu lạ, ghi chú sai kiểu, mục tiêu sai và ngày không hợp lệ.
- 1.127 câu trong ngân hàng; 1.122 câu đủ điều kiện chấm điểm. PDF yêu cầu đăng nhập, đường dẫn ngoài danh sách bị từ chối.
- Kiểm tra nâng cấp JSON cũ, tính lại điểm, chấm nhiều đáp án, bảo toàn thống kê khi lịch sử vượt 100 bài, lọc câu và ghi đè chủ đề cá nhân.
- Kiểm tra lịch ôn theo tự tin và đúng/sai; bài thi hết giờ tính đúng deadline và không bị nộp hai lần.
- Kiểm tra bản nháp tức thời, lưu trước debounce khi yêu cầu flush, tự thử lại không cần sửa thêm, yêu cầu ghi tuần tự, xử lý phản hồi bị mất và khác thứ tự khóa JSON; xung đột/phiên hết hạn không làm mất bản nháp.

## Kiểm tra qua trình duyệt

Dùng tài khoản và database tạm, không tác động database thật:

- Đăng nhập, tạo bài một câu, chọn đáp án, ghi chú, đánh giá rất chắc và đồng bộ thành công.
- Tải lại trang, tiếp tục đúng bài, giữ lựa chọn, ghi chú và mức tự tin.
- Nộp bài đúng, xem kết quả và thống kê đúng lần đầu/chủ đề/biểu đồ tuần.
- Kiểm tra bố cục thống kê ở desktop và màn hình 390 × 844; ảnh lưu trong `review/`.
- Dùng proxy cục bộ giả lập API trả 503: lưu thất bại được thông báo, bản nháp giữ trên máy; gỡ lỗi giả lập, ứng dụng tự đồng bộ mà không cần sửa thêm.
- Tải lại khi toàn bộ API trả 503: mở được bản lưu từ bộ nhớ của tab, giữ mục tiêu; sửa tiếp khi API lỗi và tự đồng bộ khi API phục hồi.
- Hai tab sửa khác phiên bản: tab cũ bị từ chối ghi đè; nút dùng bản máy chủ đọc lại đúng mục tiêu mới.

## Giới hạn xác minh

Chưa deploy lên Vercel hoặc kết nối Turso Production của người dùng. Không thay đổi dữ liệu Production. Chưa kiểm tra toàn bộ trình duyệt/thiết bị thực tế; hỗ trợ cảnh báo rời trang và dung lượng localStorage phụ thuộc trình duyệt. Đây chưa phải PWA chạy hoàn toàn ngoại tuyến. Phân loại chủ đề là gợi ý từ khóa, có thể chỉnh theo cá nhân.
