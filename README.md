# Thumbnail Maker

**Ghép 2–4 ảnh thành một thumbnail trên Windows, xử lý ảnh ngay trên máy.**

Dành cho người làm nội dung và người bán hàng cần ghép vài ảnh nhanh: chọn bố cục, kéo để canh ảnh, lăn chuột để zoom rồi xuất PNG, JPG hoặc WebP. Giao diện tiếng Việt, không cần đăng nhập.

<img src="assets/app.png" alt="Thumbnail Maker" width="128">

## Tính năng hiện có

- Ghép 2, 3 hoặc 4 ảnh với 16 bố cục có sẵn.
- Thêm ảnh bằng kéo thả, hộp chọn file hoặc dán từ clipboard.
- Canh và zoom riêng từng khung; đổi số khung trong phiên vẫn giữ phần canh chỉnh.
- Kích thước preset hoặc tùy chỉnh từ 64 đến 4096 px mỗi chiều.
- Chỉnh khoảng cách, bo góc, màu nền và chất lượng JPG/WebP.
- Xuất file trên máy, không chèn watermark trong phiên bản mã nguồn hiện tại.

Hiện chưa có chèn chữ/logo, lưu và mở lại dự án chứa ảnh, xuất hàng loạt, AI, tài khoản, thanh toán hay kích hoạt bản quyền. Tính năng dự kiến nằm trong [kế hoạch thương mại hóa](docs/COMMERCIALIZATION.md), không phải tính năng đã có.

## Cài đặt và sử dụng

**Nền tảng:** Windows x64, .NET Framework 4.8 và Microsoft Edge WebView2 Runtime. Mã nguồn hướng tới Windows 10/11; cần kiểm thử trên phiên bản Windows sẽ hỗ trợ khi bán. Không cần Node.js hoặc Python để chạy bản đã build.

Khi có gói phát hành chính thức, tải từ [GitHub Releases](https://github.com/ducchinhsero/Thumbnail-Maker/releases). Liên kết này không có nghĩa đã có bản phát hành hoặc đã mở bán. Repo hiện chưa cung cấp bộ cài thương mại có chữ ký số hay quy trình mua hàng.

Chủ sở hữu và người được cấp phép phát triển có thể build/cài từ nguồn:

```powershell
git clone https://github.com/ducchinhsero/Thumbnail-Maker.git
cd Thumbnail-Maker
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

Script tải WebView2 SDK lần đầu, build và cài vào `%LOCALAPPDATA%\Programs\ThumbnailMaker`, tạo shortcut Desktop và Start Menu. Thông thường không cần quyền quản trị. Tải SDK cần Internet; quá trình ghép và xuất ảnh không cần dịch vụ xử lý ảnh trực tuyến.

Mở **Thumbnail Maker** từ Start Menu → thêm ảnh → chọn 2/3/4 khung → kéo và zoom → **Ctrl+S** để xuất.

Xem [hướng dẫn sử dụng](docs/USER_GUIDE.md) để xem phím tắt, cập nhật, gỡ cài và xử lý lỗi.

## Quyền sử dụng và thương mại

**Repo công khai để tham khảo mã nguồn; bảo lưu bản quyền. Đây không phải dự án nguồn mở theo giấy phép MIT/Apache/GPL.** Xem [LICENSE](LICENSE).

Xem mã trên GitHub không cấp quyền bán lại, phân phối bản build, sửa đổi hoặc khai thác mã nguồn thương mại. Quyền xem/fork do điều khoản GitHub cung cấp vẫn được giữ nguyên. Quyền sử dụng bản ứng dụng thương mại phải được thỏa thuận riêng; repo không tự cấp giấy phép thương mại cho người tải về.

Chưa công bố giá, kênh thanh toán hoặc chính sách mua hàng. Hỏi kênh liên hệ thương mại qua [hồ sơ người duy trì](https://github.com/ducchinhsero). Không gửi thông tin thanh toán qua Issue công khai.

Giấy phép dự án chỉ áp dụng phần mã/tài nguyên thuộc chủ sở hữu dự án. Thành phần Microsoft và bên thứ ba tuân theo [thông báo riêng](THIRD_PARTY_NOTICES.md). Người dùng cần có quyền đối với ảnh và nội dung mình sử dụng.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [Sử dụng](docs/USER_GUIDE.md) | Thao tác, cập nhật và gỡ cài |
| [Quyền riêng tư](PRIVACY.md) | Xử lý ảnh, cấu hình và log |
| [Hỗ trợ](SUPPORT.md) | Báo lỗi, phạm vi hỗ trợ |
| [Bảo mật](SECURITY.md) | Báo cáo riêng, chế độ phát triển |
| [Phát triển](docs/DEVELOPMENT.md) | Build, kiểm thử và phát hành |
| [Thương mại hóa](docs/COMMERCIALIZATION.md) | Định vị, kiểm chứng nhu cầu, điều kiện mở bán |
| [Đóng góp](CONTRIBUTING.md) | Phản hồi và đề xuất sửa mã |

## Dung lượng và hiệu năng

Bản build x64 kiểm tra trên máy phát triển ngày 31/10/2026 gồm EXE và ba DLL, tổng khoảng **947 KiB**, chưa gồm WebView2 Runtime, hồ sơ trình duyệt và dữ liệu phát sinh. Ứng dụng đã khởi động và tải giao diện thành công trên máy này.

Thời gian khởi động/xuất ảnh phụ thuộc máy, Runtime, định dạng và kích thước ảnh. Số liệu đo cũ không được coi là cam kết cho mọi thiết bị; xem [cách kiểm thử](docs/DEVELOPMENT.md).
