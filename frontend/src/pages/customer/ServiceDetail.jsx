import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Row, Col, Spin, message } from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../../Home.css";

const PRIMARY_COLOR = "#BFA16A";
const FONT_SERIF = '"Playfair Display", Georgia, serif';
const API_URL = import.meta.env.VITE_API_URL || "https://caohienstudio-api.onrender.com/api";

const CATEGORY_LABELS = {
  TRADITIONAL: "TRUYỀN THỐNG",
  PHOTOJOURNALISM: "PHÓNG SỰ",
  COMBO: "KẾT HỢP",
  PRINT: "ẢNH / PHOTOBOOK",
  OTHER: "DỊCH VỤ KHÁC",
};

// Trang chi tiết gói dịch vụ, hiển thị giá, mô tả và nút đặt lịch.
const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  const fromCategory = location.state?.fromCategory;

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

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [id]);

  // Scroll reveals trigger
  useEffect(() => {
    if (loading) return;

    const revealElements = document.querySelectorAll(".scroll-reveal");
    const observerOptions = {
      root: null,
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
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
          {/* Left Column: Image wrapper */}
          <Col xs={24} md={12}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8DED2",
                borderRadius: "0px",
                padding: "16px",
                boxShadow: "0 5px 15px rgba(154, 138, 120, 0.02)"
              }}
            >
              <img
                src={
                  service.thumbnail ||
                  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800"
                }
                alt={service.name}
                style={{
                  width: "100%",
                  height: "550px",
                  objectFit: "cover",
                  display: "block",
                  border: "1px solid #E8DED2"
                }}
              />
            </div>
          </Col>

          {/* Right Column: Info detail metadata */}
          <Col xs={24} md={12}>
            {/* Category tag */}
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "1.5px",
                fontWeight: "600",
                textTransform: "uppercase",
                padding: "4px 12px",
                border: "1px solid rgba(191, 161, 106, 0.3)",
                background: "rgba(191, 161, 106, 0.05)",
                color: "#BFA16A",
                display: "inline-block"
              }}
            >
              {service.category ? CATEGORY_LABELS[service.category] || service.category.toUpperCase() : "CAO HIỂN STUDIO"}
            </span>

            {/* Title */}
            <h1
              className="font-serif-luxury"
              style={{
                fontSize: "clamp(32px, 5vw, 44px)",
                margin: "20px 0",
                fontWeight: "300",
                color: "#1F1F1F",
                lineHeight: "1.2"
              }}
            >
              {service.name}
            </h1>

            {/* Pricing */}
            <div
              style={{
                fontSize: "28px",
                color: PRIMARY_COLOR,
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              {service.base_price?.toLocaleString("vi-VN")}đ
            </div>

            {/* Estimated shoot hours duration */}
            <div
              style={{
                fontSize: "14px",
                color: "#555555",
                marginBottom: "30px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "300"
              }}
            >
              <ClockCircleOutlined style={{ color: "#BFA16A" }} /> 
              <span>Thời lượng chụp ước tính: <strong style={{ fontWeight: "500" }}>{service.duration_hours || 4} giờ</strong></span>
            </div>

            {/* Description */}
            <p style={{ color: "#555555", lineHeight: "2.1", fontSize: "14.5px", fontWeight: "300", marginBottom: "35px" }}>
              {service.details ||
                service.description ||
                "Gói chụp ảnh cao cấp được thiết kế tinh tế nhằm ghi lại từng khoảnh khắc ý nghĩa nhất của bạn."}
            </p>

            {/* Features check list divider */}
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
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "14.5px",
                    color: "#555555",
                    fontWeight: "300"
                  }}
                >
                  <CheckCircleOutlined
                    style={{ color: PRIMARY_COLOR }}
                  />
                  <span>{feat}</span>
                </Col>
              ))}
            </Row>

            {/* Booking Action */}
            <button
              onClick={() =>
                navigate("/booking", {
                  state: {
                    service_id: service._id,
                    serviceName: service.name,
                    base_price: service.base_price,
                  },
                })
              }
              className="btn-premium-gold"
              style={{
                height: "52px",
                padding: "0 50px",
                marginTop: "40px",
                fontSize: "12px",
                display: "inline-flex"
              }}
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
                  const serviceNameLower = service.name?.toLowerCase() || "";
                  const categoryLower = service.category?.toLowerCase() || "";
                  
                  const hasPhoto = serviceNameLower.includes("chụp") || serviceNameLower.includes("ảnh") || serviceNameLower.includes("photo") || categoryLower === "combo" || (!serviceNameLower.includes("quay") && !serviceNameLower.includes("phim") && !serviceNameLower.includes("video"));
                  const hasVideo = serviceNameLower.includes("quay") || serviceNameLower.includes("phim") || serviceNameLower.includes("video") || categoryLower === "combo";
                  
                  const links = [];
                  
                  if (hasPhoto && (service.category === "TRADITIONAL" || service.category === "PHOTOJOURNALISM" || service.category === "COMBO")) {
                    links.push(
                      <a href="/faq#photo-styles" style={{ color: PRIMARY_COLOR, textDecoration: "none", transition: "all 0.3s", fontWeight: "400", borderBottom: "1px solid transparent" }} onMouseOver={(e) => e.target.style.borderBottomColor = PRIMARY_COLOR} onMouseOut={(e) => e.target.style.borderBottomColor = "transparent"}>
                        Phong cách chụp
                      </a>
                    );
                  }
                  
                  if (hasVideo && (service.category === "TRADITIONAL" || service.category === "PHOTOJOURNALISM" || service.category === "COMBO")) {
                    links.push(
                      <a href="/faq#video-styles" style={{ color: PRIMARY_COLOR, textDecoration: "none", transition: "all 0.3s", fontWeight: "400", borderBottom: "1px solid transparent" }} onMouseOver={(e) => e.target.style.borderBottomColor = PRIMARY_COLOR} onMouseOut={(e) => e.target.style.borderBottomColor = "transparent"}>
                        Phong cách quay
                      </a>
                    );
                  }
                  
                  if (links.length === 0) return null;
                  
                  return links.map((link, index) => (
                    <React.Fragment key={index}>
                      {link}
                      <span style={{ color: "#E8DED2" }}>•</span>
                    </React.Fragment>
                  ));
                })()}

                <a href="/faq#delivery-time" style={{ color: PRIMARY_COLOR, textDecoration: "none", transition: "all 0.3s", fontWeight: "400", borderBottom: "1px solid transparent" }} onMouseOver={(e) => e.target.style.borderBottomColor = PRIMARY_COLOR} onMouseOut={(e) => e.target.style.borderBottomColor = "transparent"}>
                  Thời gian nhận sản phẩm
                </a>

                <span style={{ color: "#E8DED2" }}>•</span>

                <a href="/faq#printing" style={{ color: PRIMARY_COLOR, textDecoration: "none", transition: "all 0.3s", fontWeight: "400", borderBottom: "1px solid transparent" }} onMouseOver={(e) => e.target.style.borderBottomColor = PRIMARY_COLOR} onMouseOut={(e) => e.target.style.borderBottomColor = "transparent"}>
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
