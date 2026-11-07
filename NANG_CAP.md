# Bản nâng cấp tự ôn PMP — 07/11/2026

## Chức năng đã bổ sung

- **Kế hoạch hôm nay** ở Tổng quan: đặt mục tiêu 1–500 câu/ngày; hiển thị hoạt động 7 ngày, câu đến hạn, câu sai nhiều lần và câu chưa làm. Bài theo kế hoạch ưu tiên câu đến hạn, câu đang sai rồi đến câu mới. Mục tiêu đếm câu có chọn đáp án trong các bài đã nộp, tính theo múi giờ Việt Nam; làm lại một câu vẫn tính là một lượt học.
- **Ôn tập cách quãng**: mỗi lần nộp bài cập nhật lịch riêng từng câu. Sai, đoán hoặc chưa đánh giá tự tin: ôn sau 1 ngày. Đúng và khá chắc: khoảng cách tăng 1,5 lần, từ 2 đến 14 ngày. Đúng và rất chắc: khoảng cách tăng 2 lần, từ 3 đến 90 ngày. Khi đổi mức tự tin sau nộp bài, lịch hiện tại cũng được điều chỉnh từ lần ôn gần nhất.
- **Tiến bộ & điểm yếu** trong menu: tỷ lệ đúng lần đầu, câu sai ít nhất 2 lần, câu chưa tự tin, câu đến hạn; biểu đồ hoạt động/tỷ lệ đúng 8 tuần; thống kê theo chủ đề và danh sách câu thường sai.
- **Tạo bài linh hoạt**: lọc theo câu chưa làm, sai từ 2 lần, đang cần ôn, đã đánh dấu, đến hạn, chưa tự tin; kết hợp bộ đề và chủ đề. Ngân hàng có chọn số câu để luyện danh sách. Kết quả có nút luyện lại toàn bộ câu sai/bỏ trống của lượt đó.
- **Ghi chú, mức tự tin, chủ đề cá nhân** tại ngân hàng, bài đang làm và kết quả. Ghi chú tối đa 2.000 ký tự/câu và có thể tìm bằng ô tìm kiếm ngân hàng.
- **Chủ đề gợi ý** được phân theo từ khóa nội dung/lời giải. Người học có thể đổi nhãn từng câu. Đây là phân loại phục vụ học cá nhân, chưa được chuyên gia duyệt và không phải phân loại kỳ thi chính thức.

## Lưu bài và phục hồi

Mỗi thay đổi được lưu thành bản nháp trong localStorage theo tài khoản và tab, rồi chờ 450 ms để đồng bộ. Các yêu cầu ghi được gửi lần lượt; lỗi kết nối được tự thử lại sau 5 giây và khi trình duyệt báo có mạng. Nếu một lần ghi có thể đã thành công nhưng mất phản hồi, ứng dụng đọc lại phiên bản máy chủ trước khi thử ghi tiếp.

Tải lại cùng tab, hoặc mở tab mới sau khi đóng tab trước, sẽ kiểm tra bản nháp chưa đồng bộ gần nhất. Khi phiên bản máy chủ còn phù hợp, bản nháp được phục hồi và đồng bộ tiếp. Nếu hai bản khác phiên bản, ứng dụng yêu cầu chọn **Dùng bản máy chủ** hoặc **Dùng bản nháp**; lựa chọn thứ hai có xác nhận vì sẽ thay thế dữ liệu máy chủ. Có nút tải bản sao JSON trước khi chọn và nút đăng nhập lại khi phiên hết hạn.

Trình duyệt có thể hiện cảnh báo rời trang khi chưa đồng bộ; việc hiện cảnh báo phụ thuộc hỗ trợ của trình duyệt. Đăng xuất sẽ thử lưu ngay và dừng nếu chưa đồng bộ được. Nếu bộ nhớ trình duyệt đầy/bị chặn, ứng dụng báo rõ và cung cấp nút tải JSON.

Ngân hàng đã tải được lưu trên máy để phục hồi khi API tạm mất kết nối. Tài khoản được nhớ trong sessionStorage của tab để mở bản lưu khi API kiểm tra phiên tạm không hoạt động. API vẫn yêu cầu phiên hợp lệ cho mọi truy cập máy chủ. Đây chưa phải ứng dụng PWA cài đặt/chạy hoàn toàn ngoại tuyến: tải ứng dụng lần đầu, mở PDF và đăng nhập mới vẫn cần kết nối. Xóa dữ liệu trình duyệt sẽ xóa bản nháp trên máy; dữ liệu đã đồng bộ vẫn ở database.

## Dữ liệu cũ và giới hạn

- Không đổi schema tài khoản/database; các trường mới nằm trong JSON tiến độ. Không cần biến môi trường mới.
- File JSON cũ được nâng cấp từ lịch sử còn lưu. Lịch sử chi tiết giữ 100 bài gần nhất; thống kê tích lũy theo câu vẫn tiếp tục lưu sau đó. Không thể tái dựng các bài đã bị loại khỏi lịch sử cũ.
- Hoạt động hằng ngày giữ tối đa 730 ngày; ghi chú và thống kê từng câu theo ngân hàng hiện tại.
- File nhập và yêu cầu ghi giới hạn 4.000.000 byte. Ứng dụng và API cùng kiểm tra mã câu, đáp án, phiên đang làm, lịch sử, lịch ôn, mục tiêu, ghi chú và dữ liệu ngày. Điểm bài nhập được tính lại theo đáp án ngân hàng.
- Không thay đổi nội dung/đáp án tài liệu. 5 câu có lỗi đáp án nguồn vẫn không được đưa vào bài chấm điểm.
- Bài thi hết giờ khi đóng tab sẽ được kết thúc ở thời điểm deadline, không cộng khoảng thời gian đến lúc mở lại. Thao tác đổi đáp án sau deadline bị chặn.
- Số liệu luyện tập và lịch ôn hỗ trợ tự học, không dự đoán kết quả thi chính thức.

## Kiểm tra và chạy thử

```sh
npm ci
npm test
npm run build
npm start
```

`npm test` sử dụng database tạm và không chạm database thật. Bộ kiểm tra gồm tích hợp nhiều tài khoản và 15 ca về dữ liệu nhập, nâng cấp dữ liệu cũ, chấm câu nhiều đáp án, deadline, lịch ôn, tích lũy sau 100 bài, bộ lọc, bản nháp, tự thử lại, phản hồi ghi bị mất và xung đột.

Mã mới cần được redeploy lên Vercel để xuất hiện trên website đang dùng. Chưa triển khai hay thay đổi database Production trong đợt nâng cấp này.
