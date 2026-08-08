/**
 * AdminLayout.jsx
 * Layout tổng cho Admin: sidebar điều hướng, header và vùng nội dung.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Button, message, Avatar, Dropdown, Divider, Tooltip } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Logo from "../Logo";
import {
  DashboardOutlined,
  UserOutlined,
  CameraOutlined,
  SolutionOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
  HomeOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const { Sider, Content } = Layout;

const PRIMARY_COLOR = "#9a8a78";
const SIDEBAR_BG = "#f8f5f1";
const BORDER_COLOR = "#e8e0d8";
const TEXT_DARK = "#2f2f2f";

// Layout khung admin gồm sidebar, menu quản trị và vùng nội dung.
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
      children: [
        { key: "/admin/orders", label: "Danh sách đơn" },
        { key: "/admin/orders/create", label: "Tạo đơn đặt hộ" },
      ],
    },
    {
      key: "/admin/services",
      icon: <AppstoreOutlined />,
      label: "Gói dịch vụ",
      children: [
        { key: "/admin/services", label: "Danh sách dịch vụ" },
        { key: "/admin/services/add", label: "Thêm dịch vụ" },
        { key: "/admin/categories/service", label: "Quản lý danh mục" },
      ],
    },
    {
      key: "/admin/galleries",
      icon: <PictureOutlined />,
      label: "Thư viện ảnh",
      children: [
        { key: "/admin/galleries", label: "Danh sách album" },
        { key: "/admin/galleries/create", label: "Thêm album" },
        { key: "/admin/categories/gallery", label: "Quản lý danh mục" },
      ],
    },
    {
      key: "/admin/accounts",
      icon: <TeamOutlined />,
      label: "Tài khoản",
      children: [
        { key: "/admin/accounts", label: "Danh sách tài khoản" },
        { key: "/admin/accounts/add", label: "Thêm tài khoản" },
        { key: "/admin/customers", label: "Danh sách khách hàng" },
      ],
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

  const userDropdownItems = [
    {
      key: "profile",
      icon: <SettingOutlined />,
      label: "Thông tin tài khoản",
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "website",
      icon: <HomeOutlined />,
      label: "Xem website",
      onClick: () => window.open("/", "_blank"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  if (!admin) return null;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0ece6" }}>
      <Sider
        width={260}
        collapsedWidth={72}
        collapsed={collapsed}
        style={{
          background: SIDEBAR_BG,
          borderRight: `1px solid ${BORDER_COLOR}`,
          boxShadow: "4px 0 20px rgba(80, 60, 40, 0.06)",
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        trigger={null}
      >
        {/* ── Logo + Collapse toggle ── */}
        <div
          style={{
            height: 72,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${BORDER_COLOR}`,
            flexShrink: 0,
          }}
        >
          {/* Logo */}
          <div
            onClick={() => navigate("/admin/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            <Logo size={34} showText={!collapsed} textColor={TEXT_DARK} />
          </div>

          {/* Collapse button */}
          <Tooltip
            title={collapsed ? "Mở rộng" : "Thu gọn"}
            placement="right"
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                color: "#999",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Tooltip>
        </div>

        {/* ── Menu ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: collapsed ? "12px 6px" : "12px 10px",
          }}
        >
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

        {/* ── User panel ── */}
        <div
          style={{
            borderTop: `1px solid ${BORDER_COLOR}`,
            padding: collapsed ? "12px 0" : "12px 14px",
            flexShrink: 0,
          }}
        >
          <Dropdown
            menu={{ items: userDropdownItems }}
            placement="topLeft"
            trigger={["click"]}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                padding: collapsed ? "6px 0" : "8px 10px",
                borderRadius: 12,
                justifyContent: collapsed ? "center" : "flex-start",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(154,138,120,0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Avatar
                size={36}
                icon={<UserOutlined />}
                style={{ backgroundColor: PRIMARY_COLOR, flexShrink: 0 }}
              />

              {!collapsed && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: TEXT_DARK,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {admin.full_name || admin.email || "Admin"}
                  </div>
                  <div style={{ fontSize: 11, color: "#999" }}>
                    Quản trị viên
                  </div>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </Sider>

      {/* ── Main content (no Header) ── */}
      <Layout style={{ background: "#f0ece6" }}>
        <Content className="admin-layout-content" style={{ padding: 24 }}>
          <div
            className="admin-main-card"
            style={{
              minHeight: "calc(100vh - 48px)",
              background: "#fff",
              borderRadius: 20,
              padding: 28,
              border: `1px solid ${BORDER_COLOR}`,
              boxShadow: "0 16px 48px rgba(80, 60, 40, 0.06)",
              overflowX: "auto",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>

      <style>{`
        .ant-layout-sider-trigger { display: none; }

        @media (max-width: 768px) {
          .admin-layout-content {
            padding: 10px !important;
          }
          .admin-main-card {
            padding: 16px 12px !important;
            border-radius: 12px !important;
            min-height: calc(100vh - 20px) !important;
          }
        }

        .ant-menu .ant-menu-item,
        .ant-menu .ant-menu-submenu-title {
          border-radius: 10px;
          margin: 3px 0;
          height: 40px;
          line-height: 40px;
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
          background: rgba(255, 255, 255, 0.6) !important;
          border-radius: 10px;
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
          padding-inline: calc(50% - 16px) !important;
        }
      `}</style>
    </Layout>
  );
};

export default AdminLayout;
