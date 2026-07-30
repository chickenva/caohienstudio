/**
 * Contract.jsx
 * Trang điều khoản hợp đồng và chính sách dịch vụ.
 */
import React from 'react';
import { Typography, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

// Trang nội dung chính sách/hợp đồng mẫu hiển thị cho khách.
const Contract = () => {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '40px 20px', color: '#000', fontFamily: '"Times New Roman", Times, serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2} style={{ color: '#000', fontFamily: '"Times New Roman", Times, serif', textTransform: 'uppercase' }}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </Title>
          <Title level={4} style={{ color: '#000', fontFamily: '"Times New Roman", Times, serif', marginTop: 0 }}>
            Độc lập - Tự do - Hạnh phúc
          </Title>
          <Divider style={{ width: '30%', minWidth: '150px', margin: '20px auto', borderColor: '#000' }} />
          <Title level={1} style={{ color: '#000', fontFamily: '"Times New Roman", Times, serif', textTransform: 'uppercase', marginTop: '20px' }}>
            HỢP ĐỒNG DỊCH VỤ CHỤP ẢNH
          </Title>
          <Text type="secondary" style={{ color: '#000' }}>Cập nhật lần cuối: Tháng 7, 2026</Text>
        </div>

        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#000' }}>
          <Paragraph>
            Hợp đồng này (sau đây gọi là "Hợp đồng") được thỏa thuận và ký kết giữa các bên dưới đây dựa trên việc Bên B (Khách hàng) xác nhận Đặt lịch qua hệ thống website của Bên A (Cao Hiển Studio). Bằng việc tích vào ô "Tôi đã đọc và đồng ý với Hợp đồng dịch vụ & Chính sách", Bên B xác nhận đã hiểu và chấp thuận toàn bộ các điều khoản sau:
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>ĐIỀU 1: THÔNG TIN CÁC BÊN</Title>
          <Paragraph>
            <Text strong style={{ color: '#000' }}>BÊN A (BÊN CUNG CẤP DỊCH VỤ): CAO HIỂN STUDIO</Text><br />
            Đại diện pháp lý / Quản lý: [Tên người đại diện]<br />
            Địa chỉ: [Địa chỉ Studio]<br />
            Điện thoại: [Số điện thoại Studio]<br />
            Email: [Email Studio]<br />
          </Paragraph>
          <Paragraph>
            <Text strong style={{ color: '#000' }}>BÊN B (KHÁCH HÀNG / BÊN THUÊ DỊCH VỤ):</Text><br />
            Là cá nhân/tổ chức có thông tin chi tiết (Họ tên, SĐT, Email) được ghi nhận trong Đơn Đặt Lịch trên hệ thống website của Bên A.
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>ĐIỀU 2: NỘI DUNG DỊCH VỤ</Title>
          <Paragraph>
            Bên A đồng ý cung cấp và Bên B đồng ý sử dụng dịch vụ nhiếp ảnh bao gồm các Gói chụp, Gói đi kèm, Thời gian, và Địa điểm chi tiết như đã được xác nhận trong Đơn Đặt Lịch.
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>ĐIỀU 3: GIÁ TRỊ HỢP ĐỒNG & PHƯƠNG THỨC THANH TOÁN</Title>
          <Paragraph>
            <Text strong style={{ color: '#000' }}>3.1. Giá trị hợp đồng:</Text> Là tổng số tiền được hệ thống tính toán và hiển thị rõ ràng tại bước Thanh Toán Đặt Lịch, bao gồm giá các gói dịch vụ và các ưu đãi (nếu có).
          </Paragraph>
          <Paragraph>
            <Text strong style={{ color: '#000' }}>3.2. Tiền cọc:</Text> Để Hợp đồng có hiệu lực và Bên A tiến hành giữ lịch, Bên B có nghĩa vụ thanh toán trước khoản tiền cọc tương đương <Text strong style={{ color: '#000', textDecoration: 'underline' }}>30% giá trị hợp đồng</Text>.
          </Paragraph>
          <Paragraph>
            <Text strong style={{ color: '#000' }}>3.3. Thanh toán phần còn lại:</Text> Khoản tiền còn lại (70% giá trị hợp đồng + chi phí phát sinh nếu có) sẽ được Bên B thanh toán đầy đủ cho Bên A sau <Text strong style={{ color: '#000' }}>3 đến 4 ngày</Text> kể từ ngày hoàn tất buổi chụp (tức là tại thời điểm Bên A bàn giao toàn bộ sản phẩm/ảnh gốc cho Bên B).
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>ĐIỀU 4: CHÍNH SÁCH HỦY & BẢO LƯU</Title>
          <Paragraph>
            <Text strong style={{ color: '#000' }}>4.1. Hủy hợp đồng từ Bên B:</Text> Nếu Bên B đơn phương chấm dứt hợp đồng/hủy lịch chụp vì bất kỳ lý do cá nhân nào, số tiền cọc 30% sẽ <Text strong style={{ color: '#000', textDecoration: 'underline' }}>không được hoàn lại</Text> để bù đắp chi phí thiệt hại cơ hội cho Bên A.
          </Paragraph>
          <Paragraph>
            <Text strong style={{ color: '#000' }}>4.2. Dời lịch và Bảo lưu:</Text> Thay vì hủy, Bên A khuyến khích Bên B liên hệ để thỏa thuận dời lịch. Bên A đồng ý <Text strong style={{ color: '#000' }}>bảo lưu số tiền cọc trong thời gian tối đa 6 tháng</Text>. Bên B phải thông báo trước ít nhất 24 giờ (đối với gói chụp trong ngày) hoặc 03 ngày (đối với gói chụp nhiều ngày).
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</Title>
          <Paragraph>
            - Đảm bảo có mặt đúng thời gian, địa điểm như đã thỏa thuận.<br />
            - Cung cấp trang thiết bị, nhân sự chuyên nghiệp và thực hiện buổi chụp đúng với chất lượng đã cam kết.<br />
            - Giao trả sản phẩm (ảnh gốc, ảnh chỉnh sửa, sản phẩm in ấn nếu có) đúng thời hạn (thường từ 3-4 ngày đối với ảnh gốc, và theo thỏa thuận đối với ảnh chỉnh sửa).<br />
            - Bên A được quyền sử dụng hình ảnh của Bên B cho mục đích quảng bá trên các kênh truyền thông của Studio, trừ khi Bên B có yêu cầu bằng văn bản về việc bảo mật hình ảnh trước khi buổi chụp diễn ra.
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</Title>
          <Paragraph>
            - Hợp tác, có mặt đúng giờ để buổi chụp diễn ra suôn sẻ.<br />
            - Thanh toán đầy đủ và đúng hạn số tiền còn lại như quy định tại Điều 3.<br />
            - Tự bảo quản tài sản cá nhân trong quá trình chụp ảnh.
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>ĐIỀU 7: ĐIỀU KHOẢN CHUNG</Title>
          <Paragraph>
            Hai bên cam kết thực hiện đúng các điều khoản trong Hợp đồng này. Mọi phát sinh, tranh chấp (nếu có) sẽ được ưu tiên giải quyết thông qua thương lượng, hòa giải trên tinh thần tôn trọng lẫn nhau.
          </Paragraph>
          
          <Divider style={{ borderColor: '#000', margin: '40px 0' }} />
          <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#000' }}>
            (Hợp đồng này có hiệu lực ngay khi Quý khách xác nhận Đặt lịch thành công trên hệ thống)
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contract;
