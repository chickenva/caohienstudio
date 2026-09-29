# Rubric chấm đồ án Công nghệ phần mềm — ghi nhớ cho tài liệu Word

Người dùng yêu cầu các file Word được tạo hoặc chỉnh sửa cho họ trong workspace này tuân theo rubric trong `Rubric_Do_An_Mon_Hoc_CNPM_sinhvien.docx` (bản nguồn hiện được lưu tại `C:\Users\User\Downloads`). Áp dụng các tiêu chí phù hợp với loại tài liệu; không chèn nội dung chấm điểm vào tài liệu nếu người dùng không yêu cầu. Khi chỉnh luận văn hoặc hồ sơ đồ án, dùng toàn bộ tiêu chí dưới đây làm chuẩn nội dung và kiểm tra.

## Nguyên tắc cốt lõi

- Sinh viên có thể dùng LLM và Agentic AI; việc dùng AI tự nó không bị trừ điểm. Phải minh bạch, kiểm chứng đầu ra và làm chủ nội dung.
- Đánh giá sự phù hợp với mục tiêu, phạm vi, sản phẩm và khối lượng đã đăng ký; không áp đặt lựa chọn công nghệ cá nhân.
- Mọi nhận định về mức đạt cần có minh chứng cụ thể. Thiếu minh chứng thì tiêu chí tương ứng không được xếp từ Mức 4 trở lên. Không tự tạo số liệu, khảo sát, kết quả thử nghiệm, nguồn tham khảo hay bằng chứng.
- Nội dung phải được sinh viên giải thích được và phù hợp với đề tài. Dùng AI không đồng nghĩa với đạo văn; nội dung không làm chủ được có thể kích hoạt quy trình đạo văn.

## Thang điểm tổng 100

| Tiêu chí | Điểm tối đa | Nội dung chính |
|---|---:|---|
| TC1 | 10 | Tính thực tiễn và hiểu biết vấn đề nghiên cứu |
| TC2.1 | 10 | Phân tích nghiệp vụ, yêu cầu, thiết kế và giải pháp |
| TC2.2 | 10 | Độ hoàn thiện sản phẩm và khối lượng hoàn thành |
| TC2.3 | 5 | Làm chủ, khai báo và kiểm soát LLM/Agentic AI |
| TC2.4 | 10 | Chất lượng mã nguồn và quản lý chất lượng |
| TC2.5 | 5 | Kiểm thử phần mềm |
| TC2.6 | 5 | CI/CD và vận hành |
| TC2.7 | 5 | Thực nghiệm người dùng và cải tiến theo phản hồi |
| TC3 | 10 | Thuyết trình và demo |
| TC4 | 10 | Tổng hợp kiến thức, luận văn, tài liệu tham khảo, hình thức |
| TC5 | 15 | Trả lời câu hỏi hội đồng |
| TC6 | 5 | Kết quả nổi bật có minh chứng |

TC2 là 50 điểm, bằng tổng TC2.1–TC2.7. Mỗi tiêu chí chia 5 mức: Mức 5 90–100%; Mức 4 75–89%; Mức 3 60–74%; Mức 2 40–59%; Mức 1 0–39%. Dùng khoảng điểm ghi trong phiếu chấm; nếu hồ sơ nằm giữa hai mức và thiếu minh chứng, chọn mức thấp hơn. TC6 chấm theo kết quả nổi bật, mỗi kết quả hợp lệ được xem xét 1–5 điểm, tổng TC6 không quá 5.

## Ngưỡng và nội dung cần thể hiện

