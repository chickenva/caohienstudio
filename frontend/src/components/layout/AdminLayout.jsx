import React from "react";
import { Layout, Menu, Button, message } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  UserOutlined,
  CameraOutlined,
  TeamOutlined,
  SolutionOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để highlight menu đang active

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    message.success("Đã đăng xuất tài khoản quản trị");
    navigate("/login");
  };

  const menuItems = [
    {
      key: "/admin/profile",
      icon: <UserOutlined />,
      label: "Thông tin tài khoản",
    },
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: "Thống kê doanh thu",
    },
    {
      key: "sub-resources",
      icon: <CameraOutlined />,
      label: "Quản lý Kho tài nguyên",
      children: [
        { key: "/admin/resources", label: "Danh sách tài nguyên" },
        { key: "/admin/resources/add", label: "Thêm tài nguyên" },
      ],
    },
    {
      key: "sub-staff",
      icon: <TeamOutlined />,
      label: "Quản lý Nhân sự",
      children: [
        { key: "/admin/staff/add", label: "Thêm nhân sự" },
        { key: "/admin/staff", label: "Chỉnh sửa thông tin" },
      ],
    },
    {
      key: "/admin/customers",
      icon: <SolutionOutlined />,
      label: "Quản lý Khách hàng",
    },
    {
      key: "sub-services",
      icon: <AppstoreOutlined />,
      label: "Quản lý Gói dịch vụ",
      children: [
        { key: "/admin/services/add", label: "Thêm dịch vụ" },
        { key: "/admin/services", label: "Chỉnh sửa thông tin" },
      ],
    },
    {
      key: "sub-orders",
      icon: <ShoppingCartOutlined />,
      label: "Quản lý đơn hàng",
      children: [
        { key: "/admin/orders", label: "Danh sách đơn hàng" },
        { key: "/admin/orders/detail", label: "Chi tiết thông tin" },
        { key: "/admin/orders/create", label: "Tạo đơn đặt hộ" },
      ],
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* NAVBAR BÊN TRÁI */}
      <Sider width={260} theme="dark" breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            height: "64px",
            lineHeight: "64px",
            textAlign: "center",
            color: "#fff",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "1px",
            background: "#141414",
          }}
        >
          ADMIN PANEL
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={["sub-orders", "sub-services"]} // Mở sẵn vài tab cho đẹp
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      {/* MÀN HÌNH QUẢN LÝ BÊN PHẢI */}
      <Layout>
        <Header
          style={{
            padding: "0 20px",
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </Header>

        <Content
          style={{
            margin: "24px",
            padding: "24px",
            background: "#fff",
            borderRadius: "8px",
            overflow: "initial",
          }}
        >
          {/* Outlet là nơi các trang (Dashboard, Quản lý đơn...) sẽ hiển thị khi bấm vào Menu */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
