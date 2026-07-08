from pathlib import Path


path = Path("tmp/build_tlcn_report.py")
text = path.read_text(encoding="utf-8")


def must_replace(old: str, new: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f"Missing replacement target:\n{old[:160]}")
    text = text.replace(old, new, 1)


def insert_after(anchor: str, addition: str) -> None:
    global text
    if anchor not in text:
        raise SystemExit(f"Missing insert anchor:\n{anchor[:160]}")
    text = text.replace(anchor, anchor + addition, 1)


must_replace(
    'OUT_DOCX = OUT_DIR / "BaoCao_TLCN_CaoHienStudio.docx"',
    'OUT_DOCX = OUT_DIR / "BaoCao_TLCN_CaoHienStudio_HoanChinh.docx"',
)

must_replace(
    "Trong quá trình phân tích mã nguồn, project có 91 tệp chính sau khi loại trừ thư mục phụ thuộc và build. Backend gồm 36 tệp với 9 controller, 10 route và 8 model chính. Frontend gồm 55 tệp với 36 trang và 9 component/layout chính. Các con số này cho thấy hệ thống đã có cấu trúc module rõ ràng và đủ cơ sở để trình bày như một đề tài TLCN hoàn chỉnh.",
    "Trong quá trình phân tích mã nguồn hiện tại, project có 101 tệp chính sau khi loại trừ thư mục phụ thuộc và build. Backend gồm 42 tệp với 10 controller, 11 route và 9 model chính. Frontend gồm 59 tệp với 39 trang và 9 component/layout chính. So với bản phân tích trước, hệ thống đã bổ sung module danh mục động, trang chính sách/hợp đồng, cơ chế email tự động và một số luồng quản trị mới.",
)

must_replace(
    '"Cung cấp trang quản trị cho admin để quản lý đơn hàng, khách hàng, dịch vụ, album công khai, nhiếp ảnh gia và số liệu tổng quan.",',
    '"Cung cấp trang quản trị cho admin để quản lý đơn hàng, khách hàng, dịch vụ, album công khai, danh mục dịch vụ/album, dữ liệu vận hành và số liệu tổng quan.",',
)

must_replace(
    '"Cung cấp trang quản trị cho admin để quản lý đơn hàng, khách hàng, dịch vụ, album công khai, nhiếp ảnh gia và số liệu tổng quan.",',
    '"Cung cấp trang quản trị cho admin để quản lý đơn hàng, khách hàng, dịch vụ, album công khai, danh mục dịch vụ/album, dữ liệu vận hành và số liệu tổng quan.",',
) if '"Cung cấp trang quản trị cho admin để quản lý đơn hàng, khách hàng, dịch vụ, album công khai, nhiếp ảnh gia và số liệu tổng quan.",' in text else None

must_replace(
    "Kết quả đạt được của đề tài là một website có đầy đủ luồng từ phía khách hàng đến phía quản trị viên. Người dùng có thể xem dịch vụ, xem album, tạo tài khoản, đặt lịch và thanh toán cọc. Quản trị viên có thể quản lý danh mục dịch vụ, album, khách hàng, nhiếp ảnh gia, đơn hàng và theo dõi dashboard tổng quan.",
    "Kết quả đạt được của đề tài là một website có đầy đủ luồng từ phía khách hàng đến phía quản trị viên. Người dùng có thể xem dịch vụ, xem album, tạo tài khoản, đặt lịch, đọc hợp đồng/chính sách và thanh toán cọc. Quản trị viên có thể quản lý dịch vụ, album, danh mục động, khách hàng, đơn hàng và theo dõi dashboard tổng quan.",
)

must_replace(
    '("PublicGalleries", "title, category, drive_folder_id, coverImage, photographer_id, featured, is_active", "Quản lý album ảnh công khai lấy nguồn từ Google Drive."),',
    '("PublicGalleries", "title, category, drive_folder_id, coverImage, photographer_id, service_ids, featured, is_active, order", "Quản lý album ảnh công khai, liên kết nhiều dịch vụ và lấy nguồn từ Google Drive."),\n            ("Categories", "name, slug, type, description, is_active, order", "Lưu danh mục động cho dịch vụ và album, hỗ trợ lọc/hiển thị/reorder."),',
)

