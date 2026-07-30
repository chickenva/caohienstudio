/**
 * MyBookings.jsx
 * Trang lịch sử đặt lịch của khách hàng đã đăng nhập.
 */
import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Button, message, Space, Select, Card, Row, Col, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { EyeOutlined, ReloadOutlined, CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../Home.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");
const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Đã gửi yêu cầu", value: "REQUESTED" },
  { label: "Đã gửi hợp đồng", value: "CONTRACT_SENT" },
  { label: "Chờ thanh toán", value: "WAITING_PAYMENT" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đã hủy", value: "CANCELED" },
  // Legacy (ẩn trong filter nhưng vẫn hiển thị nếu có dữ liệu cũ)
];

// Định dạng tiền VND trong bảng đơn của khách.
const formatCurrency = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

// Render tag trạng thái đơn theo luồng booking mới và dữ liệu legacy.
const renderOrderStatus = (status) => {
  const map = {
    // Luồng mới
    REQUESTED: { color: "orange", text: "Đã gửi yêu cầu" },
    CONTRACT_SENT: { color: "purple", text: "Hợp đồng đã gửi" },
    WAITING_PAYMENT: { color: "gold", text: "Chờ thanh toán" },
    CONFIRMED: { color: "blue", text: "Đã xác nhận" },
    IN_PROGRESS: { color: "geekblue", text: "Đang thực hiện" },
    COMPLETED: { color: "green", text: "Hoàn thành" },
    CANCELED: { color: "red", text: "Đã hủy" },
    // Legacy
    PENDING: { color: "gold", text: "Chờ thanh toán" },
    DEPOSITED: { color: "cyan", text: "Đã đặt cọc" },
    // Fallback
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

// Render tag trạng thái thanh toán từ text backend đã tổng hợp.
const renderPaymentStatus = (text) => {
  let color = "orange";
  if (text === "Đã thanh toán") color = "blue";
  if (text === "Đã tất toán") color = "green";

  return (
    <Tag color={color} style={{ borderRadius: 0, letterSpacing: "1px" }}>
      {(text || "Chưa thanh toán").toUpperCase()}
    </Tag>
  );
};

// Trang khách theo dõi toàn bộ đơn đặt lịch của mình.
const MyBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Lấy danh sách booking của user đang đăng nhập.
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

  // Lọc đơn theo trạng thái đang chọn trên giao diện.
  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

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
      key: "services",
      render: (_, record) => (
        <div>
          <span style={{ fontWeight: 600, color: PRIMARY_COLOR }}>
            {record.service_id?.name || "Dịch vụ"}
          </span>
          {record.extra_service_ids && record.extra_service_ids.length > 0 && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              + {record.extra_service_ids.map(s => s.name).join(", ")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      key: "status",
      render: (_, record) => (
        <div>
          {renderOrderStatus(record.status)}
          {record.status === "CONTRACT_SENT" && (
            <div style={{ fontSize: 11, color: "#722ed1", marginTop: 4 }}>
              📄 Hợp đồng đã được gửi đến email
            </div>
          )}
          {record.status === "WAITING_PAYMENT" && (
            <div style={{ fontSize: 11, color: "#d46b08", marginTop: 4 }}>
              ⏳ Vui lòng thanh toán để giữ lịch
            </div>
          )}
        </div>
      ),
    },
    {
      title: "THANH TOÁN",
      key: "payment_status_text",
      render: (_, record) => renderPaymentStatus(record.payment_status_text),
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
      title: "",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
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
  const requested = bookings.filter((item) => item.status === "REQUESTED").length;
  const contractSent = bookings.filter((item) => item.status === "CONTRACT_SENT").length;
  const confirmed = bookings.filter((item) => item.status === "CONFIRMED").length;
  const completed = bookings.filter((item) => item.status === "COMPLETED").length;

  return (
    <div style={{ maxWidth: "1250px", margin: "80px auto 40px", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 18px", background: "rgba(154, 138, 120, 0.08)", border: "1px solid rgba(154, 138, 120, 0.2)", marginBottom: 20 }}>
          <CalendarOutlined style={{ color: PRIMARY_COLOR }} />
          <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: PRIMARY_COLOR, fontWeight: 600 }}>
            Lịch Chụp Của Tôi
          </span>
        </div>
        <h1
          className="font-serif-luxury"
          style={{
            color: "#1F1F1F",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 300,
            lineHeight: 1.2,
            margin: "0 0 16px 0",
            letterSpacing: "-0.5px",
          }}
        >
          Quản lý{" "}
          <span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>Đơn Đặt Lịch</span>
        </h1>
        <p style={{ color: "#777", fontSize: 14, lineHeight: 1.8, maxWidth: 520, margin: "0 auto", fontWeight: 300 }}>
          Theo dõi trạng thái yêu cầu đặt lịch, hợp đồng và thông tin thanh toán.
        </p>
      </div>

      {/* Alert hướng dẫn nếu có đơn CONTRACT_SENT */}
      {contractSent > 0 && (
        <Alert
          type="info"
          showIcon
          icon={<FileTextOutlined />}
          message="Bạn có hợp đồng chờ xác nhận"
          description="Studio đã gửi hợp đồng xác nhận đến email của bạn. Vui lòng mở email, đọc kỹ hợp đồng và bấm xác nhận để tiến hành đặt cọc giữ lịch."
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Tổng đơn</div>
            <strong style={{ fontSize: 24 }}>{total}</strong>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Chờ xử lý</div>
            <strong style={{ fontSize: 24, color: "orange" }}>{requested}</strong>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Đã xác nhận</div>
            <strong style={{ fontSize: 24, color: "#1677ff" }}>{confirmed}</strong>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card size="small">
            <div style={{ color: "#888" }}>Hoàn thành</div>
            <strong style={{ fontSize: 24, color: "#52c41a" }}>{completed}</strong>
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
        scroll={{ x: 900 }}
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
