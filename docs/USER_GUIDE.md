# Hướng dẫn sử dụng

## Bắt đầu

Mở Thumbnail Maker từ Desktop hoặc Start Menu. Nhấn **Thêm ảnh**, kéo file từ Explorer hoặc Ctrl+V để dán. Chọn 2/3/4 khung và bố cục. Kéo từng khung để canh, lăn chuột để zoom. Chọn kích thước/định dạng rồi nhấn **Xuất ảnh**.

Xuất được PNG, JPG và WebP. Khả năng đọc ảnh phụ thuộc bộ giải mã WebView2; thử chuyển sang PNG/JPG nếu không đọc được. Không cam kết hỗ trợ RAW, PSD hay mọi biến thể HEIC.

## Phím tắt và chuột

| Thao tác | Kết quả |
|---|---|
| Ctrl+O | Chọn ảnh |
| Ctrl+V | Dán ảnh từ clipboard |
| Thả file vào khung | Gán ảnh vào khung đó |
| Kéo trong khung | Canh ảnh |
| Lăn chuột | Zoom quanh con trỏ |
| Nhấp đúp khung | Đặt lại zoom và canh giữa |
| Click ảnh ở cột trái | Gán vào khung đang chọn; đổi chỗ nếu ảnh ở khung khác |
| Mũi tên; giữ Shift | Dịch ảnh; tăng bước dịch |
| `+`, `-`, `0` | Phóng to, thu nhỏ, đặt lại |
| `2`, `3`, `4` | Đổi số khung |
| Tab | Chọn khung kế tiếp |
| Delete | Bỏ ảnh khỏi khung |
| Ctrl+S | Xuất ảnh |

Click canvas trước khi dùng phím điều khiển nếu ô nhập đang giữ tiêu điểm.

## Bố cục và chất lượng

Có 4 bố cục cho 2 ảnh, 6 cho 3 ảnh, 6 cho 4 ảnh. Chỉnh khoảng cách, bo góc và nền. Preset: 1280×720, 1920×1080, 2560×1440, 1080×1080, 1080×1350, 1080×1920, 1200×630; nhập riêng mỗi chiều từ 64 đến 4096 px.

PNG tránh nén mất dữ liệu. JPG/WebP có chỉnh chất lượng để giảm dung lượng. Kiểm tra ảnh ở kích thước thật trước khi đăng; ảnh nguồn nhỏ vẫn mờ khi phóng lớn, app không có AI tăng chi tiết.

Đổi số khung/bố cục trong phiên giữ phần canh chỉnh. App chưa lưu dự án chứa ảnh để mở lại sau khi đóng: xuất kết quả trước khi thoát.

## Cài đặt và cập nhật

Bản cài từ script ở `%LOCALAPPDATA%\Programs\ThumbnailMaker`. Cấu hình/log ở `%LOCALAPPDATA%\ThumbnailMaker`.

Chủ sở hữu hoặc nhà phát triển được ủy quyền cập nhật từ nguồn:

```powershell
git pull --ff-only
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

Xuất công việc trước khi cập nhật: build đóng các tiến trình ThumbnailMaker đang chạy; cài đặt thay thế file trong thư mục cài. Nếu đã sửa mã, xem `git status` trước khi pull. Chưa có cập nhật tự động.

## Gỡ cài

Đóng app, xóa `%LOCALAPPDATA%\Programs\ThumbnailMaker` và hai shortcut **Thumbnail Maker** tại Desktop/Start Menu. Muốn xóa cấu hình/log/hồ sơ WebView2, xóa riêng `%LOCALAPPDATA%\ThumbnailMaker`. Giữ thư mục ảnh xuất nếu còn cần.

## Xử lý lỗi

| Hiện tượng | Kiểm tra |
|---|---|
| Không khởi động/lỗi WebView2 | Runtime, .NET Framework 4.8 và log |
| Không tải được SDK | Internet, proxy, quyền truy cập NuGet; không tắt kiểm tra chứng chỉ |
| EXE không chạy khi tách riêng | Giữ EXE cùng ba DLL trong `dist` |
| Không nạp ảnh | Thử PNG/JPG nhỏ hơn, đường dẫn có quyền đọc |
| Không xuất được | Quyền ghi, dung lượng đĩa, tên file; thử thư mục cục bộ |
| Cảnh báo nhà phát hành | Xác minh nguồn tải; repo hiện chưa có gói ký số, không bỏ qua cảnh báo khi chưa xác minh |

Xem [hướng dẫn báo lỗi](../SUPPORT.md) nếu cần hỗ trợ.