must_replace(
    '("Users", "/api/users/photographers, /api/users/admin/customers", "Xem nhiếp ảnh gia, quản lý khách hàng và nhân sự."),\n            ("Drive", "/api/drive/folders/:folderId/images", "Lấy danh sách ảnh từ Google Drive."),',
    '("Users", "/api/users/photographers, /api/users/admin/customers", "Xem nhiếp ảnh gia, quản lý khách hàng và dữ liệu nhân sự ở backend."),\n            ("Categories", "/api/categories, /api/categories/admin, /api/categories/admin/reorder", "Quản lý danh mục động cho dịch vụ và album."),\n            ("Contacts", "/api/contacts/send-otp, /verify-otp, /api/contacts", "Gửi OTP liên hệ, xác thực OTP và lưu yêu cầu tư vấn."),\n            ("Drive", "/api/drive/folders/:folderId/images", "Lấy danh sách ảnh từ Google Drive, chuẩn hóa URL và cache ảnh."),',
)

must_replace(
    '("Dịch vụ", "serviceController, Service", "CRUD dịch vụ, lọc theo category, soft delete bằng is_active."),\n            ("Album", "galleryController, PublicGallery, googleDriveService", "Quản lý gallery, trích xuất folder Drive, lấy ảnh trong thư mục."),',
    '("Dịch vụ", "serviceController, Service", "CRUD dịch vụ, lọc theo category, soft delete bằng is_active và cập nhật thứ tự hiển thị."),\n            ("Danh mục", "categoryController, Category", "Quản lý danh mục động cho SERVICE/GALLERY, bật/tắt và kéo thả reorder."),\n            ("Album", "galleryController, PublicGallery, googleDriveService", "Quản lý gallery, trích xuất folder Drive, lấy ảnh trong thư mục, cache ảnh và cập nhật thứ tự."),',
)

must_replace(
    '("Liên hệ", "contactController, Contact", "Nhận form liên hệ và gửi email thông báo cho studio."),\n            ("AI chat", "aiChatController", "Tư vấn gói dịch vụ bằng Gemini, giới hạn tốc độ theo IP."),',
    '("Liên hệ", "contactController, Contact, OTP", "Gửi OTP liên hệ, nhận form tư vấn và gửi email thông báo cho studio."),\n            ("Tự động hóa email", "cronJobs, mailService", "Gửi email xác nhận, nhắc lịch cho khách/admin và tự chuyển CONFIRMED sang IN_PROGRESS cuối ngày."),\n            ("AI chat", "aiChatController", "Tư vấn gói dịch vụ bằng Gemini, giới hạn tốc độ theo IP."),',
)

must_replace(
    '("Quản trị", "AdminDashboard, AdminOrders, CreateOrder, AdminServices, ServiceForm, AdminGalleries, GalleryForm, AdminPhotographers, PhotographerForm, AdminCustomers, AdminProfile", "Quản lý dữ liệu vận hành studio."),',
    '("Quản trị", "AdminDashboard, AdminOrders, CreateOrder, AdminServices, ServiceForm, AdminGalleries, GalleryForm, AdminCategories, AdminCustomers, AdminProfile", "Quản lý dữ liệu vận hành studio theo route hiện tại."),',
)

insert_after(
    '("Khách hàng", "Home, About, Services, ServiceDetail, Galleries, GalleryDetail, Booking, BookingConfirm, MyBookings, BookingDetail, Profile, Contact, FAQ", "Xem thông tin, đặt lịch, theo dõi booking và cập nhật tài khoản."),\n',
    '            ("Chính sách", "Contract, RefundPolicy", "Hiển thị hợp đồng dịch vụ và chính sách hủy/hoàn cọc để khách xác nhận trước khi đặt lịch."),\n',
)

insert_after(
    'add_paragraph(doc, "Trang AdminServices và ServiceForm hỗ trợ thêm, sửa, ẩn/hiện dịch vụ. Dịch vụ được phân loại thành TRADITIONAL, PHOTOJOURNALISM, COMBO, PRINT và OTHER. Trang AdminGalleries quản lý album công khai bằng Google Drive folder ID, cho phép chọn album nổi bật và bật/tắt trạng thái hiển thị.")\n',
    '    add_paragraph(doc, "Phiên bản hiện tại bổ sung trang AdminCategories cho hai loại danh mục SERVICE và GALLERY. Admin có thể thêm, sửa, xóa, bật/tắt và kéo thả để cập nhật thứ tự hiển thị danh mục. Frontend Services và Galleries gọi API categories để hiển thị bộ lọc động thay vì phụ thuộc hoàn toàn vào danh mục hardcode.")\n',
)

