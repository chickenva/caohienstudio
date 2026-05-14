import React, { useState, useEffect } from "react";
import { Table, Tag, Button, message, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { EyeOutlined, CreditCardOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repayLoadingId, setRepayLoadingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/bookings/my-bookings",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const visibleBookings = res.data.filter(
        (booking) =>
          booking.status !== "PAYMENT_FAILED" && booking.status !== "EXPIRED",
      );

      setBookings(visibleBookings);
    } catch (err) {
      message.error("Không thể tải danh sách lịch chụp");
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (bookingId) => {
    setRepayLoadingId(bookingId);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `http://localhost:5000/api/bookings/${bookingId}/repay`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        message.error("Không tìm thấy link thanh toán");
      }
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tạo lại link thanh toán",
      );
    } finally {
      setRepayLoadingId(null);
    }
  };

  const renderStatus = (status) => {
    let color = "blue";
    let text = status;

    if (status === "PENDING") {
      color = "gold";
      text = "Chờ thanh toán";
    } else if (status === "DEPOSITED") {
      color = "cyan";
      text = "Đã đặt cọc";
    } else if (status === "COMPLETED") {
      color = "green";
      text = "Hoàn thành";
    } else if (status === "CANCELED") {
      color = "red";
      text = "Đã hủy";
    }

    return (
      <Tag color={color} style={{ borderRadius: 0, letterSpacing: "1px" }}>
        {text.toUpperCase()}
      </Tag>
    );
  };

  const columns = [
    {
      title: "NGÀY/GIỜ CHỤP",
      key: "shoot_time",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#333" }}>
            {dayjs(record.start_time).format("DD/MM/YYYY")}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            {dayjs(record.start_time).format("HH:mm")} -{" "}
            {dayjs(record.end_time).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "GÓI DỊCH VỤ",
      dataIndex: "service_id",
      key: "service_id",
      render: (service) => (
        <span style={{ fontWeight: 600, color: PRIMARY_COLOR }}>
          {service?.name || "Dịch vụ"}
        </span>
      ),
    },
    {
      title: "THỢ CHỤP",
      dataIndex: "photographer_ids",
      key: "photographer_ids",
      render: (photographers) => {
        if (!photographers || photographers.length === 0) {
          return <span style={{ color: "#999" }}>Chưa có</span>;
        }

        return (
          <div>
            {photographers.map((p) => (
              <div key={p._id} style={{ fontWeight: 500 }}>
                {p.full_name}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: renderStatus,
    },
    {
      title: "TỔNG TIỀN",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => (
        <span style={{ fontWeight: "bold" }}>
          {amount?.toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          {record.status === "PENDING" && (
            <Button
              icon={<CreditCardOutlined />}
              loading={repayLoadingId === record._id}
              onClick={() => handleRepay(record._id)}
              style={{
                borderRadius: 0,
                fontSize: "12px",
                letterSpacing: "1px",
                background: PRIMARY_COLOR,
                color: "#fff",
                border: "none",
              }}
            >
              THANH TOÁN
            </Button>
          )}

          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`/customer/my-bookings/${record._id}`)}
            style={{ borderRadius: 0, fontSize: "12px", letterSpacing: "1px" }}
          >
            CHI TIẾT
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 20px" }}>
      <h1
        style={{
          fontFamily: FONT_SERIF,
          fontSize: "32px",
          textAlign: "center",
          marginBottom: "40px",
          color: "#333",
        }}
      >
        Lịch chụp của tôi
      </h1>

      <Table
        columns={columns}
        dataSource={bookings}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        style={{
          background: "#fff",
          border: "1px solid #eaeaea",
          boxShadow: "0 5px 15px rgba(0,0,0,0.02)",
        }}
      />
    </div>
  );
};

export default MyBookings;
