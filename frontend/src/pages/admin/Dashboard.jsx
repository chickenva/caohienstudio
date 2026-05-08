import React from "react";
import { Card, Row, Col, Statistic, Button } from "antd";
import { ArrowUpOutlined, UserOutlined, ShoppingCartOutlined, FileTextOutlined } from "@ant-design/icons";

const PRIMARY_COLOR = "#9a8a78";

const AdminDashboard = () => {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "30px" }}>Dashboard</h1>

      {/* Statistics Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: "40px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Statistic
              title="Tổng Khách Hàng"
              value={1250}
              prefix={<UserOutlined />}
              suffix={<ArrowUpOutlined style={{ color: "#3f8600" }} />}
              valueStyle={{ color: PRIMARY_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Statistic
              title="Đơn Hàng Hôm Nay"
              value={24}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: PRIMARY_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Statistic
              title="Doanh Thu Tháng Này"
              value={85500000}
              prefix="₫"
              suffix={<ArrowUpOutlined style={{ color: "#3f8600" }} />}
              valueStyle={{ color: PRIMARY_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Statistic
              title="Dịch Vụ Hoạt Động"
              value={12}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: PRIMARY_COLOR }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card title="Hoạt Động Gần Đây" style={{ borderRadius: "8px" }}>
            <div style={{ minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#aaa" }}>Nội dung sẽ được cập nhật...</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Thống Kê Top Dịch Vụ" style={{ borderRadius: "8px" }}>
            <div style={{ minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#aaa" }}>Nội dung sẽ được cập nhật...</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
