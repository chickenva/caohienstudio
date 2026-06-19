import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button, Space, Dropdown, Avatar, message } from "antd";
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
} from "@ant-design/icons";

// Design System đồng bộ (Light Luxury)
const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';
const FONT_SANS = '"Outfit", "Helvetica Neue", Arial, sans-serif';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Menu Dropdown cho Dịch vụ
  const serviceMenuItems = [
    {
      key: "1",
      label: "Gói chụp",
      onClick: () => navigate("/services"),
    },
    {
      key: "2",
      label: "Đặt lịch",
      onClick: () => navigate("/booking"),
    },
    {
      key: "3",
      label: "Thuê máy ảnh",
      onClick: () => navigate("/rentals"),
    },
  ];

  // Kiểm tra trạng thái đăng nhập để hiển thị Header
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      setUser(null);
      return;
    }

    try {
      const userData = JSON.parse(savedUser);

      // Admin được xem website (public pages), nhưng không được vào trang chức năng khách hàng
      if (userData.role === "ADMIN") {
        const blockedPaths = ["/booking", "/customer"];
        const isBlocked = blockedPaths.some(
          (p) => location.pathname === p || location.pathname.startsWith(p + "/")
        );

        if (isBlocked) {
          message.warning("Admin không thể sử dụng chức năng này. Vui lòng dùng trang quản lý.");
          navigate("/admin/dashboard", { replace: true });
          return;
        }
      }

      setUser(userData);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const menuStyle = (path) => ({
    cursor: "pointer",
    borderBottom: isActive(path) ? `1.5px solid ${PRIMARY_COLOR}` : "none",
    paddingBottom: "3px",
    color: isActive(path) ? PRIMARY_COLOR : "#2F2F2F",
    transition: "all 0.3s",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "1px",
  });

  // Menu Dropdown cho User đã đăng nhập
  const userMenuItems = [
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
          1. HEADER (Logic phân quyền User/Guest)
      ========================================== */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "90px",
          backgroundColor: "rgba(250, 247, 242, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          zIndex: 1000,
          borderBottom: "1px solid #E8DED2",
          fontFamily: FONT_SANS,
        }}
      >
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            fontSize: "20px",
            fontFamily: FONT_SERIF,
            letterSpacing: "1px",
            cursor: "pointer",
            color: "#2F2F2F",
            fontWeight: 500,
          }}
          className="nav-logo"
        >
          CAOHIENPHOTOGRAPHY
        </div>

        {/* Menu giữa */}
        <div style={{ display: "flex", gap: "30px" }}>
          <span onClick={() => navigate("/")} style={menuStyle("/")}>
            TRANG CHỦ
          </span>

          <span onClick={() => navigate("/about")} style={menuStyle("/about")}>
            GIỚI THIỆU
          </span>

          <span
            onClick={() => navigate("/galleries")}
            style={menuStyle("/galleries")}
          >
            THƯ VIỆN ẢNH
          </span>

          <span
            onClick={() => navigate("/photographers")}
            style={menuStyle("/photographers")}
          >
            THỢ CHỤP
          </span>

          <Dropdown menu={{ items: serviceMenuItems }} placement="bottom" arrow>
            <span
              style={{
                cursor: "default",
                color:
                  location.pathname.includes("/services") ||
                    location.pathname.includes("/booking") ||
                    location.pathname.includes("/rentals")
                    ? PRIMARY_COLOR
                    : "#2F2F2F",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "1px",
              }}
              className="nav-dropdown-trigger"
            >
              DỊCH VỤ
            </span>
          </Dropdown>

          <span
            onClick={() => navigate("/contact")}
            style={menuStyle("/contact")}
          >
            LIÊN HỆ
          </span>
        </div>

        {/* Khu vực bên phải Header */}
        <div
          style={{
            minWidth: "150px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {user ? (
            user.role === "ADMIN" ? (
              /* TRƯỜNG HỢP: ADMIN xem website */
              <Button
                icon={<DashboardOutlined />}
                onClick={() => navigate("/admin/dashboard")}
                style={{
                  background: "#2f2f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 0,
                  height: 40,
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  padding: "0 20px",
                }}
              >
                QUẢN LÝ WEBSITE
              </Button>
            ) : (
              /* TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP (customer) */
              <Dropdown
                menu={{ items: userMenuItems }}
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
                      color: "#2F2F2F",
                      textTransform: "uppercase",
                    }}
                  >
                    {user.full_name || "TÀI KHOẢN"}
                  </span>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  />
                </div>
              </Dropdown>
            )
          ) : (
            /* TRƯỜNG HỢP: KHÁCH VÃNG LAI */
            <Space size="middle">
              <Button
                type="text"
                onClick={() => navigate("/login")}
                style={{
                  fontWeight: 600,
                  fontSize: "11px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "#2F2F2F"
                }}
                className="btn-nav-login"
              >
                ĐĂNG NHẬP
              </Button>
              <Button
                onClick={() => navigate("/register")}
                style={{
                  background: PRIMARY_COLOR,
                  color: "#fff",
                  borderRadius: "0",
                  height: "40px",
                  border: "none",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  padding: "0 25px",
                  fontWeight: 500
                }}
                className="btn-nav-register"
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

      {/* FOOTER CHUYÊN NGHIỆP */}
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
              <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.8" }}>
                Ghi lại những khoảnh khắc yêu thương thoáng qua để tạo nên những
                bức ảnh đẹp, chân thật và có giá trị theo thời gian.
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
                <YoutubeOutlined style={{ cursor: "pointer", color: "#aaa" }} />
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
                <li onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                  Trang chủ
                </li>
                <li
                  onClick={() => navigate("/about")}
                  style={{ cursor: "pointer" }}
                >
                  Về Cao Hiền
                </li>
                <li>Thư viện ảnh</li>
                {/* <li>Blog chia sẻ</li> */}
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
                Liên hệ
              </div>
              <div
                style={{ color: "#aaa", fontSize: "13px", lineHeight: "2.5" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <EnvironmentOutlined /> TP. Hồ Chí Minh, Việt Nam
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <PhoneOutlined /> 0979 7676 02
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <MailOutlined /> caohienstudio@gmail.com
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #333",
              marginTop: "60px",
              paddingTop: "30px",
              textAlign: "center",
              color: "#666",
              fontSize: "11px",
            }}
          >
            © {new Date().getFullYear()} CAOHIENSTUDIO. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
