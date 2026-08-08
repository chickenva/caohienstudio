/**
 * AdminDashboard.jsx
 * Dashboard tổng quan: số liệu đơn, doanh thu, khách hàng, album theo phong cách Studio Luxury Admin.
 */
import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  message,
  Typography,
  Space,
  Progress,
} from "antd";
import {
  ReloadOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  AppstoreOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://caohienstudio-api.onrender.com/api");

const statusConfig = {
  REQUESTED: { color: "orange", text: "Đã gửi yêu cầu" },
  CONTRACT_SENT: { color: "purple", text: "Hợp đồng đã gửi" },
  WAITING_PAYMENT: { color: "gold", text: "Chờ đặt cọc" },
  PENDING: { color: "gold", text: "Chờ thanh toán" },
  DEPOSITED: { color: "cyan", text: "Đã đặt cọc" },
  CONFIRMED: { color: "blue", text: "Đã xác nhận" },
  IN_PROGRESS: { color: "geekblue", text: "Đang thực hiện" },
  COMPLETED: { color: "green", text: "Hoàn thành" },
  CANCELED: { color: "red", text: "Đã hủy" },
  CANCELLED: { color: "red", text: "Đã hủy" },
  EXPIRED: { color: "default", text: "Hết hạn" },
  PAYMENT_FAILED: { color: "volcano", text: "Thanh toán lỗi" },
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchOverview = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/dashboard/admin/overview`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setOverview(res.data);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể tải dữ liệu dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  const cards = overview?.cards || {};
  const revenue = overview?.revenue || {};
  const bookingStatus = overview?.bookingStatus || {};
  const recentBookings = overview?.recentBookings || [];

  const totalStatusCount =
    Object.values(bookingStatus).reduce(
      (sum, item) => sum + Number(item || 0),
      0,
    ) || 1;

  const columns = [
    {
      title: "MÃ ĐƠN",
      dataIndex: "_id",
      key: "_id",
      width: 110,
      render: (id) => <Text code style={{ fontWeight: 700 }}>#{id?.slice(-6).toUpperCase()}</Text>,
    },
    {
      title: "KHÁCH HÀNG",
      dataIndex: "customer_id",
      key: "customer_id",
      render: (customer) => (
        <div>
          <div style={{ fontWeight: 600, color: "#262626" }}>
            {customer?.full_name || "Khách hàng"}
          </div>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>
            {customer?.phone || customer?.email || ""}
          </div>
        </div>
      ),
    },
    {
      title: "DỊCH VỤ",
      dataIndex: "service_id",
      key: "service_id",
      render: (service) => <span style={{ fontWeight: 500 }}>{service?.name || "Dịch vụ"}</span>,
    },
    {
      title: "NGÀY CHỤP",
      dataIndex: "start_time",
      key: "start_time",
      width: 140,
      render: (date) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dayjs(date).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>
            {dayjs(date).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      width: 145,
      render: (status) => {
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };

        return <Tag color={config.color} style={{ borderRadius: 4, fontWeight: 500 }}>{config.text}</Tag>;
      },
    },
    {
      title: "TỔNG TIỀN",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      width: 140,
      render: (amount) => <strong style={{ color: "#BFA16A" }}>{formatMoney(amount)}</strong>,
    },
  ];

  const cardStyle = {
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
    border: "1px solid #efebe4",
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 0, fontWeight: 700 }}>
            Tổng quan hệ thống
          </Title>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchOverview} loading={loading} />
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate("/admin/orders/create")}
            style={{ backgroundColor: "#BFA16A", borderColor: "#BFA16A" }}
          >
            Tạo đơn hộ
          </Button>
        </Space>
      </div>

      {/* Primary KPI Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ ...cardStyle, background: "linear-gradient(135deg, #ffffff 0%, #FAF7F2 100%)" }} loading={loading}>
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13, textTransform: "uppercase", fontWeight: 600 }}>Tổng đơn đặt lịch</span>}
              value={cards.totalBookings || 0}
              prefix={<ShoppingCartOutlined style={{ color: "#BFA16A", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#595959" }}>
              Tháng này: <strong style={{ color: "#BFA16A" }}>{cards.monthlyBookings || 0}</strong> đơn mới
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ ...cardStyle, background: "linear-gradient(135deg, #ffffff 0%, #FAF7F2 100%)" }} loading={loading}>
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13, textTransform: "uppercase", fontWeight: 600 }}>Doanh thu dự kiến</span>}
              value={revenue.expectedRevenue || 0}
              formatter={formatMoney}
              prefix={<DollarOutlined style={{ color: "#389e0d", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#237804" }}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#595959" }}>
              Từ các đơn đã xác nhận / hoàn thành
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ ...cardStyle, background: "linear-gradient(135deg, #ffffff 0%, #FAF7F2 100%)" }} loading={loading}>
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13, textTransform: "uppercase", fontWeight: 600 }}>VNPay Đã Thanh Toán</span>}
              value={revenue.actualPaidRevenue || 0}
              formatter={formatMoney}
              prefix={<DollarOutlined style={{ color: "#0958d9", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#0958d9" }}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#595959" }}>
              <strong style={{ color: "#0958d9" }}>{revenue.successfulPaymentCount || 0}</strong> giao dịch thành công
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ ...cardStyle, background: "linear-gradient(135deg, #ffffff 0%, #FAF7F2 100%)" }} loading={loading}>
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13, textTransform: "uppercase", fontWeight: 600 }}>Tổng Khách Hàng</span>}
              value={cards.totalCustomers || 0}
              prefix={<UserOutlined style={{ color: "#722ed1", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#595959" }}>
              Đang hoạt động: <strong style={{ color: "#722ed1" }}>{cards.activeCustomers || 0}</strong> tài khoản
            </div>
          </Card>
        </Col>
      </Row>

      {/* Booking Pipeline Status Cards */}
      <Title level={5} style={{ marginBottom: 12, fontWeight: 700, color: "#595959" }}>
        Tiến độ đơn hàng
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4.8} style={{ flex: 1 }}>
          <Card bordered={false} style={{ ...cardStyle, borderLeft: "4px solid #fa8c16" }} loading={loading}>
            <Statistic
              title="Yêu cầu mới"
              value={cards.requestedBookings || 0}
              prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4.8} style={{ flex: 1 }}>
          <Card bordered={false} style={{ ...cardStyle, borderLeft: "4px solid #722ed1" }} loading={loading}>
            <Statistic
              title="Chờ hợp đồng / Cọc"
              value={(cards.contractSentBookings || 0) + (cards.waitingPaymentBookings || 0)}
              prefix={<FileTextOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1", fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4.8} style={{ flex: 1 }}>
          <Card bordered={false} style={{ ...cardStyle, borderLeft: "4px solid #1677ff" }} loading={loading}>
            <Statistic
              title="Đã xác nhận"
              value={cards.confirmedBookings || 0}
              prefix={<CheckCircleOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff", fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4.8} style={{ flex: 1 }}>
          <Card bordered={false} style={{ ...cardStyle, borderLeft: "4px solid #2f54eb" }} loading={loading}>
            <Statistic
              title="Đang thực hiện"
              value={cards.inProgressBookings || 0}
              prefix={<CameraOutlined style={{ color: "#2f54eb" }} />}
              valueStyle={{ color: "#2f54eb", fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4.8} style={{ flex: 1 }}>
          <Card bordered={false} style={{ ...cardStyle, borderLeft: "4px solid #389e0d" }} loading={loading}>
            <Statistic
              title="Hoàn thành"
              value={cards.completedBookings || 0}
              prefix={<CheckCircleOutlined style={{ color: "#389e0d" }} />}
              valueStyle={{ color: "#389e0d", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Breakdown Status & Recent Orders */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Tỷ lệ trạng thái đơn</span>}
            style={cardStyle}
            loading={loading}
          >
            {Object.entries(bookingStatus).map(([status, count]) => {
              const config = statusConfig[status] || {
                color: "default",
                text: status,
              };

              const percent = Math.round(
                (Number(count || 0) / totalStatusCount) * 100,
              );

              return (
                <div key={status} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      <Tag color={config.color} style={{ borderRadius: 4 }}>{config.text}</Tag>
                    </span>
                    <strong>{count || 0} đơn</strong>
                  </div>

                  <Progress percent={percent} size="small" showInfo={false} strokeColor={config.color === "green" ? "#52c41a" : config.color === "orange" ? "#fa8c16" : config.color === "blue" ? "#1677ff" : "#BFA16A"} />
                </div>
              );
            })}
          </Card>

          {/* Catalog stats */}
          <Card style={{ ...cardStyle, marginTop: 16 }} loading={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>Gói Dịch Vụ</span>}
                  value={cards.activeServices || 0}
                  prefix={<AppstoreOutlined style={{ color: "#BFA16A" }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>Album Gallery</span>}
                  value={cards.activeGalleries || 0}
                  prefix={<PictureOutlined style={{ color: "#BFA16A" }} />}
                  valueStyle={{ fontSize: 20, fontWeight: 700 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Đơn đặt lịch mới nhất</span>}
            extra={
              <Button type="link" onClick={() => navigate("/admin/orders")} icon={<ArrowRightOutlined />}>
                Xem tất cả
              </Button>
            }
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
            loading={loading}
          >
            <Table
              columns={columns}
              dataSource={recentBookings}
              rowKey="_id"
              pagination={false}
              size="middle"
              scroll={{ x: 800 }}
              style={{ borderRadius: "0 0 12px 12px", overflow: "hidden" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
