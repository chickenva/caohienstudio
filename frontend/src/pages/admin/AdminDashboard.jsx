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
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const API_URL = "http://localhost:5000/api";

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

// Định dạng số tiền trong các card doanh thu dashboard.
const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

// Dashboard admin tổng hợp đơn, doanh thu, khách hàng, dịch vụ và album.
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  // Lấy JWT admin để gọi API dashboard.
  const getToken = () => localStorage.getItem("token");

  // Lấy toàn bộ số liệu tổng quan từ backend.
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
      width: 120,
      render: (id) => <strong>#{id?.slice(-6).toUpperCase()}</strong>,
    },
    {
      title: "KHÁCH HÀNG",
      dataIndex: "customer_id",
      key: "customer_id",
      render: (customer) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {customer?.full_name || "Khách hàng"}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {customer?.email || ""}
          </div>
        </div>
      ),
    },
    {
      title: "DỊCH VỤ",
      dataIndex: "service_id",
      key: "service_id",
      render: (service) => service?.name || "Dịch vụ",
    },
    {
      title: "NGÀY CHỤP",
      dataIndex: "start_time",
      key: "start_time",
      width: 150,
      render: (date) => (
        <div>
          <div>{dayjs(date).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {dayjs(date).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };

        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "TỔNG TIỀN",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      width: 150,
      render: (amount) => <strong>{formatMoney(amount)}</strong>,
    },
  ];

  return (
    <div>
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
          <Title level={3} style={{ marginBottom: 4 }}>
            Tổng quan hệ thống
          </Title>
          <Text type="secondary">
            Theo dõi tình hình đơn đặt lịch, doanh thu, khách hàng và tài nguyên
            của Cao Hiển Studio.
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchOverview}>
            Làm mới
          </Button>

          <Button type="primary" onClick={() => navigate("/admin/orders")}>
            Xem đơn đặt lịch
          </Button>
        </Space>
      </div>


      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng đơn đặt lịch"
              value={cards.totalBookings || 0}
              prefix={<ShoppingCartOutlined />}
            />
            <Text type="secondary">
              Tháng này: {cards.monthlyBookings || 0} đơn
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Yêu cầu mới"
              value={cards.requestedBookings || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#d48806" }}
            />
            <Text type="secondary">Đơn khách vừa gửi, chờ admin xử lý</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Chờ hợp đồng/đặt cọc"
              value={(cards.contractSentBookings || 0) + (cards.waitingPaymentBookings || 0)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <Text type="secondary">Đơn đã gửi hợp đồng hoặc chờ khách đặt cọc</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Đã xác nhận"
              value={cards.confirmedBookings || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
            <Text type="secondary">Đơn đã xác nhận lịch hẹn</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Đang thực hiện"
              value={cards.inProgressBookings || 0}
              prefix={<CameraOutlined />}
              valueStyle={{ color: "#2f54eb" }}
            />
            <Text type="secondary">Đơn đang trong quá trình chụp</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Hoàn thành"
              value={cards.completedBookings || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#389e0d" }}
            />
            <Text type="secondary">Đơn đã hoàn tất dịch vụ</Text>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Doanh thu dự kiến"
              value={revenue.expectedRevenue || 0}
              formatter={formatMoney}
              prefix={<DollarOutlined />}
            />
            <Text type="secondary">Từ đơn đã xác nhận và hoàn thành</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Thanh toán VNPay thành công"
              value={revenue.actualPaidRevenue || 0}
              formatter={formatMoney}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#389e0d" }}
            />
            <Text type="secondary">
              {revenue.successfulPaymentCount || 0} giao dịch thành công
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Doanh thu tháng này"
              value={revenue.monthlyRevenue || 0}
              formatter={formatMoney}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#0958d9" }}
            />
            <Text type="secondary">Tính theo đơn đã xác nhận/hoàn thành</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Khách hàng"
              value={cards.totalCustomers || 0}
              prefix={<UserOutlined />}
            />
            <Text type="secondary">
              Đang hoạt động: {cards.activeCustomers || 0}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={12}>
          <Card loading={loading}>
            <Statistic
              title="Gói dịch vụ"
              value={cards.activeServices || 0}
              prefix={<AppstoreOutlined />}
            />
            <Text type="secondary">Dịch vụ đang hiển thị</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <Card loading={loading}>
            <Statistic
              title="Album ảnh"
              value={cards.activeGalleries || 0}
              prefix={<PictureOutlined />}
            />
            <Text type="secondary">Album đang hiển thị</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} lg={8}>
          <Card title="Tỷ lệ trạng thái đơn" loading={loading}>
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
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      <Tag color={config.color}>{config.text}</Tag>
                    </span>
                    <strong>{count || 0}</strong>
                  </div>

                  <Progress percent={percent} size="small" showInfo={false} />
                </div>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title="Đơn đặt lịch mới nhất"
            extra={
              <Button type="link" onClick={() => navigate("/admin/orders")}>
                Xem tất cả
              </Button>
            }
            loading={loading}
          >
            <Table
              columns={columns}
              dataSource={recentBookings}
              rowKey="_id"
              pagination={false}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
