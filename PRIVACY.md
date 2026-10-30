# Quyền riêng tư

Cập nhật: 31/10/2026. Mô tả mã nguồn hiện tại, không bao gồm cửa hàng hoặc dịch vụ thanh toán tương lai.

## Ảnh và kết quả xuất

Ảnh được đọc và xử lý bằng Canvas trong WebView2 trên thiết bị. Mã ứng dụng hiện không triển khai tải ảnh lên máy chủ, tài khoản, quảng cáo hoặc SDK phân tích hành vi. Kết quả được ghi vào đường dẫn người dùng chọn.

`https://app.local` là host nội bộ được ứng dụng phục vụ từ tài nguyên nhúng trong EXE, không phải dịch vụ lưu trữ ảnh trên Internet. Đây không phải cam kết rằng toàn bộ Windows/WebView2 không bao giờ kết nối mạng: Runtime, hệ điều hành, công cụ cập nhật và dịch vụ đồng bộ có hành vi riêng. Build lần đầu truy cập NuGet để tải SDK.

## Dữ liệu trên máy

| Vị trí | Nội dung |
|---|---|
| `%LOCALAPPDATA%\ThumbnailMaker\settings.ini` | Vị trí/kích thước cửa sổ, thư mục lưu gần nhất |
| `%LOCALAPPDATA%\ThumbnailMaker\app.log` | Khởi động, lỗi, đường dẫn và dung lượng file đã xuất |
| `%LOCALAPPDATA%\ThumbnailMaker\WebView2` | Hồ sơ WebView2; localStorage lưu kích thước, bố cục, màu, chất lượng, tên file |
| Đường dẫn chọn khi xuất | Ảnh PNG/JPG/WebP đã tạo |

Chưa có lưu dự án chứa ảnh để khôi phục toàn bộ phiên. Luôn xuất trước khi đóng app. Hồ sơ WebView2 có thể chứa bộ nhớ đệm do Runtime quản lý; tài liệu này không cam kết xóa an toàn mọi dấu vết ảnh khỏi thiết bị.

## Clipboard và hỗ trợ

Ctrl+V nhận ảnh từ sự kiện dán do người dùng thực hiện. Log không tự gửi cho người duy trì. Khi gửi log, xóa tên người dùng, đường dẫn và nội dung nhạy cảm. Không đăng ảnh khách hàng hay dữ liệu thanh toán lên Issue công khai.

## Xóa dữ liệu

Đóng app rồi xóa `%LOCALAPPDATA%\ThumbnailMaker` để đặt lại cấu hình, log và hồ sơ WebView2. Việc này không xóa ảnh đã xuất. Xóa thư mục cài ứng dụng không tự xóa thư mục dữ liệu này.

Trước khi thêm telemetry, tài khoản, kích hoạt online hoặc thanh toán, phải cập nhật tài liệu về dữ liệu, mục đích, bên nhận, thời gian lưu và lựa chọn của người dùng.
