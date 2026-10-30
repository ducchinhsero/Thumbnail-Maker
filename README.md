# Thumbnail Maker

Ứng dụng Windows nhỏ gọn để ghép 2 / 3 / 4 ảnh thành một thumbnail, canh chỉnh từng ảnh
bằng chuột rồi xuất PNG · JPG · WebP.

- **Dung lượng: ~950 KB** (không cần cài .NET, không cần framework riêng — chỉ dùng WebView2 có sẵn trong Windows 11)
- **Khởi động ~0,6 giây**
- **Vẽ lại < 1 ms** mỗi khung hình, xuất ảnh 1920×1080 chỉ ~0,25 giây

---

## 1. Cài đặt

**Yêu cầu:** Windows 10/11 — đã có sẵn .NET Framework 4.8 và WebView2 Runtime (Win11 có cả hai).
Không cần .NET SDK / Node / Python để **chạy**; Python + Pillow chỉ cần nếu muốn tạo lại icon.

```powershell
git clone https://github.com/ducchinhsero/Thumbnail-Maker.git
cd Thumbnail-Maker
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Script sẽ build bản mới nhất (lần đầu tự tải WebView2 SDK ~9 MB), copy vào
`%LOCALAPPDATA%\Programs\ThumbnailMaker` và tạo shortcut ở **Desktop** + **Start Menu**.

Mở app: nút Start → gõ `Thumbnail Maker`, hoặc nhấp đúp shortcut ngoài Desktop.

> Gỡ cài: xoá `%LOCALAPPDATA%\Programs\ThumbnailMaker` và 2 shortcut.

Chỉ muốn build lấy exe:

```powershell
.\build.ps1          # → dist\ThumbnailMaker.exe (+ 3 DLL WebView2)
```

---

## 2. Cách dùng

| Thao tác | Kết quả |
|---|---|
| **Thêm ảnh** (Ctrl+O) hoặc kéo-thả file từ Explorer | Nạp ảnh, tự lấp vào các khung trống |
| Kéo ảnh từ Explorer **thả vào một khung** | Gán ảnh vào đúng khung đó |
| **Kéo trong khung** | Canh (pan) ảnh |
| **Lăn chuột** trong khung | Zoom quanh vị trí con trỏ |
| **Nhấp đúp** vào khung | Đặt lại khung đó (zoom 100 %, canh giữa) |
| **Click vào thumbnail** ở cột trái | Gán ảnh vào khung đang chọn (tự đổi chỗ nếu ảnh đã nằm ở khung khác) |
| **Ctrl+V** | Dán ảnh từ clipboard |
| Mũi tên (Shift = 10px) | Dịch ảnh trong khung |
| `+` / `-` / `0` | Zoom in / zoom out / đặt lại |
| `2` `3` `4` | Đổi nhanh số khung |
| Tab | Chuyển sang khung kế tiếp |
| Delete | Bỏ ảnh khỏi khung |
| **Ctrl+S** | Xuất ảnh |

### Bố cục
- **2 ảnh**: Trái·Phải, Trên·Dưới, Lớn·Nhỏ, Nhỏ·Lớn
- **3 ảnh**: 3 cột, 3 hàng, Lớn | 2, 2 | Lớn, Lớn trên, Lớn dưới
- **4 ảnh**: Lưới 2×2, 4 cột, 4 hàng, Lớn | 3, 3 | Lớn, Lớn trên

Đổi bố cục qua lại **không mất** phần canh chỉnh đã làm (mỗi ngăn được giữ riêng).

### Kích thước & trang trí
- Preset: 1280×720 (YouTube), 1920×1080, 2560×1440, 1080×1080, 1080×1350,
  1080×1920, 1200×630, hoặc tự nhập (64 – 4096 px).
- Khoảng cách giữa các khung, bo góc, màu nền (ô trống sẽ lộ màu nền).

### Xuất
PNG (không mất dữ liệu) · JPG · WebP, có thanh chất lượng cho JPG/WebP.
Ảnh xuất ra đúng kích thước đã chọn, dùng thuật toán resample chất lượng cao.
Sau khi lưu, góc phải dưới hiện thông báo kèm nút **Mở thư mục**.

---

## 3. Cấu trúc dự án

```
thumbnail creator/
├─ install.ps1          # cài đặt (build + copy + shortcut)
├─ build.ps1            # build bằng csc (.NET Framework 4.8 có sẵn)
├─ src/
│  └─ ThumbnailMaker.cs # host C# WinForms + WebView2 (~600 dòng)
├─ app/
│  ├─ index.html        # giao diện (nhúng vào exe khi build)
│  ├─ style.css
│  └─ app.js            # engine canvas: bố cục, kéo/zoom, xuất ảnh
├─ assets/              # icon + manifest + script tạo icon
├─ tools/               # script test (CDP) + tạo ảnh mẫu
├─ dist/                # bản build (ThumbnailMaker.exe + 3 DLL của WebView2)
└─ .build/              # thư mục tạm: SDK WebView2, ảnh test, screenshot
```

**Kiến trúc:** exe C# chỉ làm 4 việc — tạo cửa sổ, khởi tạo WebView2, phục vụ
`index.html/style.css/app.js` **từ tài nguyên nhúng trong exe** (không đọc file rời),
và ghi file khi xuất ảnh (hộp thoại Save As gốc của Windows). Toàn bộ phần dựng ảnh
chạy trên Chromium canvas nên nhanh và mượt.

**Ghi chú kỹ thuật:** khởi động nhanh nhờ tắt WPAD/proxy auto-detect
(`--proxy-server="direct://"`) — nếu không, Chromium mất ~2,2 giây chỉ để dò proxy
cho host nội bộ `app.local`.

---

## 4. Kiểm thử tự động

```powershell
.\dist\ThumbnailMaker.exe --dev      # bật cổng DevTools 9333
node tools\cdp_test.mjs              # test bố cục, kéo/zoom, xuất ảnh
node tools\cdp_perf.mjs              # đo tốc độ render / decode / xuất
```

Kết quả lần chạy gần nhất:

```
A. images loaded: 4  cells: ["i1","i2","i3","i4"]
B. after 4→2→4:    ["i1","i2","i3","i4"]        (giữ nguyên canh chỉnh)
C. drag pan:       panX 0.000 → -0.192  OK
D. wheel zoom:     1.000 → 1.468  OK
E. select cell:    sel = 2  OK
H. file input:     2 ảnh  OK
F. export png/jpg/webp  OK
G. render:         0,2 ms/khung hình (p95), heap 6 MB
```
