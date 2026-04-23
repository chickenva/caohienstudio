import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tag, Button, message, Descriptions, Spin } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repayLoading, setRepayLoading] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooking(res.data);
    } catch (err) {
      message.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    setRepayLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/bookings/${id}/repay`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      message.error("Lỗi khởi tạo thanh toán lại");
    } finally {
      setRepayLoading(false);
    }
  };

  if (loading) return <Spin fullscreen tip="Đang tải..." />;
  if (!booking)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Không tìm thấy đơn hàng
      </div>
    );

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      <Card
        title={<span style={{ fontSize: "20px" }}>CHI TIẾT ĐƠN ĐẶT LỊCH</span>}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Mã đơn hàng">
            {booking._id}
          </Descriptions.Item>
          <Descriptions.Item label="Dịch vụ">
            {booking.serviceName}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày chụp">
            {dayjs(booking.appointmentDate).format("DD/MM/YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Địa điểm">
            {booking.location}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng giá trị">
            {booking.price?.toLocaleString()}đ
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền cọc cần trả">
            <span style={{ fontWeight: "bold", color: "#cf1322" }}>
              {booking.depositAmount?.toLocaleString()}đ
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={booking.status === "Confirmed" ? "green" : "orange"}>
              {booking.status === "Confirmed"
                ? "ĐÃ THANH TOÁN CỌC"
                : "CHỜ THANH TOÁN"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {booking.status === "Pending" && (
          <div
            style={{
              marginTop: 30,
              textAlign: "center",
              background: "#fffbe6",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #ffe58f",
            }}
          >
            <p style={{ fontSize: "16px", marginBottom: "15px" }}>
              Đơn hàng của bạn đang chờ thanh toán cọc để được xác nhận chính
              thức.
            </p>
            <Button
              type="primary"
              size="large"
              onClick={handleRepay}
              loading={repayLoading}
              style={{
                background: "#52c41a",
                borderColor: "#52c41a",
                height: "50px",
                padding: "0 40px",
              }}
            >
              THANH TOÁN NGAY QUA VNPAY
            </Button>
          </div>
        )}

        <Button
          onClick={() => navigate("/my-bookings")}
          style={{ marginTop: 20 }}
        >
          Quay lại danh sách
        </Button>
      </Card>
    </div>
  );
};

export default BookingDetail;
