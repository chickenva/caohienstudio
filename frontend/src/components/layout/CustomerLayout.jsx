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
  ArrowUpOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import AIChatWidget from "../AIChatWidget";
import Logo from "../Logo";

// Design System đồng bộ (Light Luxury)
const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';
const FONT_SANS = '"Outfit", "Helvetica Neue", Arial, sans-serif';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Tự động cuộn lên đầu trang khi chuyển trang
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Cưỡng bức cuộn lên đầu trang và tắt khôi phục cuộn tự động của trình duyệt khi tải lại trang
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // Lắng nghe sự kiện scroll để hiển thị nút cuộn lên đầu trang
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuClick = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(path);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Menu Dropdown cho Dịch vụ
  const serviceMenuItems = [
    {
      key: "traditional",
      label: "Truyền thống",
      onClick: () => handleMenuClick("/services?category=TRADITIONAL"),
    },
    {
      key: "photojournalism",
      label: "Phóng sự",
      onClick: () => handleMenuClick("/services?category=PHOTOJOURNALISM"),
    },
    {
      key: "combo",
      label: "Kết hợp",
      onClick: () => handleMenuClick("/services?category=COMBO"),
    },
    {
      key: "print",
      label: "Ảnh / Photobook",
      onClick: () => handleMenuClick("/services?category=PRINT"),
    },
    {
      key: "rentals",
      label: "Thuê máy ảnh",
      onClick: () => handleMenuClick("/rentals"),
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
      onClick: () => handleMenuClick("/customer/profile"),
    },
    {
      key: "2",
      label: "Quản lý đơn đặt lịch",
      icon: <CalendarOutlined />,
      onClick: () => handleMenuClick("/customer/my-bookings"),
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
        <Logo size={40} textColor="#2F2F2F" onClick={() => handleMenuClick("/")} />

        {/* Menu giữa */}
        <div style={{ display: "flex", gap: "30px" }}>
          <span onClick={() => handleMenuClick("/")} style={menuStyle("/")}>
            TRANG CHỦ
          </span>

          <span onClick={() => handleMenuClick("/about")} style={menuStyle("/about")}>
            GIỚI THIỆU
          </span>

          <span
            onClick={() => handleMenuClick("/galleries")}
            style={menuStyle("/galleries")}
          >
            THƯ VIỆN ẢNH
          </span>

          <Dropdown menu={{ items: serviceMenuItems }} placement="bottom" arrow>
            <span
              style={{
                cursor: "default",
                borderBottom:
                  location.pathname.includes("/services") ||
                  location.pathname.includes("/rentals")
                    ? `1.5px solid ${PRIMARY_COLOR}`
                    : "none",
                paddingBottom: "3px",
                color:
                  location.pathname.includes("/services") ||
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
            onClick={() => handleMenuClick("/booking")}
            style={menuStyle("/booking")}
          >
            ĐẶT LỊCH
          </span>


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
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "40px",
            }}
          >
            {/* Cột 1: Giới thiệu */}
            <div>
              <Logo
                size={40}
                textColor="#ffffff"
                onClick={() => handleMenuClick("/")}
                style={{ marginBottom: "25px" }}
              />
              <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.8" }}>
                Ghi lại những khoảnh khắc yêu thương thoáng qua để tạo nên những
                bức ảnh đẹp, chân thật và có giá trị theo thời gian.
              </p>
              <Space
                size="large"
                style={{ marginTop: "20px" }}
              >
                <a
                  href="https://www.facebook.com/caohienstudio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FacebookOutlined className="social-icon" />
                </a>
                <a
                  href="https://www.instagram.com/caohien.photojournalism?fbclid=IwZXh0bgNhZW0CMTAAYnJpZBExV2hXeDB5MlphNGRqbVdnb3NydGMGYXBwX2lkEDIyMjAzOTE3ODgyMDA4OTIAAR6j7Ao7qddfGHDVWOSBmzP8AYhCufZxW8wpKJXJqje025RitDWkjA_ffvz8Nw_aem_gxz1Be5biS62oTyCPezTJw"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramOutlined className="social-icon" />
                </a>
                <a
                  href="https://www.threads.com/@caohien.photojournalism?xmt=AQG0CjZ69R1g7-PJAn8cgcxx33tbxLdKqMxwRKf1xbjuiBo"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="18"
                    height="18"
                    fill="currentColor"
                    className="social-icon"
                  >
                    <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161" />
                  </svg>
                </a>
              </Space>
            </div>

            {/* Cột 2: Khám phá */}
            <div className="footer-column-discover">
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
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "2.2",
                  color: "#aaa",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <li
                  onClick={() => handleMenuClick("/")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Trang chủ
                </li>
                <li
                  onClick={() => handleMenuClick("/about")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Giới thiệu
                </li>
                <li
                  onClick={() => handleMenuClick("/galleries")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Thư viện ảnh
                </li>
                <li
                  onClick={() => handleMenuClick("/services")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Gói dịch vụ
                </li>
                <li
                  onClick={() => handleMenuClick("/rentals")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Thuê thiết bị
                </li>
                <li
                  onClick={() => handleMenuClick("/contact")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Liên hệ
                </li>
              </ul>
            </div>

            {/* Cột 3: Hỗ trợ & Chính sách */}
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
                Hỗ trợ & Chính sách
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: "2.2",
                  color: "#aaa",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <li
                  onClick={() => handleMenuClick("/contact")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Hướng dẫn đặt lịch
                </li>
                <li
                  onClick={() => handleMenuClick("/contact")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Chính sách hủy & hoàn cọc
                </li>
                <li
                  onClick={() => handleMenuClick("/about")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Quy trình làm việc
                </li>
                <li
                  onClick={() => handleMenuClick("/faq")}
                  style={{ cursor: "pointer" }}
                  className="footer-link"
                >
                  Câu hỏi thường gặp (FAQ)
                </li>
              </ul>
            </div>

            {/* Cột 4: Liên hệ */}
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
                style={{
                  color: "#aaa",
                  fontSize: "13px",
                  lineHeight: "2.2",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <EnvironmentOutlined style={{ color: PRIMARY_COLOR, fontSize: "15px", marginTop: "4px", width: "20px", display: "inline-flex", justifyContent: "center", flexShrink: 0 }} />
                  <span>34B4 TL 887, phường An Hội, Vĩnh Long</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <PhoneOutlined style={{ color: PRIMARY_COLOR, fontSize: "15px", marginTop: "4px", width: "20px", display: "inline-flex", justifyContent: "center", flexShrink: 0 }} />
                  <span>(+84) 979 7676 02</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <MailOutlined style={{ color: PRIMARY_COLOR, fontSize: "15px", marginTop: "4px", width: "20px", display: "inline-flex", justifyContent: "center", flexShrink: 0 }} />
                  <span>caohienstudio@gmail.com</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <ClockCircleOutlined style={{ color: PRIMARY_COLOR, fontSize: "15px", marginTop: "4px", width: "20px", display: "inline-flex", justifyContent: "center", flexShrink: 0 }} />
                  <span>Giờ mở cửa: 09:00 AM - 05:00 PM (Hàng ngày)</span>
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

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Nút Cuộn Lên Đầu Trang (Back to Top) */}
      <button
        className={`scroll-to-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Cuộn lên đầu trang"
      >
        <ArrowUpOutlined />
      </button>

      {/* Style CSS cho nút cuộn lên */}
      <style>{`
        .scroll-to-top-btn {
          position: fixed;
          bottom: 104px;
          right: 36px;
          z-index: 999;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(191, 161, 106, 0.3);
          background-color: #ffffff;
          color: #BFA16A;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          opacity: 0;
          transform: translateY(10px) scale(0.9);
          pointer-events: none;
        }

        .scroll-to-top-btn.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .scroll-to-top-btn:hover {
          background-color: #BFA16A;
          color: #ffffff;
          border-color: #BFA16A;
          box-shadow: 0 6px 16px rgba(191, 161, 106, 0.25);
          transform: translateY(-2px);
        }

        .scroll-to-top-btn:active {
          transform: translateY(0);
        }

        .social-icon {
          font-size: 20px;
          color: #aaa;
          transition: color 0.3s ease;
        }
        .social-icon:hover {
          color: #BFA16A !important;
        }

        .footer-link {
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: #BFA16A !important;
        }

        @media (min-width: 768px) {
          .footer-column-discover {
            padding-left: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerLayout;
