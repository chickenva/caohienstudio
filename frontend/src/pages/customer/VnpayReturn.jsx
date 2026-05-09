import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Result, Button, Spin } from "antd";
import axios from "axios";

const VnpayReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("processing"); // 'processing', 'success', 'error'

  useEffect(() => {
    const handleReturn = async () => {
      const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
      const token = localStorage.getItem("token");

      // LOGIC MỚI: Gom toàn bộ tham số VNPay trên URL thành một Object
      const vnpayData = Object.fromEntries(searchParams.entries());

      if (vnp_ResponseCode === "00") {
        try {
          // LOGIC MỚI: Gửi dữ liệu xuống Backend để kiểm tra chữ ký (Bảo mật 100%)
          // Backend sẽ tự động cập nhật bảng Payment -> SUCCESS và Booking -> DEPOSITED
          await axios.post(
            `http://localhost:5000/api/bookings/vnpay-return`,
            vnpayData,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setPaymentStatus("success");
        } catch (err) {
          console.error("Update DB Error:", err);
          setPaymentStatus("error");
        }
      } else {
        setPaymentStatus("error");
      }
      setLoading(false);
    };
    handleReturn();
  }, [searchParams]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" tip="Đang kiểm tra giao dịch..." />
      </div>
    );

  // GIAO DIỆN GIỮ NGUYÊN 100%
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
            ? "Lịch hẹn của bạn đã được xác nhận. Hẹn gặp bạn tại studio!"
            : "Giao dịch không thành công hoặc đã bị hủy. Bạn có thể thử thanh toán lại trong chi tiết đơn hàng."
        }
        extra={[
          <Button key="home" onClick={() => navigate("/")}>
            TRANG CHỦ
          </Button>,
          <Button
            key="list"
            type="primary"
            onClick={() => navigate("/my-bookings")}
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
