import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button, Space, Dropdown, Avatar, Divider } from "antd";
import {
  ArrowRightOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  FacebookOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";

// Design System đồng bộ
const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Arial, sans-serif';

const SharedLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Dữ liệu cứng cho danh sách các cặp đôi (Album)
  const albumMenuItems = [
    {
      key: "1",
      label: "Minh & Thảo - Wedding in Da Lat",
      onClick: () => navigate("/customer/gallery/minh-thao"),
    },
    {
      key: "2",
      label: "Hoàng & Linh - Pre-Wedding in Nha Trang",
      onClick: () => navigate("/customer/gallery/hoang-linh"),
    },
    {
      key: "3",
      label: "Quốc & Phương - City Romance",
      onClick: () => navigate("/customer/gallery/quoc-phuong"),
    },
  ];

  // Kiểm tra trạng thái đăng nhập mỗi khi chuyển trang
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth/login");
  };

  const isActive = (path) => location.pathname === path;

  const menuStyle = (path) => ({
    cursor: "pointer",
    borderBottom: isActive(path) ? "1px solid #333" : "none",
    paddingBottom: "3px",
    color: isActive(path) ? "#000" : "#555",
    transition: "all 0.3s",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "1px",
  });

  // ============ MENU CUSTOMER ============
  const customerMenuItems = [
    {
      key: "1",
      label: "Thông tin tài khoản",
      icon: <InfoCircleOutlined />,
      onClick: () => navigate("/customer/profile"),
    },
    {
      key: "2",
      label: "Quản lý đơn đặt lịch",
      icon: <CalendarOutlined />,
      onClick: () => navigate("/customer/my-bookings"),
    },
    {
      type: "divider",
    },
    {
      key: "3",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  // ============ MENU ADMIN ============
  const adminMenuItems = [
    {
      key: "profile",
      label: "Thông tin tài khoản",
      icon: <InfoCircleOutlined />,
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "dashboard",
      label: "Dashboard Thống Kê",
      icon: <DashboardOutlined />,
      onClick: () => navigate("/admin/dashboard"),
    },
    {
      type: "divider",
    },
    {
      key: "resources",
      label: "Quản lý Kho tài nguyên",
      icon: <ShoppingOutlined />,
      children: [
        {
          key: "resources-add",
          label: "Thêm tài nguyên",
          icon: <PlusOutlined />,
          onClick: () => navigate("/admin/resources/add"),
        },
        {
          key: "resources-edit",
          label: "Chỉnh sửa thông tin",
          icon: <EditOutlined />,
          onClick: () => navigate("/admin/resources"),
        },
      ],
    },
    {
      key: "staff",
      label: "Quản lý Nhân sự",
      icon: <TeamOutlined />,
      children: [
        {
          key: "staff-add",
          label: "Thêm nhân sự",
          icon: <PlusOutlined />,
          onClick: () => navigate("/admin/staff/add"),
        },
        {
          key: "staff-edit",
          label: "Chỉnh sửa thông tin",
          icon: <EditOutlined />,
          onClick: () => navigate("/admin/staff"),
        },
      ],
    },
    {
      key: "customers",
      label: "Quản lý Khách hàng",
      icon: <UserOutlined />,
      children: [
        {
          key: "customers-list",
          label: "Thông tin chi tiết",
          icon: <FileTextOutlined />,
          onClick: () => navigate("/admin/customers"),
        },
      ],
    },
    {
      key: "services",
      label: "Quản lý Gói dịch vụ",
      icon: <ShoppingOutlined />,
      children: [
        {
          key: "services-add",
          label: "Thêm dịch vụ",
          icon: <PlusOutlined />,
          onClick: () => navigate("/admin/services/add"),
        },
        {
          key: "services-edit",
          label: "Chỉnh sửa thông tin",
          icon: <EditOutlined />,
          onClick: () => navigate("/admin/services"),
        },
      ],
    },
    {
      key: "orders",
      label: "Quản lý đơn hàng",
      icon: <FileTextOutlined />,
      children: [
        {
          key: "orders-list",
          label: "Danh sách đơn hàng",
          icon: <FileTextOutlined />,
          onClick: () => navigate("/admin/orders"),
        },
        {
          key: "orders-detail",
          label: "Chi tiết thông tin",
          icon: <InfoCircleOutlined />,
          onClick: () => navigate("/admin/orders"),
        },
        {
          key: "orders-create",
          label: "Tạo đơn đặt hộ",
          icon: <PlusOutlined />,
          onClick: () => navigate("/admin/orders/create"),
        },
      ],
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Kiểm tra xem đây là trang admin hay customer
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        fontFamily: FONT_SANS,
        background: "#fff",
      }}
    >
      {/* ==========================================
          HEADER (Dùng chung cho Customer & Admin)
      ========================================== */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "90px",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          zIndex: 1000,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {/* Logo */}
        <div
          onClick={() => navigate(isAdminPage ? "/admin/dashboard" : "/customer")}
          style={{
            fontSize: "20px",
            fontFamily: FONT_SERIF,
            letterSpacing: "1px",
            cursor: "pointer",
            color: "#333",
          }}
        >
          CAOHIENPHOTOGRAPHY
        </div>

        {/* Menu giữa - Chỉ hiển thị cho Customer */}
        {!isAdminPage && (
          <div style={{ display: "flex", gap: "30px" }}>
            <span onClick={() => navigate("/customer")} style={menuStyle("/customer")}>
              TRANG CHỦ
            </span>
            <Dropdown
              menu={{ items: albumMenuItems }}
              placement="bottomCenter"
              arrow
            >
              <span
                style={{
                  color: location.pathname.includes("/customer/gallery")
                    ? "#000"
                    : "#555",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  cursor: "pointer",
                }}
              >
                THƯ VIỆN ẢNH ⌄
              </span>
            </Dropdown>
            <span
              onClick={() => navigate("/customer/about")}
              style={menuStyle("/customer/about")}
            >
              GIỚI THIỆU VỀ TÔI
            </span>
            <span
              onClick={() => navigate("/customer/services")}
              style={menuStyle("/customer/services")}
            >
              BẢNG GIÁ / PRICE LIST
            </span>
            <span
              onClick={() => navigate("/customer/booking")}
              style={menuStyle("/customer/booking")}
            >
              ĐẶT LỊCH
            </span>
          </div>
        )}

        {/* Admin label - Hiển thị cho Admin */}
        {isAdminPage && (
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: PRIMARY_COLOR,
              letterSpacing: "1px",
            }}
          >
            ADMIN DASHBOARD
          </div>
        )}

        {/* Khu vực bên phải Header */}
        <div
          style={{
            minWidth: "150px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {user ? (
            /* TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP */
            <Dropdown
              menu={{
                items: isAdminPage ? adminMenuItems : customerMenuItems,
              }}
              placement="bottomRight"
              arrow
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#333",
                    textTransform: "uppercase",
                  }}
                >
                  {user.name}
                </span>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: PRIMARY_COLOR }}
                />
              </div>
            </Dropdown>
          ) : (
            /* TRƯỜNG HỢP: KHÁCH VÃNG LAI */
            <Space size="middle">
              <Button
                type="text"
                onClick={() => navigate("/auth/login")}
                style={{
                  fontWeight: 600,
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                ĐĂNG NHẬP
              </Button>
              <Button
                onClick={() => navigate("/auth/register")}
                style={{
                  background: PRIMARY_COLOR,
                  color: "#fff",
                  borderRadius: "0",
                  height: "40px",
                  border: "none",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  padding: "0 25px",
                }}
              >
                ĐĂNG KÝ <ArrowRightOutlined />
              </Button>
            </Space>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <main style={{ flex: 1, marginTop: "90px" }}>
        <Outlet />
      </main>

      {/* FOOTER - Chỉ hiển thị cho Customer */}
      {!isAdminPage && (
        <footer
          style={{
            background: "#1a1a1a",
            color: "#fff",
            padding: "80px 40px 30px 40px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "40px",
              }}
            >
              {/* Cột 1: Giới thiệu */}
              <div>
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: "20px",
                    letterSpacing: "1px",
                    marginBottom: "25px",
                  }}
                >
                  CAOHIENPHOTOGRAPHY
                </div>
                <p
                  style={{
                    color: "#aaa",
                    fontSize: "13px",
                    lineHeight: "1.8",
                  }}
                >
                  Ghi lại những khoảnh khắc yêu thương thoáng qua để tạo nên
                  những bức ảnh đẹp, chân thật và có giá trị theo thời gian.
                </p>
                <Space
                  size="large"
                  style={{ marginTop: "20px", fontSize: "18px" }}
                >
                  <FacebookOutlined
                    style={{ cursor: "pointer", color: "#aaa" }}
                  />
                  <InstagramOutlined
                    style={{ cursor: "pointer", color: "#aaa" }}
                  />
                  <YoutubeOutlined
                    style={{ cursor: "pointer", color: "#aaa" }}
                  />
                </Space>
              </div>

              {/* Cột 2: Khám phá */}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    marginBottom: "25px",
                    textTransform: "uppercase",
                  }}
                >
                  Khám phá
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "13px",
                    lineHeight: "2.5",
                    color: "#aaa",
                  }}
                >
                  <li
                    onClick={() => navigate("/customer")}
                    style={{ cursor: "pointer" }}
                  >
                    Trang chủ
                  </li>
                  <li
                    onClick={() => navigate("/customer/about")}
                    style={{ cursor: "pointer" }}
                  >
                    Về Cao Hiền
                  </li>
                  <li
                    onClick={() => navigate("/customer/services")}
                    style={{ cursor: "pointer" }}
                  >
                    Bảng Giá
                  </li>
                  <li
                    onClick={() => navigate("/customer/booking")}
                    style={{ cursor: "pointer" }}
                  >
                    Đặt Lịch
                  </li>
                </ul>
              </div>

              {/* Cột 3: Liên hệ */}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    marginBottom: "25px",
                    textTransform: "uppercase",
                  }}
                >
                  Liên Hệ
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "13px",
                    lineHeight: "2.5",
                    color: "#aaa",
                  }}
                >
                  <li>
                    <PhoneOutlined style={{ marginRight: "8px" }} />
                    +84 123 456 789
                  </li>
                  <li>
                    <MailOutlined style={{ marginRight: "8px" }} />
                    caohien@studio.com
                  </li>
                  <li>
                    <EnvironmentOutlined style={{ marginRight: "8px" }} />
                    Hà Nội, Việt Nam
                  </li>
                </ul>
              </div>

              {/* Cột 4: Pháp lý */}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    marginBottom: "25px",
                    textTransform: "uppercase",
                  }}
                >
                  Pháp Lý
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "13px",
                    lineHeight: "2.5",
                    color: "#aaa",
                  }}
                >
                  <li style={{ cursor: "pointer" }}>Điều Khoản Sử Dụng</li>
                  <li style={{ cursor: "pointer" }}>Chính Sách Bảo Mật</li>
                  <li style={{ cursor: "pointer" }}>Hỗ Trợ Khách Hàng</li>
                </ul>
              </div>
            </div>

            <Divider style={{ background: "#333", margin: "40px 0 30px 0" }} />

            <div
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#999",
              }}
            >
              © 2024 Cao Hiến Photography. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default SharedLayout;