- **TC1:** kiểm chứng nhu cầu thực tế; mô tả bối cảnh, người dùng, vấn đề và phạm vi; so sánh giải pháp hiện có; chốt KPI định lượng ở Bước 3. Ngưỡng Mức 5 gồm ít nhất 3 bên liên quan, so sánh ít nhất 3 giải pháp và 5 KPI. Bảng metric xác nhận ngưỡng 5 KPI vì một dòng trong mô tả chi tiết bị lỗi ký tự.
- **TC2.1:** yêu cầu có acceptance criteria; business rules/từ điển dữ liệu; sơ đồ thiết kế phải khớp sản phẩm; NFR có ràng buộc định lượng; giải thích lựa chọn và đánh đổi. Mức 5 nêu 100% user story/use case có acceptance criteria, ít nhất 4 loại sơ đồ khớp mã nguồn và ít nhất 5 NFR định lượng.
- **TC2.2:** đo chức năng chính và khối lượng so với cam kết Bước 3; thể hiện môi trường triển khai, demo, xử lý ngoại lệ, kiểm tra dữ liệu, phân quyền, logging và trạng thái biên. Mức 5 hướng tới đủ 100% chức năng/khối lượng cam kết, bản chạy production hoặc staging công khai có người dùng thật, demo không lỗi.
- **TC2.3:** ghi AI Usage Log có thể đối chiếu Git (công cụ, phạm vi, prompt chính, phần AI sinh và phần sinh viên sửa); giải thích được mã; nêu lỗi/ảo giác AI đã phát hiện và cách sửa; có quy trình review, kiểm chứng tài liệu chính thức, giấy phép và dữ liệu nhạy cảm. Trường hợp không dùng AI: bản cam kết cùng lịch sử Git đều theo tiến độ và báo cáo tuần có thể đạt trọn 5 điểm.
- **TC2.4:** mã phân lớp/mô-đun, tên và coding convention nhất quán; lint và phân tích tĩnh; giới hạn duplication/issue; lịch sử Git và PR review đều theo kỳ; không lộ secret; README/hướng dẫn triển khai và nợ kỹ thuật. Ngưỡng Mức 5 gồm 0 lỗi lint/Blocker/Critical, duplication không quá 3%, commit ít nhất 90% số tuần, PR có review cho ít nhất 90% thay đổi, không có secret bị lộ.
- **TC2.5:** có kế hoạch và nhiều tầng kiểm thử; test truy vết acceptance criteria, gồm luồng âm/biên; báo cáo coverage, tự động hóa, trạng thái CI và defect. Mức 5: ít nhất 4 tầng, coverage mô-đun lõi ít nhất 70%, tự động hóa ít nhất 70%, 100% test pass ở lần CI cuối và không còn defect Critical/Blocker.
- **TC2.6:** pipeline chạy thực tế qua build, lint/static analysis, test, security/dependency scan, đóng gói và deploy; theo dõi tỉ lệ build xanh, số lần deploy, thời gian staging, quản lý secret, version/rollback, health check/log/alert. Mức 5 nêu ít nhất 6 chặng, build xanh ít nhất 90%, ít nhất 10 lần deploy tự động, lên staging trong tối đa 15 phút và có monitoring/cảnh báo.
- **TC2.7:** thử nghiệm với đúng nhóm người dùng mục tiêu, có kịch bản và dữ liệu; đo task success và SUS/CSAT/NPS; cải tiến theo phản hồi và đo lại. Mức 5: ít nhất 10 người dùng thật, task success ít nhất 90%, SUS ít nhất 80 và ít nhất một vòng cải tiến có so sánh trước–sau.
- **TC3:** cấu trúc rõ, đúng thời gian, slide trực quan ít chữ, trình bày không đọc slide; demo trực tiếp trên môi trường triển khai và có minh chứng pipeline, test, thực nghiệm. Mức 5 giới hạn sai lệch thời gian ở 5% và demo không lỗi.
- **TC4:** lập luận xuyên suốt vấn đề → lý thuyết → giải pháp → thực nghiệm → bàn luận → kết luận; tổng hợp và phản biện nguồn, nhất là tài liệu ngoại ngữ; trích dẫn nhất quán; kiểm soát trùng lặp; chính tả, định dạng, đánh số và dẫn chiếu hình/bảng. Mức 5 nêu ít nhất 5 tài liệu ngoại ngữ chất lượng, trùng lặp không quá 20% (không tính trích dẫn hợp lệ), không lỗi chính tả/định dạng, 100% hình/bảng được đánh số và dẫn chiếu.
- **TC5:** trả lời đúng trọng tâm và câu hỏi kỹ thuật; giải thích lựa chọn, mã, kiểm thử, triển khai và phần có AI hỗ trợ; nhận biết hạn chế, lập luận có căn cứ. Mức 5 nêu ít nhất 90% câu hỏi đúng trọng tâm và ít nhất 95% câu hỏi kỹ thuật chính xác.
- **TC6:** chỉ tính bài báo/hội nghị, giải thưởng, triển khai thực tế có xác nhận, sở hữu trí tuệ, đóng góp mã nguồn mở được chấp nhận, kết quả vượt KPI hoặc đổi mới kỹ thuật khi có minh chứng và sinh viên giải thích được vai trò của mình.

