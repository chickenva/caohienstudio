import React from "react";
import { Row, Col, Card, Statistic, Table, Tag } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  HourglassOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// --- HARDCODED DATA DÀNH CHO STUDIO ---

// Dữ liệu doanh thu theo 6 tháng gần nhất
const monthlyRevenueData = [
  { month: "Tháng 11", revenue: 45000000 },
  { month: "Tháng 12", revenue: 85000000 }, // Mùa cưới/Kỷ yếu
  { month: "Tháng 1", revenue: 60000000 },
  { month: "Tháng 2", revenue: 40000000 },
  { month: "Tháng 3", revenue: 55000000 },
  { month: "Tháng 4", revenue: 72000000 },
];

// Dữ liệu tỷ trọng các gói dịch vụ
const serviceShareData = [
  { name: "Pre-Wedding", value: 45 },
  { name: "Kỷ Yếu", value: 30 },
  { name: "Chân Dung Nghệ Thuật", value: 15 },
  { name: "Sự Kiện", value: 10 },
];
const COLORS = ["#141414", "#9a8a78", "#d4b895", "#f0f0f0"]; // Tone màu chuẩn studio

// Dữ liệu đơn hàng gần đây
const recentOrders = [
  {
    key: "1",
    orderId: "ORD-2026-001",
    customer: "Nguyễn Văn A",
    service: "Pre-Wedding Nắng Sài Gòn",
    date: "25/04/2026",
    total: 15000000,
    status: "Confirmed",
  },
  {
    key: "2",
    orderId: "ORD-2026-002",
    customer: "Trần Thị B",
    service: "Kỷ Yếu HCMUTE",
    date: "28/04/2026",
    total: 5000000,
    status: "Pending",
  },
  {
    key: "3",
    orderId: "ORD-2026-003",
    customer: "Lê Hoàng C",
    service: "Chân Dung Nàng Thơ",
    date: "20/04/2026",
    total: 2500000,
    status: "Completed",
  },
];

const columns = [
  { title: "Mã Đơn", dataIndex: "orderId", key: "orderId", fontWeight: "bold" },
  { title: "Khách Hàng", dataIndex: "customer", key: "customer" },
  { title: "Gói Dịch Vụ", dataIndex: "service", key: "service" },
  { title: "Ngày Chụp", dataIndex: "date", key: "date" },
  {
    title: "Tổng Tiền",
    dataIndex: "total",
    key: "total",
    render: (val) => (
      <span style={{ fontWeight: "bold" }}>{val.toLocaleString()}đ</span>
    ),
  },
  {
    title: "Trạng Thái",
    dataIndex: "status",
    key: "status",
    render: (status) => {
      let color =
        status === "Confirmed"
          ? "blue"
          : status === "Completed"
            ? "green"
            : "orange";
      let text =
        status === "Confirmed"
          ? "ĐÃ CỌC"
          : status === "Completed"
            ? "HOÀN THÀNH"
            : "CHỜ THANH TOÁN";
      return <Tag color={color}>{text}</Tag>;
    },
  },
];

const AdminDashboard = () => {
  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "24px",
          color: "#141414",
        }}
      >
        Tổng quan thống kê
      </h2>

      {/* HÀNG 1: 4 THẺ THỐNG KÊ TỔNG QUAN */}
      <Row gutter={[24, 24]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Statistic
              title="Tổng Doanh Thu (Tháng này)"
              value={72000000}
              suffix="đ"
              prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Statistic
              title="Tổng Đơn Đặt Lịch"
              value={45}
              prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Statistic
              title="Đang Chờ Thanh Toán"
              value={8}
              prefix={<HourglassOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Statistic
              title="Lịch Chụp Hoàn Thành"
              value={120}
              prefix={<CheckCircleOutlined style={{ color: "#141414" }} />}
              valueStyle={{ color: "#141414", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      {/* HÀNG 2: BIỂU ĐỒ */}
      <Row gutter={[24, 24]} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={16}>
          <Card
            title="Doanh thu 6 tháng gần nhất"
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              height: "400px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRevenueData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000000}tr`}
                />
                <RechartsTooltip
                  formatter={(value) =>
                    new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(value)
                  }
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#141414"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="Tỷ trọng dịch vụ (%)"
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              height: "400px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceShareData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceShareData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `${value}%`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* HÀNG 3: BẢNG DỮ LIỆU */}
      <Card
        title="Đơn Đặt Lịch Mới Nhất"
        bordered={false}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <Table columns={columns} dataSource={recentOrders} pagination={false} />
      </Card>
    </div>
  );
};

export default AdminDashboard;
