# PMP Practice Lab — Vercel, nhiều tài khoản

Bản dành riêng cho Vercel, thay cho gói Node/Docker trước đó. Giao diện React + Vite, API Vercel Functions (Node.js 22), database Turso/libSQL qua mạng. Không dùng SQLite file để lưu tiến độ trên Vercel.

## Có lưu riêng dữ liệu từng người không?

Có. Mỗi người đăng ký bằng email và mật khẩu riêng, có `user_id` riêng. Database lưu phiên đang làm, lịch sử, câu đã đánh dấu và câu sai theo `user_id`. Đăng nhập cùng tài khoản ở máy khác sẽ đọc lại tiến độ đã lưu.

- Không dùng chung tài khoản giữa các học viên nếu muốn tách tiến độ.
- Có kiểm tra phiên bản dữ liệu: khi hai tab/thiết bị cùng sửa, phiên cũ không âm thầm ghi đè phiên mới. Ứng dụng yêu cầu tải lại, có nút tải bản sao JSON trước khi tải lại.
- Thi có hẹn giờ giữ mốc kết thúc tuyệt đối. Hết giờ lúc đóng trình duyệt, bài tự nộp khi mở lại ứng dụng.
- Có tối đa 100 lượt làm bài gần nhất cho mỗi tài khoản; tiến độ tự lưu sau thay đổi, cần Internet.
- Mật khẩu được băm scrypt với salt riêng. Cookie phiên HttpOnly, SameSite=Lax và Secure khi chạy trên Vercel. Token phiên trong database chỉ lưu dạng hash.
- Đăng ký yêu cầu mã tham gia do quản trị cung cấp. Không có xác minh email hoặc gửi email khôi phục; email hiện dùng làm tên đăng nhập. Có công cụ quản trị đặt lại mật khẩu.

## Triển khai Vercel

### 1. Tạo database Turso

Tạo database cloud trong tài khoản Turso của bạn, lấy **Database URL** và **Auth Token** có quyền đọc/ghi. Không gửi token vào chat hoặc đưa vào Git.

Tài liệu chính thức: https://docs.turso.tech/sdk/ts/quickstart

### 2. Đưa dự án lên Vercel

Giải nén. Đưa toàn bộ nội dung thư mục này vào repository Git riêng, rồi trên Vercel chọn **Add New → Project**, import repository đó. Thư mục root phải chứa `package.json` và `vercel.json`.

Cấu hình:

| Mục | Giá trị |
| --- | --- |
| Framework Preset | Vite |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | dist |
| Node.js | 22.x |

`vercel.json` đã khai báo cấu hình này, routing API và các PDF cần đóng gói vào Function.

### 3. Thêm biến môi trường

Trong **Project Settings → Environment Variables**, thêm:

| Biến | Giá trị |
| --- | --- |
| TURSO_DATABASE_URL | URL database, ví dụ libsql://ten-db.turso.io |
| TURSO_AUTH_TOKEN | Token database đọc/ghi |
| APP_SIGNUP_CODE | Mã tham gia bí mật do bạn tự đặt, rồi đưa riêng cho người học |

Áp dụng cho Production. Dùng database và mã tham gia riêng cho Preview/Development nếu bật các môi trường đó, tránh bản thử ghi vào dữ liệu thật. Không đặt tiền tố `VITE_` cho các biến bí mật.

### 4. Deploy và tạo tài khoản

Nhấn **Deploy**. Mở website, chọn **Đăng ký**, nhập tên, email, mật khẩu tối thiểu 12 ký tự và mã tham gia.

Khi có yêu cầu đăng ký/đăng nhập đầu tiên, backend tự tạo các bảng và nhập 1.127 câu hỏi vào database. Bạn cũng có thể khởi tạo trước qua máy local bằng `npm run db:init` với `.env.local` đã cấu hình.

Sau khi đủ người học, xóa giá trị `APP_SIGNUP_CODE` và redeploy để đóng đăng ký mới. Người đã có tài khoản vẫn đăng nhập bình thường.

## Triển khai bằng CLI

Sau khi có tài khoản Vercel và biến môi trường của dự án:

