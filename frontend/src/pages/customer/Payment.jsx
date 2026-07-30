/**
 * Payment.jsx
 * Trang thanh toán cọc qua VNPay.
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Statistic, Spin, message, Button } from "antd";
import { LoadingOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const PRIMARY_COLOR = "#9a8a78";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

// Trang thanh toán cũ/legacy, giữ lại để tương thích route hiện có.
const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deadline] = useState(Date.now() + 10 * 60 * 1000); // 10 phút

  useEffect(() => {
    fetchBooking();
    // Polling mỗi 3 giây để kiểm tra thanh toán
    const timer = setInterval(checkStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBooking(res.data.booking);
      setLoading(false);
    } catch (e) {
      message.error("Không thể tải thông tin đơn hàng");
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/bookings/${id}/check-status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (
        res.data.status === "DEPOSITED" ||
        res.data.payment_status === "SUCCESS"
      ) {
        message.success("Thanh toán thành công!");
        navigate(`/booking-success/${id}`);
      }
    } catch (e) {
      // Tiếp tục polling
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      // Gọi API tạo lại link VNPay cho đơn hàng hiện tại
      const res = await axios.post(
        `${API_URL}/bookings/${id}/repay`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      // Redirect tới VNPay để thanh toán
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (error) {
      message.error(
        "Lỗi khởi tạo thanh toán: " + (error.response?.data?.message || "Vui lòng thử lại sau"),
      );
      setLoading(false);
    }
  };

  if (loading) return <Spin fullscreen />;
  if (!booking) return <div>Không tìm thấy đơn hàng</div>;

  const depositAmount = booking.total_amount * 0.3; // Cọc 30%

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <Card
        bordered={false}
        style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}
      >
        <h2 style={{ fontFamily: "Playfair Display", marginBottom: "30px" }}>
          Thanh toán đặt cọc
        </h2>

        <div
          style={{
            textAlign: "left",
            background: "#fafafa",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <p>
            <strong>Dịch vụ:</strong> {booking.service_id?.name}
          </p>
          <p>
            <strong>Ngày chụp:</strong>{" "}
            {new Date(booking.start_time).toLocaleDateString("vi-VN")}
          </p>
          <p>
            <strong>Địa điểm:</strong> {booking.location}
          </p>
          <p>
            <strong>Giá gốc:</strong>{" "}
            <span style={{ fontSize: "16px" }}>
              {booking.total_amount?.toLocaleString()}đ
            </span>
          </p>
          <p style={{ borderTop: "1px solid #e0e0e0", paddingTop: "10px" }}>
            <strong style={{ fontSize: "18px", color: PRIMARY_COLOR }}>
              Số tiền cọc (30%):
            </strong>
            <br />
            <span
              style={{
                fontSize: "24px",
                color: PRIMARY_COLOR,
                fontWeight: "bold",
              }}
            >
              {depositAmount.toLocaleString()}đ
            </span>
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          style={{
            width: "100%",
            height: "50px",
            fontSize: "16px",
            backgroundColor: PRIMARY_COLOR,
            marginBottom: "15px",
          }}
          onClick={handlePayment}
          loading={loading}
        >
          Thanh toán qua VNPay
        </Button>

        <div style={{ color: "#888", marginTop: "20px" }}>
          <LoadingOutlined style={{ marginRight: "8px" }} />
          Đang chờ hệ thống xác nhận thanh toán...
        </div>
        <p style={{ fontSize: "12px", marginTop: "10px", color: "#999" }}>
          Vui lòng không tắt trình duyệt cho đến khi nhận được thông báo thành
          công.
        </p>
      </Card>
    </div>
  );
};

export default Payment;