## Quy trình, đạo văn và các mức chặn

- Quy trình có 4 bước: đề tài được duyệt; sinh viên đăng ký và phân công; báo cáo tiến độ tối thiểu hằng tuần và chốt bằng văn bản sản phẩm cuối cùng cùng metric trước khi qua 50% thời gian; phản biện/chấm theo rubric và hồ sơ.
- Tại bảo vệ, hội đồng chọn ngẫu nhiên ít nhất 5 nội dung (ít nhất 2 trong luận văn, 3 trong mã nguồn/minh chứng); sinh viên có tối đa 3 phút cho mỗi nội dung để giải thích. V1 có thể làm tiêu chí chứa nội dung nhận 0; V2 làm TC2 nhận 0; V3 hoặc V4 có thể làm toàn đồ án nhận 0 và chuyển xử lý theo quy chế.
- Các cổng G1–G10 phải được áp dụng trước khi cộng tổng: thiếu cam kết sản phẩm/metric đúng hạn có thể khiến không đủ điều kiện bảo vệ; báo cáo tiến độ thưa hoặc repo không build/không cấp quyền làm giảm mức TC2.2/TC2.4; thiếu AI log lẫn cam kết không dùng AI chặn TC2.3 ở Mức 2; khai báo AI mâu thuẫn làm TC2.3 = 0 và kích hoạt kiểm tra; thiếu cả test tự động lẫn tài liệu test thủ công chặn TC2.5 ở Mức 1; không có CI/CD chạy được chặn TC2.6 ở Mức 2; không thử nghiệm người dùng chặn TC2.7 ở Mức 1; sản phẩm không tương xứng cam kết chặn TC2.2 ở Mức 2; V2 trở lên áp dụng hệ quả đạo văn.
- Hồ sơ cốt lõi: phiếu đăng ký/phân công; log tiến độ; cam kết sản phẩm và metric; repo Git; AI Usage Log hoặc cam kết không dùng AI; SRS/SDD và sơ đồ; báo cáo phân tích tĩnh/quét secret; kế hoạch và kết quả test; pipeline/deploy; báo cáo user study; kiểm tra trùng lặp và references; minh chứng TC6. Thiếu minh chứng thì không xếp tiêu chí tương ứng từ Mức 4 trở lên.

## Cách áp dụng khi làm file Word

Với luận văn, báo cáo đồ án, SRS/SDD, nhật ký AI, hồ sơ kiểm thử, báo cáo thực nghiệm và tài liệu bảo vệ, kiểm tra tiêu chí liên quan ở trên, bảo đảm mọi số liệu/khẳng định có nguồn hoặc minh chứng, thuật ngữ nhất quán, nguồn trích dẫn rõ, hình/bảng được đánh số và dẫn chiếu. Không bịa kết quả còn thiếu; đánh dấu chỗ cần người dùng cung cấp hoặc xác minh. Với loại Word không liên quan trực tiếp đến đồ án, giữ các chuẩn chất lượng có thể áp dụng (rõ ràng, nhất quán, có căn cứ) mà không ép nội dung rubric vào tài liệu.
