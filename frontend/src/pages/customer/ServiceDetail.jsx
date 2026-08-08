/**
 * ServiceDetail.jsx
 * Trang chi tiết gói dịch vụ và CTA đặt lịch.
 * - Ưu tiên ảnh thumbnail đại diện (upload từ server hoặc Drive link).
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Row, Col, Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";
import {
  upgradeGoogleImageUrl,
  isServerUploadUrl,
} from "../../utils/imageUtils";

const PRIMARY_COLOR = "#BFA16A";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "https://caohienstudio-api.onrender.com/api");

const CATEGORY_LABELS = {
  TRADITIONAL: "TRUYỀN THỐNG",
  PHOTOJOURNALISM: "PHÓNG SỰ",
  COMBO: "KẾT HỢP",
  PRINT: "ẢNH / PHOTOBOOK",
  OTHER: "DỊCH VỤ KHÁC",
};

// Chọn src ảnh chính — ưu tiên server upload, fallback sang Drive thumbnail
const resolvePrimaryThumbnail = (thumbnail) => {
  if (!thumbnail) return FALLBACK_IMG;
  if (isServerUploadUrl(thumbnail)) return thumbnail;
  return upgradeGoogleImageUrl(thumbnail, "s1200") || FALLBACK_IMG;
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  const fromCategory = location.state?.fromCategory;

  // Fetch service detail
  useEffect(() => {
    document.body.style.backgroundColor = "#FAF7F2";

    const fetchDetail = async () => {
      try {
        const res = await axios.get(`${API_URL}/services/${id}`);
        setService(res.data);
      } catch (err) {
        message.error("Không tìm thấy thông tin dịch vụ");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();

    return () => { document.body.style.backgroundColor = ""; };
  }, [id]);

  // Scroll reveals trigger
  useEffect(() => {
    if (loading) return;
    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("active"); observer.unobserve(e.target); } }),
      { root: null, threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    revealElements.forEach((el) => observer.observe(el));
    return () => revealElements.forEach((el) => observer.unobserve(el));
  }, [loading, service]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "150px 0", background: "#FAF7F2" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", background: "#FAF7F2", color: "#777777" }}>
        Không tìm thấy thông tin gói dịch vụ. Vui lòng quay lại bảng giá.
      </div>
    );
  }

  const primaryThumbnail = resolvePrimaryThumbnail(service.thumbnail);

  return (
    <div className="home-page-container" style={{ background: "#FAF7F2", minHeight: "100vh", width: "100%" }}>
      {/* Ambient spotlights */}
      <div className="glow-spotlight-light" style={{ top: "8%", left: "5%" }}></div>
      <div className="glow-spotlight-light" style={{ top: "50%", right: "5%" }}></div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px 100px 20px" }}>
        {/* Back Button */}
        <button
          onClick={() => {
            if (fromCategory && fromCategory !== "ALL") {
              navigate(`/services?category=${fromCategory}`);
            } else {
              navigate("/services");
            }
          }}
          className="btn-premium-outline scroll-reveal"
          style={{ marginBottom: 40, height: "42px", padding: "0 22px", fontSize: "11px" }}
        >
          <ArrowLeftOutlined style={{ marginRight: "6px" }} /> QUAY LẠI BẢNG GIÁ
        </button>

        <Row gutter={[60, 50]} className="scroll-reveal stagger-1">
          {/* ── Left Column: Thumbnail Image ── */}
          <Col xs={24} md={12}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8DED2",
                padding: "16px",
                boxShadow: "0 5px 15px rgba(154, 138, 120, 0.02)",
                overflow: "hidden",
                borderRadius: "4px",
              }}
            >
              <img
                src={primaryThumbnail}
                alt={service.name}
                onError={(e) => {
                  if (!e.currentTarget.dataset.driveAttempted && service.thumbnail && !isServerUploadUrl(service.thumbnail)) {
                    e.currentTarget.dataset.driveAttempted = "true";
                    e.currentTarget.src = upgradeGoogleImageUrl(service.thumbnail, "s1200") || FALLBACK_IMG;
                  } else {
                    e.currentTarget.src = FALLBACK_IMG;
                  }
                }}
                style={{
                  width: "100%",
                  height: "clamp(280px, 45vh, 520px)",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: "2px",
                }}
              />
            </div>
          </Col>

          {/* ── Right Column: Info ── */}
          <Col xs={24} md={12}>
            {/* Category tag */}
            <span
              style={{
                fontSize: "10px", letterSpacing: "1.5px", fontWeight: "600",
                textTransform: "uppercase", padding: "4px 12px",
                border: "1px solid rgba(191, 161, 106, 0.3)",
                background: "rgba(191, 161, 106, 0.05)", color: "#BFA16A", display: "inline-block",
              }}
            >
              {service.category ? CATEGORY_LABELS[service.category] || service.category.toUpperCase() : "CAO HIỂN STUDIO"}
            </span>

            {/* Title */}
            <h1
              className="font-serif-luxury"
              style={{ fontSize: "clamp(32px, 5vw, 44px)", margin: "20px 0", fontWeight: "300", color: "#1F1F1F", lineHeight: "1.2" }}
            >
              {service.name}
            </h1>

            {/* Pricing */}
            <div style={{ fontSize: "28px", color: PRIMARY_COLOR, fontWeight: "600", marginBottom: "20px" }}>
              {service.base_price?.toLocaleString("vi-VN")}đ
            </div>

            {/* Features divider */}
            <div style={{ height: "1px", background: "#E8DED2", width: "100%", margin: "30px 0" }}></div>

            <h4 style={{ marginBottom: "20px", letterSpacing: "1.5px", fontSize: "12px", fontWeight: "600", color: "#2F2F2F" }}>
              GÓI DỊCH VỤ BAO GỒM:
            </h4>
            <Row>
              {(
                service.features || [
                  "Chụp ảnh không giới hạn file",
                  "Hỗ trợ concept chụp",
                  "Chỉnh sửa 30 file retouch",
                  "Giao toàn bộ file gốc",
                ]
              ).map((feat, idx) => (
                <Col
                  span={24}
                  key={idx}
                  style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14.5px", color: "#555555", fontWeight: "300" }}
                >
                  <CheckCircleOutlined style={{ color: PRIMARY_COLOR }} />
                  <span>{feat}</span>
                </Col>
              ))}
            </Row>

            {/* Booking Action */}
            <button
              onClick={() => navigate("/booking", { state: { service_id: service._id, serviceName: service.name, base_price: service.base_price } })}
              className="btn-premium-gold"
              style={{ height: "52px", padding: "0 50px", marginTop: "40px", fontSize: "12px", display: "inline-flex" }}
            >
              ĐẶT LỊCH HẸN NGAY <ShoppingCartOutlined />
            </button>

            {/* FAQ Minimalist Links */}
            <div style={{ marginTop: "50px", paddingTop: "25px", borderTop: "1px solid #E8DED2" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px", fontSize: "13.5px", color: "#666666", fontWeight: "300" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <InfoCircleOutlined style={{ color: PRIMARY_COLOR, fontSize: "14px" }} />
                  Bạn có thắc mắc?
                </span>

                {(() => {
                  const nameL = service.name?.toLowerCase() || "";
                  const catL = service.category?.toLowerCase() || "";
                  const hasPhoto = nameL.includes("chụp") || nameL.includes("ảnh") || nameL.includes("photo") || catL === "combo" || (!nameL.includes("quay") && !nameL.includes("phim") && !nameL.includes("video"));
                  const hasVideo = nameL.includes("quay") || nameL.includes("phim") || nameL.includes("video") || catL === "combo";
                  const links = [];

                  if (hasPhoto && ["TRADITIONAL", "PHOTOJOURNALISM", "COMBO"].includes(service.category)) {
                    links.push(<a key="photo" href="/faq#photo-styles" style={{ color: PRIMARY_COLOR, textDecoration: "none", fontWeight: "400", borderBottom: "1px solid transparent", transition: "all 0.3s" }} onMouseOver={(e) => { e.target.style.borderBottomColor = PRIMARY_COLOR; }} onMouseOut={(e) => { e.target.style.borderBottomColor = "transparent"; }}>Phong cách chụp</a>);
                  }
                  if (hasVideo && ["TRADITIONAL", "PHOTOJOURNALISM", "COMBO"].includes(service.category)) {
                    links.push(<a key="video" href="/faq#video-styles" style={{ color: PRIMARY_COLOR, textDecoration: "none", fontWeight: "400", borderBottom: "1px solid transparent", transition: "all 0.3s" }} onMouseOver={(e) => { e.target.style.borderBottomColor = PRIMARY_COLOR; }} onMouseOut={(e) => { e.target.style.borderBottomColor = "transparent"; }}>Phong cách quay</a>);
                  }

                  if (links.length === 0) return null;
                  return links.map((link, i) => (
                    <React.Fragment key={i}>{link}<span style={{ color: "#E8DED2" }}>•</span></React.Fragment>
                  ));
                })()}

                <a href="/faq#delivery-time" style={{ color: PRIMARY_COLOR, textDecoration: "none", fontWeight: "400", borderBottom: "1px solid transparent", transition: "all 0.3s" }} onMouseOver={(e) => { e.target.style.borderBottomColor = PRIMARY_COLOR; }} onMouseOut={(e) => { e.target.style.borderBottomColor = "transparent"; }}>
                  Thời gian nhận sản phẩm
                </a>
                <span style={{ color: "#E8DED2" }}>•</span>
                <a href="/faq#printing" style={{ color: PRIMARY_COLOR, textDecoration: "none", fontWeight: "400", borderBottom: "1px solid transparent", transition: "all 0.3s" }} onMouseOver={(e) => { e.target.style.borderBottomColor = PRIMARY_COLOR; }} onMouseOut={(e) => { e.target.style.borderBottomColor = "transparent"; }}>
                  Quy định in ảnh
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ServiceDetail;
