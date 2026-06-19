import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Button, message, Space, Select, Card, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import { EyeOutlined, CreditCardOutlined, ReloadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const API_URL = "http://localhost:5000/api";
const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ thanh toán", value: "PENDING" },
  { label: "Đã đặt cọc", value: "DEPOSITED" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đã hủy", value: "CANCELED" },
];

const formatCurrency = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

const isExpiredPendingBooking = (booking) => {
  if (booking.status !== "PENDING") return false;
  if (!booking.expires_at) return true;

  return dayjs(booking.expires_at).isSame(dayjs()) ||
    dayjs(booking.expires_at).isBefore(dayjs());
};

const isPayableBooking = (booking) => {
  return (
    booking.status === "PENDING" &&
    booking.expires_at &&
    dayjs(booking.expires_at).isAfter(dayjs())
  );
};

const getDisplayOrderStatus = (booking) => {
  if (isExpiredPendingBooking(booking)) {
    return "CANCELED";
  }

  if (booking.status === "EXPIRED" || booking.status === "PAYMENT_FAILED") {
    return "CANCELED";
  }

  return booking.status;
};

const getDisplayPaymentStatus = (booking) => {
  if (isExpiredPendingBooking(booking)) {
    return "Chưa thanh toán";
  }

  if (booking.payment_status_text === "Đã hết hạn") {
    return "Chưa thanh toán";
  }

  return booking.payment_status_text || "Chưa thanh toán";
};

const renderOrderStatus = (status) => {
  const map = {
    PENDING: { color: "gold", text: "Chờ thanh toán" },
    DEPOSITED: { color: "cyan", text: "Đã đặt cọc" },
    CONFIRMED: { color: "blue", text: "Đã xác nhận" },
    IN_PROGRESS: { color: "geekblue", text: "Đang thực hiện" },
    COMPLETED: { color: "green", text: "Hoàn thành" },
    CANCELED: { color: "red", text: "Đã hủy" },

    // Chống dữ liệu cũ
    EXPIRED: { color: "red", text: "Đã hủy" },
    PAYMENT_FAILED: { color: "red", text: "Đã hủy" },
  };

  const item = map[status] || { color: "default", text: status || "Không rõ" };

  return (
    <Tag color={item.color} style={{ borderRadius: 0, letterSpacing: "1px" }}>
      {item.text.toUpperCase()}
    </Tag>
  );
};

const renderPaymentStatus = (text) => {
  const finalText = text === "Đã hết hạn" ? "Chưa thanh toán" : text;

  let color = "orange";

  if (finalText === "Đã thanh toán") color = "blue";
  if (finalText === "Đã tất toán") color = "green";

  return (
    <Tag color={color} style={{ borderRadius: 0, letterSpacing: "1px" }}>
      {(finalText || "Chưa thanh toán").toUpperCase()}
    </Tag>
  );
};

const getPaidAmountColor = (amount) => {
  return Number(amount || 0) > 0 ? "#389e0d" : "#000";
};

const getRemainingAmountColor = (amount) => {
  return Number(amount || 0) > 0 ? "#cf1322" : "#000";
};

const MyBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [repayLoadingId, setRepayLoadingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải danh sách lịch chụp",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return bookings;

    if (statusFilter === "PENDING") {
      return bookings.filter(
        (booking) =>
          booking.status === "PENDING" && !isExpiredPendingBooking(booking),
      );
    }

    if (statusFilter === "CANCELED") {
      return bookings.filter(
        (booking) =>
          getDisplayOrderStatus(booking) === "CANCELED",
      );
    }

    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const handleRepay = async (booking) => {
    if (!isPayableBooking(booking)) {
      message.warning("Đơn hàng đã quá hạn thanh toán. Vui lòng làm mới danh sách.");
      fetchBookings();
      return;
    }

    setRepayLoadingId(booking._id);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/bookings/${booking._id}/repay`,
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
      fetchBookings();
    } finally {
      setRepayLoadingId(null);
    }
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
            {photographers.map((photographer) => (
              <div key={photographer._id} style={{ fontWeight: 500 }}>
                {photographer.full_name}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "TRẠNG THÁI ĐƠN",
      key: "status",
      render: (_, record) => renderOrderStatus(getDisplayOrderStatus(record)),
    },
    {
      title: "THANH TOÁN",
      key: "payment_status_text",
      render: (_, record) => renderPaymentStatus(getDisplayPaymentStatus(record)),
    },
    {
      title: "TỔNG GIÁ TRỊ",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => (
        <span style={{ fontWeight: "bold" }}>{formatCurrency(amount)}</span>
      ),
    },
    {
      title: "ĐÃ THANH TOÁN",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (amount) => (
        <span
          style={{
            color: getPaidAmountColor(amount),
            fontWeight: 600,
          }}
        >
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: "CÒN LẠI",
      dataIndex: "remaining_amount",
      key: "remaining_amount",
      render: (amount) => (
        <span
          style={{
            color: getRemainingAmountColor(amount),
            fontWeight: 600,
          }}
        >
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          {isPayableBooking(record) && (
            <Button
              icon={<CreditCardOutlined />}
              loading={repayLoadingId === record._id}
              onClick={() => handleRepay(record)}
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
            style={{
              borderRadius: 0,
              fontSize: "12px",
              letterSpacing: "1px",
            }}
          >
            CHI TIẾT
          </Button>
        </Space>
      ),
    },
  ];

  const total = bookings.length;
  const pending = bookings.filter((item) => item.status === "PENDING").length;
  const deposited = bookings.filter((item) => item.status === "DEPOSITED").length;
  const completed = bookings.filter((item) => item.status === "COMPLETED").length;

  return (
    <div style={{ maxWidth: "1250px", margin: "40px auto", padding: "0 20px" }}>
      <h1
        style={{
          fontFamily: FONT_SERIF,
          fontSize: "34px",
          textAlign: "center",
          marginBottom: "12px",
          color: "#333",
        }}
      >
        Lịch chụp của tôi
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#777",
          marginBottom: "32px",
        }}
      >
        Theo dõi lịch sử đặt lịch, trạng thái thanh toán và chi tiết từng đơn.
      </p>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Tổng đơn</div>
            <strong style={{ fontSize: 24 }}>{total}</strong>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Chờ thanh toán</div>
            <strong style={{ fontSize: 24 }}>{pending}</strong>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Đã đặt cọc</div>
            <strong style={{ fontSize: 24 }}>{deposited}</strong>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Hoàn thành</div>
            <strong style={{ fontSize: 24 }}>{completed}</strong>
          </Card>
        </Col>
      </Row>

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          style={{ minWidth: 220 }}
        />

        <Button icon={<ReloadOutlined />} onClick={fetchBookings} loading={loading}>
          Làm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 1100 }}
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