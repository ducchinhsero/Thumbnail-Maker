# Bảo mật

## Báo cáo

Chưa công bố chu kỳ hỗ trợ bảo mật hay phiên bản thương mại ổn định. Bản hiện tại chưa được kiểm toán bảo mật độc lập.

Nếu tab Security có **Report a vulnerability**, dùng kênh đó để báo cáo riêng. Nếu chưa có, liên hệ qua kênh công bố trên [hồ sơ người duy trì](https://github.com/ducchinhsero) để xin nơi tiếp nhận riêng. Không đăng mã khai thác, file nhạy cảm hay thông tin cá nhân lên Issue công khai. Chưa có chương trình thưởng lỗi hoặc thời hạn phản hồi được cam kết.

Báo cáo gồm commit/phiên bản, môi trường, bước tái hiện, mức ảnh hưởng và ví dụ tối thiểu đã loại bỏ dữ liệu riêng tư.

## Chế độ phát triển

`ThumbnailMaker.exe --dev` bật DevTools cổng 9333 và lệnh ghi file theo đường dẫn phục vụ kiểm thử. Chỉ dùng trên máy phát triển tin cậy; không bật khi dùng thường hoặc trong shortcut phát hành. Không mở cổng này qua mạng hay chia sẻ phiên cho người không tin cậy. Đóng phiên `--dev` sau khi thử.

Giữ Windows và WebView2 Runtime được cập nhật. Chỉ nhận gói từ nguồn chính thức và đối chiếu SHA-256 khi được cung cấp; checksum không thay thế chữ ký số.
