# Kế hoạch thương mại hóa

Cập nhật: 31/10/2026. Đây là giả thuyết và kế hoạch kiểm chứng, chưa phải giá bán, điều khoản mua hàng hoặc cam kết doanh thu.

## Định vị và tiềm năng

**Công cụ Windows gọn để ghép 2–4 ảnh nhanh, tiếng Việt, xử lý ảnh trên máy.** Nhóm nên thử: người bán hàng ghép ảnh sản phẩm, người làm nội dung tạo ảnh so sánh, nhóm vận hành cần bố cục lặp lại. Đây là phân khúc giả định, chưa có dữ liệu chứng minh họ sẵn sàng trả tiền.

Hướng hợp lý hiện tại là tiện ích trả phí cho thị trường ngách. Chưa có cơ sở dự báo doanh thu hoặc xem đây là cơ hội thị trường lớn riêng cho app. Điểm tốt: ít thao tác cho nhiệm vụ hẹp, tiếng Việt, không cần tài khoản/dịch vụ xử lý ảnh. Hạn chế: dễ sao chép chức năng, Windows-only, nhiều lựa chọn miễn phí, chưa có dữ liệu sử dụng lặp lại/trả tiền.

Không quảng bá như bộ thiết kế thumbnail toàn diện: chưa có chữ, logo, layer tự do, preset thương hiệu, lưu dự án hoặc AI. Không hứa tăng CTR/doanh số nếu chưa có thử nghiệm đủ cơ sở.

Đối chiếu nguồn chính thức ngày 31/10/2026:

| Lựa chọn | Nguồn xác nhận | Hàm ý |
|---|---|---|
| [Adobe Express Free](https://helpx.adobe.com/express/web/adobe-express-subscription/free.html) | Có gói miễn phí và công cụ thiết kế | Cần giá trị cụ thể hơn “làm ảnh” nói chung |
| [PhotoCollage.com](https://www.photocollage.com/) | Ghép miễn phí, không đăng ký, xử lý ảnh trong trình duyệt, có chữ và lưu/mở dự án | Riêng tư/không đăng nhập chưa đủ khác biệt; kiểm chứng quy trình Windows hay lợi ích cho nhóm chuyên biệt |

Đây là đối chiếu tính năng công bố, không phải nghiên cứu thị phần. Nhận định nhu cầu/lợi thế là suy luận cần thử nghiệm.

## Mô hình doanh thu đề xuất

Thử **mua một lần cho một phiên bản chính**: tác vụ chạy cục bộ, chưa có giá trị dịch vụ liên tục đủ giải thích thuê bao. Bản thương mại phải quy định số thiết bị, mục đích sử dụng, cập nhật, hỗ trợ và chuyển máy.

Có thể thử **149.000đ và 299.000đ** cho cùng đề nghị mua một lần ở hai nhóm phù hợp. Đây là mức thử nghiệm đề xuất, không phải giá công bố hoặc giá tối ưu được thị trường xác nhận. Chỉ nhận tiền khi có bản giao được, điều khoản rõ và chính sách hoàn tiền đã chốt.

Ví dụ số học: 100 đơn × 199.000đ = 19.900.000đ doanh thu gộp, trước phí, thuế, hoàn tiền, hỗ trợ và tìm khách. Đây không phải dự báo đạt 100 đơn. Theo dõi chi phí hỗ trợ/tìm khách để đánh giá lợi nhuận.

Public repo áp dụng [LICENSE](../LICENSE) bảo lưu bản quyền. Bản quyền không ngăn người khác tự xây chức năng tương tự. Lợi thế cần đến từ hiểu khách hàng, phân phối, chất lượng, hỗ trợ. Logic kích hoạt phía client có thể đọc được: không nhúng bí mật hoặc xem key cục bộ là hàng rào kinh doanh duy nhất.

## Thử nghiệm 30 ngày

Mốc nội bộ đề xuất, không phải chuẩn ngành:

1. **Tuần 1:** phỏng vấn 10 người cùng phân khúc, quan sát công cụ đang dùng, tần suất và thời gian ghép ảnh. Tìm vấn đề lặp lại.
2. **Tuần 2:** cho 20 người phù hợp dùng bản thử với điều khoản rõ; đo có đồng ý: thời gian đến ảnh xuất đầu tiên, tỷ lệ hoàn tất, lỗi và nhu cầu quay lại. Có thể ghi thủ công thay vì thêm telemetry.
3. **Tuần 3:** kiểm tra ít nhất 8/20 người quay lại trong 7 ngày; tìm tính năng cản trả tiền. Chỉ ưu tiên lưu dự án/chữ/logo/xuất hàng loạt nếu được xác nhận.
4. **Tuần 4:** trình bày giá thử. Mục tiêu 5 người chấp nhận mua trong 20 người đã dùng là tín hiệu ban đầu; chỉ tính khách trả tiền khi giao dịch thật hoàn tất. Không suy rộng mẫu nhỏ này ra thị trường.

Nếu thử một lần rồi bỏ hoặc không thấy giá trị hơn công cụ miễn phí, thu hẹp ngách/đổi đề nghị trước khi đầu tư lớn. Nếu quay lại và mua thật, sửa điểm nghẽn quan sát được rồi mở rộng thử nghiệm.

## Ưu tiên đề xuất — chưa triển khai

| Thứ tự | Tính năng | Giá trị cần kiểm chứng |
|---|---|---|
| 1 | Lưu/mở dự án, undo/redo | Giảm mất công việc |
| 2 | Chữ tiếng Việt, logo, preset thương hiệu | Hoàn tất ảnh trong một công cụ |
| 3 | Xuất hàng loạt, đặt tên, nhiều kích thước | Tiết kiệm thời gian cho người dùng thường xuyên |
| 4 | Bộ cài ký số, cập nhật, quản lý quyền dùng | Giao sản phẩm và hỗ trợ đáng tin cậy |

AI chỉ nên thêm nếu có nhu cầu xác nhận và phương án chi phí/quyền riêng tư.

## Điều kiện mở bán

- Xác minh sở hữu mã/tài nguyên/đóng góp, tên nhãn hiệu và định danh `Anphabe.ThumbnailMaker`; hoàn tất notices bên thứ ba.
- Công bố bên bán, liên hệ, giá cuối, giao hàng/thanh toán, quyền dùng/số thiết bị, cập nhật/hỗ trợ, hoàn tiền, xử lý dữ liệu giao dịch. Những nội dung này chưa được chốt trong repo.
- Xác định nghĩa vụ thuế, hóa đơn và bảo vệ người tiêu dùng theo nơi bán/khách hàng; rà soát chuyên môn tại thời điểm bán, không coi repo là kết luận pháp lý.
- Thử máy sạch, chọn Windows hỗ trợ, ký số, công bố nguồn tải/checksum theo [quy trình phát hành](DEVELOPMENT.md).
- Trước khi công khai, kiểm tra repo và lịch sử Git không có bí mật, dữ liệu khách hàng hoặc tài nguyên chưa được phép. Không đưa khóa ký/thanh toán vào repo.

Theo [hướng dẫn giấy phép GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), repo công khai không tự thành nguồn mở; quyền xem/fork vẫn theo điều khoản nền tảng. Giấy phép mới không thu hồi quyền đã cấp hợp lệ trước đó; cần kiểm tra nếu từng phân phối theo điều khoản khác.

Tài liệu này chưa tạo bản thương mại, checkout, bộ cài, hệ thống license hoặc GitHub Release. Phát hành/nhận tiền là các bước riêng sau khi điều kiện được đáp ứng.
