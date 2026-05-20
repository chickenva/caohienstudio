import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Button, message, Avatar, Dropdown, Space } from "antd";
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
  HomeOutlined,
  ContactsOutlined,
  BarChartOutlined,
  DownOutlined,
  SettingOutlined,
  PictureOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const PRIMARY_COLOR = "#9a8a78";
const SIDEBAR_BG = "#f8f5f1";
const BORDER_COLOR = "#e8e0d8";
const TEXT_DARK = "#2f2f2f";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [admin, setAdmin] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const userData = JSON.parse(savedUser);

      if (userData.role !== "ADMIN") {
        message.warning("Bạn không có quyền truy cập trang quản trị");
        navigate("/", { replace: true });
        return;
      }

      setAdmin(userData);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    message.success("Đã đăng xuất tài khoản quản trị");
    navigate("/login");
  };

  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
    },
    {
      key: "/admin/orders",
      icon: <ShoppingCartOutlined />,
      label: "Đơn đặt lịch",
    },
    {
      key: "/admin/services",
      icon: <AppstoreOutlined />,
      label: "Gói dịch vụ",
      children: [
        { key: "/admin/services", label: "Danh sách dịch vụ" },
        { key: "/admin/services/add", label: "Thêm dịch vụ" },
      ],
    },
    {
      key: "/admin/galleries",
      icon: <PictureOutlined />,
      label: "Thư viện ảnh",
      children: [
        { key: "/admin/galleries", label: "Danh sách album" },
        { key: "/admin/galleries/create", label: "Tạo album" },
      ],
    },
    {
      key: "/admin/photographers",
      icon: <TeamOutlined />,
      label: "Nhiếp ảnh gia",
      children: [
        { key: "/admin/photographers", label: "Danh sách nhiếp ảnh gia" },
        { key: "/admin/photographers/add", label: "Thêm nhiếp ảnh gia" },
      ],
    },
    {
      key: "/admin/resources",
      icon: <CameraOutlined />,
      label: "Tài nguyên / thiết bị",
      children: [
        { key: "/admin/resources", label: "Danh sách tài nguyên" },
        { key: "/admin/resources/add", label: "Thêm tài nguyên" },
      ],
    },
    {
      key: "/admin/customers",
      icon: <SolutionOutlined />,
      label: "Khách hàng",
    },
    {
      key: "/admin/contacts",
      icon: <ContactsOutlined />,
      label: "Liên hệ tư vấn",
    },
    {
      key: "/admin/revenue",
      icon: <BarChartOutlined />,
      label: "Doanh thu",
    },
    {
      key: "/admin/profile",
      icon: <UserOutlined />,
      label: "Tài khoản quản trị",
    },
  ];

  const selectedKeys = useMemo(() => {
    const path = location.pathname;

    const flattenItems = menuItems.flatMap((item) =>
      item.children ? [item, ...item.children] : [item],
    );

    const matched = flattenItems
      .filter((item) => path === item.key || path.startsWith(`${item.key}/`))
      .sort((a, b) => b.key.length - a.key.length)[0];

    return matched ? [matched.key] : [path];
  }, [location.pathname]);

  const currentOpenKeys = useMemo(() => {
    const path = location.pathname;

    return menuItems
      .filter((item) =>
        item.children?.some(
          (child) => path === child.key || path.startsWith(`${child.key}/`),
        ),
      )
      .map((item) => item.key);
  }, [location.pathname]);

  useEffect(() => {
    if (!collapsed) {
      setOpenKeys(currentOpenKeys);
    }
  }, [currentOpenKeys, collapsed]);

  const adminDropdownItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin tài khoản",
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "website",
      icon: <HomeOutlined />,
      label: "Xem website",
      onClick: () => navigate("/"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/admin/dashboard") return "Tổng quan";
    if (path === "/admin/orders") return "Quản lý đơn đặt lịch";

    if (path === "/admin/services") return "Quản lý gói dịch vụ";
    if (path === "/admin/services/add") return "Thêm gói dịch vụ";
    if (path.startsWith("/admin/services/edit/")) {
      return "Chỉnh sửa gói dịch vụ";
    }

    if (path === "/admin/galleries") return "Quản lý thư viện ảnh";
    if (path === "/admin/galleries/create") return "Tạo album mới";
    if (path.startsWith("/admin/galleries/edit/")) {
      return "Chỉnh sửa album";
    }

    if (path === "/admin/photographers") return "Quản lý nhiếp ảnh gia";
    if (path === "/admin/photographers/add") return "Thêm nhiếp ảnh gia";
    if (path.startsWith("/admin/photographers/edit/")) {
      return "Chỉnh sửa nhiếp ảnh gia";
    }

    if (path === "/admin/resources") return "Quản lý tài nguyên";
    if (path === "/admin/resources/add") return "Thêm tài nguyên";
    if (path.startsWith("/admin/resources/edit/")) {
      return "Chỉnh sửa tài nguyên";
    }

    if (path === "/admin/customers") return "Quản lý khách hàng";
    if (path === "/admin/contacts") return "Liên hệ tư vấn";
    if (path === "/admin/revenue") return "Thống kê doanh thu";
    if (path === "/admin/profile") return "Tài khoản quản trị";

    return "Quản trị hệ thống";
  };

  if (!admin) return null;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f6f3ef" }}>
      <Sider
        width={280}
        collapsedWidth={86}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        style={{
          background: SIDEBAR_BG,
          borderRight: `1px solid ${BORDER_COLOR}`,
          boxShadow: "6px 0 24px rgba(80, 60, 40, 0.04)",
        }}
        trigger={null}
      >
        <div
          onClick={() => navigate("/admin/dashboard")}
          style={{
            height: 92,
            padding: collapsed ? "22px 0" : "22px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 12,
            cursor: "pointer",
            borderBottom: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: TEXT_DARK,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: '"Playfair Display", serif',
              fontSize: 18,
            }}
          >
            CH
          </div>

          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: '"Playfair Display", "Times New Roman", serif',
                  fontSize: 20,
                  color: TEXT_DARK,
                  lineHeight: 1,
                }}
              >
                Cao Hien
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: PRIMARY_COLOR,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Studio Admin
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: collapsed ? "18px 10px" : "20px 14px" }}>
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={setOpenKeys}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            inlineCollapsed={collapsed}
            style={{
              background: "transparent",
              borderInlineEnd: "none",
              fontSize: 13,
              color: TEXT_DARK,
            }}
          />
        </div>

        {!collapsed && (
          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 22,
              padding: 16,
              borderRadius: 16,
              background: "#fff",
              border: `1px solid ${BORDER_COLOR}`,
              boxShadow: "0 12px 30px rgba(80, 60, 40, 0.06)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: PRIMARY_COLOR,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Studio Manager
            </div>
            <div style={{ color: "#777", fontSize: 12, lineHeight: 1.7 }}>
              Quản lý đơn đặt lịch, dịch vụ, album, nhiếp ảnh gia và dữ liệu
              khách hàng của Cao Hien Studio.
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ background: "#f6f3ef" }}>
        <Header
          style={{
            height: 76,
            padding: "0 28px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${BORDER_COLOR}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#f4eee8",
                color: TEXT_DARK,
              }}
            />

            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: TEXT_DARK,
                  lineHeight: 1.2,
                }}
              >
                {getPageTitle()}
              </div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                Cao Hien Studio Management System
              </div>
            </div>
          </div>

          <Space size={14}>
            <Button
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{
                height: 40,
                borderRadius: 999,
                borderColor: BORDER_COLOR,
                background: "#fff",
              }}
            >
              Xem website
            </Button>

            <Dropdown
              menu={{ items: adminDropdownItems }}
              placement="bottomRight"
              arrow
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  background: "#fff",
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: 999,
                  padding: "7px 12px 7px 7px",
                  boxShadow: "0 8px 22px rgba(80, 60, 40, 0.04)",
                }}
              >
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: PRIMARY_COLOR }}
                />

                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
                    {admin.full_name || admin.email || "Admin"}
                  </div>
                  <div style={{ fontSize: 11, color: "#999" }}>
                    Quản trị viên
                  </div>
                </div>

                <DownOutlined style={{ fontSize: 11, color: "#999" }} />
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 28 }}>
          <div
            style={{
              minHeight: "calc(100vh - 132px)",
              background: "#fff",
              borderRadius: 22,
              padding: 28,
              border: `1px solid ${BORDER_COLOR}`,
              boxShadow: "0 20px 50px rgba(80, 60, 40, 0.06)",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>

      <style>{`
        .ant-layout-sider-trigger {
          display: none;
        }

        .ant-menu .ant-menu-item,
        .ant-menu .ant-menu-submenu-title {
          border-radius: 12px;
          margin: 4px 0;
          height: 42px;
          line-height: 42px;
        }

        .ant-menu-light .ant-menu-item-selected {
          background: #2f2f2f !important;
          color: #fff !important;
          font-weight: 600;
        }

        .ant-menu-light .ant-menu-item-selected .anticon {
          color: #fff !important;
        }

        .ant-menu-light .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #2f2f2f !important;
          font-weight: 700;
        }

        .ant-menu-light .ant-menu-sub {
          background: rgba(255, 255, 255, 0.55) !important;
          border-radius: 12px;
          padding: 4px;
        }

        .ant-menu-light .ant-menu-sub .ant-menu-item-selected {
          background: #9a8a78 !important;
          color: #fff !important;
        }

        .ant-menu-light .ant-menu-item:hover,
        .ant-menu-light .ant-menu-submenu-title:hover {
          color: #2f2f2f !important;
          background: rgba(154, 138, 120, 0.12) !important;
        }

        .ant-menu-inline-collapsed > .ant-menu-item,
        .ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title {
          padding-inline: calc(50% - 16px);
        }
      `}</style>
    </Layout>
  );
};

export default AdminLayout;