```sh
npm ci
npx vercel login
npx vercel link
npx vercel env pull .env.local
npm run db:init
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

Hoặc dùng `npx vercel --prod` để Vercel build từ source. Các bước link/deploy cần đăng nhập tài khoản Vercel của bạn. Gói ZIP không chứa token, thông tin tài khoản hoặc liên kết dự án Vercel đã tạo sẵn.

## Chạy thử trên máy cá nhân

Yêu cầu Node.js 22.x:

```sh
npm ci
cp .env.example .env.local
```

Điền database URL, token và mã tham gia vào `.env.local`, rồi:

```sh
npm run build
npm start
```

Mở `http://127.0.0.1:3000`. Để thử cục bộ hoàn toàn, có thể dùng `TURSO_DATABASE_URL=file:./local.db` và để trống token; **file local chỉ dùng khi phát triển, không dùng trên Vercel**.

Chạy kiểm tra tự động với database tạm, không tác động database thật:

```sh
npm test
```

## Chuyển tiến độ từ website cũ

Trên website cũ, vào **Lịch sử làm bài → Tải tiến độ JSON**. Đăng nhập đúng tài khoản trên bản mới, vào **Lịch sử làm bài → Nhập tiến độ JSON**. Sao lưu tiến độ hiện tại trước nếu đã có dữ liệu. Mỗi người nhập file vào tài khoản của chính mình.

Bản xuất không chứa tài khoản hoặc tiến độ học trên website cũ. Website cũ trên chatgpt.site không tự thay đổi khi triển khai bản này.

## Quản trị và sao lưu

- Sao lưu đầy đủ database bằng công cụ export/backup của Turso; database chứa cả tài khoản và tiến độ.
- Mỗi người có thể tải JSON tiến độ của chính họ trong giao diện.
- Quên mật khẩu: quản trị chạy `node scripts/reset-password.mjs` trên máy tin cậy đã có `.env.local` kết nối đúng database. Cấp hai biến môi trường tạm `RESET_USER_EMAIL` và `RESET_NEW_PASSWORD`; công cụ đặt lại mật khẩu và thu hồi phiên đăng nhập của người đó. Không đưa mật khẩu vào tham số lệnh, Git hoặc chat.
- Dùng một database cho các instance Production cùng dự án. Các user được tách bằng session server và điều kiện `user_id` ở mọi truy vấn tiến độ.
- Đây là ứng dụng học cá nhân nhiều tài khoản, chưa có bảng điều khiển giảng viên, phân lớp hoặc thống kê toàn lớp.

## Nội dung và chất lượng nguồn

Có 1.127 câu thuộc 6 đề, gồm 41 câu nhiều đáp án. 1.122 câu dùng chấm điểm; 5 câu có đáp án không khớp lựa chọn trong nguồn (đề 2 câu 144; đề 6 câu 16, 72, 74, 75) được gắn cảnh báo, không dùng trong bài làm. Hai câu không có lời giải trong nguồn: đề 1 câu 270, đề 3 câu 64. Không tự sửa khóa đáp án theo suy đoán.

Câu hỏi/lời giải giữ tiếng Anh, giao diện tiếng Việt. Có liên kết về trang PDF gốc. PDF và database tải xuống được phục vụ qua API có kiểm tra đăng nhập, không đặt trong thư mục static công khai.

## Các tệp chính

- `src/`: giao diện và đăng nhập.
- `api/index.mjs`: API Vercel, tài khoản, session, tiến độ và file có xác thực.
- `lib/db.mjs`: kết nối Turso, schema và nhập ngân hàng câu hỏi.
- `data/`: ngân hàng JSON và báo cáo trích xuất.
- `server-assets/`: 4 PDF và database SQLite/JSON để tải sau khi đăng nhập.
- `vercel.json`: build, routing và cấu hình Functions.
- `tests/multiuser.mjs`: kiểm tra tách dữ liệu giữa hai tài khoản, đăng nhập trên thiết bị khác, xung đột phiên bản, đăng xuất và bảo vệ PDF.

Tài liệu nền tảng: https://vercel.com/docs/functions/runtimes/node-js ; https://vercel.com/kb/guide/is-sqlite-supported-in-vercel ; https://docs.turso.tech/sdk/ts/reference
