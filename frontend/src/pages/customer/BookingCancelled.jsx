import React from "react";
import { Result, Button, Typography } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarOutlined, UnorderedListOutlined } from "@ant-design/icons";

const { Text } = Typography;

const BookingCancelled = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận thông tin từ state khi navigate
  const { bookingId, serviceName } = location.state || {};

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <Result
          status="error"
          title={
            <span style={{ fontSize: 26, fontWeight: 700, color: "#ff4d4f" }}>
              Đơn Đặt Lịch Đã Được Hủy
            </span>
          }
          subTitle={
            <div style={{ marginTop: 8 }}>
              {serviceName && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Dịch vụ: </Text>
                  <Text strong>{serviceName}</Text>
                </div>
              )}
              {bookingId && (
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary">Mã đơn: </Text>
                  <Text code>#{bookingId.slice(-8).toUpperCase()}</Text>
                </div>
              )}
              <Text type="secondary">
                Đơn đặt lịch của bạn đã được hủy thành công. Nếu bạn thay đổi
                ý định, bạn có thể đặt lịch mới bất cứ lúc nào.
              </Text>
            </div>
          }
          extra={[
            <Button
              key="rebook"
              type="primary"
              size="large"
              icon={<CalendarOutlined />}
              onClick={() => navigate("/booking")}
              style={{
                background: "#9a8a78",
                borderColor: "#9a8a78",
                height: 46,
                padding: "0 28px",
              }}
            >
              Đặt Lịch Mới
            </Button>,
            <Button
              key="list"
              size="large"
              icon={<UnorderedListOutlined />}
              onClick={() => navigate("/customer/my-bookings")}
              style={{ height: 46, padding: "0 28px" }}
            >
              Xem Danh Sách Đơn
            </Button>,
          ]}
        />
      </div>
    </div>
  );
};

export default BookingCancelled;
