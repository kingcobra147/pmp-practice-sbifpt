# Mẹo làm bài PMP — v3.1.0

## Cách dùng

- Mở **Mẹo làm bài** trong menu để xem toàn bộ 44 mẹo song ngữ English – Tiếng Việt, tổng hợp từ các nội dung đã trao đổi.
- Có 10 nhóm: đọc đề/tư duy, thay đổi, con người, rủi ro, Agile/Scrum, chất lượng, công cụ, tiến độ/nguồn lực, chi phí và tài liệu.
- Tìm bằng từ khóa Anh, Việt có dấu hoặc không dấu: `insurance`, `Pareto`, `rủi ro`, `duong gang`, `CPI EV AC`.
- Từng mẹo có dấu hiệu, hướng tiếp cận song ngữ, ngoại lệ khi cần và liên kết nguồn PMI, Scrum Guide, ASQ hoặc APM. Hai mẹo đọc đề được ghi rõ là kỹ thuật do ứng dụng tổng hợp.
- Trong ngân hàng, câu đã đánh dấu, ôn câu sai, phiên luyện tập/thi và phần xem lại kết quả: bấm **Mẹo cho câu này** để mở các mẹo liên quan. Nội dung mặc định thu gọn; chuyển sang câu mới trong bài làm sẽ thu gọn lại.
- Panel chỉ ra từ/cụm từ tìm thấy trong nội dung câu hỏi. Hiện tối đa 4 mẹo ban đầu; có nút xem đủ khi có nhiều hơn và nút mở thư viện đầy đủ.
- Nếu chưa có mẹo phù hợp, ứng dụng thông báo rõ và cho mở thư viện. Không cố ghép một mẹo chuyên môn vào mọi câu hỏi.
- Từ thư viện có thể luyện nhóm câu mang dấu hiệu đó. Số câu lấy tối đa theo cấu hình đang chọn ở Tổng quan; nút hiển thị rõ số câu sẽ lấy/số câu có sẵn. Khi có bài đang làm, nút bắt đầu bài mới bị khóa.

## Cách nhận diện và giới hạn

Việc ghép mẹo chỉ đọc `prompt` — nội dung câu hỏi. Không sử dụng lựa chọn, khóa đáp án hoặc lời giải nguồn. Cách ghép là bộ quy tắc văn bản cục bộ, có điều kiện bối cảnh; ví dụ các mẹo Scrum yêu cầu dấu hiệu Agile/Scrum, mẹo FIRST/NEXT/NOT đọc câu hỏi cuối thay vì bắt từ bất kỳ trong câu chuyện. Từ “insurance” xuất hiện phụ trong câu hỏi về vị trí ghi nhận trong project charter không tự làm hiện mẹo Transfer.

Đây là mẹo định hướng học, không phải đáp án tự động hay đánh giá chuyên gia cho từng câu. Cần xem vai trò, thời điểm, cách tiếp cận và dữ kiện thực tế. Ví dụ “third party” không luôn có nghĩa Transfer: nếu nói về hợp tác tận dụng cơ hội thì có thể là Share.

Xem mẹo không chọn đáp án, không nộp bài, không cập nhật điểm và không dừng đồng hồ thi. Trạng thái mở/đóng panel là tạm thời, không đồng bộ sang thiết bị khác.

Không cần API key, dịch vụ AI hay quyền chụp màn hình. Không thay đổi schema database hoặc nội dung/khóa đáp án của 1.127 câu nguồn. Không cần thêm biến môi trường.

## Các file chính

- `data/tips.json`: 44 mẹo song ngữ, nhóm và các nguồn tham khảo.
- `shared/tips.mjs`: quy tắc nhận diện, tìm kiếm không dấu và nhóm mẹo.
- `src/Tips.tsx`: thư viện mẹo và panel theo câu hỏi.
- `src/App.tsx`: nối vào menu, ngân hàng, bài làm và kết quả.
- `tests/tips.test.mjs`: kiểm tra tính đầy đủ, ngữ cảnh, từ khóa gây nhiễu và không đọc khóa đáp án.

## Kiểm tra

```sh
npm test
npm run build
```

Bộ kiểm thử hiện có 26 ca về học tập, đồng bộ và mẹo, cùng kiểm tra tích hợp nhiều tài khoản. Muốn đưa tính năng lên website đang dùng, cần đưa source v3.1.0 lên repository và triển khai lại Vercel.
