# Phát triển và phát hành

Dành cho chủ sở hữu hoặc người được cấp quyền theo [LICENSE](../LICENSE).

## Build

Windows x64, .NET Framework 4.8 với `csc.exe` tại `C:\Windows\Microsoft.NET\Framework64\v4.0.30319`, WebView2 Runtime để chạy, Internet tải SDK lần đầu. Build cố định Microsoft.Web.WebView2 **1.0.3240.44** từ NuGet vào `.build/wv2`.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Đầu ra `dist`: `ThumbnailMaker.exe`, `Microsoft.Web.WebView2.Core.dll`, `Microsoft.Web.WebView2.WinForms.dll`, `WebView2Loader.dll`. Giữ cả bốn khi phân phối. WebView2 Runtime được cài riêng; DLL SDK không thay thế Runtime.

Icon đã commit trong `assets`; Python/Pillow chỉ cần khi tạo lại icon. Node.js không tham gia build. Script build đóng các tiến trình ThumbnailMaker; xuất công việc trước khi chạy.

## Cấu trúc

- `src/ThumbnailMaker.cs`: WinForms, WebView2, UI nhúng, ghi file/hộp thoại Windows.
- `app/`: HTML/CSS/JavaScript, Canvas, bố cục, canh/zoom, xuất ảnh.
- `assets/`: icon, manifest, script tạo icon.
- `tools/`: CDP, benchmark, sinh ảnh mẫu.
- `dist/`, `.build/`: sinh tự động, không commit.

Dữ liệu mô tả ở [PRIVACY.md](../PRIVACY.md). `app.local` trả nội dung từ assembly, không phải backend online.

## Kiểm thử

Node.js 22+ có `fetch`, `WebSocket`, `import.meta.dirname`; Python/Pillow để sinh ảnh mẫu. Có thể dùng môi trường Python riêng:

```powershell
python -m venv .build\test-venv
.\.build\test-venv\Scripts\python.exe -m pip install Pillow
.\.build\test-venv\Scripts\python.exe tools\gen_test_images.py
```

Đóng phiên thường, mở phiên phát triển:

```powershell
.\dist\ThumbnailMaker.exe --dev
```

Trong terminal khác:

```powershell
node tools\cdp_test.mjs
node tools\cdp_perf.mjs
```

Screenshot/kết quả ở `.build/shots`. Driver thử nhập ảnh, giữ gán ảnh khi đổi số khung, kéo/zoom/chọn khung, xuất ba định dạng. Một số phép kiểm tra chỉ in `FAIL`/`MISSING`: exit code 0 chưa đủ kết luận đạt. Đọc toàn bộ output, xác nhận không lỗi JavaScript, kiểm tra ảnh xuất và screenshot. Đóng `--dev` rồi kiểm tra shortcut chạy chế độ thường.

Benchmark phụ thuộc môi trường. Khi công bố, ghi CPU/RAM, Windows, WebView2, commit, kích thước/định dạng ảnh nguồn, kích thước xuất, cách đo. Tách thời gian export thực khỏi thời gian chờ driver thêm vào. Không dùng số đo cũ làm cam kết hiệu năng.

## Phát hành

Chưa có pipeline tự động đóng gói, ký số, cấp license hay tạo Release. Trước khi phát hành:

1. Chọn version/tag, Windows hỗ trợ; thử trên máy sạch, thiếu Runtime, đường dẫn tiếng Việt và thư mục không có quyền ghi.
2. Kiểm tra sở hữu mã/tài nguyên, danh tính nhà phát hành, điều khoản bán. Rà soát `Anphabe.ThumbnailMaker` đang làm AppUserModelID: định danh không chứng minh quyền dùng nhãn hiệu hay quan hệ với tổ chức đó.
3. Build từ commit đã chọn; shortcut không có `--dev`. Khi đổi SDK, kiểm tra tương thích và giấy phép phiên bản mới.
4. Đóng gói bốn file, hướng dẫn cài, điều khoản ứng dụng đã chốt, `THIRD_PARTY_NOTICES.md` và toàn bộ `licenses/`. Build/install script hiện chưa tự copy tài liệu: cần đóng gói riêng hoặc thêm bước tự động trước khi bán.
5. Ký số bằng chứng thư của nhà phát hành và kiểm tra trên máy sạch. Không chia sẻ private key/chứng thư chứa khóa riêng trong repo.
6. Tạo ZIP/bộ cài, SHA-256 cho gói cuối, release notes, giới hạn và hướng dẫn cập nhật/gỡ cài.
7. Chỉ tạo GitHub Release khi quyết định phân phối công khai bản đó. Repo công khai không bắt buộc công khai binary trả phí.

Tính checksum khi đã tạo gói:

```powershell
Get-FileHash .\dist\ThumbnailMaker-<version>-win-x64.zip -Algorithm SHA256
```

Thay `<version>` bằng phiên bản thật. Không commit token, khóa ký/kích hoạt, thông tin thanh toán, ảnh khách hàng hoặc log riêng tư.