insert_after(
    '        widths=[4.0, 6.0, 6.0],\n    )\n\n    doc.add_page_break()\n',
    '    add_section_heading(doc, "3.7. Tự động hóa email và chính sách dịch vụ")\n    add_paragraph(doc, "Hệ thống đã bổ sung mailService và cronJobs để tự động hóa một phần quy trình chăm sóc khách hàng. Khi booking thanh toán thành công, hệ thống gửi email xác nhận cho khách và email báo đơn mới cho admin. Hằng ngày lúc 7:00, cron job gửi nhắc lịch cho khách có lịch chụp vào ngày mai và nhắc admin về lịch chụp trong ngày. Lúc 23:55, hệ thống tự động chuyển các booking CONFIRMED của ngày hiện tại sang IN_PROGRESS và gửi thông báo cho admin.")\n    add_paragraph(doc, "Frontend cũng có hai trang văn bản pháp lý gồm hợp đồng dịch vụ và chính sách hủy/hoàn cọc. Trong luồng Booking, khách cần xác nhận đã đọc và đồng ý với các chính sách này trước khi tiếp tục. Đây là điểm bổ sung quan trọng vì quy trình đặt lịch dịch vụ ảnh cưới cần làm rõ trách nhiệm, tiền cọc, bảo lưu lịch và thanh toán phần còn lại.")\n\n    doc.add_page_break()\n',
)

must_replace(
    '"Một số menu/route quản trị như contacts hoặc revenue có dấu hiệu là placeholder, cần hoàn thiện route tương ứng hoặc ẩn khỏi sidebar.",',
    '"Một số file quản lý photographer vẫn còn trong frontend/backend nhưng route admin hiện tại chưa mở lại trong App.jsx; cần quyết định bật lại chức năng hoặc dọn code cũ để tránh lệch tài liệu.",',
)

insert_after(
    '"Một số nhãn trạng thái như EXPIRED hoặc PAYMENT_FAILED xuất hiện trong thống kê nhưng chưa nằm trong enum Booking hiện tại; cần thống nhất mô hình trạng thái.",\n',
    '        "Booking model vẫn còn resource_ids tham chiếu Resource trong khi module Resource/Rentals đã được gỡ khỏi route chính; cần dọn schema hoặc khôi phục module nếu nghiệp vụ quay lại.",\n        "Trang hợp đồng/chính sách mô tả cọc cố định 30%, trong khi luồng Booking/Backend hỗ trợ deposit_percent 30%, 50% hoặc 100%; cần thống nhất chính sách hiển thị và logic thanh toán.",\n        "Contact API có endpoint gửi/xác thực OTP nhưng submitContact chưa tự kiểm tra OTP trong cùng request; frontend cần đảm bảo flow verify trước submit hoặc backend cần enforce lại.",\n',
)

must_replace(
    "Thông qua đề tài, sinh viên rèn luyện được kỹ năng phân tích nghiệp vụ, thiết kế dữ liệu, xây dựng API, tổ chức giao diện frontend, xử lý xác thực, tích hợp thanh toán và kiểm thử luồng chức năng. Đề tài cũng giúp hiểu rõ hơn cách chuyển một bài toán vận hành thực tế của studio thành các module phần mềm có thể triển khai.",
    "Thông qua đề tài, sinh viên rèn luyện được kỹ năng phân tích nghiệp vụ, thiết kế dữ liệu, xây dựng API, tổ chức giao diện frontend, xử lý xác thực, tích hợp thanh toán, tổ chức danh mục động, tự động hóa email và kiểm thử luồng chức năng. Đề tài cũng giúp hiểu rõ hơn cách chuyển một bài toán vận hành thực tế của studio thành các module phần mềm có thể triển khai.",
)

path.write_text(text, encoding="utf-8")
print("updated generator for full current report")
