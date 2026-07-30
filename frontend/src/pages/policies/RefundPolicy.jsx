/**
 * RefundPolicy.jsx
 * Trang chính sách hoàn tiền và hủy lịch.
 */
import React from 'react';
import { Typography, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

// Trang chính sách hoàn/hủy và bảo lưu cọc.
const RefundPolicy = () => {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '40px 20px', color: '#000', fontFamily: '"Times New Roman", Times, serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#000', fontFamily: '"Times New Roman", Times, serif', textTransform: 'uppercase' }}>
            Chính Sách Hủy & Hoàn Cọc
          </Title>
          <Text type="secondary">Cập nhật lần cuối: Tháng 7, 2026</Text>
        </div>

        <Divider style={{ borderColor: '#000' }} />

        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#000' }}>
          <Title level={4} style={{ color: '#000', fontFamily: '"Times New Roman", Times, serif' }}>Điều 1: Quy định Đặt cọc</Title>
          <Paragraph>
            Để giữ lịch chụp và đảm bảo quyền lợi cho cả hai bên, Cao Hiển Studio áp dụng mức đặt cọc cố định là <Text strong style={{ color: '#000', textDecoration: 'underline' }}>30% tổng giá trị hợp đồng/đơn hàng</Text> cho tất cả các gói dịch vụ, bất kể thời gian đặt lịch. Lịch chụp của Quý khách chỉ được xác nhận chính thức sau khi hệ thống ghi nhận khoản tiền cọc này.
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>Điều 2: Chính sách Hủy lịch</Title>
          <Paragraph>
            Trong trường hợp Quý khách (Bên B) chủ động yêu cầu hủy lịch chụp vì bất kỳ lý do cá nhân nào:
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li><Text strong style={{ color: '#000', textDecoration: 'underline' }}>Tiền cọc sẽ KHÔNG được hoàn lại</Text> dưới mọi hình thức. Khoản cọc này được dùng để bù đắp chi phí cơ hội, chi phí setup và giữ lịch của Ekip.</li>
              <li>Quý khách vui lòng cân nhắc kỹ lưỡng trước khi quyết định hủy đơn.</li>
            </ul>
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>Điều 3: Chính sách Dời lịch & Bảo lưu</Title>
          <Paragraph>
            Chúng tôi hiểu rằng có những sự cố ngoài ý muốn khiến Quý khách không thể thực hiện buổi chụp đúng như dự kiến. Trong trường hợp này, thay vì hủy lịch, Cao Hiển Studio (Bên A) hỗ trợ:
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li><Text strong>Bảo lưu tiền cọc trong thời hạn tối đa 6 tháng</Text> kể từ ngày chụp dự kiến ban đầu.</li>
              <li>Quý khách cần thông báo dời lịch cho Studio trước ít nhất <Text strong>24 giờ</Text> (đối với gói chụp studio/ngoại cảnh trong ngày) hoặc <Text strong>03 ngày</Text> (đối với gói chụp xa/nhiều ngày).</li>
              <li>Mỗi hợp đồng/đơn hàng chỉ được hỗ trợ dời lịch tối đa <Text strong>02 lần</Text> trong thời hạn bảo lưu.</li>
            </ul>
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>Điều 4: Trường hợp Bất khả kháng</Title>
          <Paragraph>
            Đối với các trường hợp bất khả kháng (thiên tai, dịch bệnh, hoặc lỗi từ phía Studio khiến buổi chụp không thể diễn ra), hai bên sẽ cùng thỏa thuận để dời lịch sang một thời điểm phù hợp. Nếu không thể sắp xếp được, Studio sẽ hoàn lại 100% tiền cọc cho Quý khách.
          </Paragraph>

          <Title level={4} style={{ color: '#000', marginTop: '30px', fontFamily: '"Times New Roman", Times, serif' }}>Điều 5: Thanh toán phần còn lại</Title>
          <Paragraph>
            Số tiền còn lại (70% giá trị hợp đồng và các chi phí phát sinh nếu có) sẽ được thanh toán sau <Text strong>3-4 ngày</Text> kể từ ngày chụp xong, tại thời điểm Quý khách nhận bàn giao toàn bộ file ảnh gốc/sản phẩm hoàn thiện.
          </Paragraph>

          <Divider style={{ borderColor: '#000', margin: '40px 0 20px 0' }} />
          <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#000' }}>
            Bản chính sách này có giá trị pháp lý tương đương phụ lục hợp đồng dịch vụ chụp ảnh.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
