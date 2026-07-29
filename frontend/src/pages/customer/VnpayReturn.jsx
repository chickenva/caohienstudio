import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Result, Button, Spin } from "antd";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";

// Trang nhận kết quả redirect từ VNPay sau khi khách thanh toán cọc.
const VnpayReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("processing");

  useEffect(() => {
    // Gửi toàn bộ params VNPay về backend để xác thực chữ ký và cập nhật booking.
    const handleReturn = async () => {
      try {
        const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
        const vnpayData = Object.fromEntries(searchParams.entries());

        if (!vnp_ResponseCode) {
          setPaymentStatus("error");
          return;
        }

        try {
          await axios.post(
            `${API_URL}/bookings/vnpay-return`,
            vnpayData,
          );
          setPaymentStatus(vnp_ResponseCode === "00" ? "success" : "error");
        } catch (apiErr) {
          // Backend vẫn có thể đã cập nhật Payment FAILED rồi trả 400 cho giao dịch thất bại.
          console.error("VNPay backend update error:", apiErr);
          setPaymentStatus("error");
        }
      } catch (err) {
        console.error("VNPay return error:", err);
        setPaymentStatus("error");
      } finally {
        setLoading(false);
      }
    };

    handleReturn();
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" tip="Đang kiểm tra giao dịch..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "80px auto", padding: "0 20px" }}>
      <Result
        status={paymentStatus === "success" ? "success" : "error"}
        title={
          paymentStatus === "success"
            ? "ĐẶT LỊCH THÀNH CÔNG!"
            : "THANH TOÁN THẤT BẠI"
        }
        subTitle={
          paymentStatus === "success"
            ? "Lịch hẹn của bạn đã được ghi nhận. Nhân viên sẽ liên hệ xác nhận với bạn trong vòng 24h."
            : "Giao dịch không thành công hoặc đã bị hủy. Bạn có thể thử thanh toán lại trong chi tiết đơn hàng."
        }
        extra={[
          <Button key="home" onClick={() => navigate("/")}>
            TRANG CHỦ
          </Button>,
          <Button
            key="list"
            type="primary"
            onClick={() => navigate("/customer/my-bookings")}
            style={{ background: "#333", border: "none" }}
          >
            XEM ĐƠN ĐẶT LỊCH
          </Button>,
        ]}
      />
    </div>
  );
};

export default VnpayReturn;
