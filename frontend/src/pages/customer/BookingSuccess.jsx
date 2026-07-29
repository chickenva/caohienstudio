import React, { useEffect, useState } from "react";
import { Result, Button, Card, Descriptions, Divider } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

// Trang thông báo đặt lịch thành công trong luồng cũ.
const BookingSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      const res = await axios.get(`http://localhost:5000/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBooking(res.data);
    };
    fetchDetail();
  }, [id]);

  if (!booking) return null;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <Result
        status="success"
        title="ĐẶT LỊCH THÀNH CÔNG!"
        subTitle={`Mã đơn hàng: #${id.slice(-6).toUpperCase()}. Cảm ơn bạn đã tin tưởng Cao Hiển Studio.`}
        extra={[
          <Button key="home" onClick={() => navigate("/")}>
            VỀ TRANG CHỦ
          </Button>,
          <Button
            key="buy"
            type="primary"
            style={{ background: "#9a8a78", border: "none" }}
            onClick={() => navigate("/customer/my-bookings")}
          >
            QUẢN LÝ ĐƠN ĐẶT LỊCH
          </Button>,
        ]}
      />

      <Card
        title="Thông tin đơn hàng"
        bordered={false}
        style={{ marginTop: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Gói dịch vụ">
            {booking.serviceName}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày chụp">
            {dayjs(booking.appointmentDate).format("DD/MM/YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Địa điểm">
            {booking.location}
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền đã cọc">
            {(booking.price * 0.2).toLocaleString()}đ
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền còn lại">
            {(booking.price * 0.8).toLocaleString()}đ (Thanh toán tại Studio)
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default BookingSuccess;
