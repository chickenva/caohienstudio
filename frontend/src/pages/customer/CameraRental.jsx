/**
 * CameraRental.jsx
 * Trang danh sách thiết bị cho thuê (máy ảnh, ống kính, phụ kiện).
 * Chỉ hiển thị thông tin, khách hàng liên hệ trực tiếp để thuê.
 */
import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message, Empty, Tag } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CameraOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FALLBACK_CAMERA = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const CATEGORY_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "BODY", label: "Thân máy (Body)" },
  { key: "LENS", label: "Ống kính (Lens)" },
  { key: "ACCESSORY", label: "Phụ kiện" },
  { key: "KIT", label: "Bộ Kit" },
];

const CONDITION_MAP = {
  NEW: { label: "Mới 100%", color: "green" },
  LIKE_NEW: { label: "Như mới", color: "blue" },
  GOOD: { label: "Tốt", color: "orange" },
};

const CameraRental = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get("category") || "ALL";

  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";
    fetchCameras();
    return () => { document.body.style.backgroundColor = ""; };
  }, []);

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/camera-rentals`);
      setCameras(res.data?.cameras || []);
    } catch (err) {
      message.error("Không thể tải danh sách thiết bị cho thuê");
    } finally {
      setLoading(false);
    }
  };

  const filteredCameras = currentCategory === "ALL"
    ? cameras
    : cameras.filter((c) => c.category === currentCategory);

  // Scroll animation
  useEffect(() => {
    if (loading) return;
    const elements = document.querySelectorAll(".scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, currentCategory]);

  return (
    <div className="home-page-container" style={{ minHeight: "100vh", padding: "100px 0 60px" }}>
      <div className="glow-spotlight-light" style={{ top: "5%", left: "3%" }} />
      <div className="glow-spotlight-light" style={{ bottom: "10%", right: "5%" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }} className="scroll-reveal">
          <span style={{ color: PRIMARY_COLOR, letterSpacing: 3, fontSize: 11, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 15 }}>
            CAMERA RENTAL SERVICE
          </span>
          <h1 className="font-serif-luxury" style={{ color: "#1F1F1F", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, lineHeight: 1.2, margin: "0 0 16px 0", letterSpacing: "-0.5px" }}>
            Cho Thuê{" "}
            <span className="text-gold" style={{ fontStyle: "italic", fontWeight: 400 }}>Thiết Bị</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "0 auto 20px" }}>
            <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
            <div style={{ width: 6, height: 6, background: PRIMARY_COLOR, transform: "rotate(45deg)" }} />
            <div style={{ width: 40, height: 1, background: PRIMARY_COLOR }} />
          </div>
          <p style={{ color: "#555", fontSize: 15, lineHeight: 1.8, maxWidth: 560, margin: "0 auto", fontWeight: 300, letterSpacing: "0.5px" }}>
            Cao Hiển Studio cung cấp dịch vụ cho thuê máy ảnh, ống kính và phụ kiện chuyên nghiệp.
            Liên hệ trực tiếp để thuê thiết bị phù hợp với nhu cầu của bạn.
          </p>
        </div>

        {/* Contact Info Banner */}
        <div
          className="scroll-reveal"
          style={{
            background: "linear-gradient(135deg, #2F2F2F 0%, #1a1a1a 100%)",
            borderRadius: 12,
            padding: "20px 28px",
            marginBottom: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <PhoneOutlined style={{ color: PRIMARY_COLOR, fontSize: 20 }} />
          <div style={{ color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
              Liên hệ thuê thiết bị qua Hotline / Zalo
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: PRIMARY_COLOR, letterSpacing: 1 }}>
              0123 456 789
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="scroll-reveal" style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchParams(tab.key === "ALL" ? {} : { category: tab.key })}
              style={{
                padding: "8px 20px",
                border: currentCategory === tab.key ? `1.5px solid ${PRIMARY_COLOR}` : "1px solid #E8DED2",
                borderRadius: 24,
                background: currentCategory === tab.key ? PRIMARY_COLOR : "transparent",
                color: currentCategory === tab.key ? "#fff" : "#555",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.3s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Camera Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : filteredCameras.length === 0 ? (
          <Empty description="Chưa có thiết bị nào" />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredCameras.map((camera, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={camera._id}>
                <div
                  className="scroll-reveal"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    background: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #EDE8E1",
                    cursor: "pointer",
                    transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  onClick={() => navigate(`/camera-rental/${camera._id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(191,161,106,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", paddingTop: "75%", overflow: "hidden" }}>
                    <img
                      src={camera.thumbnail || FALLBACK_CAMERA}
                      alt={camera.name}
                      style={{
                        position: "absolute",
                        top: 0, left: 0, width: "100%", height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s",
                      }}
                      onError={(e) => { e.target.src = FALLBACK_CAMERA; }}
                    />
                    {/* Availability badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        background: camera.is_available ? "rgba(56,158,13,0.9)" : "rgba(207,19,34,0.9)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {camera.is_available ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      {camera.is_available ? "Sẵn sàng" : "Đang cho thuê"}
                    </div>
                    {/* Condition badge */}
                    {camera.condition && (
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 600,
                          background: "rgba(255,255,255,0.9)",
                          color: "#555",
                        }}
                      >
                        {CONDITION_MAP[camera.condition]?.label || camera.condition}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px 18px" }}>
                    {camera.brand && (
                      <div style={{ fontSize: 10, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                        {camera.brand}
                      </div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1F1F1F", marginBottom: 8, lineHeight: 1.3 }}>
                      {camera.name}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#999", fontWeight: 500 }}>Giá thuê / ngày</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: PRIMARY_COLOR }}>
                          {Number(camera.rental_price_per_day || 0).toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <CameraOutlined style={{ fontSize: 18, color: "#ddd" }} />
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default CameraRental;
