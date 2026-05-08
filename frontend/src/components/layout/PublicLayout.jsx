import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button, Space, Dropdown, Avatar } from "antd";
import {
  ArrowRightOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  FacebookOutlined,
  InstagramOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";

// Design System đồng bộ
const PRIMARY_COLOR = "#9a8a78";
const FONT_SERIF = '"Playfair Display", "Times New Roman", serif';
const FONT_SANS = '"Helvetica Neue", Arial, sans-serif';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Kiểm tra trạng thái đăng nhập mỗi khi chuyển trang
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Nếu đã đăng nhập, redirect đến /customer hoặc /admin
      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/customer");
      }
    } else {
      setUser(null);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
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
      {/* HEADER */}
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
          onClick={() => navigate("/")}
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

        {/* Menu giữa */}
        <div style={{ display: "flex", gap: "30px" }}>
          <span onClick={() => navigate("/")} style={menuStyle("/")}>
            TRANG CHỦ
          </span>
          <span onClick={() => navigate("/about")} style={menuStyle("/about")}>
            GIỚI THIỆU VỀ TÔI
          </span>
          <span
            onClick={() => navigate("/services")}
            style={menuStyle("/services")}
          >
            BẢNG GIÁ / PRICE LIST
          </span>
          <span
            onClick={() => navigate("/booking")}
            style={menuStyle("/booking")}
          >
            ĐẶT LỊCH
          </span>
        </div>

        {/* Khu vực bên phải Header */}
        <div style={{ minWidth: "150px", display: "flex", justifyContent: "flex-end" }}>
          <Space size="middle">
            <Button
              type="text"
              onClick={() => navigate("/login")}
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
              }}
            >
              ĐĂNG KÝ <ArrowRightOutlined />
            </Button>
          </Space>
        </div>
      </header>

      {/* CONTENT */}
      <main style={{ flex: 1, marginTop: "90px" }}>
        <Outlet />
      </main>

      {/* FOOTER */}
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
                <li
                  onClick={() => navigate("/services")}
                  style={{ cursor: "pointer" }}
                >
                  Bảng giá dịch vụ
                </li>
                <li
                  onClick={() => navigate("/booking")}
                  style={{ cursor: "pointer" }}
                >
                  Đặt lịch
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
                Liên hệ
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
                <li>📱 +84 123 456 789</li>
                <li>📧 info@caohienstudio.com</li>
                <li>📍 Hà Nội, Việt Nam</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div
            style={{
              borderTop: "1px solid #333",
              marginTop: "40px",
              paddingTop: "20px",
              textAlign: "center",
              color: "#666",
              fontSize: "12px",
            }}
          >
            © 2024 Cao Hiến Photography. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
