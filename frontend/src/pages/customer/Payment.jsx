import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Statistic, Spin, message, Button } from "antd";
import { LoadingOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const { Countdown } = Statistic;
const PRIMARY_COLOR = "#9a8a78";

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [deadline] = useState(Date.now() + 10 * 60 * 1000); // 10 phút

  useEffect(() => {
    fetchBooking();
    // Cơ chế Polling: Mỗi 3 giây kiểm tra trạng thái 1 lần
    const timer = setInterval(checkStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchBooking = async () => {
    const res = await axios.get(`http://localhost:5000/api/bookings/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setBooking(res.data);
  };

  const checkStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/bookings/check-status/${id}`,
      );
      if (res.data.status === "Confirmed") {
        message.success("Thanh toán thành công!");
        navigate(`/booking-success/${id}`);
      }
    } catch (e) {
      console.error("Polling error");
    }
  };

  if (!booking) return <Spin fullscreen />;

  const depositAmount = booking.price * 0.2;
  const qrUrl = `https://img.vietqr.io/image/MB-0979767602-compact2.png?amount=${depositAmount}&addInfo=CK%20${id.slice(-6).toUpperCase()}&accountName=CAO%20THI%20HIEN`;

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
        <h2 style={{ fontFamily: "Playfair Display" }}>Thanh toán đặt cọc</h2>
        <div
          style={{ margin: "20px 0", background: "#fff7e6", padding: "10px" }}
        >
          <Countdown
            title="Đơn hàng sẽ hết hạn sau"
            value={deadline}
            onFinish={() => navigate("/booking")}
            format="mm:ss"
          />
        </div>

        <img
          src={qrUrl}
          alt="QR"
          style={{
            width: "250px",
            marginBottom: "20px",
            border: "5px solid #f9f9f9",
          }}
        />

        <div
          style={{
            textAlign: "left",
            background: "#fafafa",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <p>
            Mã đơn: <strong>#{id.slice(-6).toUpperCase()}</strong>
          </p>
          <p>
            Số tiền cần cọc:{" "}
            <strong style={{ color: PRIMARY_COLOR, fontSize: "18px" }}>
              {depositAmount.toLocaleString()}đ
            </strong>
          </p>
          <p>
            Nội dung: <strong>CK {id.slice(-6).toUpperCase()}</strong>
          </p>
        </div>

        <div style={{ color: "#888" }}>
          <LoadingOutlined /> Đang chờ hệ thống xác nhận thanh toán...
        </div>
        <p style={{ fontSize: "12px", marginTop: "10px" }}>
          Vui lòng không tắt trình duyệt cho đến khi nhận được thông báo thành
          công.
        </p>
      </Card>
    </div>
  );
};

export default Payment;
